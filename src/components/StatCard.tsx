import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'gold' | 'accent';
  className?: string;
  delay?: number;
  onClick?: () => void;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  className,
  delay = 0,
  onClick
}: StatCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02]",
        "bg-gradient-card border border-border/50 shadow-card",
        "animate-slide-up",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      style={{ animationDelay: delay + 'ms' }}
    >
      {variant === 'gold' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
      )}
      {variant === 'accent' && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg",
              variant === 'gold' ? "bg-primary/20 text-primary" :
                variant === 'accent' ? "bg-accent/20 text-accent" :
                  "bg-secondary text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className={cn(
          "font-display text-4xl font-bold mb-1",
          variant === 'gold' ? "text-gradient-white" :
            variant === 'accent' ? "text-accent" :
              "text-foreground"
        )}>
          {value}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
