import TestResultView from
"../components/TestResultView";

export default function ResultPreview() {
  return (
    <TestResultView
      attempt={{
        score: 42,
        accuracy: 78,
        correct: 14,
        wrong: 4,
        attempted: 18,
      }}
      onViewDiagnosis={() => {}}
      onExit={() => {}}
    />
  );
}