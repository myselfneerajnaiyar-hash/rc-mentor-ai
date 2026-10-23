import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const migrationPath = fileURLToPath(new URL("../supabase/migrations/20261021040000_first_session_journey.sql", import.meta.url));

test("first-session migration is repeatable and creates a journey only on completed-profile transition", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create schema auth;
      create table auth.users (id uuid primary key);
      create table public.daily_rc_sets (id uuid primary key);
      create table public.profiles (user_id uuid primary key references auth.users(id), profile_completed boolean default false);
      create function auth.uid() returns uuid language sql stable as 'select null::uuid';
    `);
    const migration = await readFile(migrationPath, "utf8");
    await db.exec(migration);
    await db.exec(migration);

    const userId = "c80259ed-1a90-42be-b2fb-72aac13e6474";
    await db.query("insert into auth.users (id) values ($1)", [userId]);
    await db.query("insert into public.profiles (user_id, profile_completed) values ($1, false)", [userId]);
    let result = await db.query("select phase from public.first_session_journeys where user_id = $1", [userId]);
    assert.equal(result.rows.length, 0);

    await db.query("update public.profiles set profile_completed = true where user_id = $1", [userId]);
    result = await db.query("select phase from public.first_session_journeys where user_id = $1", [userId]);
    assert.deepEqual(result.rows, [{ phase: "PROFILE_COMPLETE" }]);

    await db.query("update public.profiles set profile_completed = true where user_id = $1", [userId]);
    result = await db.query("select count(*)::int as count from public.first_session_journeys where user_id = $1", [userId]);
    assert.equal(result.rows[0].count, 1);
  } finally {
    await db.close();
  }
});
