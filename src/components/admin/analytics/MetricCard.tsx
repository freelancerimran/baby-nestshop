import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  gradient: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  description,
  gradient,
}: MetricCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl p-6
        text-white shadow-lg transition-all
        hover:scale-[1.02]
        hover:shadow-xl
        ${gradient}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/80">
            {title}
          </p>

          <h3 className="mt-3 text-4xl font-bold">
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-white/80">
              {description}
            </p>
          )}
        </div>

        <div className="opacity-90">
          {icon}
        </div>
      </div>

      <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/10" />
    </div>
  );
}