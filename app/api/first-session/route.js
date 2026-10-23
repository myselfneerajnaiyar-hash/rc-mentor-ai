import { NextResponse } from "next/server";
import {
  completeDailyRcMission,
  getFirstSessionState,
  markReportViewed,
  requireFirstSessionUser,
  saveDiagnosticAnswer,
  saveReadingEvent,
  startDailyRcMission,
  startDiagnostic,
  submitDiagnostic,
} from "@/lib/firstSession/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  const auth = await requireFirstSessionUser(request);
  if (auth.error) return json({ error: auth.error }, auth.status);
  try {
    return json(await getFirstSessionState(auth.user.id));
  } catch (error) {
    console.error("First-session state load failed", error);
    return json({ error: error.message || "First-session state unavailable." }, 500);
  }
}

export async function POST(request) {
  const auth = await requireFirstSessionUser(request);
  if (auth.error) return json({ error: auth.error }, auth.status);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  try {
    switch (body?.action) {
      case "start_diagnostic":
        return json(await startDiagnostic(auth.user.id));
      case "answer":
        return json(await saveDiagnosticAnswer(auth.user.id, body.question_id, body.selected_option));
      case "reading_event":
        await saveReadingEvent(auth.user.id, body.event);
        return json({ saved: true });
      case "submit_diagnostic":
        return json(await submitDiagnostic(auth.user.id));
      case "report_viewed":
        return json(await markReportViewed(auth.user.id));
      case "start_mission":
        return json(await startDailyRcMission(auth.user.id));
      case "complete_mission":
        return json(await completeDailyRcMission(auth.user.id));
      default:
        return json({ error: "Unknown first-session action." }, 400);
    }
  } catch (error) {
    const message = error?.message || "First-session action failed.";
    const status = /time is up|no longer accepting|cannot be started|complete the diagnostic|finish today's|already complete|not available yet/i.test(message) ? 409 : 500;
    return json({ error: message }, status);
  }
}
