import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  CAT_ARENA_SECTIONAL_DURATION_MINUTES,
  CAT_ARENA_SECTIONAL_DURATION_SECONDS,
  remainingSectionalSeconds,
} from "../lib/cat-arena/sectionalTiming.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

 test("CAT Arena sectional duration is fixed at 40 minutes / 2400 seconds", () => {
  assert.equal(CAT_ARENA_SECTIONAL_DURATION_MINUTES, 40);
  assert.equal(CAT_ARENA_SECTIONAL_DURATION_SECONDS, 2400);
});

test("server deadline countdown resumes at the remaining time and expires at 40 minutes", () => {
  const deadline = 2_400_000;
  assert.equal(remainingSectionalSeconds(0, deadline), 2400);
  assert.equal(remainingSectionalSeconds(2_399_100, deadline), 1);
  assert.equal(remainingSectionalSeconds(deadline, deadline), 0);
  assert.equal(remainingSectionalSeconds(deadline + 5000, deadline), 0);
});

test("all bundled existing CAT Arena sectionals declare 40 minutes", async () => {
  for (let n = 1; n <= 10; n += 1) {
    const name = `sectional-${String(n).padStart(2, "0")}`;
    const json = JSON.parse(await read(`data/catrc/${name}.json`));
    assert.equal(json.meta?.timeMinutes ?? json.timeLimitMinutes, 40, name);
  }
});

test("database migration updates catalog, attempt records, upload defaults, and server expiry", async () => {
  const migration = await read("supabase/migrations/20261006090000_cat_arena_sectionals_40_minutes.sql");
  assert.match(migration, /UPDATE public\.sectional_test_content[\s\S]*?SET time_minutes = 40/i);
  assert.match(migration, /force_cat_arena_sectional_duration[\s\S]*?NEW\.time_minutes := 40/i);
  assert.match(migration, /UPDATE public\.sectional_tests[\s\S]*?SET time_limit_s = 2400[\s\S]*?sectional_id ~ '\^sectional-/i);
  assert.match(migration, /duration_seconds integer NOT NULL DEFAULT 2400 CHECK \(duration_seconds = 2400\)/i);
  assert.match(migration, /expires_at timestamptz NOT NULL DEFAULT \(now\(\) \+ interval '40 minutes'\)/i);
  assert.match(migration, /v_session\.expires_at <= clock_timestamp\(\)/i);
});

test("desktop and mobile countdown paths use the server deadline or 40-minute fallback", async () => {
  for (const path of ["cat-arena/CATArenaTestView.jsx", "cat-arena/CATArenaTestViewV2.jsx"]) {
    const source = await read(path);
    assert.match(source, /remainingSectionalSeconds\(Date\.now\(\), sectionalSession\.expires_at\)/);
    assert.match(source, /<CATTimer deadlineAt=\{sectionalSession\?\.expires_at\}/);
    assert.match(source, /CAT_ARENA_SECTIONAL_DURATION_SECONDS/);
    assert.doesNotMatch(source, /30\s*\*\s*60|durationMinutes=\{30\}/);
  }
});

test("both sectional containers start/resume server sessions and attach them to attempts", async () => {
  for (const path of ["cat-arena/rc/RCSectionalContainer.jsx", "cat-arena/rc/RCSectionalContainerV2.jsx"]) {
    const source = await read(path);
    assert.match(source, /\/api\/cat-sectionals\/\$\{sectionalId\}\/session/);
    assert.match(source, /sectionalSession=\{sectionalSession\}/);
    assert.match(source, /sectional_session_id: sectionalSession\.id/);
  }
  const v1 = await read("cat-arena/rc/RCSectionalContainer.jsx");
  const v2 = await read("cat-arena/rc/RCSectionalContainerV2.jsx");
  assert.match(v1, /time_limit_s: loadedTestData\?\.durationSeconds \|\| CAT_ARENA_SECTIONAL_DURATION_SECONDS/);
  assert.match(v2, /\.select\("time_minutes"\)/);
  assert.match(v2, /durationSeconds: \(sectional\?\.time_minutes \|\| CAT_ARENA_SECTIONAL_DURATION_SECONDS \/ 60\) \* 60/);
});

test("the server session route resumes only owned, unexpired sessions", async () => {
  const route = await read("app/api/cat-sectionals/[id]/session/route.js");
  assert.match(route, /requireCapability\(request, "showCATSectionals"\)/);
  assert.match(route, /\.eq\("user_id", userId\)/);
  assert.match(route, /\.is\("submitted_at", null\)/);
  assert.match(route, /\.gt\("expires_at", now\)/);
  assert.match(route, /cat_arena_sectional_sessions/);
});

test("no CAT Arena sectional runtime path retains a 30-minute default", async () => {
  for (const path of [
    "cat-arena/CATArenaTestView.jsx",
    "cat-arena/CATArenaTestViewV2.jsx",
    "cat-arena/rc/RCSectionalContainer.jsx",
    "cat-arena/rc/RCSectionalContainerV2.jsx",
    "cat-arena/components/CATTimer.jsx",
    "app/api/cat-sectionals/[id]/session/route.js",
  ]) {
    const source = await read(path);
    assert.doesNotMatch(source, /1800|30\s*\*\s*60|durationMinutes=\{30\}|time_limit_s:\s*1800/);
  }
});

test("unrelated product timing constants remain independent", async () => {
  const precision = await read("lib/precision/server.js");
  assert.match(precision, /PRECISION_DURATION_SECONDS = 480/);
  const bootcamp = await read("lib/bootcamp/content.mjs");
  assert.match(bootcamp, /vaSolveMinutes === 8/);
});

