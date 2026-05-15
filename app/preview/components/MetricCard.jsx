export default function MetricCard() {

  return (

  <div className="max-w-5xl mx-auto px-6 pt-10">
  <div
    className="
      rounded-[32px]
      overflow-hidden
      border border-white/10
      shadow-[0_20px_80px_rgba(0,0,0,0.45)]
    "
  >
    <div
      className="p-10"
      style={{
        background: `
          radial-gradient(
            circle at top left,
            rgba(59,130,246,0.22),
            transparent 38%
          ),
          linear-gradient(
            180deg,
            #131A2B 0%,
            #0B1120 100%
          )
        `,
      }}
    >
      <p className="text-white/70 text-sm mb-4">
        Reading Accuracy
      </p>

      <h2 className="text-6xl font-bold text-white tracking-tight">
        91%
      </h2>

      <p className="text-white/60 mt-3 text-lg">
        Top 3% among CAT aspirants
      </p>
    </div>
  </div>
</div>


  )

}