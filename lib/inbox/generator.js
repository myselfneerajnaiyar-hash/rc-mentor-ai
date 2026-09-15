import { chooseInboxLifecycle, eligibleInboxOffer, loadInboxSubscriptions } from "./lifecycle.js"
import { inboxAnnouncements } from "./announcements.js"
import { inboxQuery, withInboxDeadline } from "./request.js"
import { loadActivityBatch, readAll, dateKey, shiftDay, dayStart } from "./activity.js"
import { chooseDailyNotification, createInboxNotification } from "./service.js"
export async function runInboxGenerator(db, { now = new Date(), clock = () => Date.now(), budgetMs = 240000, logger = console, loadActivity = loadActivityBatch, createNotification = createInboxNotification } = {}) {
  const started = clock(), key = dateKey(now)
  const workSignal = AbortSignal.timeout(budgetMs)
  const stats = { dateKey: key, considered: 0, created: 0, skipped: 0, failed: 0, status: "running", lastUserId: null }
  // A process kill cannot execute finally. The next invocation closes abandoned runs.
  const { error: recoveryError } = await inboxQuery(db.from("inbox_generation_runs")
    .update({ status: "failed", finished_at: new Date().toISOString(), error: "Interrupted execution; safe to retry daily work" })
    .eq("status", "running").lt("started_at", new Date(Date.now() - 600000).toISOString()), { timeoutMs: 15000 })
  if (recoveryError) throw recoveryError
  const { data: run, error: startError } = await inboxQuery(db.from("inbox_generation_runs").insert({ date_key: key, status: "running" }).select("id").single(), { timeoutMs: 15000 })
  if (startError) throw startError
  let fatal = null
  try {
    for (;;) {
      if (workSignal.aborted || clock() - started > budgetMs) { stats.status = "partial"; fatal = "Time budget reached; rerun safely to resume remaining daily work"; break }
      let query = db.from("profiles").select("user_id,name,created_at,exam,trial_expires_at,is_premium,premium_expires_at,institute_id").not("user_id", "is", null).order("user_id", { ascending: true }).limit(50)
      if (stats.lastUserId) query = query.gt("user_id", stats.lastUserId)
      const { data: profiles, error } = await inboxQuery(query, { signal: workSignal, timeoutMs: 15000 })
      if (error) throw error
      if (!profiles?.length) break
      const ids = profiles.map((profile) => profile.user_id)
      // Include archived/deleted history: hiding a message must not reset frequency controls.
      let history
      try {
        history = await readAll(() => db.from("inbox_notifications").select("id,user_id,type,created_at,rule_key,proactive_date,idempotency_key,metadata").in("user_id", ids).gte("created_at", dayStart(shiftDay(key, -30)).toISOString()).order("id", { ascending: true }), 500, { signal: AbortSignal.any([workSignal, AbortSignal.timeout(30000)]) })
      } catch (error) {
        if (workSignal.aborted) throw error
        stats.considered += profiles.length; stats.failed += profiles.length
        stats.lastUserId = profiles.at(-1).user_id
        logger.error("Inbox history batch failed", { runId: run.id, message: error?.message || String(error) })
        continue
      }
      // Transactional/approved announcements run even if today's proactive slot is used.
      let subscriptions = null
      try { subscriptions = await withInboxDeadline((signal) => loadInboxSubscriptions(db, ids, { signal }), { signal: workSignal, timeoutMs: 30000 }) }
      catch (error) { stats.failed += profiles.length; logger.error("Inbox account context failed", { runId: run.id, message: error?.message || String(error) }) }
      for (let offset = 0; offset < profiles.length && !workSignal.aborted; offset += 5) {
        await Promise.all(profiles.slice(offset, offset + 5).map(async (profile) => {
          const lifecycle = subscriptions ? chooseInboxLifecycle({ profile, subscriptions, now }) : null
          const notices = [...(lifecycle ? [lifecycle] : []), ...inboxAnnouncements(profile, now)]
          for (const notice of notices) {
            if (history.some((row) => row.user_id === profile.user_id && row.idempotency_key === notice.idempotencyKey)) continue
            try {
              const inserted = await withInboxDeadline((signal) => createNotification(db, notice, { signal }), { signal: workSignal, timeoutMs: 15000 })
              if (inserted) stats.created++
            } catch (error) { stats.failed++; logger.error("Inbox account notice failed", { runId: run.id, userId: profile.user_id, message: error?.message || String(error) }) }
          }
        }))
      }
      const pending = profiles.filter((profile) => !history.some((row) => row.user_id === profile.user_id && (row.proactive_date === key || row.idempotency_key === `daily:${key}`)))
      stats.considered += profiles.length
      stats.skipped += profiles.length - pending.length
      if (pending.length) {
        let batch
        try { batch = await withInboxDeadline((signal) => loadActivity(db, pending.map((profile) => profile.user_id), shiftDay(key, -29), shiftDay(key, 1), { until: now, signal }), { signal: workSignal, timeoutMs: 30000 }) }
        catch (error) { stats.failed += pending.length; logger.error("Inbox activity batch failed", { runId: run.id, message: error?.message || String(error), code: error?.code }); batch = null }
        if (batch) {
          for (let offset = 0; offset < pending.length; offset += 5) {
            if (workSignal.aborted || clock() - started > budgetMs) { stats.status = "partial"; fatal = "Time budget reached; rerun safely to resume remaining daily work"; break }
            await Promise.all(pending.slice(offset, offset + 5).map(async (profile) => {
              try {
                const notification = chooseDailyNotification({ userId: profile.user_id, firstName: profile.name, exam: profile.exam || "Unassigned", offer: subscriptions ? eligibleInboxOffer({ profile, subscriptions, now }) : null, accountCreatedAt: profile.created_at, dateKey: key, events: batch.get(profile.user_id) || [], history: history.filter((row) => row.user_id === profile.user_id) })
                if (!notification) { stats.skipped++; return }
                const inserted = await withInboxDeadline((signal) => createNotification(db, notification, { signal }), { signal: workSignal, timeoutMs: 15000 })
                if (inserted) stats.created++; else stats.skipped++
              } catch (error) { stats.failed++; logger.error("Inbox user generation failed", { runId: run.id, userId: profile.user_id, message: error?.message || String(error), code: error?.code }) }
            }))
          }
        }
      }
      stats.lastUserId = profiles.at(-1).user_id
      if (profiles.length < 50) break
    }
    if (workSignal.aborted) { stats.status = "partial"; fatal = "Time budget reached; rerun safely to resume remaining daily work" }
    if (stats.status === "running") stats.status = stats.failed ? "partial" : "complete"
  } catch (error) { stats.status = workSignal.aborted ? "partial" : "failed"; fatal = workSignal.aborted ? "Time budget reached; rerun safely to resume remaining daily work" : error?.message || String(error); logger.error("Inbox generation failed", { runId: run.id, message: fatal }) }
  const finalState = { finished_at: new Date().toISOString(), status: stats.status, considered: stats.considered, created: stats.created, skipped: stats.skipped, failed: stats.failed, last_user_id: stats.lastUserId, error: fatal }
  let finishError
  for (let retry = 0; retry < 2; retry++) {
    try {
      const result = await inboxQuery(db.from("inbox_generation_runs").update(finalState).eq("id", run.id), { timeoutMs: 15000 })
      if (result.error) throw result.error
      finishError = null; break
    } catch (error) { finishError = error }
  }
  if (finishError) throw finishError
  logger.info("Inbox generation finished", { runId: run.id, ...stats, durationMs: clock() - started })
  return { runId: run.id, ...stats }
}
