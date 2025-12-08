import { useEffect, useState } from 'react';

interface ProgressRingProps {
  percentage: number;
  visited: number;
  total: number;
  size?: number; // Optional size override
}

const ProgressRing = ({ percentage, visited, total, size }: ProgressRingProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Use size prop or default to 240 (full size)
  const radius = size ? size / 2 : 120;
  const isCompact = size && size < 100;
  const isMedium = size && size >= 100 && size < 200;
  const strokeWidth = isCompact ? 6 : isMedium ? 10 : 12;
  // Reduce radius slightly to accommodate stroke cap and prevent clipping
  const normalizedRadius = radius - strokeWidth / 2 - 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect - hide in compact mode */}
      {!isCompact && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        </div>
      )}

      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          stroke="hsl(var(--border))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke="url(#goldGradient)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(43, 74%, 49%)" />
            <stop offset="100%" stopColor="hsl(35, 80%, 55%)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`font-display font-bold text-gradient-white ${isCompact ? 'text-lg' : isMedium ? 'text-3xl' : 'text-5xl'}`}>
          {animatedPercentage}%
        </span>
        {!isCompact && !isMedium && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 mt-1">World Explored</span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
