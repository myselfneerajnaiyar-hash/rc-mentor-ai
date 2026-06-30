"use client";

import { useState } from "react";

import TabGroup from "../../../components/TabGroup";

import MentorVerdictTab from "./MentorVerdictTab";
import CognitiveDiagnosisTab from "./CognitiveDiagnosisTab";
import DetailedReviewTab from "./DetailedReviewTab";
import AnalyticsTab from "./AnalyticsTab";

export default function TestDiagnosisTabs(props) {
  console.log(props);

  const [activeTab, setActiveTab] =
    useState("mentor");

  return (
    <div className="min-h-screen text-white">

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8 flex items-center justify-between">

  <TabGroup
    tabs={[
      {
        label: "Mentor Verdict",
        value: "mentor",
      },
      {
        label: "Cognitive Diagnosis",
        value: "cognitive",
      },
      {
        label: "Detailed Review",
        value: "review",
      },
      {
        label: "Analytics",
        value: "analytics",
      },
    ]}
    active={activeTab}
    onChange={setActiveTab}
  />

  <button
   onClick={props.onBack}
    className="
      px-5
      py-2.5
      rounded-xl
      bg-emerald-600
      hover:bg-emerald-500
      text-white
      font-semibold
      transition-all
      duration-200
      shadow-lg
      shadow-emerald-500/20
    "
  >
    ← Back to Results
  </button>

</div>

        {activeTab === "mentor" && (
          <MentorVerdictTab {...props} />
        )}

        {activeTab === "cognitive" && (
          <CognitiveDiagnosisTab {...props} />
        )}

        {activeTab === "review" && (
          <DetailedReviewTab {...props} />
        )}

        {activeTab === "analytics" && (
  <AnalyticsTab {...props} />
)}

      </div>

    </div>
  );
}