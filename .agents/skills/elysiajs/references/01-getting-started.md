# Elysia Getting Started & Core Concepts

> Foundational introduction, quick starts, mental models, benchmarks, and step-by-step tutorials.

## Table of Contents

- [At a glance (at-glance.md)](#at-a-glance)
- [Encapsulation (illust.md)](#encapsulation)
- [Welcome to Elysia (tutorial.md)](#welcome-to-elysia)
- [Key Concept&#x20; (key-concept.md)](#key-concept-x20)
- [Welcome to ElysiaJS (playground.md)](#welcome-to-elysiajs)
- [Quick Start (playground/preview.md)](#quick-start)
- [Quick Start (quick-start.md)](#quick-start)
- [Congratulations! (tutorial/whats-next.md)](#congratulations)
- [Your First Route (tutorial/getting-started/your-first-route.md)](#your-first-route)

---

---
url: 'https://elysiajs.com/at-glance.md'
---

# At a glance

Elysia is an ergonomic web framework for building backend servers with Bun.

Designed with simplicity and type-safety in mind, Elysia offers a familiar API with extensive support for TypeScript and is optimized for Bun.

Here's a simple hello world in Elysia.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'Hello Elysia')
    .get('/user/:id', ({ params: { id }}) => id)
    .post('/form', ({ body }) => body)
    .listen(3000)
```

Navigate to [localhost:3000](http://localhost:3000/) and you should see 'Hello Elysia' as the result.

::: tip
Hover over the code snippet to see the type definition.

In the mock browser, click on the path highlighted in blue to change paths and preview the response.

Elysia can run in the browser, and the results you see are actually executed using Elysia.
:::

## Performance

Building on Bun and extensive optimization like static code analysis allows Elysia to generate optimized code on the fly.

Elysia can outperform most web frameworks available today\[1], and even match the performance of Golang and Rust frameworks\[2].

| Framework     | Runtime | Average     | Plain Text | Dynamic Parameters | JSON Body  |
| ------------- | ------- | ----------- | ---------- | ------------------ | ---------- |
| bun           | bun     | 262,660.433 | 326,375.76 | 237,083.18         | 224,522.36 |
| elysia        | bun     | 255,574.717 | 313,073.64 | 241,891.57         | 211,758.94 |
| hyper-express | node    | 234,395.837 | 311,775.43 | 249,675            | 141,737.08 |
| hono          | bun     | 203,937.883 | 239,229.82 | 201,663.43         | 170,920.4  |
| h3            | node    | 96,515.027  | 114,971.87 | 87,935.94          | 86,637.27  |
| oak           | deno    | 46,569.853  | 55,174.24  | 48,260.36          | 36,274.96  |
| fastify       | bun     | 65,897.043  | 92,856.71  | 81,604.66          | 23,229.76  |
| fastify       | node    | 60,322.413  | 71,150.57  | 62,060.26          | 47,756.41  |
| koa           | node    | 39,594.14   | 46,219.64  | 40,961.72          | 31,601.06  |
| express       | bun     | 29,715.537  | 39,455.46  | 34,700.85          | 14,990.3   |
| express       | node    | 15,913.153  | 17,736.92  | 17,128.7           | 12,873.84  |

## TypeScript

Elysia is designed to help you write less TypeScript.

Elysia's Type System is fine-tuned to infer types from your code automatically, without needing to write explicit TypeScript, while providing type-safety at both runtime and compile time for the most ergonomic developer experience.

Take a look at this example:

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/user/:id', ({ params: { id } }) => id)
                        // ^?
    .listen(3000)
```

The above code creates a path parameter **"id"**. The value that replaces `:id` will be passed to `params.id` both at runtime and in types, without manual type declaration.

Elysia's goal is to help you write less TypeScript and focus more on business logic. Let the framework handle the complex types.

TypeScript is not required to use Elysia, but it's recommended.

## Type Integrity

To take it a step further, Elysia provides **Elysia.t**, a schema builder to validate types and values at both runtime and compile time, creating a single source of truth for your data types.

Let's modify the previous code to accept only a number value instead of a string.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/user/:id', ({ params: { id } }) => id, {
                                // ^?
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

This code ensures that our path parameter **id** will always be a number at both runtime and compile time (type-level).

::: tip
Hover over "id" in the above code snippet to see a type definition.
:::

With Elysia's schema builder, we can ensure type safety like a strongly typed language with a single source of truth.

## Standard Schema

Elysia supports [Standard Schema](https://github.com/standard-schema/standard-schema), allowing you to use your favorite validation library:

* Zod
* Valibot
* ArkType
* Effect Schema
* Yup
* Joi
* [and more](https://github.com/standard-schema/standard-schema)

```typescript twoslash
import { Elysia } from 'elysia'
import { z } from 'zod'
import * as v from 'valibot'

new Elysia()
	.get('/id/:id', ({ params: { id }, query: { name } }) => id, {
	//                           ^?
		params: z.object({
			id: z.coerce.number()
		}),
		query: v.object({
			name: v.literal('Lilith')
		})
	})
	.listen(3000)
```

Elysia will infer the types from the schema automatically, allowing you to use your favorite validation library while still maintaining type safety.

## OpenAPI

Elysia adopts many standards by default, like OpenAPI, WinterTC compliance, and Standard Schema. Allowing you to integrate with most of the industry standard tools or at least easily integrate with tools you are familiar with.

For instance, because Elysia adopts OpenAPI by default, generating API documentation is as easy as adding a one-liner:

```typescript
import { Elysia, t } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
    .use(openapi()) // [!code ++]
    .get('/user/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

With the OpenAPI plugin, you can seamlessly generate an API documentation page without additional code or specific configuration and share it with your team effortlessly.

## OpenAPI from types

Elysia also supports OpenAPI schema generation with **1 line directly from types**.

This is a **unique feature** of Elysia, allowing you to have complete and accurate API documentation directly from your code without any manual annotation.

```typescript
import { Elysia, t } from 'elysia'
import { openapi, fromTypes } from '@elysia/openapi'

export const app = new Elysia()
    .use(openapi({
    	references: fromTypes() // [!code ++]
    }))
    .get('/user/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

This is equivalent to **FastAPI**'s automatic OpenAPI generation from types but in TypeScript.

## End-to-end Type Safety

With Elysia, type safety is not limited to server-side.

With Elysia, you can synchronize your types with your frontend team automatically, similar to tRPC, using Elysia's client library, "Eden".

```typescript
import { Elysia, t } from 'elysia'
import { openapi, fromTypes } from '@elysia/openapi'

export const app = new Elysia()
    .use(openapi({
    	references: fromTypes()
    }))
    .get('/user/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

And on your client-side:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/user/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)

export type App = typeof app

// @filename: client.ts
// ---cut---
// client.ts
import { treaty } from '@elysia/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// Get data from /user/617
const { data } = await app.user({ id: 617 }).get()
      // ^?

console.log(data)
```

With Eden, you can use the existing Elysia types to query an Elysia server **without code generation** and synchronize types for both frontend and backend automatically.

Elysia is not only about helping you create a confident backend but for all that is beautiful in this world.

## Type Soundness

Most frameworks with end-to-end type safety usually assume only a happy part, leaving error handling and edge cases out of the type system.

However, Elysia can infers all of the possible outcomes of your API, from lifecycle events/macro from any part of your codebase.

::: code-group

```typescript twoslash [client.ts]
// @filename: server.ts
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.macro({
		auth: {
			cookie: t.Object({
				session: t.String()
			}),
			beforeHandle({ cookie: { session }, status }) {
				if(session.value !== 'valid')
					return status(401)
			}
		}
	})

const app = new Elysia()
	.use(plugin)
    .get('/user/:id', ({ params: { id }, status }) => {
    	if(Math.random() > 0.1)
     		return status(420)
       
       return id
    }, {
    	auth: true,
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)

export type App = typeof app

// @filename: client.ts
// ---cut---
// client.ts
import { treaty } from '@elysia/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// Get data from /user/617
const { data, error } = await app.user({ id: 617 }).get()
            // ^?




















console.log(data)
```

```typescript [server.ts]
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.macro({
		auth: {
			cookie: t.Object({
				session: t.String()
			}),
			beforeHandle({ cookie: { session }, status }) {
				if(session.value !== 'valid')
					return status(401)
			}
		}
	})

const app = new Elysia()
	.use(plugin)
    .get('/user/:id', ({ params: { id }, status }) => {
    	if(Math.random() > 0.1)
     		return status(420)
       
       return id
    }, {
    	auth: true,
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
    
export type App = typeof app
```

:::

This is one of the **unfair advantages** that Elysia has from years of investment in type system.

## Platform Agnostic

Elysia is optimized for Bun with native feature but **not limited to Bun**.

Being [WinterTC compliant](https://wintertc.org/) allows you to deploy Elysia servers on:

* Bun
* [Node.js](/integrations/node)
* [Deno](/integrations/deno)
* [Cloudflare Worker](/integrations/cloudflare-worker)
* [Vercel](/integrations/vercel)
* [Expo](/integrations/expo) via API routes
* [Nextjs](/integrations/nextjs) via API routes
* [Astro](/integrations/astro) via API routes

and several more! Checkout `integration` section on sidebar for more support runtime.

## Our Community

We want to create a friendly and welcoming community for everyone with bright, cute, friendly and playful design including our hand drawn anime girl mascot, *"Elysia chan"*.

We believe that technology should be friendly and approachable instead of being serious all the time, to brings joy to people's lives.

But even that, **we take Elysia very seriously** to make sure it's reliable and production ready high-performance framework that can be trusted for your next project.

Elysia is **used in production by many companies and projects worldwide**, including [X](https://x.com/shlomiatar/status/1822381556142362734), [Bank for Agriculture and Agricultural Co-operatives](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13924470), [Cluely](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-14420139), [CS.Money](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13913513), [Abacate Pay](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13922081) and used by [over 10,000 (open source) projects on GitHub.](https://github.com/elysiajs/elysia/network/dependents) and has been actively developed and maintained since 2022 with many regular contributors from our community.

Elysia is a reliable choice and production ready for building your next backend server.

Here's on of our community resources to get you started:

***

1\. Measured in requests/second. The benchmark for parsing query, path parameter and set response header on Debian 11, Intel i7-13700K tested on Bun 0.7.2 on 6 Aug 2023. See the benchmark condition [here](https://github.com/SaltyAom/bun-http-framework-benchmark/tree/c7e26fe3f1bfee7ffbd721dbade10ad72a0a14ab#results).

2\. Based on [TechEmpower Benchmark round 22](https://www.techempower.com/benchmarks/#section=data-r22\&hw=ph\&test=composite).

---


---

---
url: 'https://elysiajs.com/illust.md'
---


---


---

---
url: 'https://elysiajs.com/tutorial.md'
---

# Welcome to Elysia

It's great to have you here! This playground will help you get started with Elysia interactively.

Unlike traditional backend frameworks, **Elysia can run in a browser**! Although it doesn't support all features, it's a perfect environment for learning and experimentation.

You can check out the API docs by clicking  on the left sidebar.

## What is Elysia

Elysia is an ergonomic framework for humans.

Ok, seriously, Elysia is a backend TypeScript framework that focuses on developer experience and performance.

What makes Elysia different from other frameworks is:

1. Spectacular performance comparable to Golang.
2. Extraordinary TypeScript support with **type soundness**.
3. Built around OpenAPI from the ground up.
4. Offers End-to-end Type Safety like tRPC.
5. Uses Web Standards, allowing you to run your code anywhere like Cloudflare Workers, Deno, Bun, Node.js and more.
6. It is, of course, **designed for humans** first.

Although Elysia has some framework-specific concepts to learn, once users get the hang of it, many find it very enjoyable and intuitive to work with.

## How to use this playground

Playground is divided into 3 sections:

1. Documentation and task on the left side (what you're currently reading).
2. Code editor in the top right
3. Preview, output, and console in the bottom right

## Assignment

For the first assignment, let's modify the code to make the server respond with `"Hello Elysia!"` instead of `"Hello World!"`.

Feel free to look around the code editor and preview section to get familiar with the environment.

\<template #answer>

You can change the response by changing the content inside the `.get` method from `'Hello World!'` to `'Hello Elysia!'`.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', 'Hello World!') // [!code --]
	.get('/', 'Hello Elysia!') // [!code ++]
	.listen(3000)
```

Now Elysia will respond with `"Hello Elysia!"` when you access `/`.

---


---

---
url: 'https://elysiajs.com/key-concept.md'
---

# Key Concept&#x20;

Elysia has every important concept that you need to understand.

This page covers most concepts that you should know before getting started.

## Encapsulation&#x20;

Elysia lifecycle methods are **encapsulated** to its own instance only.

Which means if you create a new instance, it will not share the lifecycle methods with others.

```ts
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(({ cookie }) => {
		throwIfNotSignIn(cookie)
	})
	.get('/profile', () => 'Hi there!')

const app = new Elysia()
	.use(profile)
	// ⚠️ This will NOT have sign in check
	.patch('/rename', ({ body }) => updateProfile(body))
```

In this example, the `isSignIn` check will only apply to `profile` but not `app`.

> Try changing the path in the URL bar to **/rename** and see the result

**Elysia isolates lifecycle by default** unless explicitly stated. This is similar to **export** in JavaScript, where you need to export the function to make it available outside the module.

To **"export"** the lifecycle to other instances, you must add specify the scope.

```ts
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(
		{ as: 'global' }, // [!code ++]
		({ cookie }) => {
			throwIfNotSignIn(cookie)
		}
	)
	.get('/profile', () => 'Hi there!')

const app = new Elysia()
	.use(profile)
	// This has sign in check
	.patch('/rename', ({ body }) => updateProfile(body))
```

Casting lifecycle to **"global"** will export lifecycle to **every instance**.

Learn more about this in [scope](/essential/plugin.html#scope-level).

## Method Chaining&#x20;

Elysia code should **ALWAYS** use method chaining.

This is **important to ensure type safety**.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
                        // ^?
    .listen(3000)
```

In the code above, **state** returns a new **ElysiaInstance** type, adding a typed `build` property.

### Without method chaining

As Elysia type system is complex, every method in Elysia returns a new type reference.

Without using method chaining, Elysia doesn't save these new types, leading to no type inference.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

We recommend to **always use method chaining** to provide an accurate type inference.

## Dependency&#x20;

Elysia, by design, is composed of multiple mini Elysia apps which can run **independently** like microservices that communicate with each other.

Each Elysia instance is independent and **can run as a standalone server**.

When an instance needs to use another instance's service, you **must explicitly declare the dependency**.

```ts twoslash
// @errors: 2339
import { t } from 'elysia'

abstract class Auth {
	static getProfile() {
		return {
			name: 'Elysia User'
		}
	}

	static models = {
		user: t.Object({
			name: t.String()
		})
	} as const
}
// ---cut---
import { Elysia } from 'elysia'

const auth = new Elysia()
	.decorate('Auth', Auth)
	.model(Auth.models)

const main = new Elysia()
 	// ❌ 'auth' is missing
	.get('/', ({ Auth }) => Auth.getProfile())
	// auth is required to use Auth's service
	.use(auth) // [!code ++]
	.get('/profile', ({ Auth }) => Auth.getProfile())
//                                        ^?



// ---cut-after---
```

This is similar to **Dependency Injection** where each instance must declare its dependencies.

This approach forces you to be explicit about dependencies, allowing better tracking and modularity.

### Deduplication&#x20;

By default, each plugin will be re-executed **every time** applying to another instance.

To prevent this, Elysia can deduplicate lifecycle with **a unique identifier** using `name` and optional `seed` property.

```ts
import { Elysia } from 'elysia'

// `name` is a unique identifier
const ip = new Elysia({ name: 'ip' }) // [!code ++]
	.derive(
		{ as: 'global' },
		({ server, request }) => ({
			ip: server?.requestIP(request)
		})
	)
	.get('/ip', ({ ip }) => ip)

const router1 = new Elysia()
	.use(ip)
	.get('/ip-1', ({ ip }) => ip)

const router2 = new Elysia()
	.use(ip)
	.get('/ip-2', ({ ip }) => ip)

const server = new Elysia()
	.use(router1)
	.use(router2)
```

Adding the `name` and optional `seed` to the instance will make it a unique identifier, preventing it from being called multiple times.

Learn more about this in [plugin deduplication](/essential/plugin.html#plugin-deduplication).

### Global vs Explicit Dependency

There are some cases where global dependency makes more sense than an explicit one.

**Global** plugin example:

* **Plugins that don't add types** - eg. cors, compress, helmet
* Plugins that add global lifecycle that no instance should have control over - eg. tracing, logging

Example use cases:

* OpenAPI/Open - Global document
* OpenTelemetry - Global tracer
* Logging - Global logger

In cases like this, it makes more sense to create it as global dependency instead of applying it to every instance.

However, if your dependency doesn't fit into these categories, it's recommended to use **explicit dependency** instead.

**Explicit dependency** example:

* **Plugins that add types** - eg. macro, state, model
* Plugins that add business logic that an instance can interact with - eg. Auth, Database

Example use cases:

* State management - eg. Store, Session
* Data modeling - eg. ORM, ODM
* Business logic - eg. Auth, Database
* Feature module - eg. Chat, Notification

## Order of code&#x20;

The order of Elysia's life-cycle code is very important.

Because events will only apply to routes **after** they are registered.

If you put the onError before plugin, plugin will not inherit the onError event.

```typescript
import { Elysia } from 'elysia'

new Elysia()
 	.onBeforeHandle(() => {
        console.log('1')
    })
	.get('/', () => 'hi')
    .onBeforeHandle(() => {
        console.log('2')
    })
    .listen(3000)
```

Console should log the following:

```bash
1
```

Notice that it doesn't log **2**, because the event is registered after the route so it is not applied to the route.

Learn more about this in [order of code](/essential/life-cycle.html#order-of-code).

## Type Inference

Elysia has a complex type system that allows you to infer types from the instance.

```ts twoslash
import { Elysia, t } from 'elysia'

const app = new Elysia()
	.post('/', ({ body }) => body, {
                // ^?




		body: t.Object({
			name: t.String()
		})
	})
```

You should **always use an inline function** to provide an accurate type inference.

If you need to apply a separate function, eg. MVC's controller pattern, it's recommended to destructure properties from inline function to prevent unnecessary type inference as follows:

```ts
import { Elysia, t } from 'elysia'

abstract class Controller {
	static greet({ name }: { name: string }) {
		return 'hello ' + name
	}
}

const app = new Elysia()
	.post('/', ({ body }) => Controller.greet(body), {
		body: t.Object({
			name: t.String()
		})
	})
```

See [Best practice: MVC Controller](/essential/best-practice.html#controller).

### TypeScript

We can get type definitions for every Elysia/TypeBox type by accessing the `static` property as follows:

```ts twoslash
import { t } from 'elysia'

const MyType = t.Object({
	hello: t.Literal('Elysia')
})

type MyType = typeof MyType.static
//    ^?
```

This allows Elysia to infer and provide types automatically, reducing the need to declare duplicate schemas.

A single Elysia/TypeBox schema can be used for:

* Runtime validation
* Data coercion
* TypeScript type
* OpenAPI schema

This allows us to make a schema as a **single source of truth**.

---


---

---
url: 'https://elysiajs.com/playground.md'
---

# Welcome to ElysiaJS

It's great to have you here! This playground is designed to help you get started with ElysiaJS quickly and easily.

Unlike traditional backend framework, Elysia can also run in a browser! Allowing you to write, and try out Elysia directly in your browser! making it a perfect environment for learning and experimentation.

Elysia is an ergonomic web framework for humans.

---


---

---
url: 'https://elysiajs.com/playground/preview.md'
---


---


---

---
url: 'https://elysiajs.com/quick-start.md'
---

# Quick Start

Elysia is a TypeScript backend framework with multiple runtime support but optimized for Bun.

However, you can use Elysia with other runtimes like Node.js.

\<Tab
id="quickstart"
:names="\['Bun', 'Node.js', 'Web Standard']"
:tabs="\['bun', 'node', 'web-standard']"

>

Elysia is optimized for Bun which is a JavaScript runtime that aims to be a drop-in replacement for Node.js.

You can install Bun with the command below:

::: code-group

```bash [MacOS/Linux]
curl -fsSL https://bun.sh/install | bash
```

```bash [Windows]
powershell -c "irm bun.sh/install.ps1 | iex"
```

:::

\<Tab
id="quickstart"
:names="\['Auto Installation', 'Manual Installation']"
:tabs="\['auto', 'manual']"

>

We recommend starting a new Elysia server using `bun create elysia`, which sets up everything automatically.

```bash
bun create elysia app
```

Once done, you should see the folder name `app` in your directory.

```bash
cd app
```

Start a development server by:

```bash
bun dev
```

Navigate to [localhost:3000](http://localhost:3000), which should greet you with "Hello Elysia".

::: tip
Elysia provides a `dev` command to automatically reload your server on file changes.
:::

To manually create a new Elysia app, install Elysia as a package:

```typescript
bun add elysia
bun add -d @types/bun
```

This will install Elysia and Bun type definitions.

Create a new file `src/index.ts` and add the following code:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/', () => 'Hello Elysia')
	.listen(3000)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

Open your `package.json` file and add the following scripts:

```json
{
   	"scripts": {
  		"dev": "bun --watch src/index.ts",
  		"build": "bun build src/index.ts --target bun --outdir ./dist",
  		"start": "NODE_ENV=production bun dist/index.js",
  		"test": "bun test"
   	}
}
```

These scripts refer to the different stages of developing an application:

* **dev** - Start Elysia in development mode with auto-reload on code change.
* **build** - Build the application for production usage.
* **start** - Start an Elysia production server.

If you are using TypeScript, make sure to create, and update `tsconfig.json` to include `compilerOptions.strict` to `true`:

```json
{
   	"compilerOptions": {
  		"strict": true
   	}
}
```

Node.js is a JavaScript runtime for server-side applications, the most popular runtime for JavaScript which Elysia supports.

You can install Node.js with the command below:

::: code-group

```bash [MacOS]
brew install node
```

```bash [Windows]
choco install nodejs
```

```bash [apt (Linux)]
sudo apt install nodejs
```

```bash [pacman (Arch)]
pacman -S nodejs npm
```

:::

## Setup

We recommend using TypeScript for your Node.js project.

\<Tab
id="language"
:names="\['TypeScript', 'JavaScript']"
:tabs="\['ts', 'js']"

>

To create a new Elysia app with TypeScript, we recommend installing Elysia with `tsx`:

::: code-group

```bash [bun]
bun add elysia @elysia/node && \
bun add -d tsx @types/node typescript
```

```bash [pnpm]
# pnpm doesn't install peer dependencies
pnpm add elysia @elysia/node @sinclair/typebox openapi-types && \
pnpm add -D tsx @types/node typescript
```

```bash [npm]
npm install elysia @elysia/node && \
npm install --save-dev tsx @types/node typescript
```

```bash [yarn]
yarn add elysia @elysia/node && \
yarn add -D tsx @types/node typescript
```

:::

This will install Elysia, TypeScript, and `tsx`.

`tsx` is a CLI that transpiles TypeScript to JavaScript with hot-reload and several more features you'd expect from a modern development environment.

Create a new file `src/index.ts` and add the following code:

```typescript
import { Elysia } from 'elysia'
import { node } from '@elysia/node'

const app = new Elysia({ adapter: node() })
	.get('/', () => 'Hello Elysia')
	.listen(3000, ({ hostname, port }) => {
		console.log(
			`🦊 Elysia is running at ${hostname}:${port}`
		)
	})
```

Open your `package.json` file and add the following scripts:

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

* **dev** - Start Elysia in development mode with auto-reload on code change.
* **build** - Build the application for production usage.
* **start** - Start an Elysia production server.

Make sure to create `tsconfig.json`

```bash
npx tsc --init
```

Don't forget to update `tsconfig.json` to include `compilerOptions.strict` to `true`:

```json
{
   	"compilerOptions": {
  		"strict": true
   	}
}
```

::: warning
If you use Elysia without TypeScript, you may miss out on some features like auto-completion, advanced type checking, and end-to-end type safety, which are core features of Elysia.
:::

To create a new Elysia app with JavaScript, start by installing Elysia:

::: code-group

```bash [bun]
bun add elysia @elysia/node
```

```bash [pnpm]
# pnpm doesn't install peer dependencies
pnpm add elysia @elysia/node @sinclair/typebox openapi-types
```

```bash [npm]
npm install elysia @elysia/node
```

```bash [yarn]
yarn add elysia @elysia/node
```

:::

This will install Elysia.

Create a new file `src/index.js` and add the following code:

```javascript
import { Elysia } from 'elysia'
import { node } from '@elysia/node'

const app = new Elysia({ adapter: node() })
	.get('/', () => 'Hello Elysia')
	.listen(3000, ({ hostname, port }) => {
		console.log(
			`🦊 Elysia is running at ${hostname}:${port}`
		)
	})
```

Open your `package.json` file and add the following scripts:

```json
{
	"type": "module",
   	"scripts": {
  		"dev": "node src/index.js",
  		"start": "NODE_ENV=production node src/index.js"
   	}
}
```

These scripts refer to the different stages of developing an application:

* **dev** - Start Elysia in development mode.
* **start** - Start an Elysia production server.

::: warning
If you use Elysia without TypeScript, you may miss out on some features like auto-completion, advanced type checking, and end-to-end type safety, which are core features of Elysia.
:::

Elysia is a WinterTC compliant library, which means if a framework or runtime supports Web Standard Request/Response, it can run Elysia.

First, install Elysia with the command below:

::: code-group

```bash [bun]
bun install elysia
```

```bash [pnpm]
# pnpm doesn't install peer dependencies
pnpm install elysia @sinclair/typebox openapi-types
```

```bash [npm]
npm install elysia
```

```bash [yarn]
yarn add elysia
```

:::

Next, select a runtime that supports Web Standard Request/Response.

We have a few recommendations:

### Not on the list?

If you are using a custom runtime, you may access `app.fetch` to handle the request and response manually.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/', () => 'Hello Elysia')
	.listen(3000)

export default app.fetch

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
```

---


---

---
url: 'https://elysiajs.com/tutorial/whats-next.md'
---

# Congratulations!

You have completed the tutorial.

Now you're ready to build your own application with Elysia!

## First up

We highly recommend that you check out these 2 pages first before getting started with Elysia:

### llms.txt

Alternatively, you can download llms.txt or llms-full.txt and feed it to your favorite LLMs like ChatGPT, Claude or Gemini to get a more interactive experience.

### If you are stuck

Feel free to ask our community on GitHub Discussions, Discord, and Twitter.

## From another Framework?

If you have used other popular frameworks like Express, Fastify, or Hono, you will find Elysia right at home with just a few differences.

## Essential Chapter

Here are the foundations of Elysia, we highly recommend that you go through these pages before jumping to other topics:

## More Patterns

If you feel like exploring more Elysia features, check out:

## Integration with Meta Framework

We can also use Elysia with Meta Framework like Nextjs, Nuxt, Astro, etc.

## Integration with your favorite tool

We have some integration with popular tools:

***

We hope you will love Elysia as much as we do!

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/your-first-route.md'
---

# Your First Route

When we enter a website, it takes

1. **path** like `/`, `/about`, or `/contact`
2. **method** like `GET`, `POST`, or `DELETE`

To determine which resource to show, simply called **"route"**.

In Elysia, we can define a route by:

1. Call method named after HTTP method
2. Path being the first argument
3. Handler being the second argument

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', 'Hello World!')
	.listen(3000)
```

## Routing

Path in Elysia can be grouped into 3 types:

1. static paths - static string to locate the resource
2. dynamic paths - segment can be any value
3. wildcards - path until a specific point can be anything

See Route.

## Static Path

Static path is a hardcoded string to locate the resource on the server.

```ts
import { Elysia } from 'elysia'

new Elysia()
	.get('/hello', 'hello')
	.get('/hi', 'hi')
	.listen(3000)
```

See Static Path.

## Dynamic path

Dynamic paths match some part and capture the value to extract extra information.

To define a dynamic path, we can use a colon `:` followed by a name.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .listen(3000)
```

Here, a dynamic path is created with `/id/:id`, which tells Elysia to capture the value `:id` segment with value like **/id/1**, **/id/123**, **/id/anything**.

See Dynamic Path.

### Optional path parameters

We can make a path parameter optional by adding a question mark `?` after the parameter name.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id?', ({ params: { id } }) => `id ${id}`)
    .listen(3000)
```

See Optional Path Parameters.

## Wildcards

Dynamic paths allow capturing a single segment while wildcards allow capturing the rest of the path.

To define a wildcard, we can use an asterisk `*`.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/*', ({ params }) => params['*'])
    .listen(3000)
```

See Wildcards.

## Assignment

Let's recap, and create 3 paths with different types:

\<template #answer>

1. Static path `/elysia` that responds with `"Hello Elysia!"`
2. Dynamic path `/friends/:name?` that responds with `"Hello {name}!"`
3. Wildcard path `/flame-chasers/*` that responds with the rest of the path.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/elysia', 'Hello Elysia!')
	.get('/friends/:name?', ({ params: { name } }) => `Hello ${name}!`)
	.get('/flame-chasers/*', ({ params }) => params['*'])
	.listen(3000)
```


---

