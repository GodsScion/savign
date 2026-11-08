# savign.org

The company website for SAVIGN, served at https://www.savign.org. It is a Next.js app exported as static HTML to
`out/` and hosted on GitHub Pages.

## Develop

```bash
npm ci --ignore-scripts   # install exactly what package-lock.json pins, with no install scripts
npm run dev               # local dev server
npm run build             # static export to out/
npm run check             # gate over out/: copy rules, CSS rules, image sizes, JS budget
npm test                  # unit tests for the gate
npm run lint && npm run format:check
```

`npm run check -- --release` also fails while any field in `app/company.ts` is still empty.

`npm run qa -- <output-dir>` serves `out/`, runs Lighthouse mobile three times and takes screenshots. It needs
Lighthouse and Playwright installed elsewhere (`QA_TOOLS`, `QA_CHROME`); they are not dependencies of this repo.

## Deploy

A push to `main` runs `.github/workflows/deploy.yml`: install, lint, format check, tests, build, `check --release`,
then publishes `out/` to GitHub Pages. Changes reach `main` only after the owner says ship it.

## License

Copyright © 2025 SAVIGN Pvt. Ltd. All rights reserved.
