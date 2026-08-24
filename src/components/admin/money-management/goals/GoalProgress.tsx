"use client";

interface GoalProgressProps {
  targetAmount: number;
  contributed: number;
  monthlyTarget?: number;
  showDetails?: boolean;
}

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

export default function GoalProgress({
  targetAmount,
  contributed,
  monthlyTarget = 0,
  showDetails = true,
}: GoalProgressProps) {
  const target = Number(
    targetAmount || 0
  );

  const saved = Math.max(
    0,
    Number(contributed || 0)
  );

  const remaining = Math.max(
    0,
    target - saved
  );

  const percentage =
    target > 0
      ? Math.min(
          100,
          (saved / target) * 100
        )
      : 0;

  return (
    <div className="w-full">

      <div className="flex items-end justify-between gap-4">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Progress
          </p>

          <p className="mt-1 text-lg font-black text-gray-900">
            {money(saved)}
          </p>
        </div>

        <p className="text-sm font-black text-blue-600">
          {percentage.toFixed(0)}%
        </p>

      </div>


      <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">

        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>


      {showDetails && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">

          <span>
            Remaining{" "}
            <strong className="font-bold text-gray-700">
              {money(remaining)}
            </strong>
          </span>

          {target > 0 && (
            <span>
              Target{" "}
              <strong className="font-bold text-gray-700">
                {money(target)}
              </strong>
            </span>
          )}

          {monthlyTarget > 0 && (
            <span>
              Monthly{" "}
              <strong className="font-bold text-gray-700">
                {money(
                  monthlyTarget
                )}
              </strong>
            </span>
          )}

        </div>
      )}

    </div>
  );
}