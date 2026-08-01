export default function Logo({ inverted = false }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 font-display text-xl font-semibold tracking-tight">
      <span className={inverted ? "text-paper" : "text-ink"}>Table</span>
      <span className="text-marigold">ly</span>
    </span>
  );
}
