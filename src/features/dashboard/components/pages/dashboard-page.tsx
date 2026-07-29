"use client"

import { useSelector } from "react-redux"
import { Container } from "@/shared/components/ui/Container"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { BookOpen, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RootState } from "@/redux/store"
import { Button } from "@/shared/components/ui/Button"

function DashboardPage() {
  const onboarding = useSelector((state: RootState) => state.onboarding)

  if (!onboarding.roadmap) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 text-heading-md font-semibold text-foreground">
            Welcome to AI Mentor
          </h1>
          <p className="mb-6 text-muted-foreground">
            Complete your onboarding to get a personalized learning roadmap.
          </p>
          <Button href="/auth" variant="primary">
            Start Onboarding
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-heading-md font-semibold text-foreground">
            Your Learning Roadmap
          </h1>
          <p className="mt-1 text-muted-foreground">
            {onboarding.learningGoal}
          </p>
        </div>

        <div className="space-y-3">
          {onboarding.roadmap.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Card
                className={cn(
                  "transition-all duration-200",
                  index === 0 ? "border-primary/30" : "opacity-60",
                )}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {index === 0 ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        index > 0 && "text-muted-foreground",
                      )}
                    >
                      {item}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {index === 0
                        ? "Current milestone"
                        : "Upcoming milestone"}
                    </p>
                  </div>
                  {index === 0 && (
                    <div className="ml-auto">
                      <span className="badge-base bg-primary/10 text-primary text-xs">
                        In Progress
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Container>
  )
}

export { DashboardPage }
