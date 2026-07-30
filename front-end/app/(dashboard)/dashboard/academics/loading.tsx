export default function AcademicsLoading() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse space-y-6">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="h-44 rounded-2xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-52 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
