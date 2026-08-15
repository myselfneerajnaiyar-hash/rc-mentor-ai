const EXAM_ALIASES = Object.freeze({
  CAT: "CAT",
  CLAT: "CLAT",
  IPMAT: "IPMAT",
  CUET: "CUET",
  BANKING: "Banking",
  "BANK PO": "Banking",
  GMAT: "GMAT",
  SSC: "SSC",
  SAT: "SAT",
  XAT: "XAT",
})

export function normalizeExam(value) {
  if (typeof value !== "string") return "Unassigned"
  const normalized = value.trim().replace(/\s+/g, " ").toUpperCase()
  return EXAM_ALIASES[normalized] || "Unassigned"
}

export function getExamCapabilities(value) {
  const exam = normalizeExam(value)
  const isCAT = exam === "CAT"
  return Object.freeze({ exam, isCAT, showDailyRC: isCAT, showCATSectionals: isCAT })
}

export function getExamDisplayName(value) {
  const exam = normalizeExam(value)
  const names = {
    CAT: "CAT VARC",
    CLAT: "CLAT English",
    IPMAT: "IPMAT Verbal",
    CUET: "CUET Language",
    Banking: "Banking English",
    GMAT: "GMAT Verbal",
    SSC: "SSC English",
    SAT: "SAT Reading & Writing",
    XAT: "XAT Verbal",
    Unassigned: "Reading",
  }
  return names[exam]
}
