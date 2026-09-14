"use client";

import { useParams } from "next/navigation";
import DailyRCResult from "@/components/DailyRCResult";

export default function RCSessionPage() {
  const { attemptId } = useParams();
  return <DailyRCResult attemptId={attemptId} />;
}
