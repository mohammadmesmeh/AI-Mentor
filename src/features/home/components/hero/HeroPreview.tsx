import { Play } from "lucide-react"
import { Avatar } from "@/shared/components/ui/Avatar"
import { ProgressBar } from "@/shared/components/ui/ProgressBar"
import { StatusDot } from "@/shared/components/ui/StatusDot"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"

/**
 * A glimpse of the learning workspace rising from the bottom of the hero and
 * cut off by it: a side rail, "Continue your journey", today's task and the
 * plan's progress. Sample data from the translation files, labelled "Example"
 * on screen; hidden from assistive tech, which would otherwise read the sample
 * as the learner's own progress.
 *
 * Below md only the task card is shown (with its "Example" label).
 */
function HeroPreview({ className }: { className?: string }) {
  const t = useT("hero")
  const progressLabel = t("preview.progress")
  const progressValue = t("preview.progressValue")

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex overflow-hidden rounded-[1.125rem] border border-hero-card-line bg-white shadow-[0_-6px_40px_rgb(18_49_77/10%)]",
        className
      )}
    >
      <div className="hidden w-19 shrink-0 flex-col items-center gap-4.5 border-e border-hero-rail-line pt-5.5 md:flex">
        <Avatar name={t("preview.learner")} className="size-8 text-sm" />
        <span className="h-1 w-6 rounded-sm bg-track" />
        <span className="h-1 w-6 rounded-sm bg-track" />
      </div>

      <div className="flex min-w-0 grow flex-col gap-3.5 p-4 md:px-6.5 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <p className="m-0! hidden font-hero text-[1.0625rem] leading-6 font-bold text-ink md:block">
            {t("preview.continue")}
          </p>
          <p className="m-0! text-[0.8125rem] leading-5 text-text-muted">{t("preview.example")}</p>
        </div>

        <div className="flex gap-3.5">
          <div className="flex min-w-0 flex-[1.6] items-center gap-3.5 rounded-[0.875rem] border border-hero-tile-line px-4 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.75rem] bg-primary-900 text-white">
              <Play className="size-3.5 fill-current" strokeWidth={0} />
            </span>
            <div className="min-w-0 grow">
              <p className="m-0! truncate font-hero text-[0.9375rem] leading-6 font-bold text-ink">{t("preview.task")}</p>
              <p className="m-0! truncate text-xs leading-5 text-text-muted">{t("preview.taskMeta")}</p>
            </div>
            <StatusDot tone="current" label={t("preview.today")} className="text-xs font-bold max-sm:hidden" />
          </div>

          <div className="hidden min-w-0 flex-1 flex-col justify-center gap-2 rounded-[0.875rem] border border-hero-tile-line px-4 py-3.5 md:flex">
            <div className="flex justify-between gap-3 text-[0.8125rem] leading-5 text-text-muted">
              <span>{progressLabel}</span>
              <span className="font-bold text-ink">{progressValue}</span>
            </div>
            <ProgressBar value={44} label={progressLabel} valueText={progressValue} size="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { HeroPreview }
