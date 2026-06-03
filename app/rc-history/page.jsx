"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RCHistoryPage() {

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadHistory() {

      const user =
        await supabase.auth.getUser();

      if (!user.data.user) {
        setLoading(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("daily_rc_attempts")
          .select(`
            *,
            daily_rc_sets (
              title
            )
          `)
          .eq(
            "user_id",
            user.data.user.id
          )
          .order(
            "completed_at",
            { ascending: false }
          );

      if (!error) {
        setAttempts(data || []);
      }

      setLoading(false);
    }

    loadHistory();

  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071120] flex items-center justify-center text-white">
        Loading History...
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-[#071120] text-white">

      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black">
              📚 RC History
            </h1>

            <p className="text-slate-400 mt-2">
              Review all your Daily RC Arena attempts.
            </p>

          </div>

          <Link
            href="/daily-challenge"
            className="
            px-4
            py-2
            rounded-xl
            bg-slate-800
            hover:bg-slate-700
            "
          >
            ← Back
          </Link>

        </div>

        {attempts.length === 0 && (

          <div className="
            mt-10
            rounded-2xl
            border
            border-slate-700
            bg-slate-900/70
            p-10
            text-center
          ">

            <h2 className="text-3xl font-bold">
              No RC Attempts Yet
            </h2>

            <p className="text-slate-400 mt-4">
              Complete your first Daily RC Challenge.
            </p>

          </div>

        )}

        <div className="mt-10 space-y-5">

          {attempts.map((attempt) => (

            <div
              key={attempt.id}
              className="
              rounded-2xl
              border
              border-slate-700
              bg-slate-900/70
              p-6
              "
            >

              <div className="flex justify-between">

                <div>

                  <div className="text-2xl font-bold">

                    {attempt.daily_rc_sets?.title ||
                      "Daily RC"}

                  </div>

                  <div className="text-slate-400 mt-2">

                    {new Date(
                      attempt.completed_at
                    ).toLocaleDateString()}

                  </div>

                </div>

              </div>

              <div className="grid md:grid-cols-5 gap-6 mt-6">

                <div>

                  <div className="text-slate-400 text-xs">
                    CAT Score
                  </div>

                  <div className="text-3xl font-black text-cyan-300">
                    {attempt.score}
                  </div>

                </div>

                <div>

                  <div className="text-slate-400 text-xs">
                    Accuracy
                  </div>

                  <div className="text-3xl font-black text-emerald-300">
                    {attempt.accuracy}%
                  </div>

                </div>

                <div>

                  <div className="text-slate-400 text-xs">
                    Composite
                  </div>

                  <div className="text-3xl font-black text-yellow-300">
                    {attempt.composite_score}
                  </div>

                </div>

                <div>

                  <div className="text-slate-400 text-xs">
                    Correct
                  </div>

                  <div className="text-3xl font-black text-white">
                    {attempt.correct_count}
                  </div>

                </div>

                <div>

                  <div className="text-slate-400 text-xs">
                    Time
                  </div>

                  <div className="text-3xl font-black text-orange-300">
                    {Math.floor(
                      attempt.time_taken / 60
                    )}m{" "}
                    {attempt.time_taken % 60}s
                  </div>

                </div>

              </div>

              <Link
                href={`/rc-session/${attempt.id}`}
              >

                <button
                  className="
                  mt-6
                  px-5
                  py-3
                  rounded-xl
                  bg-cyan-600
                  font-bold
                  "
                >
                  View Review →
                </button>

              </Link>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}