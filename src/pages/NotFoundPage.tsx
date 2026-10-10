import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
      <div className="h-1.5 w-40 rounded-full road-dash" aria-hidden />
      <p className="mt-6 font-display text-[40px] font-bold leading-none tracking-tight text-asphalt-900 tabular-nums">404</p>
      <h1 className="mt-2 font-display text-xl font-semibold text-asphalt-900">Page not found</h1>
      <p className="mt-1 text-[13px] text-slate-500">The page you asked for does not exist or has moved.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-asphalt-800 px-4 text-[13px] font-semibold text-white transition duration-150 hover:bg-asphalt-700 active:translate-y-px focus-visible:focus-halo sm:h-8"
      >
        Go to your home page
      </Link>
    </section>
  )
}
