"use client";

export default function MobileRCSectional({
  passage,
  question,
  options,
  timeLeft,
  onSelectOption,
  onNext,
  onSubmit
}) {
  return (
    <div className="rc-mobile-root">

      {/* TOP STICKY HEADER */}
      <div className="rc-header">
        <span className="rc-title">CAT RC Sectional</span>
        <span className="rc-timer">{timeLeft}</span>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="rc-content">

        {/* PASSAGE (≈55%) */}
        <section className="rc-passage">
          <h3>Passage</h3>
          <p>{passage}</p>
        </section>

        {/* QUESTION (≈25%) */}
        <section className="rc-question">
          <h4>{question}</h4>

          <div className="rc-options">
            {options.map((opt, i) => (
              <button
                key={i}
                className="rc-option"
                onClick={() => onSelectOption(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* FIXED ACTION PALETTE (≈20%) */}
      <div className="rc-palette">
        <button className="secondary">Clear</button>
        <button className="secondary">Mark</button>
        <button className="primary" onClick={onNext}>Next</button>
        <button className="danger" onClick={onSubmit}>Submit</button>
      </div>

    </div>
  );
}
