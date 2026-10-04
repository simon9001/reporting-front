# Control Room Reporting — Web app

React 19 + Vite + TanStack Query + Tailwind web app for the Control Room Operations, Incident & Shift Reporting System. It calls the API, which lives in its own repository, under `/api`.

`shared/src` is a copy of `@sr/shared` from the API repository, holding schemas, constants and types. Do not edit it here: change it in the combined workspace and run `pnpm sync-shared`.

## Run locally

Requires Node 22+ and pnpm 10. The API must be running. By default the dev server sends `/api` to `http://localhost:3000`; set `SR_API_PROXY` to point elsewhere.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit tests
pnpm build        # production build in dist/
```

The Playwright end-to-end tests (`e2e/`) need the API next to this folder, so run them from the combined workspace.

## Deploy: Vercel

1. In Vercel, choose **Add New → Project** and import this repository. `vercel.json` already sets these:
   - framework: Vite
   - install: `pnpm install --frozen-lockfile`
   - build: `pnpm build`
   - output: `dist`
   - No environment variables are needed.
2. **`vercel.json` rewrites `/api/*` to the API on Render**, so the browser only ever talks to the Vercel address. This is what keeps sign-in cookies and the API's same-origin protection working. If your Render service is not called `shiftreporting-api`, change the `destination` to your Render address before deploying.
3. In the API's Render settings, set `SR_APP_BASE_URL` to this site's address, for example `https://shiftreporting.vercel.app`. If you add a custom domain later, update it again.
4. **After deploying,** sign in and check that the indicator in the top bar shows **Live**.
   - If it keeps saying "Reconnecting", the proxy is not holding the live stream open.
   - The app still updates by itself, by re-checking every 60 seconds.
