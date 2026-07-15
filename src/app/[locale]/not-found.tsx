import Link from "next/dist/client/link";

export default function NotFound() {
  return (
<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-6">
  {/* Ambient background glow */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/20 blur-3xl animate-glow-pulse" />
    <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
  </div>

  {/* 404 Card */}
  <div className="relative z-10 flex max-w-lg flex-col items-center rounded-2xl border border-border-default bg-surface-card/80 p-10 text-center shadow-floating backdrop-blur-xl">
    <span className="mb-4 rounded-full bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-500">
      Error 404
    </span>

    <h1 className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-8xl font-bold tracking-tight text-transparent">
      404
    </h1>

    <h2 className="mt-4 text-heading-md font-semibold">
      Page Not Found
    </h2>

    <p className="mt-3 max-w-sm text-text-secondary">
      يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
    </p>

    <Link
      href="/"
      className="btn-primary mt-8"
    >
      العودة للرئيسية
    </Link>
  </div>
</div>
  );
}
