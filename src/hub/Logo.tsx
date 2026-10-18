export function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hq-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fd0ff" />
          <stop offset="1" stopColor="#3d7bff" />
        </linearGradient>
        <linearGradient id="hq-o" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#c9973b" />
          <stop offset="1" stopColor="#f8e3a8" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="#0d1016"
        stroke="rgba(255,255,255,.12)"
      />
      <rect x="13" y="13" width="17" height="17" rx="5" fill="url(#hq-g)" />
      <rect
        x="34"
        y="13"
        width="17"
        height="17"
        rx="5"
        fill="rgba(255,255,255,.14)"
      />
      <rect
        x="13"
        y="34"
        width="17"
        height="17"
        rx="5"
        fill="rgba(255,255,255,.14)"
      />
      <circle
        cx="42.5"
        cy="42.5"
        r="8.5"
        fill="none"
        stroke="url(#hq-o)"
        strokeWidth="3.5"
      />
    </svg>
  );
}
