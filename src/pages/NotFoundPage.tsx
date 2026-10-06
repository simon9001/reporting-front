import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <div className="h-2 w-48 rounded-full road-dash" aria-hidden />
      <p className="mt-8 font-display text-7xl font-bold tracking-tight text-asphalt-900 tabular-nums">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-asphalt-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you asked for does not exist or has moved.</p>
      <Link
        to="/"
        className="mt-8 inline-flex h-10 items-center justify-center rounded-[10px] bg-asphalt-800 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-asphalt-700 active:translate-y-px"
      >
        Go to your home page
      </Link>
    </section>
  )
}
