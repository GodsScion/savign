# savign.org

The company website for SAVIGN, served at https://www.savign.org. It is a Next.js app exported as static HTML to
`out/` and hosted on GitHub Pages.

## Develop

```bash
npm ci --ignore-scripts   # install exactly what package-lock.json pins, with no install scripts
npm run dev               # local dev server
npm run build             # static export to out/
npm run check             # gate over out/: copy rules, CSS rules, image sizes, JS budget
npm test                  # unit tests for the gate and the QA server
npm run test:build        # builds a probe Next app with every banned form planted; check must report each
npm run lint && npm run format:check
```

`npm run check -- --release` also fails while any field in `app/company.ts` is empty or a preview word (TBD,
pending, awaiting), and when a field's value is not shown as text on the home page (Rule 26).

`npm run qa -- <output-dir>` serves `out/`, runs Lighthouse mobile and desktop three times each, prints the medians,
takes screenshots, and exits 1 when performance or accessibility is under 90 or CLS over 0.1 on either. Add
`--allow-fail` for an exploratory run. It needs Lighthouse and Playwright installed elsewhere (`QA_TOOLS`,
`QA_CHROME`); they are not dependencies of this repo.

## Deploy

A push to `main` runs `.github/workflows/deploy.yml`: install, lint, format check, tests, the probe build test, build,
`check --release`,
then publishes `out/` to GitHub Pages. Changes reach `main` only after the owner says ship it.

## License

Copyright © 2025 SAVIGN Pvt. Ltd. All rights reserved.
