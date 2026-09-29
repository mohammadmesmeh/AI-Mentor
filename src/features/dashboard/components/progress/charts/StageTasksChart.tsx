"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { toneColor } from "@/shared/components/ui/status-tone"

export interface StageBarDatum {
  /** Short axis label ("Stage 2"); the full title shows in the tooltip. */
  stage: string
  title: string
  completed: number
  remaining: number
}

/**
 * Completed vs remaining tasks per stage (shadcn Chart / recharts), loaded on
 * the Progress page only. recharts has no RTL mode, so the axis is reversed
 * and the value axis moves to the right in Arabic.
 */
export default function StageTasksChart({
  data,
  labels,
  rtl,
}: {
  data: StageBarDatum[]
  labels: { completed: string; remaining: string }
  rtl: boolean
}) {
  const config = {
    completed: { label: labels.completed, color: toneColor.completed },
    remaining: { label: labels.remaining, color: "var(--chart-remaining)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} barGap={8} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--line)" />
        <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={10} reversed={rtl} interval={0} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} orientation={rtl ? "right" : "left"} />
        <ChartTooltip
          cursor={{ fill: "var(--segment)" }}
          content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.title} />}
        />
        <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false} />
        <Bar dataKey="remaining" fill="var(--color-remaining)" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}
