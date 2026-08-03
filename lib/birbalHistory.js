export async function getBirbalHistory(supabase, userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("mentor_chat_history")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    console.error("Error loading Birbal history:", error);
    return [];
  }

  return data || [];
}

export async function saveBirbalMessage(
  supabase,
  userId,
  role,
  content
) {
  if (!userId || !content) return;

  const { error } = await supabase
    .from("mentor_chat_history")
    .insert({
      user_id: userId,
      role,
      content
    });

  if (error) {
    console.error("Error saving Birbal message:", error);
  }
}