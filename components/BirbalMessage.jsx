export default function BirbalMessage({ text }) {
  return (
    <div className="flex gap-3 mt-4 items-start">

      <img
        src="/birbal.png"
        className="w-8 h-8 rounded-full"
      />

      <div className="bg-slate-800 border border-slate-700 text-slate-200 px-4 py-3 rounded-xl max-w-xl">
        {text}
      </div>

    </div>
  )
}