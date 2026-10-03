import { execSync } from 'node:child_process'

export default function globalSetup() {
  execSync('pnpm --filter backend db:test:deploy', { stdio: 'inherit' })
  execSync('pnpm --filter backend e2e:prepare', { stdio: 'inherit' })
}
