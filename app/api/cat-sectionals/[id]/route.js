import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const filePath = path.join(
      process.cwd(),
      "data",
      "catrc",
      `${id}.json`
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "CAT RC Sectional not found" },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load sectional" },
      { status: 500 }
    );
  }
}
