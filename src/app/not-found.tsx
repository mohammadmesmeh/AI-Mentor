import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-6">
      <div className="relative z-10 flex max-w-lg flex-col items-center rounded-2xl border border-border-default bg-surface-card/80 p-10 text-center shadow-floating backdrop-blur-xl">
        <span className="mb-4 rounded-full bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-500">
          Page Not Found
        </span>

        <span
          className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-8xl font-bold tracking-tight text-transparent"
          aria-hidden="true"
        >
          404
        </span>

        <h1 className="mt-4 text-heading-md font-semibold">
          {"Oops! This page doesn't exist."}
        </h1>

        <p className="mt-3 max-w-sm text-text-secondary">
          {"The page you're looking for might have been moved or deleted."}
        </p>

        <Link href="/" className="btn-primary mt-8">
          Back to Home
        </Link>
      </div>
    </div>
  );
}