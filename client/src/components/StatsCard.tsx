import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color?: "primary" | "secondary" | "accent" | "destructive";
  className?: string;
}

export function StatsCard({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  color = "primary",
  className 
}: StatsCardProps) {
  const colors = {
    primary: "text-primary border-primary/20 bg-primary/5",
    secondary: "text-secondary border-secondary/20 bg-secondary/5",
    accent: "text-accent border-accent/20 bg-accent/5",
    destructive: "text-destructive border-destructive/20 bg-destructive/5",
  };

  return (
    <div className={cn("cyber-card p-4 border flex items-center gap-4", colors[color], className)}>
      <div className={cn("p-3 rounded-none bg-background/50 border", 
        color === 'primary' ? 'border-primary/50' : 
        color === 'secondary' ? 'border-secondary/50' : 
        color === 'accent' ? 'border-accent/50' : 
        'border-destructive/50'
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest opacity-70 font-display">{label}</div>
        <div className="text-2xl font-bold font-mono tabular-nums leading-none mt-1">
          {value}
        </div>
        {subValue && (
          <div className="text-xs mt-1 opacity-50 font-mono">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}
