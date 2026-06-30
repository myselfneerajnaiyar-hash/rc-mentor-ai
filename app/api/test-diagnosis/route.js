import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {

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

  return Response.json({
    passages,
    rcQuestions,
    vaQuestions,
  });
}