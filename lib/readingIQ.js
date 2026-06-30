export function calculateReadingIQ(test) {

  const accuracyComponent =
    (test.accuracy_percent || 0) * 0.40;

  const scorePercent = Math.max(
    0,
    ((test.score || 0) / 72) * 100
  );

  const scoreComponent =
    scorePercent * 0.30;

  const speedPercent = Math.min(
    100,
    (2400 / (test.time_taken_s || 2400)) * 100
  );

  const speedComponent =
    speedPercent * 0.20;

  const confidencePercent =
    ((test.attempted || 0) /
      (test.total_questions || 24)) * 100;

  const confidenceComponent =
    confidencePercent * 0.10;

  return Math.round(
    accuracyComponent +
    scoreComponent +
    speedComponent +
    confidenceComponent
  );

}