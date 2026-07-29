"use client"

import { motion } from "framer-motion"
import { Brain } from "lucide-react"

function RoadmapGeneration() {
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
          Building Your Map
        </h1>
        <p className="text-muted-foreground">
          Your AI Mentor is creating your personalized learning roadmap.
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
