# Elysia Ecosystem Integrations & Cheat Sheet

> Complete integration guides: Drizzle ORM, Better Auth, AI SDK, Next.js, Nuxt, SvelteKit, Astro, TanStack, Prisma, serverless/edge runtimes, and the cheat sheet.

## Table of Contents

- [Better Auth (integrations/better-auth.md)](#better-auth)
- [Cheat Sheet (integrations/cheat-sheet.md)](#cheat-sheet)
- [Deploy Elysia on Vercel (integrations/vercel.md)](#deploy-elysia-on-vercel)
- [Integration with AI SDK (integrations/ai-sdk.md)](#integration-with-ai-sdk)
- [Integration with Astro (integrations/astro.md)](#integration-with-astro)
- [Cloudflare Worker Experimental (integrations/cloudflare-worker.md)](#cloudflare-worker-experimental)
- [Integration with Deno (integrations/deno.md)](#integration-with-deno)
- [Drizzle (integrations/drizzle.md)](#drizzle)
- [Integration with Expo (integrations/expo.md)](#integration-with-expo)
- [Integration with Netlify Edge Function (integrations/netlify.md)](#integration-with-netlify-edge-function)
- [Integration with Next.js (integrations/nextjs.md)](#integration-with-next-js)
- [Integration with Node.js (integrations/node.md)](#integration-with-node-js)
- [Integration with Nuxt (integrations/nuxt.md)](#integration-with-nuxt)
- [Prisma (integrations/prisma.md)](#prisma)
- [Integration with SvelteKit (integrations/sveltekit.md)](#integration-with-sveltekit)
- [Integration with TanStack Start (integrations/tanstack-start.md)](#integration-with-tanstack-start)
- [React Email (integrations/react-email.md)](#react-email)

---

---
url: 'https://elysiajs.com/integrations/better-auth.md'
---

# Better Auth

Better Auth is framework-agnostic authentication (and authorization) framework for TypeScript.
It provides a comprehensive set of features out of the box and includes a plugin ecosystem that simplifies adding advanced functionalities.
We recommend going through the [Better Auth basic setup](https://www.better-auth.com/docs/installation) before going through this page.
Our basic setup will look like this:

```ts [auth.ts]
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
export const auth = betterAuth({
    database: new Pool()
})
```

## Handler

After setting up the Better Auth instance, we can mount it to Elysia via [mount](/patterns/mount.html).
We need to mount the handler to an Elysia endpoint.

```ts [index.ts]
import { Elysia } from 'elysia'
import { auth } from './auth'
const app = new Elysia()
	.mount(auth.handler) // [!code ++]
	.listen(3000)
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

Then we can access Better Auth at `http://localhost:3000/api/auth`.

### Custom endpoint

We recommend setting a prefix path when using [mount](/patterns/mount.html).

```ts [index.ts]
import { Elysia } from 'elysia'
const app = new Elysia()
	.mount('/auth', auth.handler) // [!code ++]
	.listen(3000)
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

Then we can access Better Auth at `http://localhost:3000/auth/api/auth`.
But the URL looks redundant, so we can customize the `/api/auth` prefix to something else in the Better Auth instance.

```ts
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
export const auth = betterAuth({
    basePath: '/api' // [!code ++]
})
```

Then we can access Better Auth at `http://localhost:3000/auth/api`.
Unfortunately, we can't set the `basePath` of a Better Auth instance to be empty or `/`.

## OpenAPI

Better Auth supports `openapi` with `better-auth/plugins`.
However, if we are using [@elysia/openapi](/plugins/openapi), you might want to extract the documentation from the Better Auth instance.
First, we need to add the `openAPI` plugin to our Better Auth instance:

```ts [auth.ts]
import { betterAuth } from 'better-auth'
import { openAPI } from 'better-auth/plugins' // [!code ++]
import { Pool } from 'pg'
export const auth = betterAuth({
    database: new Pool(),
    plugins: [openAPI()] // [!code ++]
})
```

::: tip
The `openAPI()` plugin is required for `auth.api.generateOpenAPISchema` to be available. Without it, you will get a type error: `Property 'generateOpenAPISchema' does not exist`.
:::
Then we may extract the OpenAPI schema with the following code:

```ts [auth.ts]
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())
export const OpenAPI = {
    getPaths: (prefix = '/auth/api') =>
        getSchema().then(({ paths }) => {
            const reference: typeof paths = Object.create(null)
            for (const path of Object.keys(paths)) {
                const key = prefix + path
                reference[key] = paths[path]
                for (const method of Object.keys(paths[path])) {
                    const operation = (reference[key] as any)[method]
                    operation.tags = ['Better Auth']
                }
            }
            return reference
        }) as Promise<any>,
    components: getSchema().then(({ components }) => components) as Promise<any>
} as const
```

Then in our Elysia instance that uses `@elysia/openapi`.

```ts
import { Elysia } from 'elysia'
import { openapi } from '@elysia/openapi'
import { OpenAPI } from './auth'
const app = new Elysia().use(
    openapi({
        documentation: {
            components: await OpenAPI.components,
            paths: await OpenAPI.getPaths()
        }
    })
)
```

## CORS

To configure CORS, you can use the `cors` plugin from `@elysia/cors`.

```ts
import { Elysia } from 'elysia'
import { cors } from '@elysia/cors'
import { auth } from './auth'
const app = new Elysia()
    .use(
        cors({
            origin: 'http://localhost:3001',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization']
        })
    )
    .mount(auth.handler)
    .listen(3000)
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

## Macro

You can use [macro](https://elysiajs.com/patterns/macro.html#macro) with [resolve](https://elysiajs.com/patterns/macro#resolve) to provide session and user information before passing to the view.

```ts
import { Elysia } from 'elysia'
import { auth } from './auth'
// user middleware (compute user and session and pass to routes)
const betterAuth = new Elysia({ name: 'better-auth' })
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ status, request: { headers } }) {
                const session = await auth.api.getSession({
                    headers
                })
                if (!session) return status(401)
                return {
                    user: session.user,
                    session: session.session
                }
            }
        }
    })
const app = new Elysia()
    .use(betterAuth)
    .get('/user', ({ user }) => user, {
        auth: true
    })
    .listen(3000)
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

This will allow you to access the `user` and `session` objects in all of your routes.

---


---

---
url: 'https://elysiajs.com/integrations/cheat-sheet.md'
---

# Cheat Sheet

Here is a quick overview of common Elysia patterns

## Hello World

A simple hello world

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'Hello World')
    .listen(3000)
```

## Custom HTTP Method

Define routes using custom HTTP methods/verbs

See [Route](/essential/route.html#custom-method)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/hi', () => 'Hi')
    .post('/hi', () => 'From Post')
    .put('/hi', () => 'From Put')
    .route('M-SEARCH', '/hi', () => 'Custom Method')
    .listen(3000)
```

## Path Parameter

Using dynamic path parameters

See [Path](/essential/route.html#path-type)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/rest/*', () => 'Rest')
    .listen(3000)
```

## Return JSON

Elysia converts response to JSON automatically

See [Handler](/essential/handler.html)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/json', () => {
        return {
            hello: 'Elysia'
        }
    })
    .listen(3000)
```

## Return a file

A file can be returned as a formdata response

The response must be a 1-level deep object

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/json', () => {
        return {
            hello: 'Elysia',
            image: file('public/cat.jpg')
        }
    })
    .listen(3000)
```

## Header and status

Set a custom header and a status code

See [Handler](/essential/handler.html)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set, status }) => {
        set.headers['x-powered-by'] = 'Elysia'

        return status(418, "I'm a teapot")
    })
    .listen(3000)
```

## Group

Define a prefix once for subroutes

See [Group](/essential/route.html#group)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get("/", () => "Hi")
    .group("/auth", app => {
        return app
            .get("/", () => "Hi")
            .post("/sign-in", ({ body }) => body)
            .put("/sign-up", ({ body }) => body)
    })
    .listen(3000)
```

## Schema

Enforce a data type on a route

See [Validation](/essential/validation)

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/mirror', ({ body: { username } }) => username, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .listen(3000)
```

## File upload

See [Validation#file](/essential/validation#file)

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {
		body: t.Object({
			file: t.File({ format: 'image/*' }),
			multipleFiles: t.Files()
		})
	})
	.listen(3000)
```

## Lifecycle Hook

Intercept Elysia events in order

See [Lifecycle](/essential/life-cycle.html)

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .onRequest(() => {
        console.log('On request')
    })
    .on('beforeHandle', () => {
        console.log('Before handle')
    })
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        }),
        afterHandle: () => {
            console.log("After handle")
        }
    })
    .listen(3000)
```

## Guard

Enforce a data type on subroutes

See [Scope](/essential/plugin.html#scope)

```typescript twoslash
// @errors: 2345
import { Elysia, t } from 'elysia'

new Elysia()
    .guard({
        response: t.String()
    }, (app) => app
        .get('/', () => 'Hi')
        // Invalid: will throws error, and TypeScript will report error
        .get('/invalid', () => 1)
    )
    .listen(3000)
```

## Custom context

Add custom variables to route context

See [Context](/essential/handler.html#context)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .state('version', 1)
    .decorate('getDate', () => Date.now())
    .get('/version', ({
        getDate,
        store: { version }
    }) => `${version} ${getDate()}`)
    .listen(3000)
```

## Redirect

Redirect responses

See [Handler](/essential/handler.html#redirect)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'hi')
    .get('/redirect', ({ redirect }) => {
        return redirect('/')
    })
    .listen(3000)
```

## Plugin

Create a separate instance

See [Plugin](/essential/plugin)

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .state('plugin-version', 1)
    .get('/hi', () => 'hi')

new Elysia()
    .use(plugin)
    .get('/version', ({ store }) => store['plugin-version'])
    .listen(3000)
```

## WebSocket

Create a realtime connection using WebSocket

See [Web Socket](/patterns/websocket)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .ws('/ping', {
        message(ws, message) {
            ws.send('hello ' + message)
        }
    })
    .listen(3000)
```

## OpenAPI documentation

Create interactive documentation using Scalar (or optionally Swagger)

See [openapi](/plugins/openapi.html)

```typescript
import { Elysia } from 'elysia'
import { openapi } from '@elysia/openapi'

const app = new Elysia()
    .use(openapi())
    .listen(3000)

console.log(`View documentation at "${app.server!.url}openapi" in your browser`);
```

## Unit Test

Write a unit test for your Elysia app

See [Unit Test](/patterns/unit-test)

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Elysia', () => {
    it('return a response', async () => {
        const app = new Elysia().get('/', () => 'hi')

        const response = await app
            .handle(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

## Custom body parser

Create custom logic for parsing bodies

See [Parse](/essential/life-cycle.html#parse)

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onParse(({ request, contentType }) => {
        if (contentType === 'application/custom-type')
            return request.text()
    })
```

## GraphQL

Create a custom GraphQL server using GraphQL Yoga or Apollo

See [GraphQL Yoga](/plugins/graphql-yoga)

```typescript
import { Elysia } from 'elysia'
import { yoga } from '@elysia/graphql-yoga'

const app = new Elysia()
    .use(
        yoga({
            typeDefs: /* GraphQL */`
                type Query {
                    hi: String
                }
            `,
            resolvers: {
                Query: {
                    hi: () => 'Hello from Elysia'
                }
            }
        })
    )
    .listen(3000)
```

---


---

---
url: 'https://elysiajs.com/integrations/vercel.md'
---

# Deploy Elysia on Vercel

Elysia can be deployed on Vercel with zero configuration using either Bun or Node runtime.

1. In **src/index.ts**, create or import an existing Elysia server
2. Export the Elysia server as default export

```typescript
import { Elysia, t } from 'elysia'

export default new Elysia() // [!code ++]
    .get('/', () => 'Hello Vercel Function')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })
```

3. Develop locally with Vercel CLI

```bash
vc dev
```

4. Deploy to Vercel

```bash
vc deploy
```

That's it. Your Elysia app is now running on Vercel.

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

### Using Node.js

To deploy with Node.js, make sure to set `type: module` in your `package.json`

::: code-group

```ts [package.json]
{
  "name": "elysia-app",
  "type": "module" // [!code ++]
}
```

:::

### Using Bun

To deploy with Bun, make sure to set the runtime to Bun in your `vercel.json`

::: code-group

```ts [vercel.json]
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x" // [!code ++]
}
```

## If this doesn't work

Vercel has zero-configuration support for Elysia. For additional configuration, please refer to the [Vercel documentation](https://vercel.com/docs/frameworks/backend/elysia)

---


---

---
url: 'https://elysiajs.com/integrations/ai-sdk.md'
---

# Integration with AI SDK

Elysia provides support for response streaming with ease, allowing you to integrate with [Vercel AI SDKs](https://vercel.com/docs/ai) seamlessly.

## Response Streaming

Elysia supports continuous streaming of a `ReadableStream` and `Response`, allowing you to return streams directly from the AI SDKs.

```ts
import { Elysia } from 'elysia'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

new Elysia().get('/', () => {
    const stream = streamText({
        model: openai('gpt-5'),
        system: 'You are Yae Miko from Genshin Impact',
        prompt: 'Hi! How are you doing?'
    })

    // Just return a ReadableStream
    return stream.textStream // [!code ++]

    // UI Message Stream is also supported
    return stream.toUIMessageStream() // [!code ++]
})
```

Elysia will handle the stream automatically, allowing you to use it in various ways.

## Server-Sent Events

Elysia also supports Server-Sent Events for streaming responses by simply wrapping a `ReadableStream` with the `sse` function.

```ts
import { Elysia, sse } from 'elysia' // [!code ++]
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

new Elysia().get('/', () => {
    const stream = streamText({
        model: openai('gpt-5'),
        system: 'You are Yae Miko from Genshin Impact',
        prompt: 'Hi! How are you doing?'
    })

    // Each chunk will be sent as a Server Sent Event
    return sse(stream.textStream) // [!code ++]

    // UI Message Stream is also supported
    return sse(stream.toUIMessageStream()) // [!code ++]
})
```

## As Response

If you don't need type safety from the stream for further usage with [Eden](/eden/overview), you can return the stream directly as a response.

```ts
import { Elysia } from 'elysia'
import { ai } from 'ai'
import { openai } from '@ai-sdk/openai'

new Elysia().get('/', () => {
    const stream = streamText({
        model: openai('gpt-5'),
        system: 'You are Yae Miko from Genshin Impact',
        prompt: 'Hi! How are you doing?'
    })

    return stream.toTextStreamResponse() // [!code ++]

    // UI Message Stream Response will use SSE
    return stream.toUIMessageStreamResponse() // [!code ++]
})
```

## Manual Streaming

If you want to have more control over the streaming, you can use a generator function to yield the chunks manually.

```ts
import { Elysia, sse } from 'elysia'
import { ai } from 'ai'
import { openai } from '@ai-sdk/openai'

new Elysia().get('/', async function* () {
    const stream = streamText({
        model: openai('gpt-5'),
        system: 'You are Yae Miko from Genshin Impact',
        prompt: 'Hi! How are you doing?'
    })

    for await (const data of stream.textStream) // [!code ++]
        yield sse({ // [!code ++]
            data, // [!code ++]
            event: 'message' // [!code ++]
        }) // [!code ++]

    yield sse({
        event: 'done'
    })
})
```

## Fetch

If the AI SDK doesn't support the model you're using, you can still use the `fetch` function to make requests to the AI SDKs and stream the response directly.

```ts
import { Elysia, fetch } from 'elysia'

new Elysia().get('/', () => {
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-5',
            stream: true,
            messages: [
                {
                    role: 'system',
                    content: 'You are Yae Miko from Genshin Impact'
                },
                { role: 'user', content: 'Hi! How are you doing?' }
            ]
        })
    })
})
```

Elysia will proxy the fetch response with streaming support automatically.

***

For additional information, please refer to the [AI SDK documentation](https://ai-sdk.dev/docs/introduction)

---


---

---
url: 'https://elysiajs.com/integrations/astro.md'
---

# Integration with Astro

With [Astro Endpoint](https://docs.astro.build/en/core-concepts/endpoints/), we can run Elysia on Astro directly.

1. Set **output** to **server** in **astro.config.mjs**

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
    output: 'server' // [!code ++]
})
```

2. Create **pages/\[...slugs].ts**
3. Create or import an existing Elysia server in **\[...slugs].ts**
4. Export the handler with the name of the method you want to expose

```typescript
// pages/[...slugs].ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/api', () => 'hi')
    .post('/api', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

const handle = ({ request }: { request: Request }) => app.handle(request) // [!code ++]

export const GET = handle // [!code ++]
export const POST = handle // [!code ++]
```

Elysia will work normally as expected because of WinterTC compliance.

We recommend running [Astro on Bun](https://docs.astro.build/en/recipes/bun) as Elysia is designed to be run on Bun.

::: tip
You can run Elysia server without running Astro on Bun thanks to WinterTC support.
:::

With this approach, you can have co-location of both frontend and backend in a single repository and have End-to-end type-safety with Eden.

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Prefix

If you place an Elysia server not in the root directory of the app router, you need to annotate the prefix on the Elysia server.

For example, if you place the Elysia server in **pages/api/\[...slugs].ts**, you need to annotate the prefix as **/api** on the Elysia server.

```typescript
// pages/api/[...slugs].ts
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' }) // [!code ++]
    .get('/', () => 'hi')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

const handle = ({ request }: { request: Request }) => app.handle(request) // [!code ++]

export const GET = handle // [!code ++]
export const POST = handle // [!code ++]
```

This will ensure that Elysia routing works properly wherever you place it.

Please refer to [Astro Endpoints](https://docs.astro.build/en/core-concepts/endpoints/) for more information.

---


---

---
url: 'https://elysiajs.com/integrations/cloudflare-worker.md'
---

# Cloudflare Worker Experimental

Elysia now supports Cloudflare Worker with an **experimental** Cloudflare Worker Adapter.

1. You will need [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update) to setup, and start a development server.

```bash
wrangler init elysia-on-cloudflare
```

2. Then add Cloudflare Adapter to your Elysia app, and make sure to call `.compile()` before exporting the app.

```ts
import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker' // [!code ++]

export default new Elysia({
	adapter: CloudflareAdapter // [!code ++]
})
	.get('/', () => 'Hello Cloudflare Worker!')
	// This is required to make Elysia work on Cloudflare Worker
	.compile() // [!code ++]
```

3. Make sure to have `compatibility_date` set to at least `2025-06-01` in your wrangler config

::: code-group

```jsonc [wrangler.jsonc]
{
	"$schema": "node_modules/wrangler/config-schema.json",
 	"name": "elysia-on-cloudflare",
	"main": "src/index.ts",
	"compatibility_date": "2025-06-01" // [!code ++]
}
```

```toml [wrangler.toml]
main = "src/index.ts"
name = "elysia-on-cloudflare"
compatibility_date = "2025-06-01" # [!code ++]
```

:::

4. Now you can start the development server with:

```bash
wrangler dev
```

This should start a development server at `http://localhost:8787`

You don't need a `nodejs_compat` flag as Elysia doesn't use any Node.js built-in modules (or the ones we use don't support Cloudflare Worker yet).

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Limitations

Here are some known limitations of using Elysia on Cloudflare Workers:

1. `Elysia.file`, and [Static Plugin](/plugins/static) don't work [due to the lack of the `fs` module](https://developers.cloudflare.com/workers/runtime-apis/nodejs/#supported-nodejs-apis); see the [Static File](#static-file) section for alternatives
2. [OpenAPI Type Gen](/blog/openapi-type-gen) doesn't work [due to the lack of the `fs` module](https://developers.cloudflare.com/workers/runtime-apis/nodejs/#supported-nodejs-apis)
3. You can't define [**Response** before server start](https://x.com/saltyAom/status/1966602691754553832) or use a plugin that does so
4. You can't inline a value due to #3.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	// This will throw error
    .get('/', 'Hello Elysia')
    .listen(3000)
```

## Static Files

[Static Plugin](/plugins/static) doesn't work, but you can still serve static files with [Cloudflare's built-in static file serving](https://developers.cloudflare.com/workers/static-assets/).

Add the following to your wrangler config:

::: code-group

```jsonc [wrangler.jsonc]
{
	"$schema": "node_modules/wrangler/config-schema.json",
 	"name": "elysia-on-cloudflare",
	"main": "src/index.ts",
	"compatibility_date": "2025-06-01",
	"assets": { "directory": "public" } // [!code ++]
}
```

```toml [wrangler.toml]
name = "elysia-on-cloudflare"
main = "src/index.ts"
compatibility_date = "2025-06-01"
assets = { directory = "public" } # [!code ++]
```

:::

Create a `public` folder and place your static files in it.

For example, if you have a folder structure like this:

```
│
├─ public
│  ├─ kyuukurarin.mp4
│  └─ static
│     └─ mika.webp
├─ src
│  └── index.ts
└─ wrangler.toml
```

Then you should be able to access your static files from the following paths:

* **http://localhost:8787/kyuukurarin.mp4**
* **http://localhost:8787/static/mika.webp**

## Bindings

You can use Cloudflare Workers bindings by importing env from `cloudflare:workers`.

```ts
import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { env } from 'cloudflare:workers' // [!code ++]

export default new Elysia({
	adapter: CloudflareAdapter
})
	.get('/', () => `Hello ${await env.KV.get('my-key')}`) // [!code ++]
	.compile()
```

See [Cloudflare Workers: Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global) for more information about bindings.

## AoT compilation

Previously, to use Elysia on Cloudflare Worker, you have to pass `aot: false` to the Elysia constructor.

This is no longer necessary as [Cloudflare now supports Function compilation during startup](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#enable-eval-during-startup).

As of Elysia 1.4.7, you can now use Ahead of Time Compilation with Cloudflare Worker, and drop the `aot: false` flag.

```ts
import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker' // [!code ++]

export default new Elysia({
	aot: false, // [!code --]
	adapter: CloudflareAdapter // [!code ++]
})
```

Otherwise, you can still use `aot: false` if you don't want Ahead of Time Compilation, but we recommend using it for better performance and accurate plugin encapsulation.

---


---

---
url: 'https://elysiajs.com/integrations/deno.md'
---

# Integration with Deno

Elysia is built on top of Web Standard Request/Response, allowing us to run Elysia with Deno.serve directly.

To run Elysia on Deno, wrap `Elysia.fetch` in `Deno.serve`

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/', () => 'Hello Elysia')
	.listen(3000) // [!code --]

Deno.serve(app.fetch) // [!code ++]
```

Then you can run the server with `deno serve`:

```bash
deno serve --watch src/index.ts
```

This is all you need to run Elysia on Deno.

### Change Port Number

You can specify the port number in `Deno.serve`.

```ts
Deno.serve(app.fetch) // [!code --]
Deno.serve({ port:8787 }, app.fetch) // [!code ++]
```

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

---


---

---
url: 'https://elysiajs.com/integrations/drizzle.md'
---

# Drizzle

Drizzle ORM is a headless TypeScript ORM with a focus on type safety and developer experience.

We may convert Drizzle schema to Elysia validation models using `drizzle-typebox`

### Drizzle Typebox

[Elysia.t](/essential/validation.html#elysia-type) is a fork of TypeBox, allowing us to use any TypeBox type in Elysia directly.

We can convert Drizzle schema into TypeBox schema using ["drizzle-typebox"](https://npmjs.org/package/drizzle-typebox), and use it directly on Elysia's schema validation.

### Here's how it works:

1. Define your database schema in Drizzle.
2. Convert Drizzle schema into Elysia validation models using `drizzle-typebox`.
3. Use the converted Elysia validation models to ensure type validation.
4. OpenAPI schema is generated from Elysia validation models.
5. Add [Eden Treaty](/eden/overview) to add type-safety to your frontend.

```
                                                    * ——————————————— *
                                                    |                 |
                                               | -> |  Documentation  |
* ————————— *             * ———————— * OpenAPI |    |                 |
|           |   drizzle-  |          | ——————— |    * ——————————————— *
|  Drizzle  | —————————-> |  Elysia  |
|           |  -typebox   |          | ——————— |    * ——————————————— *
* ————————— *             * ———————— *   Eden  |    |                 |
                                               | -> |  Frontend Code  |
												    |                 |
												    * ——————————————— *

```

## Installation

To install Drizzle, run the following command:

```bash
bun add drizzle-orm drizzle-typebox
```

Then you need to pin `@sinclair/typebox` as there might be a mismatch version between `drizzle-typebox` and `Elysia`, this may cause conflict of Symbols between two versions.

We recommend pinning the version of `@sinclair/typebox` to the **minimum version** used by `elysia` by using:

```bash
grep "@sinclair/typebox" node_modules/elysia/package.json
```

We may use `overrides` field in `package.json` to pin the version of `@sinclair/typebox`:

```json
{
  "overrides": {
  	"@sinclair/typebox": "0.32.4"
  }
}
```

## Drizzle schema

Assuming we have a `user` table in our codebase as follows:

::: code-group

```ts [src/database/schema.ts]
import {
    pgTable,
    varchar,
    timestamp
} from 'drizzle-orm/pg-core'

import { createId } from '@paralleldrive/cuid2'

export const user = pgTable(
    'user',
    {
        id: varchar('id')
            .$defaultFn(() => createId())
            .primaryKey(),
        username: varchar('username').notNull().unique(),
        password: varchar('password').notNull(),
        email: varchar('email').notNull().unique(),
        salt: varchar('salt', { length: 64 }).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    }
)

export const table = {
	user
} as const

export type Table = typeof table
```

:::

## drizzle-typebox

We may convert the `user` table into TypeBox models by using `drizzle-typebox`:

::: code-group

```ts [src/index.ts]
import { t } from 'elysia'
import { createInsertSchema } from 'drizzle-typebox'
import { table } from './database/schema'

const _createUser = createInsertSchema(table.user, {
	// Replace email with Elysia's email type
	email: t.String({ format: 'email' })
})

new Elysia()
	.post('/sign-up', ({ body }) => {
		// Create a new user
	}, {
		body: t.Omit(
			_createUser,
			['id', 'salt', 'createdAt']
		)
	})
```

:::

This allows us to reuse the database schema in Elysia validation models

## Type instantiation is possibly infinite

If you got an error like **Type instantiation is possibly infinite** this is because of the circular reference between `drizzle-typebox` and `Elysia`.

If we nested a type from drizzle-typebox into Elysia schema, it will cause an infinite loop of type instantiation.

To prevent this, we need to **explicitly define a type between `drizzle-typebox` and `Elysia`** schema:

```ts
import { t } from 'elysia'
import { createInsertSchema } from 'drizzle-typebox'

import { table } from './database/schema'

const _createUser = createInsertSchema(table.user, {
	email: t.String({ format: 'email' })
})

// ✅ This works, by referencing the type from `drizzle-typebox`
const createUser = t.Omit(
	_createUser,
	['id', 'salt', 'createdAt']
)

// ❌ This will cause an infinite loop of type instantiation
const createUser = t.Omit(
	createInsertSchema(table.user, {
		email: t.String({ format: 'email' })
	}),
	['id', 'salt', 'createdAt']
)
```

Always declare a variable for `drizzle-typebox` and reference it if you want to use Elysia type

## Utility

As we are likely going to use `t.Pick` and `t.Omit` to exclude or include certain fields, it may be cumbersome to repeat the process:

We recommend using these utility functions **(copy as-is)** to simplify the process:

::: code-group

```ts [src/database/utils.ts]
/**
 * @lastModified 2025-02-04
 * @see https://elysiajs.com/recipe/drizzle.html#utility
 */

import { Kind, type TObject } from '@sinclair/typebox'
import {
    createInsertSchema,
    createSelectSchema,
    BuildSchema,
} from 'drizzle-typebox'

import { table } from './schema'
import type { Table } from 'drizzle-orm'

type Spread<
    T extends TObject | Table,
    Mode extends 'select' | 'insert' | undefined,
> =
    T extends TObject<infer Fields>
        ? {
              [K in keyof Fields]: Fields[K]
          }
        : T extends Table
          ? Mode extends 'select'
              ? BuildSchema<
                    'select',
                    T['_']['columns'],
                    undefined
                >['properties']
              : Mode extends 'insert'
                ? BuildSchema<
                      'insert',
                      T['_']['columns'],
                      undefined
                  >['properties']
                : {}
          : {}

/**
 * Spread a Drizzle schema into a plain object
 */
export const spread = <
    T extends TObject | Table,
    Mode extends 'select' | 'insert' | undefined,
>(
    schema: T,
    mode?: Mode,
): Spread<T, Mode> => {
    const newSchema: Record<string, unknown> = {}
    let table

    switch (mode) {
        case 'insert':
        case 'select':
            if (Kind in schema) {
                table = schema
                break
            }

            table =
                mode === 'insert'
                    ? createInsertSchema(schema)
                    : createSelectSchema(schema)

            break

        default:
            if (!(Kind in schema)) throw new Error('Expect a schema')
            table = schema
    }

    for (const key of Object.keys(table.properties))
        newSchema[key] = table.properties[key]

    return newSchema as any
}

/**
 * Spread a Drizzle Table into a plain object
 *
 * If `mode` is 'insert', the schema will be refined for insert
 * If `mode` is 'select', the schema will be refined for select
 * If `mode` is undefined, the schema will be spread as is, models will need to be refined manually
 */
export const spreads = <
    T extends Record<string, TObject | Table>,
    Mode extends 'select' | 'insert' | undefined,
>(
    models: T,
    mode?: Mode,
): {
    [K in keyof T]: Spread<T[K], Mode>
} => {
    const newSchema: Record<string, unknown> = {}
    const keys = Object.keys(models)

    for (const key of keys) newSchema[key] = spread(models[key], mode)

    return newSchema as any
}
```

:::

This utility function will convert Drizzle schema into a plain object, which can pick by property name as plain object:

```ts
// ✅ Using spread utility function
const user = spread(table.user, 'insert')

const createUser = t.Object({
	id: user.id, // { type: 'string' }
	username: user.username, // { type: 'string' }
	password: user.password // { type: 'string' }
})

// ⚠️ Using t.Pick
const _createUser = createInsertSchema(table.user)

const createUser = t.Pick(
	_createUser,
	['id', 'username', 'password']
)
```

### Table Singleton

We recommend using a singleton pattern to store the table schema, this will allow us to access the table schema from anywhere in the codebase:

::: code-group

```ts [src/database/model.ts]
import { table } from './schema'
import { spreads } from './utils'

export const db = {
	insert: spreads({
		user: table.user,
	}, 'insert'),
	select: spreads({
		user: table.user,
	}, 'select')
} as const
```

:::

This will allow us to access the table schema from anywhere in the codebase:

::: code-group

```ts [src/index.ts]
import { Elysia, t } from 'elysia'
import { db } from './database/model'

const { user } = db.insert

new Elysia()
	.post('/sign-up', ({ body }) => {
		// Create a new user
	}, {
		body: t.Object({
			id: user.username,
			username: user.username,
			password: user.password
		})
	})
```

:::

### Refinement

If type refinement is needed, you may use `createInsertSchema` and `createSelectSchema` to refine the schema directly.

::: code-group

```ts [src/database/model.ts]
import { t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

import { table } from './schema'
import { spreads } from './utils'

export const db = {
	insert: spreads({
		user: createInsertSchema(table.user, {
			email: t.String({ format: 'email' })
		}),
	}, 'insert'),
	select: spreads({
		user: createSelectSchema(table.user, {
			email: t.String({ format: 'email' })
		})
	}, 'select')
} as const
```

:::

In the code above, we refine a `user.email` schema to include a `format` property

The `spread` utility function will skip a refined schema, so you can use it as is.

***

For more information, please refer to the [Drizzle ORM](https://orm.drizzle.team) and [Drizzle TypeBox](https://orm.drizzle.team/docs/typebox) documentation.

---


---

---
url: 'https://elysiajs.com/integrations/expo.md'
---

# Integration with Expo

Starting from Expo SDK 50, and App Router v3, Expo allows us to create API route directly in an Expo app.

1. Create **app/\[...slugs]+api.ts**
2. Define an Elysia server
3. Export **Elysia.fetch** with the name of the HTTP methods you want to use

::: code-group

```typescript [app/[...slugs]+api.ts]
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'hello Expo')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.fetch // [!code ++]
export const POST = app.fetch // [!code ++]
```

:::

You can treat the Elysia server as if it were a normal Expo API route.

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Prefix

If you place an Elysia server not in the root directory of the app router, you need to annotate the prefix on the Elysia server.

For example, if you place the Elysia server in **app/api/\[...slugs]+api.ts**, you need to annotate the prefix as **/api** on the Elysia server.

::: code-group

```typescript [app/api/[...slugs]+api.ts]
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' }) // [!code ++]
    .get('/', 'Hello Expo')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.fetch
export const POST = app.fetch
```

:::

This will ensure that Elysia routing works properly wherever you place it.

## Eden

We can add [Eden](/eden/overview) for **end-to-end type safety** similar to tRPC.

1. Export `type` from the Elysia server

::: code-group

```typescript [app/[...slugs]+api.ts]
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/', 'Hello Nextjs')
	.post(
		'/user',
		({ body }) => body,
		{
			body: treaty.schema('User', {
				name: 'string'
			})
		}
	)

export type app = typeof app // [!code ++]

export const GET = app.fetch
export const POST = app.fetch
```

:::

2. Create a Treaty client

::: code-group

```typescript [lib/eden.ts]
import { treaty } from '@elysia/eden'
import type { app } from '../app/[...slugs]+api'

export const api = treaty<app>('localhost:3000/api')
```

:::

3. Use the client in both server and client components

::: code-group

```tsx [app/page.tsx]
import { api } from '../lib/eden'

export default async function Page() {
	const message = await api.get()

	return <h1>Hello, {message}</h1>
}
```

:::

## Deployment

You can either directly use the API route with Elysia and deploy as a normal Elysia app if needed, or use the [experimental Expo server runtime](https://docs.expo.dev/router/reference/api-routes/#deployment).

If you are using the Expo server runtime, you may use the `expo export` command to create an optimized build for your Expo app. This will include an Expo function that uses Elysia at **dist/server/\_expo/functions/\[...slugs]+api.js**

::: tip
Please note that Expo Functions are treated as Edge functions instead of normal servers, so running the Edge function directly will not allocate any port.
:::

You may use the Expo function adapter provided by Expo to deploy your Edge Function.

Currently, Expo supports the following adapters:

* [Express](https://docs.expo.dev/router/reference/api-routes/#express)
* [Netlify](https://docs.expo.dev/router/reference/api-routes/#netlify)
* [Vercel](https://docs.expo.dev/router/reference/api-routes/#vercel)

---


---

---
url: 'https://elysiajs.com/integrations/netlify.md'
---

# Integration with Netlify Edge Function

[Netlify Edge Functions](https://docs.netlify.com/build/edge-functions/overview/) run on [Deno](/integrations/deno), which is one of Elysia's supported runtimes, as Elysia is built on top of Web Standards.

Netlify Edge Functions require a special directory to run a function; the default is **\<directory>/netlify/edge-functions**.

To create a function at **/hello**, you would need to create a file at `netlify/edge-functions/hello.ts`, then simply `export default` an Elysia instance.

::: code-group

```typescript [netlify/edge-functions/hello.ts]
import { Elysia } from 'elysia'

export const config = { path: '/hello' } // [!code ++]

export default new Elysia({ prefix: '/hello' }) // [!code ++]
	.get('/', () => 'Hello Elysia')
```

:::

### Running locally

To test your Elysia server on Netlify Edge Functions locally, you can install the [Netlify CLI](https://docs.netlify.com/build/edge-functions/get-started/#test-locally) to simulate function invocation.

To install Netlify CLI:

```bash
bun add -g netlify-cli
```

To run the development environment:

```bash
netlify dev
```

For additional information, please refer to the [Netlify Edge Functions documentation](https://docs.netlify.com/build/edge-functions).

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

---


---

---
url: 'https://elysiajs.com/integrations/nextjs.md'
---

# Integration with Next.js

With Next.js App Router, we can run Elysia on Next.js routes.

1. Create **app/api/\[\[...slugs]]/route.ts**
2. Define an Elysia server
3. Export **Elysia.fetch** with the name of the HTTP methods you want to use

::: code-group

```typescript [app/api/[[...slugs]]/route.ts]
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/api' })
    .get('/', 'Hello Nextjs')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.fetch // [!code ++]
export const POST = app.fetch // [!code ++]
```

:::

Elysia will work normally because of WinterTC compliance.

You can treat the Elysia server as a normal Next.js API route.

With this approach, you can have co-location of both frontend and backend in a single repository and have [End-to-end type safety with Eden](/eden/overview) with both client-side and server action

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Prefix

Because our Elysia server is not in the root directory of the app router, you need to annotate the prefix on the Elysia server.

For example, if you place the Elysia server in **app/user/\[\[...slugs]]/route.ts**, you need to annotate the prefix as **/user** on the Elysia server.

::: code-group

```typescript [app/user/[[...slugs]]/route.ts]
import { Elysia, t } from 'elysia'

const app = new Elysia({ prefix: '/user' }) // [!code ++]
	.get('/', 'Hello Nextjs')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

export const GET = app.fetch
export const POST = app.fetch
```

:::

This will ensure that Elysia routing works properly wherever you place it.

## Eden

We can add [Eden](/eden/overview) for **end-to-end type safety** similar to tRPC.

In this approach, we will use the isomorphic fetch pattern to allow Elysia to:

1. On Server: directly call Elysia without going through the network layer
2. On Client: call Elysia through the network layer

To start, we need to do the following steps:

1. Export Elysia instance

::: code-group

```typescript [app/api/[[...slugs]]/route.ts]
import { Elysia } from 'elysia'

export const app = new Elysia({ prefix: '/api' }) // [!code ++]
	.get('/', 'Hello Nextjs')
	.post(
		'/user',
		({ body }) => body,
		{
			body: treaty.schema('User', {
				name: 'string'
			})
		}
	)

export const GET = app.fetch
export const POST = app.fetch
```

:::

2. Create a Treaty client with isomorphic approach

::: code-group

```typescript [lib/eden.ts]
import { treaty } from '@elysia/eden'
import type { app } from '../app/api/[[...slugs]]/route'

// .api to enter /api prefix
export const api =
  // process is defined on server side and build time
  typeof process !== 'undefined'
    ? treaty(app).api
    : treaty<typeof app>('localhost:3000').api
```

It's important that you should use `typeof process` instead of `typeof window` because `window` is not defined during build time, causing hydration error.

:::

3. Use the client in both server and client components

::: code-group

```tsx [app/page.tsx]
import { api } from '../lib/eden'

export default async function Page() {
	const message = await api.get()

	return <h1>Hello, {message}</h1>
}
```

:::

This allows you to have type safety from the frontend to the backend with minimal effort and works with both server and client components, as well as with Incremental Static Regeneration (ISR).

## React Query

We can also use React Query to interact with the Elysia server on the client.

::: code-group

```tsx [src/routes/index.tsx]
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { getTreaty } from './api.$' // [!code ++]

export const Route = createFileRoute('/a')({
	component: App
})

function App() {
	const { data: response } = useQuery({ // [!code ++]
		queryKey: ['get'], // [!code ++]
		queryFn: () => getTreaty().get() // [!code ++]
	}) // [!code ++]

	return response?.data
}
```

::: code-group

This can work with any React Query features like caching, pagination, infinite queries, etc.

***

Please refer to [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#static-route-handlers) for more information.

---


---

---
url: 'https://elysiajs.com/integrations/node.md'
---

# Integration with Node.js

Elysia provides a runtime adapter to run Elysia on multiple runtimes, including Node.js.

To run Elysia on Node.js, simply install Node adapter.

::: code-group

```bash [bun]
bun add elysia @elysia/node
```

```bash [pnpm]
pnpm add elysia @elysia/node
```

```bash [npm]
npm install elysia @elysia/node
```

```bash [yarn]
yarn add elysia @elysia/node
```

:::

Then apply the Node adapter to your main Elysia instance.

```typescript
import { Elysia } from 'elysia'
import { node } from '@elysia/node' // [!code ++]

const app = new Elysia({ adapter: node() }) // [!code ++]
	.get('/', () => 'Hello Elysia')
	.listen(3000)
```

This is all you need to run Elysia on Node.js.

### Additional Setup (optional)

For the best experience, we recommend installing `tsx` or `ts-node` with `nodemon`.

`tsx` is a CLI that transpiles TypeScript to JavaScript with hot-reload and several more features you would expect from a modern development environment.

::: code-group

```bash [bun]
bun add -d tsx @types/node typescript
```

```bash [pnpm]
pnpm add -D tsx @types/node typescript
```

```bash [npm]
npm install --save-dev tsx @types/node typescript
```

```bash [yarn]
yarn add -D tsx @types/node typescript
```

:::

Then open your `package.json` file and add the following scripts:

```json
{
   	"scripts": {
  		"dev": "tsx watch src/index.ts",
    	"build": "tsc src/index.ts --outDir dist",
  		"start": "NODE_ENV=production node dist/index.js"
   	}
}
```

These scripts refer to the different stages of developing an application:

* **dev** - Start Elysia in development mode with auto-reload on code changes.
* **build** - Build the application for production use.
* **start** - Start a production Elysia server.

Make sure to create a `tsconfig.json`:

```bash
tsc --init
```

Don't forget to update `tsconfig.json` to set `compilerOptions.strict` to `true`:

```json
{
   	"compilerOptions": {
  		"strict": true
   	}
}
```

This will give the hot reload, JSX support to run Elysia with the similar experience as `bun dev`

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

---


---

---
url: 'https://elysiajs.com/integrations/nuxt.md'
---

# Integration with Nuxt

We can use [nuxt-elysia](https://github.com/tkesgar/nuxt-elysia), a community plugin for Nuxt, to set up Elysia on Nuxt API routes with Eden Treaty.

1. Install the plugin with the following command:

```bash
bun add elysia @elysia/eden
bun add -d nuxt-elysia
```

2. Add `nuxt-elysia` to your Nuxt config:

```ts
export default defineNuxtConfig({
    modules: [ // [!code ++]
        'nuxt-elysia' // [!code ++]
    ], // [!code ++]
    nitro: { // [!code ++]
        preset: 'Bun' // [!code ++]
    } // [!code ++]
})
```

::: tip
The `nitro.preset: 'Bun'` configuration is required because Elysia runs on Bun runtime. This tells Nuxt's Nitro to use Bun as the server runtime instead of the default Node.js runtime.
:::

3. Create `api.ts` in the project root:

```typescript [api.ts]
export default () => new Elysia() // [!code ++]
  .get('/hello', () => ({ message: 'Hello world!' })) // [!code ++]
```

4. Use Eden Treaty in your Nuxt app:

```vue
<template>
    <div>
        <p>{{ data.message }}</p>
    </div>
</template>
<script setup lang="ts">
const { $api } = useNuxtApp()

const { data } = await useAsyncData(async () => {
    const { data, error } = await $api.hello.get()

    if (error)
        throw new Error('Failed to call API')

    return data
})
</script>
```

This will automatically set up Elysia to run on Nuxt API routes.

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Prefix

By default, Elysia will be mounted on **/\_api**, but we can customize it with the `nuxt-elysia` config.

```ts
export default defineNuxtConfig({
	nuxtElysia: {
		path: '/api' // [!code ++]
	}
})
```

This will mount Elysia on **/api** instead of **/\_api**.

For more configuration options, please refer to [nuxt-elysia](https://github.com/tkesgar/nuxt-elysia)

---


---

---
url: 'https://elysiajs.com/integrations/prisma.md'
---

# Prisma

[Prisma](https://prisma.io) is an ORM that allows us to interact with databases in a type-safe manner.

It provides a way to define your database schema using a Prisma schema file, and then generates TypeScript types based on that schema.

### Prismabox

[Prismabox](https://github.com/m1212e/prismabox) is a library that generate TypeBox or Elysia validation models from Prisma schema.

We can use Prismabox to convert Prisma schema into Elysia validation models, which can then be used to ensure type validation in Elysia.

### How it works:

1. Define your database schema in Prisma Schema.
2. Add `prismabox` generator to generate Elysia schema.
3. Use the converted Elysia validation models to ensure type validation.
4. OpenAPI schema is generated from Elysia validation models.
5. Add [Eden Treaty](/eden/overview) to add type-safety to your frontend.

```
                                                    * ——————————————— *
                                                    |                 |
                                               | -> |  Documentation  |
* ————————— *             * ———————— * OpenAPI |    |                 |
|           |  prismabox  |          | ——————— |    * ——————————————— *
|  Prisma   | —————————-> |  Elysia  |
|           |             |          | ——————— |    * ——————————————— *
* ————————— *             * ———————— *   Eden  |    |                 |
                                               | -> |  Frontend Code  |
												    |                 |
												    * ——————————————— *

```

## Installation

To install Prisma, run the following command:

```bash
bun add @prisma/client prismabox prisma-adapter-bun-sqlite && \
bun add -d prisma
```

## Prisma schema

Assuming you already have a `prisma/schema.prisma`.

We can add a `prismabox` generator to the Prisma schema file as follows:

::: code-group

```ts [prisma/schema.prisma]
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
  // Note: In Prisma 7+, datasource URL is configured in prisma.config.ts (for Prisma CLI),
  // and when using driver adapters you also pass the runtime URL in adapter setup.
}

generator prismabox { // [!code ++]
  provider = "prismabox" // [!code ++]
  typeboxImportDependencyName = "elysia" // [!code ++]
  typeboxImportVariableName = "t" // [!code ++]
  inputModel = true // [!code ++]
  output   = "../generated/prismabox" // [!code ++]
} // [!code ++]

model User {
  id    String  @id @default(cuid())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id    	String  @id @default(cuid())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  String
}
```

:::

This will generate Elysia validation models in the `generated/prismabox` directory.

Each model will have its own file, and the models will be named based on the Prisma model names.

For example:

* `User` model will be generated to `generated/prismabox/User.ts`
* `Post` model will be generated to `generated/prismabox/Post.ts`

## Using generated models

Then we can import the generated models in our Elysia application:

::: code-group

```ts [src/index.ts]
import { Elysia, t } from 'elysia'

import { PrismaBunSqlite } from 'prisma-adapter-bun-sqlite';
import { PrismaClient } from '../generated/prisma/client' // [!code ++]
import { UserPlain, UserPlainInputCreate } from '../generated/prismabox/User' // [!code ++]

const adapter = new PrismaBunSqlite({ url: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

const app = new Elysia()
    .put(
        '/',
        async ({ body }) =>
            prisma.user.create({
                data: body
            }),
        {
            body: UserPlainInputCreate, // [!code ++]
            response: UserPlain // [!code ++]
        }
    )
    .get(
        '/id/:id',
        async ({ params: { id }, status }) => {
            const user = await prisma.user.findUnique({
                where: { id }
            })

            if (!user) return status(404, 'User not found')

            return user
        },
        {
            response: {
                200: UserPlain, // [!code ++]
                404: t.String() // [!code ++]
            }
        }
    )
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

:::

This allows us to reuse the database schema in Elysia validation models.

***

For more information, please refer to the [Prisma](https://prisma.io), and [Prismabox](https://github.com/m1212e/prismabox) documentation.

---


---

---
url: 'https://elysiajs.com/integrations/sveltekit.md'
---

# Integration with SvelteKit

With SvelteKit, you can run Elysia on server routes.

1. Create **src/routes/\[...slugs]/+server.ts**.
2. Define an Elysia server.
3. Export a **fallback** function that calls `app.handle`.

```typescript
// src/routes/[...slugs]/+server.ts
import { Elysia, t } from 'elysia';

const app = new Elysia()
    .get('/', 'hello SvelteKit')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

interface WithRequest {
	request: Request
}

export const fallback = ({ request }: WithRequest) => app.handle(request) // [!code ++]
```

You can treat the Elysia server as a normal SvelteKit server route.

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Prefix

If you place an Elysia server not in the root directory of the app router, you need to annotate the prefix to the Elysia server.

For example, if you place Elysia server in **src/routes/api/\[...slugs]/+server.ts**, you need to annotate prefix as **/api** to Elysia server.

```typescript
// src/routes/api/[...slugs]/+server.ts
import { Elysia, t } from 'elysia';

const app = new Elysia({ prefix: '/api' }) // [!code ++]
    .get('/', () => 'hi')
    .post('/', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })

type RequestHandler = (v: { request: Request }) => Response | Promise<Response>

export const fallback: RequestHandler = ({ request }) => app.handle(request)
```

This will ensure that Elysia routing will work properly in any location you place it.

Please refer to [SvelteKit Routing](https://kit.svelte.dev/docs/routing#server) for more information.

---


---

---
url: 'https://elysiajs.com/integrations/tanstack-start.md'
---

# Integration with TanStack Start

Elysia can run inside TanStack Start server routes.

1. Create **src/routes/api.$.ts**
2. Define an Elysia server
3. Export Elysia handler in **server.handlers**

::: code-group

```typescript [src/routes/api.$.ts]
import { Elysia } from 'elysia'

import { createFileRoute } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'

const app = new Elysia({
	prefix: '/api' // [!code ++]
}).get('/', 'Hello Elysia!')

const handle = ({ request }: { request: Request }) => app.fetch(request) // [!code ++]

export const Route = createFileRoute('/api/$')({
	server: {
		handlers: {
			GET: handle, // [!code ++]
			POST: handle // [!code ++]
		}
	}
})
```

:::

Elysia should now be running on **/api**.

We may add additional methods to **server.handlers** to support other HTTP methods as needed.

### pnpm

If you use pnpm, [pnpm doesn't auto install peer dependencies by default](https://github.com/orgs/pnpm/discussions/3995#discussioncomment-1893230) forcing you to install additional dependencies manually.

```bash
pnpm add @sinclair/typebox openapi-types
```

## Eden

We can add [Eden](/eden/overview.html) for **end-to-end type safety** similar to tRPC.

::: code-group

```typescript [src/routes/api.$.ts]
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden' // [!code ++]

import { createFileRoute } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'

const app = new Elysia({
	prefix: '/api'
}).get('/', 'Hello Elysia!')

const handle = ({ request }: { request: Request }) => app.fetch(request)

export const Route = createFileRoute('/api/$')({
	server: {
		handlers: {
			GET: handle,
			POST: handle
		}
	}
})

export const getTreaty = createIsomorphicFn() // [!code ++]
	.server(() => treaty(app).api) // [!code ++]
	.client(() => treaty<typeof app>('localhost:3000').api) // [!code ++]
```

:::

Notice that we use **createIsomorphicFn** to create a separate Eden Treaty instance for both the server and client:

1. On the server, Elysia is called directly without HTTP overhead.
2. On the client, we call the Elysia server through HTTP.

In a React component, we can use `getTreaty` to call the Elysia server with type safety.

## Loader Data

Tanstack Start supports **Loader** to fetch data before rendering the component.

::: code-group

```tsx [src/routes/index.tsx]
import { createFileRoute } from '@tanstack/react-router'

import { getTreaty } from './api.$' // [!code ++]

export const Route = createFileRoute('/a')({
	component: App,
	loader: () => getTreaty().get().then((res) => res.data) // [!code ++]
})

function App() {
	const data = Route.useLoaderData() // [!code ++]

	return data
}
```

:::

Calling Elysia in a loader executes it on the server during SSR and doesn’t incur HTTP overhead.
When navigating from one page to another, the loader will run on the client-side, making an HTTP request to the endpoint.

Eden Treaty will ensure type safety on both server and client.

## React Query

We can also use React Query to interact with Elysia server on client.

::: code-group

```tsx [src/routes/index.tsx]
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { getTreaty } from './api.$' // [!code ++]

export const Route = createFileRoute('/a')({
	component: App
})

function App() {
	const { data: response } = useQuery({ // [!code ++]
		queryKey: ['get'], // [!code ++]
		queryFn: () => getTreaty().get() // [!code ++]
	}) // [!code ++]

	return response?.data
}
```

::: code-group

This can work with any React Query features like caching, pagination, infinite queries, etc.

***

Please visit [TanStack Start Documentation](https://tanstack.com/start) for more information about TanStack Start.

---


---

---
url: 'https://elysiajs.com/integrations/react-email.md'
---

# React Email

React Email is a library that allows you to use React components to create emails.

As Elysia uses Bun as the runtime environment, we can directly write a React Email component and import the JSX directly into our code to send emails.

## Installation

To install React Email, run the following command:

```bash
bun add -d react-email
bun add @react-email/components react react-dom
```

Then add this script to `package.json`:

```json
{
  "scripts": {
    "email": "email dev --dir src/emails"
  }
}
```

We recommend adding email templates into the `src/emails` directory as we can directly import the JSX files.

### TypeScript

If you are using TypeScript, you may need to add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
	"jsx": "react"
  }
}
```

## Your first email

Create file `src/emails/otp.tsx` with the following code:

```tsx
import * as React from 'react'
import { Tailwind, Section, Text } from '@react-email/components'

export default function OTPEmail({ otp }: { otp: number }) {
    return (
        <Tailwind>
            <Section className="flex justify-center items-center w-full min-h-screen font-sans">
                <Section className="flex flex-col items-center w-76 rounded-2xl px-6 py-1 bg-mauve-50">
                    <Text className="text-xs font-medium text-violet-500">
                        Verify your Email Address
                    </Text>
                    <Text className="text-mauve-500 my-0">
                        Use the following code to verify your email address
                    </Text>
                    <Text className="text-5xl font-bold pt-2">{otp}</Text>
                    <Text className="text-mauve-400 font-light text-xs pb-4">
                        This code is valid for 10 minutes
                    </Text>
                    <Text className="text-mauve-600 text-xs">
                        Thank you for joining us
                    </Text>
                </Section>
            </Section>
        </Tailwind>
    )
}

OTPEmail.PreviewProps = {
    otp: 123456
}
```

You may notice that we are using `@react-email/components` to create the email template.

This library provides a set of components including **styling with Tailwind** that are compatible with email clients like Gmail, Outlook, etc.

We also added a `PreviewProps` to the `OTPEmail` function. This only applies when previewing the email on our playground.

## Preview your email

To preview your email, run the following command:

```bash
bun email
```

This will open a browser window with the preview of your email.

![React Email playground showing an OTP email we have just written](/recipe/react-email/email-preview.webp)

## Sending email

To send an email, we can use `react-dom/server` to render the email, then submit it using a preferred provider:

::: code-group

```tsx [Nodemailer]
import { Elysia, t } from 'elysia'

import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import OTPEmail from './emails/otp'

import nodemailer from 'nodemailer' // [!code ++]

const transporter = nodemailer.createTransport({ // [!code ++]
  	host: 'smtp.gehenna.sh', // [!code ++]
  	port: 465, // [!code ++]
  	auth: { // [!code ++]
  		user: 'makoto', // [!code ++]
  		pass: '12345678' // [!code ++]
  	} // [!code ++]
}) // [!code ++]

new Elysia()
	.get('/otp', async ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

		const html = renderToStaticMarkup(<OTPEmail otp={otp} />)

        await transporter.sendMail({ // [!code ++]
        	from: 'ibuki@gehenna.sh', // [!code ++]
           	to: body, // [!code ++]
           	subject: 'Verify your email address', // [!code ++]
            html, // [!code ++]
        }) // [!code ++]

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

```tsx [Resend]
import { Elysia, t } from 'elysia'

import OTPEmail from './emails/otp'

import Resend from 'resend' // [!code ++]

const resend = new Resend('re_123456789') // [!code ++]

new Elysia()
	.get('/otp', ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

        await resend.emails.send({ // [!code ++]
        	from: 'ibuki@gehenna.sh', // [!code ++]
           	to: body, // [!code ++]
           	subject: 'Verify your email address', // [!code ++]
            html: <OTPEmail otp={otp} />, // [!code ++]
        }) // [!code ++]

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

```tsx [AWS SES]
import { Elysia, t } from 'elysia'

import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import OTPEmail from './emails/otp'

import { type SendEmailCommandInput, SES } from '@aws-sdk/client-ses' // [!code ++]
import { fromEnv } from '@aws-sdk/credential-providers' // [!code ++]

const ses = new SES({ // [!code ++]
    credentials: // [!code ++]
        process.env.NODE_ENV === 'production' ? fromEnv() : undefined // [!code ++]
}) // [!code ++]

new Elysia()
	.get('/otp', ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

		const html = renderToStaticMarkup(<OTPEmail otp={otp} />)

        await ses.sendEmail({ // [!code ++]
            Source: 'ibuki@gehenna.sh', // [!code ++]
            Destination: { // [!code ++]
                ToAddresses: [body] // [!code ++]
            }, // [!code ++]
            Message: { // [!code ++]
                Body: { // [!code ++]
                    Html: { // [!code ++]
                        Charset: 'UTF-8', // [!code ++]
                        Data: html // [!code ++]
                    } // [!code ++]
                }, // [!code ++]
                Subject: { // [!code ++]
                    Charset: 'UTF-8', // [!code ++]
                    Data: 'Verify your email address' // [!code ++]
                } // [!code ++]
            } // [!code ++]
        } satisfies SendEmailCommandInput) // [!code ++]

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

```tsx [Sendgrid]
import { Elysia, t } from 'elysia'

import OTPEmail from './emails/otp'

import sendgrid from "@sendgrid/mail" // [!code ++]

sendgrid.setApiKey(process.env.SENDGRID_API_KEY) // [!code ++]

new Elysia()
	.get('/otp', ({ body }) => {
		// Random between 100,000 and 999,999
  		const otp = ~~(Math.random() * (900_000 - 1)) + 100_000

    	const html = renderToStaticMarkup(<OTPEmail otp={otp} />)

        await sendgrid.send({ // [!code ++]
        	from: 'ibuki@gehenna.sh', // [!code ++]
           	to: body, // [!code ++]
           	subject: 'Verify your email address', // [!code ++]
            html // [!code ++]
        }) // [!code ++]

        return { success: true }
	}, {
		body: t.String({ format: 'email' })
	})
	.listen(3000)
```

:::

::: tip
Notice that we can directly import the email component out of the box thanks to Bun
:::

You may see all of the available integrations with React Email in the [React Email Integrations](https://react.email/docs/integrations/overview), and learn more about React Email in the [React Email documentation](https://react.email/docs)

---


---

