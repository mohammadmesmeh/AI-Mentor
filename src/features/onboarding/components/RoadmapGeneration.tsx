"use client"

import { useT } from "@/shared/hooks/useT"
import { motion } from "framer-motion"
import { Brain } from "lucide-react"

function RoadmapGeneration() {
  const t = useT("onboarding")
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
      >
        <Brain className="h-10 w-10 text-primary" />
      </motion.div>

      <div className="space-y-2 text-center">
        <h1 className="text-heading-md font-semibold text-foreground">
          {t("generatingTitle", "Creating Your Learning Roadmap")}
        </h1>
        <p className="text-muted-foreground">
          {t("generatingDescription", "Our AI is building a personalized learning path just for you. This should only take a moment...")}
        </p>
      </div>

      <div className="progress-track max-w-xs">
        <motion.div
          className="progress-fill"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}

export { RoadmapGeneration }
