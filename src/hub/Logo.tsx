export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/icons/hq-logo.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={`rounded-[22%] ring-1 ring-white/10 ${className}`}
      draggable={false}
    />
  );
}
