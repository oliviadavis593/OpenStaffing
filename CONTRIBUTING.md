# Contributing to OpenStaffing

Thanks for helping. You don't need to be an engineer: nurses, organizers, designers, data people,
and writers all make this better.

## Ways to help

- **Code:** pick an issue labeled `good first issue` or `help wanted`.
- **Data checks:** compare a hospital page against the original source and report anything off.
- **Nurse and organizer feedback:** tell us what question you needed answered last month that
  took too long. Open an issue or bring it to Chi Hack Night.
- **Docs and design:** plain-language explanations, accessibility reviews, and print layouts.
- **A new state:** see [docs/adding-a-state.md](docs/adding-a-state.md).

## Local setup

Follow the [Quickstart in the README](README.md#quickstart-about-5-minutes). In short:

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

## How the code is organized

| Package           | Purpose                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| `apps/web`        | The public site (Next.js App Router)                                               |
| `packages/core`   | Shared, dependency-free code: measure vocabulary, stats, normalization, formatting |
| `packages/db`     | Prisma schema and client                                                           |
| `packages/ingest` | Importers for each data source, plus the CLI                                       |

Read [docs/architecture.md](docs/architecture.md) before larger changes, and the
[ADRs](docs/adr) for why things are the way they are.

## Making a change

1. Open or comment on an issue first for anything bigger than a small fix.
2. Create a branch: `git checkout -b short-description`.
3. Keep changes focused. Add or update tests for anything in `packages/core` or `packages/ingest`.
4. Run the checks before you push:
   ```bash
   npm run typecheck && npm run lint && npm run test && npm run build
   ```
5. Open a pull request using the template. CI must pass.

## Data rules (please read)

- **Every staffing number renders through the `Figure` component**, so it always shows its unit,
  reporting period, and source link.
- **Never guess an ID** (measure IDs, CCNs, district numbers). Look it up, and cite where.
- **No patient information,** ever, even if someone offers it.
- **No editorial labels** like "unsafe hospital." Describe what the data shows.
- **Measures are only compared across states when their definitions truly match.**

## Database changes

Edit `packages/db/prisma/schema.prisma`, then run:

```bash
npm run db:migrate -- --name describe_your_change
```

Commit the generated migration folder with your change.

## Code of conduct

Everyone here follows our [Code of Conduct](CODE_OF_CONDUCT.md).
