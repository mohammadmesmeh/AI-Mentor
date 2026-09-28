/** DOM id of a task row in RoadmapView — the target of "go to task" links. */
export function taskAnchorId(taskId: string): string {
  return `task-${taskId}`
}

/**
 * After the browser follows a `#task-<id>` link, move keyboard/screen-reader
 * focus to that row too (spec 007 FR-020). The row carries tabIndex={-1};
 * scrolling is left to the hash navigation so reduced-motion rules apply.
 */
export function focusTaskAnchor(taskId: string): void {
  requestAnimationFrame(() => {
    document.getElementById(taskAnchorId(taskId))?.focus({ preventScroll: true })
  })
}
