import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "rc-lab placeholder working"
  });
}