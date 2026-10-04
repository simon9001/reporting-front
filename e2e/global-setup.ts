import { execSync } from 'node:child_process'

/** Request a URL until it answers 200, so Vite's first-load transform/optimise work happens before the tests' timeouts start. */
async function warm(url: string, capMs = 60_000) {
  const deadline = Date.now() + capMs
  for (;;) {
    try {
      if ((await fetch(url)).status === 200) return
    } catch {
      // server still starting
    }
    if (Date.now() > deadline) throw new Error(`Dev server did not warm up: ${url}`)
    await new Promise((r) => setTimeout(r, 500))
  }
}

export default async function globalSetup() {
  execSync('pnpm --filter backend db:test:deploy', { stdio: 'inherit' })
  execSync('pnpm --filter backend e2e:prepare', { stdio: 'inherit' })
  await warm('http://localhost:5174/login')
  await warm('http://localhost:5174/src/main.tsx')
}
