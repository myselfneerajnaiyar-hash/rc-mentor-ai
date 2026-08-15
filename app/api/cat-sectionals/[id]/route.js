import fs from "fs";
import path from "path";
import { requireCapability } from "@/lib/tenant/requireCapability";

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
  const access = await requireCapability(req, "showCATSectionals");
  if (!access.ok) return new Response(JSON.stringify({ error: access.status === 401 ? "Authentication required" : "CAT sectionals are not available for your exam" }), { status: access.status, headers: { "Content-Type": "application/json" } });
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
