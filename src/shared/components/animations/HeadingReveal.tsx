"use client"

import {
  cloneElement,
  Fragment,
  isValidElement,
  useRef,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react"
import { motion, useInView } from "framer-motion"

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

interface HeadingRevealProps {
  /**
   * The heading's content: a plain string, or the `t.rich()` result of a
   * translation that wraps a key phrase in `<mark>` (see `sectionHighlight`).
   * Marked words keep the mark and its colour, and rise with the rest of the
   * line instead of getting an animation of their own.
   */
  children: ReactNode
  as?: HeadingTag
  className?: string
  id?: string
  delay?: number
}

const tagMap: Record<HeadingTag, ElementType> = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
}

/**
 * Transform only, never opacity: the app's `MotionConfig reducedMotion="user"`
 * drops a transform outright but would still run an opacity fade, and the point
 * of reduced motion here is that the words are simply there, unanimated.
 */
const HIDDEN = { y: "100%", rotateX: -60 }
const SHOWN = { y: 0, rotateX: 0 }

/** Longest landing title is eight words, so the last one lands at 0.315 + 0.45. */
const DURATION = 0.45
const STAGGER = 0.045

/**
 * Consecutive words that share a highlight, so a marked phrase stays one
 * `<mark>` instead of becoming one per word. `mark` is the element the words
 * came from — null for unmarked text.
 */
interface WordRun {
  mark: ReactElement<{ children?: ReactNode }> | null
  words: string[]
}

/** Narrows a child to an element whose `children` can be walked into. */
function isElement(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement(node)
}

/**
 * Flattens the title into runs of words, remembering which ones were marked.
 * Whitespace is dropped here and put back as a real space when rendering, so
 * the words stay a single text flow: the heading wraps and reverses correctly
 * in RTL, and copying it yields the text with its spaces.
 */
function splitRuns(node: ReactNode, mark: WordRun["mark"], into: WordRun[] = []): WordRun[] {
  if (typeof node === "string") {
    for (const word of node.split(/\s+/).filter(Boolean)) {
      const last = into.at(-1)
      if (last && last.mark === mark) last.words.push(word)
      else into.push({ mark, words: [word] })
    }
    return into
  }
  if (Array.isArray(node)) {
    for (const child of node) splitRuns(child, mark, into)
    return into
  }
  if (isElement(node)) {
    return splitRuns(node.props.children, node.type === "mark" ? node : mark, into)
  }
  return into
}

function HeadingReveal({ children, as = "h2", className, id, delay = 0 }: HeadingRevealProps) {
  const Tag = tagMap[as]
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const runs = splitRuns(children, null)
  // Read out once, as plain text. The animated words are hidden from assistive
  // tech, so the name never depends on how the translation marked its phrase.
  const plainText = runs.flatMap((run) => run.words).join(" ")

  return (
    <div ref={ref} className="reveal-mask overflow-hidden">
      <Tag id={id} className={className}>
        <span className="sr-only">{plainText}</span>
        <span aria-hidden="true">
          {runs.map((run, runIndex) => {
            const words = run.words.map((text, wordIndex) => (
              <Fragment key={wordIndex}>
                {wordIndex > 0 && " "}
                <span className="reveal-mask relative inline-block overflow-hidden">
                  <motion.span
                    data-reveal-word=""
                    className="inline-block"
                    initial={HIDDEN}
                    animate={isInView ? SHOWN : HIDDEN}
                    transition={{
                      duration: DURATION,
                      delay: delay + wordIndex * STAGGER,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {text}
                  </motion.span>
                </span>
              </Fragment>
            ))

            return (
              <Fragment key={runIndex}>
                {runIndex > 0 && " "}
                {run.mark
                  ? cloneElement(run.mark, { key: `mark-${runIndex}` }, words)
                  : words}
              </Fragment>
            )
          })}
        </span>
      </Tag>
    </div>
  )
}

export { HeadingReveal, type HeadingRevealProps }
