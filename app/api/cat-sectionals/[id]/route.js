import fs from "fs";
import path from "path";

export async function generateStaticParams() {
  const dirPath = path.join(process.cwd(), "data", "catrc");

  const files = fs.readdirSync(dirPath);

  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      id: f.replace(".json", ""),
    }));
}

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "catrc",
      `${id}.json`
    );

    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({ error: "Sectional not found" }),
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to load sectional" }),
      { status: 500 }
    );
  }
}
