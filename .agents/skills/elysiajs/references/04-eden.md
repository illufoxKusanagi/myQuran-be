# Elysia Eden (End-to-End Type Safety & Client SDK)

> Complete Eden suite: Eden Treaty, Eden Fetch, WebSocket subscriptions, unit testing without HTTP overhead, and config.

## Table of Contents

- [Eden Fetch (eden/fetch.md)](#eden-fetch)
- [Eden Installation (eden/installation.md)](#eden-installation)
- [Eden Test (eden/test.md)](#eden-test)
- [Config (eden/treaty/config.md)](#config)
- [Eden Treaty Legacy (eden/treaty/legacy.md)](#eden-treaty-legacy)
- [Parameters (eden/treaty/parameters.md)](#parameters)
- [Response (eden/treaty/response.md)](#response)
- [Unit Test (eden/treaty/unit-test.md)](#unit-test)
- [WebSocket (eden/treaty/websocket.md)](#websocket)
- [End-to-End Type Safety (tutorial/features/end-to-end-type-safety.md)](#end-to-end-type-safety)
- [End-to-End Type Safety&#x20; (eden/overview.md)](#end-to-end-type-safety-x20)
- [Eden Treaty (eden/treaty/overview.md)](#eden-treaty)

---

---
url: 'https://elysiajs.com/eden/fetch.md'
---

# Eden Fetch

A fetch-like alternative to Eden Treaty.

With Eden Fetch, you can interact with Elysia server in a type-safe manner using Fetch API.

***

First export your existing Elysia server type:

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app
```

Then import the server type, and consume the Elysia API on client:

```typescript
import { edenFetch } from '@elysia/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

// response type: 'Hi Elysia'
const pong = await fetch('/hi', {})

// response type: 1895
const id = await fetch('/id/:id', {
    params: {
        id: '1895'
    }
})

// response type: { id: 1895, name: 'Skadi' }
const nendoroid = await fetch('/mirror', {
    method: 'POST',
    body: {
        id: 1895,
        name: 'Skadi'
    }
})
```

## Error Handling

You can handle errors the same way as Eden Treaty:

```typescript
import { edenFetch } from '@elysia/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = await fetch('/mirror', {
    method: 'POST',
    body: {
        id: 1895,
        name: 'Skadi'
    }
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            throw error.value
            break

        case 500:
        case 502:
            throw error.value
            break

        default:
            throw error.value
            break
    }
}

const { id, name } = nendoroid
```

## When should I use Eden Fetch over Eden Treaty

Unlike Elysia < 1.0, Eden Fetch is not faster than Eden Treaty anymore.

The preference is based on you and your team's agreement; however, we recommend using [Eden Treaty](/eden/treaty/overview) instead.

For Elysia < 1.0:

Using Eden Treaty required a lot of down-level iteration to map all possible types in a single go, while in contrast, Eden Fetch could be lazily executed until you pick a route.

With complex types and many server routes, using Eden Treaty on a low-end development device could lead to slow type inference and auto-completion.

But as Elysia has tweaked and optimized a lot of types and inference, Eden Treaty can perform very well in the considerable amount of routes.

If your single process contains **more than 500 routes**, and you need to consume all of the routes **in a single frontend codebase**, then you might want to use Eden Fetch as it has a significantly better TypeScript performance than Eden Treaty.

---


---

---
url: 'https://elysiajs.com/eden/installation.md'
---

# Eden Installation

Start by installing Eden on your frontend:

```bash
bun add @elysia/eden
bun add -d elysia
```

::: tip
Eden needs Elysia to infer utility types.

Make sure to install Elysia with the version matching the server.
:::

First, export your existing Elysia server type:

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

Then consume the Elysia API on client side:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]

// @filename: index.ts
// ---cut---
// client.ts
import { treaty } from '@elysia/eden'
import type { App } from './server' // [!code ++]

const client = treaty<App>('localhost:3000') // [!code ++]

// response: Hi Elysia
const { data: index } = await client.get()

// response: 1895
const { data: id } = await client.id({ id: 1895 }).get()

// response: { id: 1895, name: 'Skadi' }
const { data: nendoroid } = await client.mirror.post({
    id: 1895,
    name: 'Skadi'
})

// @noErrors
client.
//     ^|
```

## Gotcha

Sometimes, Eden may not infer types from Elysia correctly. The following are the most common workarounds to fix Eden type inference.

### Type Strict

Make sure to enable strict mode in **tsconfig.json**

```json
{
  "compilerOptions": {
    "strict": true // [!code ++]
  }
}
```

### Mismatched Elysia version

Eden depends on the Elysia class to import the Elysia instance and infer types correctly.

Make sure that both the client and server have matching Elysia versions.

You can check it with [`npm why`](https://docs.npmjs.com/cli/v10/commands/npm-explain) command:

```bash
npm why elysia
```

The output should contain only one elysia version at the top level:

```
elysia@1.1.12
node_modules/elysia
  elysia@"1.1.25" from the root project
  peer elysia@">= 1.1.0" from @elysia/html@1.1.0
  node_modules/@elysia/html
    dev @elysia/html@"1.1.1" from the root project
  peer elysia@">= 1.1.0" from @elysia/opentelemetry@1.1.2
  node_modules/@elysia/opentelemetry
    dev @elysia/opentelemetry@"1.1.7" from the root project
  peer elysia@">= 1.1.0" from @elysia/swagger@1.1.0
  node_modules/@elysia/swagger
    dev @elysia/swagger@"1.1.6" from the root project
  peer elysia@">= 1.1.0" from @elysia/eden@1.1.2
  node_modules/@elysia/eden
    dev @elysia/eden@"1.1.3" from the root project
```

### TypeScript version

Elysia uses newer features and syntax of TypeScript to infer types in the most performant way. Features like Const Generics and Template Literals are heavily used.

Make sure your client has a **minimum TypeScript version of >= 5.0**

### Method Chaining

To make Eden work, Elysia must use **method chaining**

Elysia's type system is complex, methods usually introduce a new type to the instance.

Using method chaining will help save that new type reference.

For example:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```

Using this, **state** now returns a new **ElysiaInstance** type, introducing **build** into store replacing the current one.

Without method chaining, Elysia doesn't save the new type when introduced, leading to no type inference.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

### Type Definitions

If you are using a Bun specific feature, like `Bun.file` or similar API and return it from a handler, you may need to install Bun type definitions to the client as well.

```bash
bun add -d @types/bun
```

### Path alias (monorepo)

If you are using path aliases in your monorepo, make sure that the frontend is able to resolve the path the same way as the backend.

::: tip
Setting up path aliases in a monorepo can be tricky. You can fork our example template: [Kozeki Template](https://github.com/SaltyAom/kozeki-template) and modify it to your needs.
:::

For example, if you have the following path alias for your backend in **tsconfig.json**:

```json
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@/*": ["./src/*"]
	}
  }
}
```

And your backend code is like this:

```typescript
import { Elysia } from 'elysia'
import { a, b } from '@/controllers'

const app = new Elysia()
	.use(a)
	.use(b)
	.listen(3000)

export type app = typeof app
```

You **must** make sure that your frontend code is able to resolve the same path alias. Otherwise, type inference will be resolved as any.

```typescript
import { treaty } from '@elysia/eden'
import type { app } from '@/index'

const client = treaty<app>('localhost:3000')

// This should be able to resolve the same module in both frontend and backend, and not `any`
import { a, b } from '@/controllers' // [!code ++]
```

To fix this, you must make sure that the path alias is resolved to the same file in both the frontend and backend.

So, you must change the path alias in **tsconfig.json** to:

```json
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@/*": ["../apps/backend/src/*"]
	}
  }
}
```

If configured correctly, you should be able to resolve the same module in both the frontend and backend.

```typescript
// This should be able to resolve the same module in both frontend and backend, and not `any`
import { a, b } from '@/controllers'
```

#### Namespace

We recommend adding a **namespace** prefix for each module in your monorepo to avoid any confusion and conflicts that may occur.

```json
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@frontend/*": ["./apps/frontend/src/*"],
	  "@backend/*": ["./apps/backend/src/*"]
	}
  }
}
```

Then, you can import the module like this:

```typescript
// Should work in both frontend and backend and not return `any`
import { a, b } from '@backend/controllers'
```

We recommend creating a **single tsconfig.json** that defines a `baseUrl` as the root of your repo, provides a path according to the module location, and creates a **tsconfig.json** for each module that inherits the root **tsconfig.json** which has the path alias.

You may find a working example in this [path alias example repo](https://github.com/SaltyAom/elysia-monorepo-path-alias) or [Kozeki Template](https://github.com/SaltyAom/kozeki-template).

---


---

---
url: 'https://elysiajs.com/eden/test.md'
---

# Eden Test

Using Eden, we can create integration tests with end-to-end type safety and auto-completion.

## Setup

We can use [Bun test](https://bun.sh/guides/test/watch-mode) to create tests.

Create **test/index.test.ts** in the root of the project directory with the following:

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'

import { edenTreaty } from '@elysia/eden'

const app = new Elysia()
    .get('/', () => 'hi')
    .listen(3000)

const api = edenTreaty<typeof app>('http://localhost:3000')

describe('Elysia', () => {
    it('return a response', async () => {
        const { data } = await api.get()

        expect(data).toBe('hi')
    })
})
```

Then we can perform tests by running **bun test**

```bash
bun test
```

This allows us to perform integration tests programmatically instead of manual fetch, while supporting type checking automatically.

---


---

---
url: 'https://elysiajs.com/eden/treaty/config.md'
---

# Config

Eden Treaty accepts 2 parameters:

* **urlOrInstance** - URL endpoint or Elysia instance
* **options** (optional) - Customize fetch behavior

## urlOrInstance

Accepts either a URL endpoint as a string or a literal Elysia instance.

Eden will change the behavior based on the type as follows:

### URL Endpoint (string)

If a URL endpoint is passed, Eden Treaty will use `fetch` or `config.fetcher` to create a network request to an Elysia instance.

```typescript
import { treaty } from '@elysia/eden'
import type { App } from './server'

const api = treaty<App>('localhost:3000')
```

You may or may not specify a protocol for the URL endpoint.

Elysia will append the endpoints automatically as follows:

1. If a protocol is specified, use the URL directly
2. If the URL is localhost and ENV is not production, use http
3. Otherwise, use https

This also applies to WebSocket for determining between **ws://** or **wss://**.

***

### Elysia Instance

If an Elysia instance is passed, Eden Treaty will create a `Request` class and pass it to `Elysia.handle` directly without creating a network request.

This allows us to interact with the Elysia server directly without request overhead, or the need to start a server.

```typescript
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .get('/hi', 'Hi Elysia')
    .listen(3000)

const api = treaty(app)
```

If an instance is passed, a generic is not needed as Eden Treaty can infer the type from the parameter directly.

This pattern is recommended for performing unit tests, or creating a type-safe reverse proxy server or microservices.

## Options

2nd optional parameter for Eden Treaty to customize fetch behavior, accepting parameters as follows:

* [fetch](#fetch) - add default parameters to fetch initialization (RequestInit)
* [fetcher](#fetcher) - custom fetch function (e.g., Axios, unfetch)
* [headers](#headers) - define default headers
* [onRequest](#onrequest) - intercept and modify fetch request before firing
* [onResponse](#onresponse) - intercept and modify fetch's response
* [parseDate](#parsedate) - automatically parse date string to Date object
* [throwHttpError](#throwhttperror) - automatically throw an error if the response status is not ok (2xx)

## Fetch

Default parameters appended to the 2nd parameter of fetch extend the type of **Fetch.RequestInit**.

```typescript
export type App = typeof app // [!code ++]
import { treaty } from '@elysia/eden'

treaty<App>('localhost:3000', {
    fetch: {
        credentials: 'include'
    }
})
```

All parameters that are passed to fetch will be passed to the fetcher, which is equivalent to:

```typescript
fetch('http://localhost:3000', {
    credentials: 'include'
})
```

## Fetcher

Provide a custom fetcher function instead of using an environment's default fetch.

```typescript
treaty<App>('localhost:3000', {
    fetcher(url, options) {
        return fetch(url, options)
    }
})
```

It's recommended to replace fetch if you want to use other client other than fetch, eg. Axios, unfetch.

## Headers

Provide additional default headers to fetch; this is a shorthand for `options.fetch.headers`.

```typescript
treaty<App>('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

All parameters that are passed to fetch will be passed to the fetcher, which is equivalent to:

```typescript
fetch('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

headers may accept the following as parameters:

* Object
* Function

### Headers Object

If an object is passed, then it will be passed to fetch directly

```typescript
treaty<App>('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

### Function

You may specify headers as a function to return custom headers based on conditions

```typescript
treaty<App>('localhost:3000', {
    headers(path, options) {
        if(path.startsWith('user'))
            return {
                authorization: 'Bearer 12345'
            }
    }
})
```

You may return an object to append its value to fetch headers.

The headers function accepts 2 parameters:

* path `string` - path which will be sent to the parameter
  * note: hostname will be **excluded**, e.g., (/user/griseo)
* options `RequestInit`: Parameters passed through the 2nd parameter of fetch

### Array

You may define a headers function as an array if multiple conditions are needed.

```typescript
treaty<App>('localhost:3000', {
    headers: [
      (path, options) => {
        if(path.startsWith('user'))
            return {
                authorization: 'Bearer 12345'
            }
        }
    ]
})
```

Eden Treaty will **run all functions** even if the value is already returned.

## Headers Priority

Eden Treaty will prioritize the order headers if duplicated as follows:

1. Inline method - Passed in method function directly
2. headers - Passed in `config.headers`

* If `config.headers` is array, parameters that come after will be prioritized

3. fetch - Passed in `config.fetch.headers`

For example:

```typescript
const api = treaty<App>('localhost:3000', {
    headers: {
        authorization: 'Bearer Aponia'
    }
})

api.profile.get({
    headers: {
        authorization: 'Bearer Griseo'
    }
})
```

This will result in:

```typescript
fetch('http://localhost:3000', {
    headers: {
        authorization: 'Bearer Griseo'
    }
})
```

If the inline function doesn't specify headers, then the result will be "**Bearer Aponia**" instead.

## OnRequest

Intercept and modify the fetch request before firing.

You may return an object to append the value to **RequestInit**.

```typescript
treaty<App>('localhost:3000', {
    onRequest(path, options) {
        if(path.startsWith('user'))
            return {
                headers: {
                    authorization: 'Bearer 12345'
                }
            }
    }
})
```

If value is returned, Eden Treaty will perform a **shallow merge** for returned value and `value.headers`.

**onRequest** accepts 2 parameters:

* path `string` - path which will be sent to parameter
  * note: hostname will be **exclude** eg. (/user/griseo)
* options `RequestInit`: Parameters that passed through 2nd parameter of fetch

### Array

You may define an onRequest function as an array if multiples conditions are need.

```typescript
treaty<App>('localhost:3000', {
    onRequest: [
      (path, options) => {
        if(path.startsWith('user'))
            return {
                headers: {
                    authorization: 'Bearer 12345'
                }
            }
        }
    ]
})
```

Eden Treaty will **run all functions** even if the value is already returned.

## onResponse

Intercept and modify fetch's response or return a new value.

```typescript
treaty<App>('localhost:3000', {
    onResponse(response) {
        if(response.ok)
            return response.json()
    }
})
```

**onRequest** accepts 1 parameter:

* response `Response` - Web Standard Response normally returned from `fetch`

### Array

You may define an onResponse function as an array if multiple conditions are need.

```typescript
treaty<App>('localhost:3000', {
    onResponse: [
        (response) => {
            if(response.ok)
                return response.json()
        }
    ]
})
```

Unlike [headers](#headers) and [onRequest](#onrequest), Eden Treaty will loop through functions until a returned value is found or error thrown, the returned value will be use as a new response.

## parseDate

* default: `true`

Automatically parse date string to Date object.

```typescript
treaty<App>('localhost:3000', {
	parseDate: true
})
```

## throwHttpError

* default: `false`

Automatically throw an error if the response status is not ok (2xx).

```typescript
treaty<App>('localhost:3000', {
	throwHttpError: true
})
```

By default, Eden will not throw an error and return as `{ error }` instead if the response status is not ok (2xx).

You can also specify a custom error handler as follows:

```typescript
treaty<App>('localhost:3000', {
	throwHttpError: (response) => {
		return response.status === 418
	}
})
```

If `throwHttpError` return `true`, Eden will throw an error, otherwise it will return as `{ error }` instead.

---


---

---
url: 'https://elysiajs.com/eden/treaty/legacy.md'
---

# Eden Treaty Legacy

::: tip NOTE
This is the documentation for Eden Treaty 1 (edenTreaty).

For a new project, we recommend starting with Eden Treaty 2 (treaty) instead.
:::

Eden Treaty is an object-like representation of an Elysia server.

It provides accessors like a normal object with types directly from the server, helping us to move faster and ensuring that nothing breaks.

***

To use Eden Treaty, first export your existing Elysia server's type:

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

Then import the server type, and consume the Elysia API on client:

```typescript
// client.ts
import { edenTreaty } from '@elysia/eden'
import type { App } from './server' // [!code ++]

const app = edenTreaty<App>('http://localhost:')

// response type: 'Hi Elysia'
const { data: pong, error } = app.get()

// response type: 1895
const { data: id, error } = app.id['1895'].get()

// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})
```

::: tip
Eden Treaty is fully type-safe with auto-completion support.
:::

## Anatomy

Eden Treaty will transform all existing paths to an object-like representation that can be described as:

```typescript
EdenTreaty.<1>.<2>.<n>.<method>({
    ...body,
    $query?: {},
    $fetch?: RequestInit
})
```

### Path

Eden will transform `/` into `.` which can be called with a registered `method`, for example:

* **/path** -> .path
* **/nested/path** -> .nested.path

### Path parameters

Path parameters will be mapped automatically by their name in the URL.

* **/id/:id** -> .id.`<anyThing>`
* eg: .id.hi
* eg: .id\['123']

::: tip
If a path doesn't support path parameters, TypeScript will show an error.
:::

### Query

You can append queries to path with `$query`:

```typescript
app.get({
    $query: {
        name: 'Eden',
        code: 'Gold'
    }
})
```

### Fetch

Eden Treaty is a fetch wrapper, you can add any valid [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) parameters to Eden by passing it to `$fetch`:

```typescript
app.post({
    $fetch: {
        headers: {
            'x-organization': 'MANTIS'
        }
    }
})
```

## Error Handling

Eden Treaty will return a value of `data` and `error` as a result, both fully typed.

```typescript
// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            warnUser(error.value)
            break

        case 500:
        case 502:
            emergencyCallDev(error.value)
            break

        default:
            reportError(error.value)
            break
    }

    throw error
}

const { id, name } = nendoroid
```

Both **data** and **error** will be typed as nullable until you can confirm their statuses with a type guard.

To put it simply, if the fetch is successful, data will have a value and error will be null, and vice versa.

::: tip
The error is wrapped with an `Error`, and its value returned from the server can be retrieved from `Error.value`
:::

### Error type based on status

Both Eden Treaty and Eden Fetch can narrow down an error type based on status code if you explicitly provide an error type in the Elysia server.

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .model({
        nendoroid: t.Object({
            id: t.Number(),
            name: t.String()
        }),
        error: t.Object({
            message: t.String()
        })
    })
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: 'nendoroid',
        response: {
            200: 'nendoroid', // [!code ++]
            400: 'error', // [!code ++]
            401: 'error' // [!code ++]
        }
    })
    .listen(3000)

export type App = typeof app
```

And on the client side:

```typescript
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            // narrow down to type 'error' described in the server
            warnUser(error.value)
            break

        default:
            // typed as unknown
            reportError(error.value)
            break
    }

    throw error
}
```

## WebSocket

Eden supports WebSocket using the same API as a normal route.

```typescript
// Server
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .ws('/chat', {
        message(ws, message) {
            ws.send(message)
        },
        body: t.String(),
        response: t.String()
    })
    .listen(3000)

type App = typeof app
```

To start listening to real-time data, call the `.subscribe` method:

```typescript
// Client
import { edenTreaty } from '@elysia/eden'
const app = edenTreaty<App>('http://localhost:')

const chat = app.chat.subscribe()

chat.subscribe((message) => {
    console.log('got', message)
})

chat.send('hello from client')
```

We can use [schema](/integrations/cheat-sheet#schema) to enforce type-safety on WebSockets, just like a normal route.

***

**Eden.subscribe** returns **EdenWebSocket** which extends the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket) class with type-safety. The syntax is identical to WebSocket.

If more control is needed, **EdenWebSocket.raw** can be accessed to interact with the native WebSocket API.

## File Upload

You may pass any of the following to the field to attach a file:

* **File**
* **FileList**
* **Blob**

Attaching a file will result in **content-type** being **multipart/form-data**

Suppose we have the server as follows:

```typescript
// server.ts
import { Elysia } from 'elysia'

const app = new Elysia()
    .post('/image', ({ body: { image, title } }) => title, {
        body: t.Object({
            title: t.String(),
            image: t.Files(),
        })
    })
    .listen(3000)

export type App = typeof app
```

We can use the client as follows:

```typescript
// client.ts
import { edenTreaty } from '@elysia/eden'
import type { Server } from './server'

export const client = edenTreaty<Server>('http://localhost:3000')

const id = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id)! as T

const { data } = await client.image.post({
    title: "Misono Mika",
    image: id<HTMLInputElement>('picture').files!,
})
```

---


---

---
url: 'https://elysiajs.com/eden/treaty/parameters.md'
---

# Parameters

We need to send a payload to the server eventually.

To handle this, Eden Treaty's methods accept 2 parameters to send data to the server.

Both parameters are type-safe and will be guided by TypeScript automatically:

1. body
2. additional parameters
   * query
   * headers
   * fetch

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .post('/user', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

// ✅ works
api.user.post({
    name: 'Elysia'
})

// ✅ also works
api.user.post({
    name: 'Elysia'
}, {
    // This is optional as not specified in schema
    headers: {
        authorization: 'Bearer 12345'
    },
    query: {
        id: 2
    }
})
```

Unless the method doesn't accept a body, then the body will be omitted and left with a single parameter only.

If the method is **"GET"** or **"HEAD"**:

1. Additional parameters
   * query
   * headers
   * fetch

```typescript
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .get('/hello', () => 'hi')
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

// ✅ works
api.hello.get({
    // This is optional as not specified in schema
    headers: {
        hello: 'world'
    }
})
```

## Empty body

If the body is optional or not needed, but query or headers are required, you may pass the body as `null` or `undefined` instead.

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .post('/user', () => 'hi', {
        query: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

api.user.post(null, {
    query: {
        name: 'Ely'
    }
})
```

## Fetch parameters

Eden Treaty is a fetch wrapper; we may add any valid [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) parameters to Eden by passing them to `$fetch`:

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .get('/hello', () => 'hi')
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

const controller = new AbortController()

const cancelRequest = setTimeout(() => {
    controller.abort()
}, 5000)

await api.hello.get({
    fetch: {
        signal: controller.signal
    }
})

clearTimeout(cancelRequest)
```

## File Upload

We may pass any of the following to attach file(s):

* **File**
* **File\[]**
* **FileList**
* **Blob**

Attaching a file will result in **content-type** being **multipart/form-data**

Suppose we have the server as follows:

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .post('/image', ({ body: { image, title } }) => title, {
        body: t.Object({
            title: t.String(),
            image: t.Files()
        })
    })
    .listen(3000)

export const api = treaty<typeof app>('localhost:3000')

const images = document.getElementById('images') as HTMLInputElement

const { data } = await api.image.post({
    title: "Misono Mika",
    image: images.files!,
})
```

---


---

---
url: 'https://elysiajs.com/eden/treaty/response.md'
---

# Response

Once the fetch method is called, Eden Treaty returns a `Promise` containing an object with the following properties:

* data - returned value of the response (2xx)
* error - returned value from the response (>= 3xx)
* response `Response` - Web Standard Response class
* status `number` - HTTP status code
* headers `FetchRequestInit['headers']` - response headers

Once returned, you must provide error handling to ensure that the response data value is unwrapped; otherwise, the value will be nullable. Elysia provides an `error()` helper function to handle the error, and Eden will provide type narrowing for the error value.

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
    .post('/user', ({ body: { name }, status }) => {
        if(name === 'Otto') return status(400)

        return name
    }, {
        body: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

const submit = async (name: string) => {
    const { data, error } = await api.user.post({
        name
    })

    // type: string | null
    console.log(data)

    if (error)
        switch(error.status) {
            case 400:
                // Error type will be narrow down
                throw error.value

            default:
                throw error.value
        }

    // Once the error is handled, type will be unwrapped
    // type: string
    return data
}
```

By default, Elysia infers `error` and `response` types to TypeScript automatically, and Eden will be providing auto-completion and type narrowing for accurate behavior.

::: tip
If the server responds with an HTTP status >= 300, then the value will always be `null`, and `error` will have a returned value instead.

Otherwise, response will be passed to `data`.
:::

## Stream response

Eden will interpret a stream response or [Server-Sent Events](/essential/handler.html#server-sent-events-sse) as an `AsyncGenerator`, allowing us to use a `for await` loop to consume the stream.

::: code-group

```typescript twoslash [Stream]
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})

const { data, error } = await treaty(app).ok.get()
if (error) throw error

for await (const chunk of data)
	console.log(chunk)
               // ^?
```

```typescript twoslash [Server-Sent Events]
import { Elysia, sse } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia()
	.get('/ok', function* () {
		yield sse({
			event: 'message',
			data: 1
		})
		yield sse({
			event: 'message',
			data: 2
		})
		yield sse({
			event: 'end'
		})
	})

const { data, error } = await treaty(app).ok.get()
if (error) throw error

for await (const chunk of data)
	console.log(chunk)
               // ^?







//
```

:::

## Utility types

Eden Treaty provides utility types `Treaty.Data<T>` and `Treaty.Error<T>` to extract the `data` and `error` types from the response.

```typescript twoslash
import { Elysia, t } from 'elysia'

import { treaty, Treaty } from '@elysia/eden'

const app = new Elysia()
	.post('/user', ({ body: { name }, status }) => {
		if(name === 'Otto') return status(400)

		return name
	}, {
		body: t.Object({
			name: t.String()
		})
	})
	.listen(3000)

const api =
	treaty<typeof app>('localhost:3000')

type UserData = Treaty.Data<typeof api.user.post>
//     ^?


// Alternatively, you can also pass a response
const response = await api.user.post({
	name: 'Saltyaom'
})

type UserDataFromResponse = Treaty.Data<typeof response>
//     ^?



type UserError = Treaty.Error<typeof api.user.post>
//     ^?












//
```

---


---

---
url: 'https://elysiajs.com/eden/treaty/unit-test.md'
---

# Unit Test

According to [Eden Treaty config](/eden/treaty/config.html#urlorinstance) and [Unit Test](/patterns/unit-test), we may pass an Elysia instance to Eden Treaty directly to interact with the Elysia server directly without sending a network request.

We may use this pattern to create a unit test with end-to-end type safety and type-level tests all at once.

```typescript twoslash
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia().get('/hello', 'hi')
const api = treaty(app)

describe('Elysia', () => {
    it('returns a response', async () => {
        const { data } = await api.hello.get()

        expect(data).toBe('hi')
              // ^?

    })
})
```

## Type safety test

To perform a type safety test, simply run **tsc** on test folders.

```bash
tsc --noEmit test/**/*.ts
```

This is useful to ensure type integrity for both client and server, especially during migrations.

---


---

---
url: 'https://elysiajs.com/eden/treaty/websocket.md'
---

# WebSocket

Eden Treaty supports WebSocket using the `subscribe` method.

```typescript
import { Elysia, t } from "elysia";
import { treaty } from "@elysia/eden";

const app = new Elysia()
  .ws("/chat", {
    body: t.String(),
    response: t.String(),
    message(ws, message) {
      ws.send(message);
    },
  })
  .listen(3000);

const api = treaty<typeof app>("localhost:3000");

const chat = api.chat.subscribe();

chat.subscribe((message) => {
  console.log("got", message);
});

chat.on("open", () => {
  chat.send("hello from client");
});
```

**.subscribe** accepts the same parameters as `get` and `head`.

## Response

**Eden.subscribe** returns **EdenWS** which extends the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket), resulting in identical syntax.

If more control is needed, **EdenWebSocket.raw** can be accessed to interact with the native WebSocket API.

---


---

---
url: 'https://elysiajs.com/tutorial/features/end-to-end-type-safety.md'
---

# End-to-End Type Safety

Elysia provides an end-to-end type safety between backend and frontend **without code generation** similar to tRPC, using Eden.

```typescript
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden'

// Backend
export const app = new Elysia()
	.get('/', 'Hello Elysia!')
	.listen(3000)

// Frontend
const client = treaty<typeof app>('localhost:3000')

const { data, error } = await client.get()

console.log(data) // Hello World
```

This works by inferring the types from the Elysia instance, and uses type hints to provide type safety for the client.

See Eden Treaty.

## Assignment

Let's click the  icon in the preview to see how's the request is logged.

---


---

---
url: 'https://elysiajs.com/eden/overview.md'
---

# End-to-End Type Safety&#x20;

Imagine you have a toy train set.

Each piece of the train track has to fit perfectly with the next one, like puzzle pieces.

End-to-end type safety is like making sure all the pieces of the track match up correctly so the train doesn't fall off or get stuck.

For a framework to have end-to-end type safety means that you can connect the client and server in a type-safe manner.

Elysia provides end-to-end type safety **without code generation** out of the box with an RPC-like connector, **Eden**.

Other frameworks that support e2e type safety:

* tRPC
* Remix
* SvelteKit
* Nuxt
* TS-Rest

Elysia allows you to change the type on the server, and it will be instantly reflected on the client, helping with auto-completion and type enforcement.

## Eden

Eden is an RPC-like client to connect Elysia with **end-to-end type safety** using only TypeScript's type inference instead of code generation.

It allows you to sync client and server types effortlessly, weighing less than 2KB.

Eden consists of 2 modules:

1. Eden Treaty **(recommended)**: an improved RPC version of Eden Treaty 1 (edenTreaty)
2. Eden Fetch: A fetch-like client with type safety

Below is an overview, use cases, and a comparison for each module.

## Eden Treaty (Recommended)

Eden Treaty is an object-like representation of an Elysia server providing end-to-end type safety and a significantly improved developer experience.

With Eden Treaty, we can interact with an Elysia server with full-type support and auto-completion, error handling with type narrowing, and create type-safe unit tests.

Example usage of Eden Treaty:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'hi')
    .get('/users', () => 'Skadi')
    .put('/nendoroid/:id', ({ body }) => body, {
        body: t.Object({
            name: t.String(),
            from: t.String()
        })
    })
    .get('/nendoroid/:id/name', () => 'Skadi')
    .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { treaty } from '@elysia/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// @noErrors
app.
//  ^|




// Call [GET] at '/'
const { data } = await app.get()

// Call [PUT] at '/nendoroid/:id'
const { data: nendoroid, error } = await app.nendoroid({ id: 1895 }).put({
    name: 'Skadi',
    from: 'Arknights'
})
```

## Eden Fetch

A fetch-like alternative to Eden Treaty for developers who prefer fetch syntax.

```typescript
import { edenFetch } from '@elysia/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

const { data } = await fetch('/name/:name', {
    method: 'POST',
    params: {
        name: 'Saori'
    },
    body: {
        branch: 'Arius',
        type: 'Striker'
    }
})
```

::: tip NOTE
Unlike Eden Treaty, Eden Fetch doesn't provide WebSocket implementation for the Elysia server.
:::

---


---

---
url: 'https://elysiajs.com/eden/treaty/overview.md'
---

# Eden Treaty

Eden Treaty is an object representation used to interact with a server and features type safety, auto-completion, and error handling.

To use Eden Treaty, first export your existing Elysia server's type:

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

Then import the server type and consume the Elysia API on the client:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]

// @filename: client.ts
// ---cut---
// client.ts
import { treaty } from '@elysia/eden'
import type { App } from './server' // [!code ++]

const app = treaty<App>('localhost:3000')

// response type: 'Hi Elysia'
const { data, error } = await app.hi.get()
      // ^?
```

## Tree-like syntax

HTTP Path is a resource indicator for a file system tree.

A file system consists of multiple levels of folders, for example:

* /documents/elysia
* /documents/kalpas
* /documents/kelvin

Each level is separated by **/** (slash) and a name.

However, in JavaScript, instead of using **"/"** (slash), we use **"."** (dot) to access deeper resources.

Eden Treaty turns an Elysia server into a tree-like file system that can be accessed from the JavaScript frontend instead.

| Path         | Treaty       |
| ------------ | ------------ |
| /            |              |
| /hi          | .hi          |
| /deep/nested | .deep.nested |

Combined with the HTTP method, we can interact with the Elysia server.

| Path         | Method | Treaty              |
| ------------ | ------ | ------------------- |
| /            | GET    | .get()              |
| /hi          | GET    | .hi.get()           |
| /deep/nested | GET    | .deep.nested.get()  |
| /deep/nested | POST   | .deep.nested.post() |

## Dynamic path

However, dynamic path parameters cannot be expressed using notation alone. If they are fully replaced, we don't know what the parameter name is supposed to be.

```typescript
// ❌ Unclear what the value is supposed to represent?
treaty.item['skadi'].get()
```

To handle this, we can specify a dynamic path using a function to provide a key value instead.

```typescript
// ✅ Clear that the value is dynamic and the path is 'name'
treaty.item({ name: 'Skadi' }).get()
```

| Path            | Treaty                           |
| --------------- | -------------------------------- |
| /item           | .item                            |
| /item/:name     | .item({ name: 'Skadi' })         |
| /item/:name/id  | .item({ name: 'Skadi' }).id      |

---


---

