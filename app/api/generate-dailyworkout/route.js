import { NextResponse } from "next/server"

export async function GET() {

  try {

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/get-daily-workout`,
      { cache: "no-store" }
    )

    const data = await res.json()

    return NextResponse.json({
      status: "Workout generated",
      data
    })

  } catch (err) {

    return NextResponse.json({
      status: "error",
      error: err.message
    })

  }

}