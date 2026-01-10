export async function POST(req) {
  const body = await req.json();

  return new Response(
    JSON.stringify({
      message: "RC Mentor endpoint is alive.",
      received: body,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
