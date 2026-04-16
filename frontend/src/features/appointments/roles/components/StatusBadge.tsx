export function StatusBadge({ name, colorCode }: { name: string; colorCode: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{
        background: `${colorCode}22`,
        color: colorCode,
        border: `1px solid ${colorCode}44`,
      }}
    >
      {name}
    </span>
  );
}
