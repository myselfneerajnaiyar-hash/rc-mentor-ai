import { supabaseAdmin } from "@/lib/supabaseAdmin";
import TestDiagnosisTabs
from "@/cat-arena/components/test-diagnosis/TestDiagnosisTabs";

export default async function Page() {

  // TEST ID FOR NOW
  const TEST_ID =
  "bb894a2a-79bc-4f0e-b09d-1be094874443";
  const { data: passages } =
    await supabaseAdmin
      .from("sectional_passage_content")
      .select("*")
      .eq("test_id", TEST_ID)
      .order("passage_number");

  const { data: rcQuestions } =
    await supabaseAdmin
      .from("sectional_question_content")
      .select("*")
      .eq("test_id", TEST_ID)
      .order("question_number");

  const { data: vaQuestions } =
    await supabaseAdmin
      .from("sectional_va_content")
      .select("*")
      .eq("test_id", TEST_ID)
      .order("question_number");

  console.log(
  "FIRST PASSAGE",
  passages?.[0]
);

const enrichedPassages =
  passages?.map(
    (p) => p.passage_enrichment
  ) || [];

  const enrichedQuestions = [
    ...(rcQuestions?.map(
      (q) => q.diagnosis
    ) || []),

    ...(vaQuestions?.map(
      (q) => q.diagnosis
    ) || []),
  ];

  console.log("PASSAGES", passages);
console.log("RC QUESTIONS", rcQuestions);
console.log("VA QUESTIONS", vaQuestions);
  return (
   <TestDiagnosisTabs
  attempt={{
    correct: 12,
    total: 24,
    attempted: 20,
  }}
  passages={passages}
  rcQuestions={rcQuestions}
  vaQuestions={vaQuestions}
/>
  );
}