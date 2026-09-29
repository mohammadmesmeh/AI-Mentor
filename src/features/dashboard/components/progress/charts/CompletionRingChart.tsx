"use client"

import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { toneColor } from "@/shared/components/ui/status-tone"

const config = {
  completed: { color: toneColor.completed },
  remaining: { color: "var(--chart-remaining)" },
} satisfies ChartConfig

/** The completion ring (shadcn Chart / recharts). Loaded on the Progress page only. */
export default function CompletionRingChart({ percent }: { percent: number }) {
  const data = [
    { key: "completed", value: percent },
    { key: "remaining", value: 100 - percent },
  ]
  return (
    <ChartContainer config={config} className="aspect-square size-full">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          stroke="none"
          cornerRadius={percent > 0 && percent < 100 ? 12 : 0}
          isAnimationActive={false}
        >
          {data.map((slice) => (
            <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
