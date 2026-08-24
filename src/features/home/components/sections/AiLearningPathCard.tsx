"use client"

import { useT } from "@/shared/hooks/useT"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { TextReveal } from "@/shared/components/animations/TextReveal"
import { AnimatedProgressBar } from "@/shared/components/animations/AnimatedProgressBar"
import { AnimatedNumber } from "@/shared/components/animations/AnimatedNumber"

interface AiLearningPathCardProps {
  className?: string
  title?: string
  badge?: string
  goal?: string
  currentStage?: number
  totalStages?: number
  completedTasks?: string[]
  currentTask?: string
  upcomingTasks?: string[]
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

function AiLearningPathCard({
  className,
  title,
  badge,
  goal,
  currentStage = 3,
  totalStages = 6,
  completedTasks,
  currentTask,
  upcomingTasks,
}: AiLearningPathCardProps) {
  const t = useT("aiLearningPath")
  const resolvedTitle = title ?? t("title", "Your Learning Path")
  const resolvedBadge = badge ?? t("badge", "AI-curated")
  const resolvedGoal = goal ?? t("defaultGoal", "Become a Backend Engineer")
  const resolvedCompletedTasks = completedTasks ?? [t("defaultCompletedTask1", "Choose a learning path"), t("defaultCompletedTask2", "Set up dev environment")]
  const resolvedCurrentTask = currentTask ?? t("defaultCurrentTask", "Build a REST API")
  const resolvedUpcomingTasks = upcomingTasks ?? [t("defaultUpcomingTask1", "Databases & Persistence"), t("defaultUpcomingTask2", "Authentication & Security")]
  const progressPercent = (currentStage / totalStages) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",

        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
      }}
      viewport={{ once: true, margin: "-40px" }}
      className='relative'
    >
      <div
        className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-primary-500/25 via-accent-500/15 to-primary-500/10 blur-[64px] opacity-80"
        aria-hidden="true"
      />
      <div className="animate-float">
        <Card className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--glass-bg)] shadow-hero backdrop-blur-2xl transition-all duration-500 ease-out-soft hover:-translate-y-1.5 hover:shadow-hero">
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02]"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary-500/[0.08] via-transparent to-accent-500/[0.08]" />
          </div>

          <CardContent className="relative z-10 p-6 sm:p-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={itemVariants} className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-500/20 to-accent-500/20 px-3 py-1 text-caption font-medium text-primary-300 ring-1 ring-white/[0.08]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-soft-pulse rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-300" />
                  </span>
                  {resolvedBadge}
                </span>
              </motion.div>

              <motion.div variants={itemVariants}>
                <TextReveal
                  as="h3"
                  className="font-display text-heading-md font-bold text-white"
                >
                  {resolvedTitle}
                </TextReveal>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="mt-5 border-t border-white/[0.06] pt-5">
                  <p className="mb-1.5 text-label text-white/50">
                    {t("goal", "Your Goal")}
                  </p>
                  <p className="font-display text-heading-sm font-semibold text-white/90">
                    {resolvedGoal}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="mt-5 space-y-3">
                  {resolvedCompletedTasks.map((task) => (
                    <div key={task} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/20">
                        <svg className="h-3 w-3 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="text-body-sm text-white/50 line-through">
                        {task}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center gap-3">
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-soft-pulse rounded-full bg-primary-500 opacity-30" />
                      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary-400 bg-primary-500/10">
                        <span className="h-2 w-2 rounded-full bg-primary-300" />
                      </span>
                    </span>
                    <p className="text-body-md font-semibold text-white">
                      {resolvedCurrentTask}
                    </p>
                  </div>

                  {resolvedUpcomingTasks.map((task) => (
                    <div key={task} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03]">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/[0.18]" />
                      </div>
                      <p className="text-body-sm text-white/40">
                        {task}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="mt-5 border-t border-white/[0.06] pt-5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-label text-white/50">
                      {t("progress", "Progress")}
                    </p>
                    <p className="text-caption font-medium text-white/40">
                      <AnimatedNumber value={progressPercent} suffix="%" delay={0.5} />
                    </p>
                  </div>
                  <AnimatedProgressBar value={progressPercent} ariaLabel={t("ariaProgressLabel", "Progress in your learning path")} ariaValuenow={currentStage} ariaValuemin={0} ariaValuemax={totalStages} />
                </div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

export { AiLearningPathCard, type AiLearningPathCardProps }