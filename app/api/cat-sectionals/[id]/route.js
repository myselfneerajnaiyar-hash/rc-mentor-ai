export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { CAT_SECTIONALS } from "../sectionals";

export async function GET(request, { params }) {
  const { id } = params;

  const test = CAT_SECTIONALS[id];

  if (!test) {
    return NextResponse.json(
      { error: "CAT RC Sectional not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(test);
}
