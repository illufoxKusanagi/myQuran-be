---
name: elysiajs
description: >-
  Comprehensive guide, architectural patterns, and practical reference for building backend APIs with ElysiaJS on Bun.
  Use whenever developing, routing, refactoring, validating, or optimizing Elysia backend services,
  integrating Drizzle ORM, TypeBox schema validation, query/params parsing, error handling, or Eden Treaty.
---

# ElysiaJS Architecture & Skill Hub

Elysia is an ergonomic, high-performance TypeScript framework supercharged by Bun with end-to-end type safety, a unified TypeBox schema system, JIT route compilation, and sub-millisecond execution speeds.

This skill is partitioned into **6 comprehensive, full-content reference manuals** containing the complete, unabridged official documentation (over 460 KB across 89 doc sections) without any cutting of context:

---

## 📚 Complete Context Reference Manuals

| Volume | Focus Area | Sections Included | Link |
| :--- | :--- | :--- | :--- |
| **01. Getting Started & Core Concepts** | Quick starts, mental model, benchmarks, step-by-step tutorials | At a glance, Quick start, Key concepts, Tutorial intro, First route, What's next, Playground, Previews | [📖 01-getting-started.md](./references/01-getting-started.md) *(34.5 KB)* |
| **02. Essential Architecture** | Core routing, lifecycle, validation, and guards | Routes, Handlers, Plugins, Lifecycle pipeline, TypeBox validation, Best practices, Encapsulation, Guards, Handler & Context, Status & Headers | [📖 02-essential.md](./references/02-essential.md) *(114.7 KB)* |
| **03. Patterns & Advanced Engine** | Configuration, macros, WebSockets, tracing, JIT | Config matrix, Reactive Cookies, Deployment, Error handling & validation errors, Extends context, Fullstack dev server, Macros, Mount, OpenAPI, Tracing (`app.trace`), Standalone schemas, TypeScript, Unit tests, WebSockets, JIT Compiler internals | [📖 03-patterns.md](./references/03-patterns.md) *(143.1 KB)* |
| **04. Eden Suite** | End-to-end full-stack type safety | Eden Overview, Installation, Eden Fetch, Eden Treaty Overview, Parameters, Response, WebSocket subscriptions, Config, In-memory Unit testing, Legacy treaty | [📖 04-eden.md](./references/04-eden.md) *(43.4 KB)* |
| **05. Official Plugin Catalog** | First-party high-performance plugins | Plugin overview & deduplication, Bearer, CORS, Cron, Apollo GraphQL, Yoga GraphQL, HTML/JSX SSR, JWT, OpenAPI, Swagger, Server-Timing, Static assets | [📖 05-plugins.md](./references/05-plugins.md) *(62.4 KB)* |
| **06. Integrations & Cheat Sheet** | Framework integrations, databases, and cheat sheet | Drizzle ORM, Better Auth, AI SDK, Next.js, Nuxt, SvelteKit, Astro, TanStack Start, Prisma, React Email, Node.js, Deno, Cloudflare Worker, Netlify Edge, Vercel, Expo, and the Full Cheat Sheet | [📖 06-integrations.md](./references/06-integrations.md) *(71.4 KB)* |

---

## ⚡ Quick Decision Guide: "Which Tool Do I Use?"

### Context State
- Need a singleton database client, redis, or mailer? ➔ Use **`.decorate('db', db)`**. (See [02-essential.md](./references/02-essential.md))
- Need a request counter or in-memory global cache? ➔ Use **`.state('key', value)`**. (See [02-essential.md](./references/02-essential.md))
- Need to parse unauthenticated headers or client IP before validation? ➔ Use **`.derive(({ headers }) => ...)`**. (See [03-patterns.md](./references/03-patterns.md))
- Need to look up an authenticated User in the database after guards pass? ➔ Use **`.resolve(async ({ headers, db }) => ...)`**. (See [03-patterns.md](./references/03-patterns.md))

### Scoping
- Developing an isolated feature controller (e.g. `/hadith`)? ➔ Leave default **`local`**. (See [02-essential.md](./references/02-essential.md))
- Creating an auth or database plugin to share with parent routes? ➔ Use **`{ as: 'scoped' }`**. (See [02-essential.md](./references/02-essential.md))
- Creating a global CORS or error-handling utility? ➔ Use **`{ as: 'global' }`**. (See [02-essential.md](./references/02-essential.md))

### Input Validation & Coercion
- Query parameters are numeric strings (e.g. `?page=2&limit=20`)? ➔ Use **`t.Optional(t.Number({ minimum: 1 }))`**. Elysia coerces them automatically. (See [02-essential.md](./references/02-essential.md))
- Need to share models across routes without importing variables? ➔ Register in **`app.model({ ... })`** and reference by string name. (See [03-patterns.md](./references/03-patterns.md))
- Need a guard schema to add fields rather than override local route schemas? ➔ Use **`.guard({ schema: 'standalone', ... })`**. (See [03-patterns.md](./references/03-patterns.md))

---

## 🗄 Upstream Raw Archives

- [📖 Complete Upstream Markdown (`llms-full.md`)](./references/llms-full.md) *(462.3 KB)*
- [📖 Upstream Table of Contents Index (`llms.md`)](./references/llms.md)
