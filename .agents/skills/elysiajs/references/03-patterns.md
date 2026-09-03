# Elysia Patterns & Advanced Engine (Config, Macros, WebSockets, Tracing & JIT)

> Production patterns: server configuration, reactive cookies, macro decorators, WebSockets, error handling, JIT compiler internals, and app.trace.

## Table of Contents

- [Config (patterns/configuration.md)](#config)
- [Cookie (tutorial/patterns/cookie.md)](#cookie)
- [Deploy to production (patterns/deploy.md)](#deploy-to-production)
- [Error Handling (tutorial/patterns/error-handling.md)](#error-handling)
- [Error Handling&#x20; (patterns/error-handling.md)](#error-handling-x20)
- [Extend context&#x20; (patterns/extends-context.md)](#extend-context-x20)
- [Extends Context (tutorial/patterns/extends-context.md)](#extends-context)
- [Elysia with Bun Fullstack Dev Server (patterns/fullstack-dev-server.md)](#elysia-with-bun-fullstack-dev-server)
- [JIT "Compiler"&#x20; (internal/jit-compiler.md)](#jit-compiler-x20)
- [Macro (tutorial/patterns/macro.md)](#macro)
- [Macro&#x20; (patterns/macro.md)](#macro-x20)
- [Mount (tutorial/features/mount.md)](#mount)
- [Mount&#x20; (patterns/mount.md)](#mount-x20)
- [OpenAPI (tutorial/features/openapi.md)](#openapi)
- [OpenAPI&#x20; (patterns/openapi.md)](#openapi-x20)
- [OpenTelemetry (patterns/opentelemetry.md)](#opentelemetry)
- [Cookie&#x20; (patterns/cookie.md)](#cookie-x20)
- [Standalone Schema (tutorial/patterns/standalone-schema.md)](#standalone-schema)
- [Unit Test&#x20; (patterns/unit-test.md)](#unit-test-x20)
- [Trace (patterns/trace.md)](#trace)
- [TypeBox (Elysia.t) (patterns/typebox.md)](#typebox-elysia-t)
- [TypeScript (patterns/typescript.md)](#typescript)
- [Unit Test (tutorial/features/unit-test.md)](#unit-test)
- [Validation Error (tutorial/patterns/validation-error.md)](#validation-error)
- [WebSocket (patterns/websocket.md)](#websocket)

---

---
url: 'https://elysiajs.com/patterns/configuration.md'
---

# Config

Elysia comes with a configurable behavior, allowing us to customize various aspects of its functionality.

We can define a configuration by using a constructor.

```ts
import { Elysia, t } from 'elysia'

new Elysia({
	prefix: '/v1',
	normalize: true
})
```

## adapter

###### Since 1.1.11

Runtime adapter for using Elysia in different environments.

Defaults to appropriate adapter based on the environment.

```ts
import { Elysia, t } from 'elysia'
import { BunAdapter } from 'elysia/adapter/bun'

new Elysia({
	adapter: BunAdapter
})
```

## allowUnsafeValidationDetails

###### Since 1.4.13

Whether Elysia should include unsafe validation details in the error response on production.

```ts
import { Elysia, t } from 'elysia'

new Elysia({
	allowUnsafeValidationDetails: true
})
```

By default, Elysia will omit all validation detail on production.

This is done to prevent leaking sensitive information about the validation schema, such as field names and expected types, which could be exploited by an attacker.

Ideally, this should only be enabled on public APIs as it may leak sensitive information about the server implementation.

#### Options - @default `false`

* `true` - Include unsafe validation details in the error response on production
* `false` - Exclude unsafe validation details in the error response on production

## aot

###### Since 0.4.0

Ahead of Time compilation.

Elysia has a built-in JIT *"compiler"* that can [optimize performance](/blog/elysia-04.html#ahead-of-time-complie).

```ts
import { Elysia } from 'elysia'

new Elysia({
	aot: true
})
```

Disable Ahead of Time compilation

#### Options - @default `false`

* `true` - Precompile every route before starting the server

* `false` - Disable JIT entirely. Faster startup time without cost of performance

## detail

Define an OpenAPI schema for all routes of an instance.

This schema will be used to generate OpenAPI documentation for all routes of an instance.

```ts
import { Elysia } from 'elysia'

new Elysia({
	detail: {
		hide: true,
		tags: ['elysia']
	}
})
```

## encodeSchema

Handle custom `t.Transform` schemas with custom `Encode` before returning the response to client.

This allows us to create custom encode functions for your data before sending response to the client.

```ts
import { Elysia, t } from 'elysia'

new Elysia({ encodeSchema: true })
```

#### Options - @default `true`

* `true` - Run `Encode` before sending the response to client
* `false` - Skip `Encode` entirely

## name

Define the name of an instance which is used for debugging and [Plugin Deduplication](/essential/plugin.html#plugin-deduplication)

```ts
import { Elysia } from 'elysia'

new Elysia({
	name: 'service.thing'
})
```

## nativeStaticResponse

###### Since 1.1.11

Use optimized functions for handling inline values for each respective runtime.

```ts
import { Elysia } from 'elysia'

new Elysia({
	nativeStaticResponse: true
})
```

#### Example

If enabled on Bun, Elysia will insert inline value into `Bun.serve.static` improving performance for static value.

```ts
import { Elysia } from 'elysia'

// This
new Elysia({
	nativeStaticResponse: true
}).get('/version', 1)

// is an equivalent to
Bun.serve({
	static: {
		'/version': new Response(1)
	}
})
```

## normalize

###### Since 1.1.0

Whether Elysia should coerce fields into a specified schema.

```ts
import { Elysia, t } from 'elysia'

new Elysia({
	normalize: true
})
```

When unknown properties that are not specified in schema are found on either input and output, how should Elysia handle the field?

Options - @default `true`

* `true`: Elysia will coerce fields into a specified schema using [exact mirror](/blog/elysia-13.html#exact-mirror)

* `typebox`: Elysia will coerce fields into a specified schema using [TypeBox's Value.Clean](https://github.com/sinclairzx81/typebox)

* `false`: Elysia will raise an error if a request or response contains fields that are not explicitly allowed in the schema of the respective handler.

## precompile

###### Since 1.0.0

Whether Elysia should [precompile all routes](/blog/elysia-10.html#improved-startup-time) ahead of time before starting the server.

```ts
import { Elysia } from 'elysia'

new Elysia({
	precompile: true
})
```

Options - @default `false`

* `true`: Run JIT on all routes before starting the server

* `false`: Dynamically compile routes on demand

It's recommended to leave it as `false`.

## prefix

Define a prefix for all routes of an instance

```ts
import { Elysia, t } from 'elysia'

new Elysia({
	prefix: '/v1'
})
```

When prefix is defined, all routes will be prefixed with the given value.

#### Example

```ts
import { Elysia, t } from 'elysia'

new Elysia({ prefix: '/v1' }).get('/name', 'elysia') // Path is /v1/name
```

## sanitize

A function or an array of functions that calls and intercepts on every `t.String` while validation.

Allowing us to read and transform strings into new values.

```ts
import { Elysia, t } from 'elysia'

new Elysia({
	sanitize: (value) => Bun.escapeHTML(value)
})
```

## seed

Define a value that will be used to generate checksum of an instance, used for [Plugin Deduplication](/essential/plugin.html#plugin-deduplication)

```ts
import { Elysia } from 'elysia'

new Elysia({
	seed: {
		value: 'service.thing'
	}
})
```

The value could be any type not limited to string, number, or object.

## strictPath

Whether Elysia should handle paths strictly.

According to [RFC 3986](https://tools.ietf.org/html/rfc3986#section-3.3), a path should be strictly equal to the path defined in the route.

```ts
import { Elysia, t } from 'elysia'

new Elysia({ strictPath: true })
```

#### Options - @default `false`

* `true` - Follows [RFC 3986](https://tools.ietf.org/html/rfc3986#section-3.3) for path matching strictly
* `false` - Tolerate suffix '/' or vice-versa.

#### Example

```ts
import { Elysia, t } from 'elysia'

// Path can be either /name or /name/
new Elysia({ strictPath: false }).get('/name', 'elysia')

// Path can be only /name
new Elysia({ strictPath: true }).get('/name', 'elysia')
```

## serve

Customize HTTP server behavior.

Bun serve configuration.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		hostname: 'elysiajs.com',
		tls: {
			cert: Bun.file('cert.pem'),
			key: Bun.file('key.pem')
		}
	},
})
```

This configuration extends [Bun Serve API](https://bun.sh/docs/api/http) and [Bun TLS](https://bun.sh/docs/api/http#tls)

### Example: Max body size

We can set the maximum body size by setting [`serve.maxRequestBodySize`](#serve-maxrequestbodysize) in the `serve` configuration.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		maxRequestBodySize: 1024 * 1024 * 256 // 256MB
	}
})
```

By default the maximum request body size is 128MB (1024 \* 1024 \* 128).
Define body size limit.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		// Maximum message size (in bytes)
	    maxPayloadLength: 64 * 1024,
	}
})
```

### Example: HTTPS / TLS

We can enable TLS (known as successor of SSL) by passing in a value for key and cert; both are required to enable TLS.

```ts
import { Elysia, file } from 'elysia'

new Elysia({
	serve: {
		tls: {
			cert: file('cert.pem'),
			key: file('key.pem')
		}
	}
})
```

### Example: Increase timeout

We can increase the idle timeout by setting [`serve.idleTimeout`](#serve-idletimeout) in the `serve` configuration.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		// Increase idle timeout to 60 seconds
		idleTimeout: 60
	}
})
```

By default the idle timeout is 30 seconds.

***

## serve

HTTP server configuration.

Elysia extends Bun configuration which supports TLS out of the box, powered by BoringSSL.

See [serve.tls](#serve-tls) for available configuration.

### serve.hostname

@default `0.0.0.0`

Set the hostname which the server listens on

### serve.id

Uniquely identify a server instance with an ID

This string will be used to hot reload the server without interrupting pending requests or websockets. If not provided, a value will be generated. To disable hot reloading, set this value to `null`.

### serve.idleTimeout

@default `30` (30 seconds)

By default, Elysia sets idle timeout to 30 seconds, which means that if a request is not completed within 30 seconds, it will be aborted.

### serve.maxRequestBodySize

@default `1024 * 1024 * 128` (128MB)

Set the maximum size of a request body (in bytes)

### serve.port

@default `3000`

Port to listen on

### serve.rejectUnauthorized

@default `NODE_TLS_REJECT_UNAUTHORIZED` environment variable

If set to `false`, any certificate is accepted.

### serve.reusePort

@default `true`

If the `SO_REUSEPORT` flag should be set

This allows multiple processes to bind to the same port, which is useful for load balancing

This configuration is overridden and turns on by default by Elysia

### serve.unix

If set, the HTTP server will listen on a unix socket instead of a port.

(Cannot be used with hostname+port)

### serve.tls

We can enable TLS (known as successor of SSL) by passing in a value for key and cert; both are required to enable TLS.

```ts
import { Elysia, file } from 'elysia'

new Elysia({
	serve: {
		tls: {
			cert: file('cert.pem'),
			key: file('key.pem')
		}
	}
})
```

Elysia extends Bun configuration which supports TLS out of the box, powered by BoringSSL.

### serve.tls.ca

Optionally override the trusted CA certificates. Default is to trust the well-known CAs curated by Mozilla.

Mozilla's CAs are completely replaced when CAs are explicitly specified using this option.

### serve.tls.cert

Cert chains in PEM format. One cert chain should be provided per private key.

Each cert chain should consist of the PEM formatted certificate for a provided private key, followed by the PEM formatted intermediate certificates (if any), in order, and not
including the root CA (the root CA must be pre-known to the peer, see ca).

When providing multiple cert chains, they do not have to be in the same order as their private keys in key.

If the intermediate certificates are not provided, the peer will not be
able to validate the certificate, and the handshake will fail.

### serve.tls.dhParamsFile

File path to a .pem file custom Diffie Helman parameters

### serve.tls.key

Private keys in PEM format. PEM allows the option of private keys being encrypted. Encrypted keys will be decrypted with options.passphrase.

Multiple keys using different algorithms can be provided either as an array of unencrypted key strings or buffers, or an array of objects in the form .

The object form can only occur in an array.

**object.passphrase** is optional. Encrypted keys will be decrypted with

**object.passphrase** if provided, or **options.passphrase** if it is not.

### serve.tls.lowMemoryMode

@default `false`

This sets `OPENSSL_RELEASE_BUFFERS` to 1.

It reduces overall performance but saves some memory.

### serve.tls.passphrase

Shared passphrase for a single private key and/or a PFX.

### serve.tls.requestCert

@default `false`

If set to `true`, the server will request a client certificate.

### serve.tls.secureOptions

Optionally affect the OpenSSL protocol behavior, which is not usually necessary.

This should be used carefully if at all!

Value is a numeric bitmask of the SSL\_OP\_\* options from OpenSSL Options

### serve.tls.serverName

Explicitly set a server name

## tags

Define tags for OpenAPI schema for all routes of an instance similar to [detail](#detail)

```ts
import { Elysia } from 'elysia'

new Elysia({
	tags: ['elysia']
})
```

## systemRouter

Use runtime/framework provided router if possible.

On Bun, Elysia will use [Bun.serve.routes](https://bun.sh/docs/api/http#routing) and fallback to Elysia's own router.

## websocket

Override websocket configuration

Recommended to leave this as default as Elysia will generate suitable configuration for handling WebSocket automatically

This configuration extends [Bun's WebSocket API](https://bun.sh/docs/api/websockets)

#### Example

```ts
import { Elysia } from 'elysia'

new Elysia({
	websocket: {
		// enable compression and decompression
    	perMessageDeflate: true
	}
})
```

***

---


---

---
url: 'https://elysiajs.com/tutorial/patterns/cookie.md'
---

# Cookie

You interact with cookies by using cookie from context.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		const total = +visit.value ?? 0
		visit.value++

		return `You have visited ${visit.value} times`
	})
	.listen(3000)
```

Cookie is a reactive object. Once modified, it will be reflected in response.

## Value

Elysia will then try to coerce it into its respective value when a type annotation if provided.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value.total++

		return `You have visited ${visit.value.total} times`
	}, {
		cookie: t.Object({
			visit: t.Optional(
				t.Object({
					total: t.Number()
				})
			)
		})
	})
	.listen(3000)
```

We can use cookie schema to validate and parse cookie.

## Attribute

We can get/set cookie attribute by its respective property name.

Otherwise, use `.set()` to bulk set attribute.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value++

		visit.httpOnly = true
		visit.path = '/'

		visit.set({
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24 * 7
		})

		return `You have visited ${visit.value} times`
	})
	.listen(3000)
```

See Cookie Attribute.

## Remove

We can remove cookie by calling `.remove()` method.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.remove()

		return `Cookie removed`
	})
	.listen(3000)
```

## Cookie Signature

Elysia can sign cookies to prevent tampering by:

1. Provide a cookie secret to the Elysia constructor.
2. Use `t.Cookie` to provide secret for each cookie.

```typescript
import { Elysia } from 'elysia'

new Elysia({
	cookie: {
		secret: 'Fischl von Luftschloss Narfidort',
	}
})
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value++

		return `You have visited ${visit.value} times`
	}, {
		cookie: t.Cookie({
			visit: t.Optional(t.Number())
        }, {
            secrets: 'Fischl von Luftschloss Narfidort',
            sign: ['visit']
        })
	})
	.listen(3000)
```

If multiple secrets are provided, Elysia will use the first secret to sign cookies, and try to verify with the rest.

See Cookie Signature, Cookie Rotation.

## Assignment

Let's create a simple counter that tracks how many times you have visited the site.

\<template #answer>

1. We can update the cookie value by modifying `visit.value`.
2. We can set **HTTP only** attribute by setting `visit.httpOnly = true`.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value++

		visit.httpOnly = true

		return `You have visited ${visit.value} times`
	}, {
		cookie: t.Object({
			visit: t.Optional(
				t.Number()
			)
		})
	})
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/patterns/deploy.md'
---

# Deploy to production

This page provides a guide on how to deploy Elysia to production.

## Cluster mode

Elysia is single-threaded by default. To take advantage of multi-core CPU, we can run Elysia in cluster mode.

Let's create an **index.ts** file that imports our main server from **server.ts** and fork multiple workers based on the number of CPU cores available.

::: code-group

```ts [src/index.ts]
import cluster from 'node:cluster'
import os from 'node:os'
import process from 'node:process'

if (cluster.isPrimary) {
  	for (let i = 0; i < os.availableParallelism(); i++)
    	cluster.fork()
} else {
  	await import('./server')
  	console.log(`Worker ${process.pid} started`)
}
```

```ts [src/server.ts]
import { Elysia } from 'elysia'

new Elysia()
	.get('/', () => 'Hello World!')
	.listen(3000)
```

:::

This will ensure that Elysia is running on multiple CPU cores.

::: tip
Elysia on Bun uses SO\_REUSEPORT by default, which allows multiple instances to listen on the same port. This only works on Linux.
:::

## Compile to binary

We recommend running the build command before deploying to production as it could potentially reduce memory usage and file size significantly.

We recommend compiling Elysia into a single binary using the command as follows:

```bash
bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	src/index.ts
```

This will generate a portable binary `server` which we can run to start our server.

Compiling server to binary usually significantly reduces memory usage by 2-3x compared to development environment.

This command is a bit long, so let's break it down:

1. **--compile** Compile TypeScript to binary
2. **--minify-whitespace** Remove unnecessary whitespace
3. **--minify-syntax** Minify JavaScript syntax to reduce file size
4. **--target bun** Optimize the binary for Bun runtime
5. **--outfile server** Output the binary as `server`
6. **src/index.ts** The entry file of our server (codebase)

To start our server, simply run the binary.

```bash
./server
```

Once binary is compiled, you don't need `Bun` installed on the machine to run the server.

This is great as the deployment server doesn't need to install an extra runtime to run making binary portable.

### Target

You can also add a `--target` flag to optimize the binary for the target platform.

```bash
bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun-linux-x64 \
	--outfile server \
	src/index.ts
```

Here's a list of available targets:
| Target                  | Operating System | Architecture | Modern | Baseline | Libc  |
|--------------------------|------------------|--------------|--------|----------|-------|
| bun-linux-x64           | Linux            | x64          | ✅      | ✅        | glibc |
| bun-linux-arm64         | Linux            | arm64        | ✅      | N/A      | glibc |
| bun-windows-x64         | Windows          | x64          | ✅      | ✅        | -     |
| bun-windows-arm64       | Windows          | arm64        | ❌      | ❌        | -     |
| bun-darwin-x64          | macOS            | x64          | ✅      | ✅        | -     |
| bun-darwin-arm64        | macOS            | arm64        | ✅      | N/A      | -     |
| bun-linux-x64-musl      | Linux            | x64          | ✅      | ✅        | musl  |
| bun-linux-arm64-musl    | Linux            | arm64        | ✅      | N/A      | musl  |

### Why not --minify

Bun has a `--minify` flag that will minify the binary.

However if we are using [OpenTelemetry](/plugins/opentelemetry), it will reduce a function name to a single character.

This makes tracing harder than it should as OpenTelemetry relies on function names.

However, if you're not using OpenTelemetry, you may opt in for `--minify` instead

```bash
bun build \
	--compile \
	--minify \
	--outfile server \
	src/index.ts
```

### Permission

Some Linux distributions might not be able to run the binary, we suggest enabling execute permissions on the binary if you're on Linux:

```bash
chmod +x ./server

./server
```

### Unknown random Chinese error

If you're trying to deploy a binary to your server but are unable to run it and are receiving random Chinese character errors.

It means that the machine you're running on **doesn't support AVX2**.

Unfortunately, Bun requires a machine that has `AVX2` hardware support.

There's no known workaround.

## Compile to JavaScript

If you are unable to compile to a binary or you are deploying on a Windows server.

You may bundle your server to a JavaScript file instead.

```bash
bun build \
	--minify-whitespace \
	--minify-syntax \
	--outfile ./dist/index.js \
	src/index.ts
```

This will generate a single portable JavaScript file that you can deploy on your server.

```bash
NODE_ENV=production bun ./dist/index.js
```

## Docker

On Docker, we recommend always compiling to a binary to reduce base image overhead.

Here's an example image using the Distroless image with a binary.

```dockerfile [Dockerfile]
FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
```

### OpenTelemetry

If you are using [OpenTelemetry](/patterns/opentelemetry) to deploy production server.

As OpenTelemetry relies on monkey-patching `node_modules/<library>`. It's required to make instrumentations work properly, we need to specify libraries to be instrumented as an external module to exclude it from being bundled.

For example, if you are using `@opentelemetry/instrumentation-pg` to instrument the `pg` library. We need to exclude `pg` from being bundled and make sure that it is importing `node_modules/pg`.

To make this work, we may specify `pg` as an external module with `--external pg`

```bash
bun build --compile --external pg --outfile server src/index.ts
```

This tells bun not to bundle `pg` into the final output file, and will be imported from the `node_modules` directory at runtime. So on a production server, you must also keep the `node_modules` directory.

It's recommended to specify packages that should be available in a production server as `dependencies` in `package.json` and use `bun install --production` to install only production dependencies.

```json
{
	"dependencies": {
		"pg": "^8.15.6"
	},
	"devDependencies": {
		"@elysia/opentelemetry": "^1.2.0",
		"@opentelemetry/instrumentation-pg": "^0.52.0",
		"@types/pg": "^8.11.14",
		"elysia": "^1.2.25"
	}
}
```

Then after running a build command, on a production server

```bash
bun install --production
```

If the node\_modules directory still includes development dependencies, you may remove the node\_modules directory and reinstall production dependencies again.

### Monorepo

If you are using Elysia with Monorepo, you may need to include dependent `packages`.

If you are using Turborepo, you may place a Dockerfile inside your apps directory like **apps/server/Dockerfile**. This also applies to other monorepo managers such as Lerna, etc.

Assuming that our monorepo uses Turborepo with structure as follows:

* apps
  * server
    * **Dockerfile (place a Dockerfile here)**
* packages
  * config

Then we can build our Dockerfile on monorepo root (not app root):

```bash
docker build -f apps/server/Dockerfile -t elysia-mono .
```

With Dockerfile as follows:

```dockerfile [apps/server/Dockerfile]
FROM oven/bun:1 AS build

WORKDIR /app

# Cache packages
COPY package.json package.json
COPY bun.lock bun.lock

COPY /apps/server/package.json ./apps/server/package.json
COPY /packages/config/package.json ./packages/config/package.json

RUN bun install

COPY /apps/server ./apps/server
COPY /packages/config ./packages/config

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
```

## Railway

[Railway](https://railway.app) is one of the popular deployment platforms.

Railway assigns a **random port** to expose for each deployment, which can be accessed via the `PORT` environment variable.

We need to modify our Elysia server to accept the `PORT` environment variable to comply with Railway port.

Instead of a fixed port, we may use `process.env.PORT` and provide a fallback on development instead.

```ts
new Elysia()
	.listen(3000) // [!code --]
	.listen(process.env.PORT ?? 3000) // [!code ++]
```

This should allow Elysia to intercept port provided by Railway.

::: tip
Elysia assigns the hostname to `0.0.0.0` automatically, which works with Railway
:::

---


---

---
url: 'https://elysiajs.com/tutorial/patterns/error-handling.md'
---

# Error Handling

onError is called when an **error is thrown**.

It accepts **context** similar to a handler but includes an additional:

* error - a thrown error
* code - error code

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onError(({ code, status }) => {
		if(code === "NOT_FOUND")
			return 'uhe~ are you lost?'

		return status(418, "My bad! But I'm cute so you'll forgive me, right?")
	})
	.get('/', () => 'ok')
	.listen(3000)
```

You can return a status to override the default error status.

## Custom Error

You can provide a custom error with error code as follows:

```typescript
import { Elysia } from 'elysia'

class NicheError extends Error {
	constructor(message: string) {
		super(message)
	}
}

new Elysia()
	.error({ // [!code ++]
		'NICHE': NicheError // [!code ++]
	}) // [!code ++]
	.onError(({ error, code, status }) => {
		if(code === 'NICHE') {
			// Typed as NicheError
			console.log(error)

			return status(418, "We have no idea how you got here")
		}
	})
	.get('/', () => {
        throw new NicheError('Custom error message')
	})
	.listen(3000)
```

Elysia uses error codes to narrow down the type of error.

It's recommended to register custom errors as Elysia can narrow down the type.

### Error Status Code

You can also provide a custom status code by adding a **status** property to class:

```typescript
import { Elysia } from 'elysia'

class NicheError extends Error {
	status = 418 // [!code ++]

	constructor(message: string) {
		super(message)
	}
}
```

Elysia will use this status code if the error is thrown, see Custom Status Code.

### Error Response

You can also define a custom error response directly into the error by providing a `toResponse` method:

```typescript
import { Elysia } from 'elysia'

class NicheError extends Error {
	status = 418

	constructor(message: string) {
		super(message)
	}

	toResponse() { // [!code ++]
		return { message: this.message } // [!code ++]
	} // [!code ++]
}
```

Elysia will use this response if the error is thrown, see Custom Error Response.

## Assignment

Let's try to extend Elysia's context.

\<template #answer>

1. You can narrow down the error by "NOT\_FOUND" to override 404 response.
2. Provide your error to `.error()` method with status property of 418.

```typescript
import { Elysia } from 'elysia'

class YourError extends Error {
	status = 418

	constructor(message: string) {
		super(message)
	}
}

new Elysia()
	.error({
		"YOUR_ERROR": YourError
	})
	.onError(({ code, status }) => {
		if(code === "NOT_FOUND")
			return "Hi there"
	})
	.get('/', () => {
		throw new YourError("A")
	})
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/patterns/error-handling.md'
---

# Error Handling&#x20;

This page provides a more advanced guide for effectively handling errors with Elysia.

If you haven't read **"Life Cycle (onError)"** yet, we recommend you to read it first.

## Custom Validation Message

When defining a schema, you can provide a custom validation message for each field.

This message will be returned as-is when the validation fails.

```ts
import { Elysia } from 'elysia'

new Elysia().get('/:id', ({ params: { id } }) => id, {
    params: t.Object({
        id: t.Number({
            error: 'id must be a number' // [!code ++]
        })
    })
})
```

If the validation fails on the `id` field, the response will be returned as `id must be a number`.

### Validation Detail&#x20;

Returning a value from `schema.error` will return the validation as-is, but sometimes you may also want to return the validation details, such as the field name and the expected type

You can do this by using the `validationDetail` option.

```ts
import { Elysia, validationDetail } from 'elysia' // [!code ++]

new Elysia().get('/:id', ({ params: { id } }) => id, {
    params: t.Object({
        id: t.Number({
            error: validationDetail('id must be a number') // [!code ++]
        })
    })
})
```

This will include all of the validation details in the response, such as the field name and the expected type.

But if you plan to use `validationDetail` in every field, adding it manually can be annoying.

You can automatically add validation detail by handling it in `onError` hook.

```ts
new Elysia()
    .onError(({ error, code }) => {
        if (code === 'VALIDATION') return error.detail(error.message) // [!code ++]
    })
    .get('/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number({
                error: 'id must be a number'
            })
        })
    })
    .listen(3000)
```

This will apply every validation error with a custom message with custom validation message.

## Validation Detail on production

By default, Elysia will omit all validation detail if `NODE_ENV` is `production`.

This is done to prevent leaking sensitive information about the validation schema, such as field names and expected types, which could be exploited by an attacker.

Elysia will only return that validation failed without any details.

```json
{
    "type": "validation",
    "on": "body",
    "found": {},
    // Only shown for custom error
    "message": "x must be a number"
}
```

The `message` property is optional and is omitted by default unless you provide a custom error message in the schema.

This can be overridden by setting `Elysia.allowUnsafeValidationDetails` to `true`, see [Elysia configuration](/patterns/configuration#allow-unsafe-validation-details) for more details.

## Custom Error

Elysia supports custom errors both in the type-level and implementation level.

By default, Elysia has a set of built-in error types like `VALIDATION`, `NOT_FOUND` which will narrow down the type automatically.

If Elysia doesn't know the error, the error code will be `UNKNOWN` with default status of `500`

But you can also add a custom error with type safety with `Elysia.error` which will help narrow down the error type for full type safety with auto-complete, and custom status code as follows:

```typescript
import { Elysia } from 'elysia'

class MyError extends Error {
    constructor(public message: string) {
        super(message)
    }
}

new Elysia()
    .error({
        MyError
    })
    .onError(({ code, error }) => {
        switch (code) {
            // With auto-completion
            case 'MyError':
                // With type narrowing
                // Hover to see error is typed as `CustomError`
                return error
        }
    })
    .get('/:id', () => {
        throw new MyError('Hello Error')
    })
```

### Custom Status Code

You can also provide a custom status code for your custom error by adding `status` property in your custom error class.

```typescript
import { Elysia } from 'elysia'

class MyError extends Error {
    status = 418

    constructor(public message: string) {
        super(message)
    }
}
```

Elysia will then use this status code when the error is thrown.

Otherwise you can also set the status code manually in the `onError` hook.

```typescript
import { Elysia } from 'elysia'

class MyError extends Error {
	constructor(public message: string) {
		super(message)
	}
}

new Elysia()
	.error({
		MyError
	})
	.onError(({ code, error, status }) => {
		switch (code) {
			case 'MyError':
				return status(418, error.message)
		}
	})
	.get('/:id', () => {
		throw new MyError('Hello Error')
	})
```

### Custom Error Response

You can also provide a custom `toResponse` method in your custom error class to return a custom response when the error is thrown.

```typescript
import { Elysia } from 'elysia'

class MyError extends Error {
	status = 418

	constructor(public message: string) {
		super(message)
	}

	toResponse() {
		return Response.json({
			error: this.message,
			code: this.status
		}, {
			status: 418
		})
	}
}
```

## To Throw or Return

Most error handling in Elysia can be done by throwing an error and will be handled in `onError`.

But for `status` it can be a little bit confusing, since it can be used both as a return value or throw an error.

It could either be **return** or **throw** based on your specific needs.

* If a `status` is **throw**, it will be caught by `onError` middleware.
* If a `status` is **return**, it will be **NOT** caught by `onError` middleware.

See the following code:

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
    .onError(({ code, error, path }) => {
        if (code === 418) return 'caught'
    })
    .get('/throw', ({ status }) => {
        // This will be caught by onError
        throw status(418)
    })
    .get('/return', ({ status }) => {
        // This will NOT be caught by onError
        return status(418)
    })
```

Here we use `status(418)` which is the "I'm a teapot" status code. You can also use the string name directly: `status("I'm a teapot")`. See Status for more on using status codes.

---


---

---
url: 'https://elysiajs.com/patterns/extends-context.md'
---

# Extend context&#x20;

Elysia provides a minimal Context by default, allowing us to extend Context for our specific need using state, decorate, derive, and resolve.

Elysia allows us to extend Context for various use cases like:

* extracting user ID as variable
* injecting a common repository pattern
* adding a database connection

We may extend Elysia's context by using the following APIs to customize the Context:

* [state](#state) - a global mutable state
* [decorate](#decorate) - additional property assigned to **Context**
* [derive](#derive) / [resolve](#resolve) - create a new value from existing property

### When to extend context

You should only extend context when:

* A property is a global mutable state, and shared across multiple routes using [state](#state)
* If a property is associated with a request or response using [decorate](#decorate)
* A property is derived from an existing property using [derive](#derive) / [resolve](#resolve)

Otherwise, we recommend defining a value or function separately than extending the context.

::: tip
It's recommended to assign properties related to request and response, or frequently used functions to Context for separation of concerns.
:::

## State

**State** is a global mutable object or state shared across the Elysia app.

Once **state** is called, value will be added to **store** property **once at call time**, and can be used in handler.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .state('version', 1)
    .get('/a', ({ store: { version } }) => version)
                // ^?
    .get('/b', ({ store }) => store)
    .get('/c', () => 'still ok')
    .listen(3000)
```

### When to use

* When you need to share a primitive mutable value across multiple routes
* If you want to use a non-primitive or a `wrapper` value or class that mutate an internal state, use [decorate](#decorate) instead.

### Key takeaway

* **store** is a representation of a single-source-of-truth global mutable object for the entire Elysia app.
* **state** is a function to assign an initial value to **store**, which could be mutated later.
* Make sure to assign a value before using it in a handler.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

new Elysia()
    // ❌ TypeError: counter doesn't exist in store
    .get('/error', ({ store }) => store.counter)
    .state('counter', 0)
    // ✅ Because we assigned a counter before, we can now access it
    .get('/', ({ store }) => store.counter)
```

::: tip
Beware that we cannot use a state value before assign.

Elysia registers state values into the store automatically without explicit type or additional TypeScript generic needed.
:::

### Reference and value Gotcha

To mutate the state, it's recommended to use **reference** to mutate rather than using an actual value.

When accessing the property from JavaScript, if we define a primitive value from an object property as a new value, the reference is lost, the value is treated as new separate value instead.

For example:

```typescript
const store = {
    counter: 0
}

store.counter++
console.log(store.counter) // ✅ 1
```

We can use **store.counter** to access and mutate the property.

However, if we define a counter as a new value

```typescript
const store = {
    counter: 0
}

let counter = store.counter

counter++
console.log(store.counter) // ❌ 0
console.log(counter) // ✅ 1
```

Once a primitive value is redefined as a new variable, the reference **"link"** will be missing, causing unexpected behavior.

This can apply to `store`, as it's a global mutable object instead.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .state('counter', 0)
    // ✅ Using reference, value is shared
    .get('/', ({ store }) => store.counter++)
    // ❌ Creating a new variable on primitive value, the link is lost
    .get('/error', ({ store: { counter } }) => counter)
```

## Decorate

**decorate** assigns an additional property to **Context** directly **at call time**.

```typescript
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .decorate('logger', new Logger())
    // ✅ defined from the previous line
    .get('/', ({ logger }) => {
        logger.log('hi')

        return 'hi'
    })
```

### When to use

* A constant or readonly value object to **Context**
* Non-primitive value or class that may contain internal mutable state
* Additional functions, singletons, or immutable property to all handlers.

### Key takeaway

* Unlike **state**, decorated value **SHOULD NOT** be mutated although it's possible
* Make sure to assign a value before using it in a handler.

## Derive

###### ⚠️ Derive doesn't handle type integrity, you might want to use [resolve](#resolve) instead.

Retrieve values from existing properties in **Context** and assign new properties.

Derive assigns when request happens **at transform lifecycle** allowing us to "derive" (create new properties from existing properties).

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers }) => {
        const auth = headers['authorization']

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

Because **derive** is assigned once a new request starts, **derive** can access request properties like **headers**, **query**, **body** where **store**, and **decorate** can't.

### When to use

* Create a new property from existing properties in **Context** without validation or type checking
* When you need to access request properties like **headers**, **query**, **body** without validation

### Key takeaway

* Unlike **state** and **decorate** instead of assigning **at call time**, **derive** is assigned once a new request starts.
* **derive is called at transform, or before validation** occurs, Elysia cannot safely confirm the type of request property resulting in as **unknown**. If you want to assign a new value from typed request properties, you may want to use [resolve](#resolve) instead.

## Resolve

Similar as [derive](#derive) but ensure type integrity.

Resolve allow us to assign a new property to context.

Resolve is called at **beforeHandle** lifecycle or **after validation**, allowing us to **resolve** request properties safely.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		headers: t.Object({
			bearer: t.String({
				pattern: '^Bearer .+$'
			})
		})
	})
	.resolve(({ headers }) => {
		return {
			bearer: headers.bearer.slice(7)
		}
	})
	.get('/', ({ bearer }) => bearer)
```

### When to use

* Create a new property from existing properties in **Context** with type integrity (type checked)
* When you need to access request properties like **headers**, **query**, **body** with validation

### Key takeaway

* **resolve is called at beforeHandle, or after validation** happens. Elysia can safely confirm the type of request property resulting in as **typed**.

### Error from resolve/derive

As resolve and derive is based on **transform** and **beforeHandle** lifecycle, we can return an error from resolve and derive. If error is returned from **derive**, Elysia will return early exit and return the error as response.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers, status }) => {
        const auth = headers['authorization']

        if(!auth) return status(400)

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

## Pattern Advanced Concept

**state**, **decorate** offers a similar API pattern for assigning property to Context as the following:

* key-value
* object
* remap

Where **derive** can be only used with **remap** because it depends on existing value.

### key-value

We can use **state**, and **decorate** to assign a value using a key-value pattern.

```typescript
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .state('counter', 0)
    .decorate('logger', new Logger())
```

This pattern is great for readability for setting a single property.

### Object

Assigning multiple properties is better contained in an object for a single assignment.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .decorate({
        logger: new Logger(),
        trace: new Trace(),
        telemetry: new Telemetry()
    })
```

The object offers a less repetitive API for setting multiple values.

### Remap

Remap is a function reassignment.

Allowing us to create a new value from existing value like renaming or removing a property by providing a function and returning an entirely new object to reassign the value.

By providing a function, and returning an entirely new object to reassign the value.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

new Elysia()
    .state('counter', 0)
    .state('version', 1)
    .state(({ version, ...store }) => ({
        ...store,
        elysiaVersion: 1
    }))
    // ✅ Create from state remap
    .get('/elysia-version', ({ store }) => store.elysiaVersion)
    // ❌ Excluded from state remap
    .get('/version', ({ store }) => store.version)
```

It's a good idea to use state remap to create a new initial value from the existing value.

However, it's important to note that Elysia doesn't offer reactivity from this approach, as remap only assigns an initial value.

::: tip
Using remap, Elysia will treat a returned object as a new property, removing any property that is missing from the object.
:::

## Affix Advance Concept

To provide a smoother experience, some plugins might have a lot of property value which can be overwhelming to remap one-by-one.

The **Affix** function which consists of **prefix** and **suffix**, allowing us to remap all properties of an instance.

```ts
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const app = new Elysia()
    .use(setup)
    .prefix('decorator', 'setup')
    .get('/', ({ setupCarbon, ...rest }) => setupCarbon)
```

Allowing us to bulk remap a property of the plugin effortlessly, preventing the name collision of the plugin.

By default, **affix** will handle both runtime, type-level code automatically, remapping the property to camelCase as naming convention.

In some cases, we can also remap all properties of the plugin:

```ts
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const app = new Elysia()
    .use(setup)
    .prefix('all', 'setup') // [!code ++]
    .get('/', ({ setupCarbon, ...rest }) => setupCarbon)
```

---


---

---
url: 'https://elysiajs.com/tutorial/patterns/extends-context.md'
---

# Extends Context

Elysia provides a context with small utilities to help you get started.

You can extend Elysia's context with:

1. Decorate
2. State
3. Resolve
4. Derive

## Decorate

**Singleton**, and **immutable** properties that are shared across all requests.

```typescript
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .decorate('logger', new Logger())
    .get('/', ({ logger }) => {
        logger.log('hi')

        return 'hi'
    })
```

Decorated value it will be available in the context as a read-only property, see Decorate.

## State

A **mutable** reference that is shared across all requests.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.state('count', 0)
	.get('/', ({ store }) => {
		store.count++

		return store.count
	})
```

State will be available in **context.store** that is shared across every request, see State.

## Resolve / Derive

Decorate value is registered as a singleton.

While Resolve, and Derive allows you to abstract a context value **per request**.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.derive(({ headers: { authorization } }) => ({
		authorization
	}))
	.get('/', ({ authorization }) => authorization)
```

Any **returned value will be available in context** except status, which will be send to client directly, and abort the subsequent handlers.

Syntax for both resolve, derive is similar but they have different use cases.

Under the hood, both is a syntax sugar (with type safety) of a lifecycle:

* derive is based on transform
* resolve is based on before handle

Since derive is based on transform, which means that data isn't validated, and coerce/transform yet. It's better to use resolve if you need validated data.

## Scope

State, and Decorate are shared across all requests, and instances.

Resolve, and Derive are per request, and have an encapsulation scope (as they're based on life-cycle event).

If you want to use a resolved/derived value from a plugin, you would have to declare a Scope.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
	.derive(
		{ as: 'scoped' }, // [!code ++]
		({ headers: { authorization } }) => ({
			authorization
		})
	)

new Elysia()
	.use(plugin)
	.get('/', ({ authorization }) => authorization)
	.listen(3000)
```

## Assignment

Let's try to extend Elysia's context.

\<template #answer>

We can use resolve to extract age from query.

```typescript
import { Elysia, t } from 'elysia'

class Logger {
	log(info: string) {
		console.log(info)
	}
}

new Elysia()
	.decorate('logger', new Logger())
	.onRequest(({ request, logger }) => {
		logger.log(`Request to ${request.url}`)
	})
	.guard({
		query: t.Optional(
			t.Object({
				age: t.Number({ min: 15 })
			})
		)
	})
	.resolve(({ query: { age }, status }) => {
		if(!age) return status(401)

		return { age }
	})
	.get('/profile', ({ age }) => age)
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/patterns/fullstack-dev-server.md'
---

# Elysia with Bun Fullstack Dev Server

Bun 1.3 introduces a [Fullstack Dev Server](https://bun.com/docs/bundler/fullstack) with HMR support.

This allows us to directly use React without any bundler like Vite or Webpack.

You can use [this example](https://github.com/saltyaom/elysia-fullstack-example) to quickly try it out.

Otherwise, install it manually:

1. Install Elysia Static plugin

```ts
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysia/static'

new Elysia()
	.use(await staticPlugin()) // [!code ++]
	.listen(3000)
```

:::tip
Notice that we need to add `await` before `staticPlugin()` to enable Fullstack Dev Server.

This is required to setup the necessary HMR hooks.
:::

2. Create **public/index.html** and **index.tsx**

::: code-group

```html [public/index.html]
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Elysia React App</title>

		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="./index.tsx"></script>
	</body>
</html>
```

```tsx [public/index.tsx]
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
	const [count, setCount] = useState(0)
	const increase = () => setCount((c) => c + 1)

	return (
		<main>
			<h2>{count}</h2>
			<button onClick={increase}>
				Increase
			</button>
		</main>
	)
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

:::

3. Enable JSX in tsconfig.json

```json
{
  "compilerOptions": {
	"jsx": "react-jsx" // [!code ++]
  }
}
```

4. Navigate to `http://localhost:3000/public` and see the result.

This allows us to develop frontend and backend in a single project without any bundler.

We have verified that Fullstack Dev Server works with HMR, [Tailwind](#tailwind), Tanstack Query, [Eden Treaty](/eden/overview), and path alias.

## Custom prefix path

We can change the default `/public` prefix by passing the `prefix` option to `staticPlugin`.

```ts
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysia/static'

new Elysia()
  	.use(
  		await staticPlugin({
  			prefix: '/' // [!code ++]
   		})
   )
  .listen(3000)
```

This would serve the static files at `/` instead of `/public`.

See [static plugin](/plugins/static) for more configuration options.

## Tailwind CSS

We can also use Tailwind CSS with Bun Fullstack Dev Server.

1. Install dependencies

```bash
bun add tailwindcss@4
bun add -d bun-plugin-tailwind
```

2. Create `bunfig.toml` with the following content:

```toml
[serve.static]
plugins = ["bun-plugin-tailwind"]
```

3. Create a CSS file with Tailwind directives

::: code-group

```css [public/global.css]
@tailwind base;
```

:::

4. Add Tailwind to your HTML or alternatively JavaScript/TypeScript file

::: code-group

```html [public/index.html]
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>Elysia React App</title>

		<meta name="viewport" content="width=device-width, initial-scale=1.0">
  		<link rel="stylesheet" href="tailwindcss"> <!-- [!code ++] -->
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="./index.tsx"></script>
	</body>
</html>
```

```tsx [public/index.tsx]
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import './global.css' // [!code ++]

function App() {
	const [count, setCount] = useState(0)
	const increase = () => setCount((c) => c + 1)

	return (
		<main>
			<h2>{count}</h2>
			<button onClick={increase}>
				Increase
			</button>
		</main>
	)
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

:::

## Path Alias

We can also use path alias in Bun Fullstack Dev Server.

1. Add `paths` in `tsconfig.json`

```json
{
  "compilerOptions": {
	"baseUrl": ".", // [!code ++]
	"paths": { // [!code ++]
	  "@public/*": ["public/*"] // [!code ++]
	} // [!code ++]
  }
}
```

2. Use the alias in your code

```tsx
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import '@public/global.css' // [!code ++]

function App() {
	const [count, setCount] = useState(0)
	const increase = () => setCount((c) => c + 1)

	return (
		<main>
			<h2>{count}</h2>
			<button onClick={increase}>
				Increase
			</button>
		</main>
	)
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
```

This will work out of the box without any additional configuration.

## Build for Production

You can build fullstack server as if it's a normal Elysia server.

```bash
bun build --compile --target bun --outfile server src/index.ts
```

This would create a single executable file **server**.

When running the **server** executable, make sure to include the **public** folder in similar to the development environment.

See [Deploy to Production](/patterns/deploy) for more information.

---


---

---
url: 'https://elysiajs.com/internal/jit-compiler.md'
---

# JIT "Compiler"&#x20;

Elysia is fast and will likely remain *one of the fastest web frameworks for JavaScript* only limited by the speed of the underlying JavaScript engine.

Elysia speed is not only acheived by optimization for specific runtime eg. Bun native features like `Bun.serve.routes`. But also the way Elysia handles route registration and request handling.

Elysia has an **JIT "compiler"** embedded within its core since [Elysia 0.4](/blog/elysia-04) (30 Mar 2023) at (*src/compose.ts*) using `new Function(...)` or also known as `eval(...)`.

The *"compiler"* is not a traditional compiler that translates code from one language to another. Instead, it dynamically generates optimized code for handling requests based on the defined routes and middleware. *(Which is why we put compiler in quotes.)*

When request is made to Elysia application for the first time for each route, Elysia dynamically generates optimized code specifically tailored to handle that route efficiently on the fly avoiding unnecessary overhead as much as possible.

## Static Code Analysis (Sucrose)

*"Sucrose"* is the nick name for the static code analysis module living alongside Elysia's JIT "compiler" at (*src/sucrose.ts*).

To generate this optimized code, the compiler needs a deep understanding of how the route handlers interact with the request and what parts of the request are actually needed.

That's Sucrose's job.

Sucrose read the code without executing it by using `Function.toString()` then perform our own custom pattern-matching to extract useful information about what parts of the request are actually needed by the route handler.

Let's take a look at a simple example:

```ts
import { Elysia } from 'elysia'

const app = new Elysia()
  .patch('/user/:id', ({ params }) => {
	return { id: req.params.id }
  })
```

In this code, we can clearly see that this handler only need a `params` to be parsed.

Sucrose looks at code and tells the *"compiler"* to only parse **params** and skip parsing other parts of the request like **body**, **query**, **headers** entirely as it's not need.

JIT "compiler" then generates code like this:

::: code-group

```ts [Elysia]
function tailoredHandler(request) {
	const context = {
		request,
		params: parseParams(request.url)
	}
	
	return routeHandler(context)
}
```

:::

This approach is entirely different from traditional web frameworks that parse everything by default with a **centralHandler** regardless of whether it's needed or not which looks something like this:

::: code-group

```ts [Traditional Framework]
function centralHandler(request) {
	const context = {
		request,
		body: await parseBody(request),
		query: parseQuery(request.url),
		headers: parseHeader(request.headers),
		// and other stuff
	}

	return routeHandler(context)
}
```

:::

This make Elysia extremely fast as it only does the minimum work required for each route.

### Why not acorn, esprima, or other traditional static analysis tools?

Traditional tools are designed for general-purpose static code analysis and may introduce unnecessary overhead for Elysia's specific use case.

For our purpose, our parser only need to understand a subset of JavaScript syntax specifically *function*. When we think about it, it's only a small part of JavaScript language that is already *parsed and formatted by JavaScript Engine*.

So instead of pulling a general purpose tool, we treat this part as a DSL (that looks like JavaScript) and build specifically for just this part for maximum performance and low-memory usage (compared to AST-based tools).

## Compiler Optimizations

Similar to traditional compilers, Elysia's JIT "compiler" also performs various optimizations to further enhance the performance of the generated code like optimizing control flow based on the specific usage patterns of the route handlers, constant fold, using direct access to properties instead of iterating through objects and arrays when possible, and more.

These optimizations and much smaller optimizations help to reduce the overhead of request handling and improve the overall speed of the application.

### Example: `mapResponse`, `mapCompactResponse`

This is one of the smaller optimizations but can have a significant impact on performance in high-throughput scenarios.

Elysia has two special optimizations for response mapping functions: `mapResponse` and `mapCompactResponse`.

Constructing a `new Response` object can be relatively expensive but for `new Response` without any additional `status` or `headers` is cheaper than constructing a full `Response` object with custom status codes or headers.

When `set` or `status` is not used, Elysia will use `mapCompactResponse` to map a value directly to a `Response` object without the overhead of additional properties.

## Platform Specific Optimization

Elysia is originally made specifically for Bun but also works on [Node.js](/integrations/node), [Deno](/integrations/deno), [Cloudflare Workers](/integrations/cloudflare-workers) and more.

There are a big difference between being **compatible** and being **optimized** for a specific platform.

Elysia can take advantage of platform-specific features and optimizations to further enhance performance, for example `Bun.serve.routes` is used when running on Bun to leverage Bun's native routing capabilities which is written in Zig for maximum performance.

Using the **inline response** for maximum performance for static responses which made Elysia the rank at #14 on [TechEmpower Framework Benchmarks](https://www.techempower.com/benchmarks/#section=data-r23\&hw=ph\&test=plaintext) among the world's fastest backend frameworks.

There are more various smaller optimization like

* using **Bun.websocket** when running on Bun for optimal WebSocket performance
* `Elysia.file` conditionally use `Bun.file` when available for faster file handling
* using `Headers.toJSON()` when running on Bun to reduce overhead when dealing headers

These small optimizations add up to make Elysia extremely fast on its target platforms.

## Overhead of JIT "Compiler"

Elysia JIT *"compiler"* is designed for peak performance in mind. However, the dynamic code generation process does introduce some overhead during the initial request handling for each route.

### Initial Request Overhead

The first time a request is made to a specific route, Elysia needs to analyze the route handler code and generate the optimized code.

This process is relatively **very fast** and usually takes < 0.005ms per route in most cases on a modern CPU and happend only **once per route**. But it is still an overhead.

This process can be moved to the startup phase by settings `precompile: true` to Elysia constructor to eliminate this overhead during the first request in exchange for a slower startup time.

### Memory Usage

The dynamically generated code is stored in memory for subsequent requests. This can lead to increased memory usage, especially for applications with a large number of routes but is relatively low.

### Bigger Bundle Size

The JIT "compiler" and Sucrose module add some additional code to the Elysia core library, which can increase the overall bundle size of the application. However, the performance benefits often outweigh the cost of a slightly larger bundle size.

### Maintainability

The use of dynamic code generation can make the codebase more complex and harder to maintain. Maintainers need to have a good understanding of how the JIT "compiler" works to effectively use and troubleshoot the framework.

### Security Considerations

Using `new Function(...)` or `eval(...)` can introduce security risks **if not handled properly**.

But that's only "if not handled properly" part.

Elysia takes precautions to ensure that the generated code is safe and does not expose vulnerabilities by make sure that only trusted code is executed. The **input is almost never user-controlled** and produced by Elysia (sucrose) itself.

## Libraries that `eval`

Elysia is not the only framework that use `new Function` and `eval`.

[ajv](https://www.npmjs.com/package/ajv) and [TypeBox](https://www.npmjs.com/package/@sinclair/typebox) are an **industry standard** validation library since the early days of Node.js with 895m and 332m downloads/months respectively.

Both of these libraries are using `eval` internally to optimize the performance of their validation code making it [faster its competitors](https://moltar.github.io/typescript-runtime-type-benchmarks/).

Elysia basically expands this beyond input validation into a whole backend framework for maximum performance. In fact, Elysia also use TypeBox for input validation, so every corner of the libraries is entirely runs on `eval`.

## Opts out

Elysia JIT compilation is enabled by default but can be opt out entirely by running in a dynamic mode:

```ts
new Elysia({ aot: false })
```

Although, it's not recommended because there are some features missing without JIT compilation, eg. `trace`.

## Afterword

With all of these *overkills* optimization, Elysia manages to have *almost* zero overhead and the only limiting factor is the speed of the underlying JavaScript engine itself.

Despite the maintainability challenges, the trade-offs made by Elysia's JIT "compiler" are worth it for the significant performance gains it provides and aligns with our goal to provide a fast foundation for building high-performance server.

This can also be seen as a differentiating factor for Elysia compared to other web frameworks that may not prioritize performance to the same extent because it's extremely hard to do properly.

We also has a [short 6-pages research paper we published to ACM Digital Library](https://dl.acm.org/doi/10.1145/3605098.3636068) about Elysia's JIT "compiler" and its performance optimizations.

For over years of Elysia existence, **we almost never saw a valid benchmark where Elysia is not the fastest framework** available on a platform except using a FFI/native binding (eg. Rust, Go, Zig) with a valid benchmark.

Which is still relatively a very hard to beat because of serialization/deserialization overhead. There are some cases like uWebSocket which is written in C++ with JavaScript binding, making it extremely fast that outperform Elysia.

But despite all odds, we think it's **worth it**.

---


---

---
url: 'https://elysiajs.com/tutorial/patterns/macro.md'
---

# Macro

Reusable route options.

Imagine we have an authentication check like this:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/user', ({ body }) => body, {
		cookie: t.Object({
			session: t.String()
		}),
		beforeHandle({ cookie: { session } }) {
			if(!session.value) throw 'Unauthorized'
		}
	})
	.listen(3000)
```

If we have multiple routes that require authentication, we have to repeat the same options over and over again.

Instead, we can use a macro to reuse route options:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.macro('auth', {
		cookie: t.Object({
			session: t.String()
		}),
		// psuedo auth check
		beforeHandle({ cookie: { session }, status }) {
			if(!session.value) return status(401)
		}
	})
	.post('/user', ({ body }) => body, {
		auth: true // [!code ++]
	})
	.listen(3000)
```

**auth** will then inline both **cookie**, and **beforeHandle** to the route.

Simply put, Macro **is a reusable route option**, similar to function but as a route option with **type soundness**.

## Assignment

Let's define a macro to check if a body is a Fibonacci number:

```typescript
function isFibonacci(n: number) {
	let a = 0, b = 1
	while(b < n) [a, b] = [b, a + b]
	return b === n || n === 0
}
```

\<template #answer>

1. To enforce type, we can define a `body` property in the macro.
2. To short-circuit the request, we can use `status` function to return early.

```typescript
import { Elysia, t } from 'elysia'

function isPerfectSquare(x: number) {
    const s = Math.floor(Math.sqrt(x))
    return s * s === x
}

function isFibonacci(n: number) {
    if (n < 0) return false

    return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4)
}

new Elysia()
    .macro('isFibonacci', {
		body: t.Number(),
        beforeHandle({ body, status }) {
            if(!isFibonacci(body)) return status(418)
        }
    })
	.post('/', ({ body }) => body, {
		isFibonacci: true
	})
    .listen(3000)
```

---


---

---
url: 'https://elysiajs.com/patterns/macro.md'
---

# Macro&#x20;

Macro is similar to a function that has control over the lifecycle event, schema, and context with full type safety.

Once defined, it will be available in the hook and can be activated by adding the property.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })
    .macro({
        hi: (word: string) => ({
            beforeHandle() {
                console.log(word)
            }
        })
    })

const app = new Elysia()
    .use(plugin)
    .get('/', () => 'hi', {
        hi: 'Elysia' // [!code ++]
    })
```

Accessing the path should log **"Elysia"** as a result.

## Property shorthand

Starting from Elysia 1.2.10, each property in the macro object can be a function or an object.

If the property is an object, it will be translated to a function that accepts a boolean parameter and will be executed if the parameter is true.

```typescript
import { Elysia } from 'elysia'

export const auth = new Elysia()
    .macro({
    	// This property shorthand
    	isAuth: { // [!code ++]
      		resolve: () => ({ // [!code ++]
      			user: 'saltyaom' // [!code ++]
      		}) // [!code ++]
        }, // [!code ++]
        // is equivalent to
        isAuth(enabled: boolean) { // [!code --]
        	if(!enabled) return // [!code --]
// [!code --]

        	return { // [!code --]
				resolve() { // [!code --]
					return { // [!code --]
						user // [!code --]
					} // [!code --]
				} // [!code --]
         	} // [!code --]
        } // [!code --]
    })
```

## Error handling

You can return an error HTTP status by returning a `status`.

```ts
import { Elysia, status } from 'elysia' // [!code ++]

new Elysia()
	.macro({
		auth: {
			resolve({ headers }) {
				if(!headers.authorization)
					return status(401, 'Unauthorized') // [!code ++]
		
				return {
					user: 'SaltyAom'
				}
			}
		}
	})
	.get('/', ({ user }) => `Hello ${user}`, {
	            // ^?
		auth: true
	})
```

It's recommended that you `return status` instead of `throw new Error()` to annotate correct HTTP status code.

If you throw an error instead, Elysia will convert it to `500 Internal Server Error` by default.

It's also recommended to use `return status` instead of `throw status` to ensure type inference for both [Eden](/eden/overview) and [OpenAPI Type Gen](/patterns/openapi#openapi-from-types).

## Resolve

You can add a property to the context by returning an object with a [**resolve**](/essential/life-cycle.html#resolve) function.

```ts twoslash
import { Elysia } from 'elysia'

new Elysia()
	.macro({
		user: (enabled: true) => ({
			resolve: () => ({
				user: 'Pardofelis'
			})
		})
	})
	.get('/', ({ user }) => user, {
                          // ^?
		user: true
	})
```

In the example above, we add a new property **user** to the context by returning an object with a **resolve** function.

Here's an example where macro resolve could be useful:

* perform authentication and add the user to the context
* run an additional database query and add data to the context
* add a new property to the context

### Macro extension with resolve

Due to TypeScript's limitation, a macro that extends other macro cannot infer type into **resolve** function.

We provide a named single macro as a workaround to this limitation.

```typescript twoslash
import { Elysia, t } from 'elysia'
new Elysia()
	.macro('user', {
		resolve: () => ({
			user: 'lilith' as const
		})
	})
	.macro('user2', {
		user: true,
		resolve: ({ user }) => {
		//           ^?
		}
	})
```

## Schema

You can define a custom schema for your macro to ensure that the route using the macro is passing the correct types.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.macro({
		withFriends: {
			body: t.Object({
				friends: t.Tuple([t.Literal('Fouco'), t.Literal('Sartre')])
			})
		}
	})
	.post('/', ({ body }) => body.friends, {
//                                  ^?

		body: t.Object({
			name: t.Literal('Lilith')
		}),
		withFriends: true
	})
```

Macro with schema will automatically validate and infer types to ensure type safety, and it can co-exist with existing schema as well.

You can also stack multiple schemas from different macros, or even from the Standard Validator, and it will work together seamlessly.

### Schema with lifecycle in the same macro

Similar to [Macro extension with resolve](#macro-extension-with-resolve),

Macro schema also supports type inference for **lifecycle within the same macro** **BUT** only with a named single macro due to TypeScript limitation.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.macro('withFriends', {
		body: t.Object({
			friends: t.Tuple([t.Literal('Fouco'), t.Literal('Sartre')])
		}),
		beforeHandle({ body: { friends } }) {
//                             ^?
		}
	})
```

If you want to use lifecycle type inference within the same macro, you might want to use a named single macro instead of multiple stacked macros

> Not to be confused with using macro schema to infer type into the route's lifecycle event. That works just fine. This limitation only applies to using lifecycle within the same macro.

## Extension

Macro can extend other macros, allowing you to build upon an existing one.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.macro({
		sartre: {
			body: t.Object({
				sartre: t.Literal('Sartre')
			})
		},
		fouco: {
			body: t.Object({
				fouco: t.Literal('Fouco')
			})
		},
		lilith: {
			fouco: true,
			sartre: true,
			body: t.Object({
				lilith: t.Literal('Lilith')
			})
		}
	})
	.post('/', ({ body }) => body, {
//                            ^?
		lilith: true
	})



// ---cut-after---
//
```

This allows you to build upon existing macro, and add more functionality to it.

## Deduplication

Macro will automatically deduplicate the lifecycle event, ensuring that each lifecycle event is only executed once.

By default, Elysia will use the property value as the seed, but you can override it by providing a custom seed.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.macro({
		sartre: (role: string) => ({
			seed: role, // [!code ++]
			body: t.Object({
				sartre: t.Literal('Sartre')
			})
		})
	})
```

However, if you ever accidentally create a circular dependency, Elysia has a limited stack of 16 to prevent an infinite loop in both runtime and type inference.

If the route already has OpenAPI detail, it will merge the details together but prefers the route detail over macro detail.

---


---

---
url: 'https://elysiajs.com/tutorial/features/mount.md'
---

# Mount

Elysia provides a Elysia.mount to interoperate between backend frameworks that is built on Web Standard like Hono, H3, etc.

```typescript
import { Elysia, t } from 'elysia'
import { Hono } from 'hono'

const hono = new Hono()
	.get('/', (c) => c.text('Hello from Hono'))

new Elysia()
	.get('/', 'Hello from Elysia')
	.mount('/hono', hono.fetch)
	.listen(3000)
```

This allows us to gradually migrate our application to Elysia, or use multiple frameworks in a single application.

## Assignment

Let's use the preview to **GET '/hono'** to see if our Hono route is working.

Try to modify the code and see how it changes!

---


---

---
url: 'https://elysiajs.com/patterns/mount.md'
---

# Mount&#x20;

[WinterTC](https://wintertc.org/) is a standard for building HTTP Server behind Cloudflare, Deno, Vercel, and others.

It allows web servers to run interoperably across runtimes by using [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request), and [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response).

Elysia is WinterTC compliant. Optimized to run on Bun, but also supports other runtimes if possible.

This allows any WinterTC-compliant framework or code to run together, allowing frameworks like Elysia, Hono, Remix, Itty Router to run together in a simple function.

## Mount

To use **.mount**, [simply pass a `fetch` function](https://twitter.com/saltyAom/status/1684786233594290176):

```ts
import { Elysia } from 'elysia'
import { Hono } from 'hono'

const hono = new Hono()
	.get('/', (c) => c.text('Hello from Hono!'))

const app = new Elysia()
    .get('/', () => 'Hello from Elysia')
    .mount('/hono', hono.fetch)
```

Any framework that uses `Request` and `Response` can interoperate with Elysia like

* Hono
* Nitro
* H3
* [Nextjs API Route](/integrations/nextjs)
* [Nuxt API Route](/integrations/nuxt)
* [SvelteKit API Route](/integrations/sveltekit)

And these can be use on multiple runtimes like:

* Bun
* Deno
* Vercel Edge Runtime
* Cloudflare Worker
* Netlify Edge Function

If the framework supports the **.mount** function, you can also mount Elysia inside another framework:

```ts
import { Elysia } from 'elysia'
import { Hono } from 'hono'

const elysia = new Elysia()
    .get('/', () => 'Hello from Elysia inside Hono inside Elysia')

const hono = new Hono()
    .get('/', (c) => c.text('Hello from Hono!'))
    .mount('/elysia', elysia.fetch)

const main = new Elysia()
    .get('/', () => 'Hello from Elysia')
    .mount('/hono', hono.fetch)
    .listen(3000)
```

This makes the possibility of an interoperable framework and runtime a reality.

---


---

---
url: 'https://elysiajs.com/tutorial/features/openapi.md'
---

# OpenAPI

Elysia is built around OpenAPI, and supports OpenAPI documentation out of the box.

We can use OpenAPI plugin to show an API documentation.

```typescript
import { Elysia, t } from 'elysia'
import { openapi } from '@elysia/openapi' // [!code ++]

new Elysia()
	.use(openapi()) // [!code ++]
	.post(
		'/',
		({ body }) => body,
		{
			body: t.Object({
				age: t.Number()
			})
		}
	)
	.listen(3000)
```

Once added, we can access our API documentation at **/openapi**.

## Detail

We can provide API documentation with a `detail` field which follows OpenAPI 3.0 specification (with auto-completion):

```typescript
import { Elysia, t } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
	.use(openapi())
	.post(
		'/',
		({ body }) => body,
		{
			body: t.Object({
				age: t.Number()
			}),
			detail: { // [!code ++]
				summary: 'Create a user', // [!code ++]
				description: 'Create a user with age', // [!code ++]
				tags: ['User'], // [!code ++]
			} // [!code ++]
		}
	)
	.listen(3000)
```

## Reference Model

We can also define reusable schema with Reference Model:

```typescript
import { Elysia, t } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
	.use(openapi())
	.model({
		age: t.Object({ // [!code ++]
			age: t.Number() // [!code ++]
		}) // [!code ++]
	})
	.post(
		'/',
		({ body }) => body,
		{
			age: t.Object({ // [!code --]
				age: t.Number() // [!code --]
			}), // [!code --]
			body: 'age',  // [!code ++]
			detail: {
				summary: 'Create a user',
				description: 'Create a user with age',
				tags: ['User'],
			}
		}
	)
	.listen(3000)
```

When we defined a reference model, it will be shown in the **Components** section of the OpenAPI documentation.

## Type Gen

OpenAPI Type Gen can document your API **without manual annotation** infers directly from TypeScript type. No Zod, TypeBox, manual interface declaraiont, etc.

**This feature is unique to Elysia**, and is not available in other JavaScript frameworks.

For example, if you use Drizzle ORM or Prisma, Elysia can infer the schema directly from the query.

![Drizzle](/blog/openapi-type-gen/drizzle-typegen.webp)

> Returning Drizzle query from Elysia route handler will be automatically inferred into OpenAPI schema.

To use OpenAPI Type Gen, simply apply the `fromTypes` plugin before `openapi` plugin.

```typescript
import { Elysia } from 'elysia'

import { openapi, fromTypes } from '@elysia/openapi' // [!code ++]

new Elysia()
	.use(openapi({
		references: fromTypes() // [!code ++]
	}))
	.get('/', { hello: 'world' })
	.listen(3000)
```

### Browser Environment

Unfortunately, this feature requires the **fs** module to read your source code, and is not available in this web playground. As Elysia is running directly in your browser (not a separated server).

You can try this feature locally with Type Gen Example repository:

```bash
git clone https://github.com/SaltyAom/elysia-typegen-example && \
cd elysia-typegen-example && \
bun install && \
bun run dev
```

## Assignment

Let's use the preview to **GET '/openapi'** and see how our API documentation looks.

This API documentation is reflected from your code.

Try to modify the code and see how the documentation changes!

---


---

---
url: 'https://elysiajs.com/patterns/openapi.md'
---

# OpenAPI&#x20;

Elysia has first-class support and follows OpenAPI schema by default.

Elysia can automatically generate an API documentation page by using an OpenAPI plugin.

To generate the Swagger page, install the plugin:

```bash
bun add @elysia/openapi
```

And register the plugin to the server:

```typescript
import { Elysia } from 'elysia'
import { openapi } from '@elysia/openapi' // [!code ++]

new Elysia()
	.use(openapi()) // [!code ++]
```

Accessing `/openapi` would show you a Scalar UI with the generated endpoint documentation from the Elysia server.

For OpenAPI plugin configuration, see the [OpenAPI plugin page](/plugins/openapi).

## OpenAPI from types

> This is optional, but we highly recommend it for much better documentation experience.

By default, Elysia relies on runtime schema to generate OpenAPI documentation.

However, you can also generate OpenAPI documentation from types by using a generator from OpenAPI plugin as follows:

1. Specify your Elysia root file (if not specified, Elysia will use `src/index.ts`), and export an instance

2. Import a generator and provide a **file path from project root** to type generator

```ts
import { Elysia, t } from 'elysia'
import { openapi, fromTypes } from '@elysia/openapi' // [!code ++]

export const app = new Elysia() // [!code ++]
    .use(
        openapi({
            references: fromTypes() // [!code ++]
        })
    )
    .get('/', { test: 'hello' as const })
    .post('/json', ({ body, status }) => body, {
        body: t.Object({
            hello: t.String()
        })
    })
    .listen(3000)
```

Elysia will attempt to generate OpenAPI documentation by reading the type of an exported instance to generate OpenAPI documentation.

This will co-exists with the runtime schema, and the runtime schema will take precedence over the type definition.

### Production

In production environment, it's likely that you might compile Elysia to a [single executable with Bun](/patterns/deploy.html) or [bundle into a single JavaScript file](https://elysiajs.com/patterns/deploy.html#compile-to-javascript).

It's recommended that you should pre-generate the declaration file (**.d.ts**) to provide type declaration to the generator.

```ts
import { Elysia, t } from 'elysia'
import { openapi, fromTypes } from '@elysia/openapi'

const app = new Elysia()
    .use(
        openapi({
            references: fromTypes(
            	process.env.NODE_ENV === 'production' // [!code ++]
             		? 'dist/index.d.ts' // [!code ++]
               		: 'src/index.ts' // [!code ++]
            )
        })
    )
```

### Caveat: Explicit types

OpenAPI Type Gen works best when using implicit types.

Sometimes, explicit types may cause an issue for the generator being unable to resolve properly.

In this case, you can use `Prettify` to inline the type:

```ts
import { Elysia, t } from 'elysia'

// Your custom type
interface User {
	id: number
	name: string
}

// Type helper to inline the type
type Prettify<T> = { // [!code ++]
	[K in keyof T]: T[K] // [!code ++]
} & {} // [!code ++]

// Add Prettify to inline the type
function getUser(): Prettify<User> { // [!code ++]
	// Your logic to get user // [!code ++]
} // [!code ++]
```

This should fix when type not showing up.

### Caveat: Root path

As it's unreliable to guess to root of the project, it's recommended to provide the path to the project root to allow generator to run correctly, especially when using monorepo.

```ts
import { Elysia, t } from 'elysia'
import { openapi, fromTypes } from '@elysia/openapi'

export const app = new Elysia()
    .use(
        openapi({
            references: fromTypes('src/index.ts', {
            	projectRoot: path.join('..', import.meta.dir) // [!code ++]
            })
        })
    )
    .get('/', { test: 'hello' as const })
    .post('/json', ({ body, status }) => body, {
        body: t.Object({
            hello: t.String()
        })
    })
    .listen(3000)
```

### Custom tsconfig.json

If you have multiple `tsconfig.json` files, it's important that you must specify a correct `tsconfig.json` file to be used for type generation.

```ts
import { Elysia, t } from 'elysia'
import { openapi, fromTypes } from '@elysia/openapi'

export const app = new Elysia()
    .use(
        openapi({
            references: fromTypes('src/index.ts', {
            	// This is reference from root of the project
            	tsconfigPath: 'tsconfig.dts.json' // [!code ++]
            })
        })
    )
    .get('/', { test: 'hello' as const })
    .post('/json', ({ body, status }) => body, {
        body: t.Object({
            hello: t.String()
        })
    })
    .listen(3000)
```

## Standard Schema with OpenAPI

Elysia will try to use a native method from each schema to convert to OpenAPI schema.

However, if the schema doesn't provide a native method, you can provide a custom schema to OpenAPI by providing a `mapJsonSchema` as follows:

\<Tab
id="schema-openapi"
noTitle
:names="\['Zod', 'Valibot', 'Effect']"
:tabs="\['zod', 'valibot', 'effect']"

>

### Zod OpenAPI

As Zod doesn't have a `toJSONSchema` method on the schema, we need to provide a custom mapper to convert Zod schema to OpenAPI schema.

::: code-group

```typescript [Zod 4]
import openapi from '@elysia/openapi'
import * as z from 'zod'

openapi({
	mapJsonSchema: {
		zod: z.toJSONSchema
	}
})
```

```typescript [Zod 3]
import openapi from '@elysia/openapi'
import { zodToJsonSchema } from 'zod-to-json-schema'

openapi({
	mapJsonSchema: {
		zod: zodToJsonSchema
	}
})
```

:::

### Valibot OpenAPI

Valibot use a separate package (`@valibot/to-json-schema`) to convert Valibot schema to JSON Schema.

```typescript
import openapi from '@elysia/openapi'
import { toJsonSchema } from '@valibot/to-json-schema'

openapi({
	mapJsonSchema: {
		valibot: toJsonSchema
	}
})
```

### Effect OpenAPI

As Effect doesn't have a `toJSONSchema` method on the schema, we need to provide a custom mapper to convert Effect schema to OpenAPI schema.

```typescript
import openapi from '@elysia/openapi'
import { JSONSchema } from 'effect'

openapi({
 	mapJsonSchema: {
   		effect: JSONSchema.make
 	}
})
```

## Describing routes

We can add route information by providing a schema type.

However, sometimes defining only a type does not make it clear what the route might do. You can use [detail](/plugins/openapi#detail) fields to explicitly describe the route.

```typescript
import { Elysia, t } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
	.use(openapi())
	.post(
		'/sign-in',
		({ body }) => body, {
    		body: t.Object(
      		{
	            username: t.String(),
	            password: t.String({
	                minLength: 8,
	                description: 'User password (at least 8 characters)' // [!code ++]
	            })
	        },
	        { // [!code ++]
	            description: 'Expected a username and password' // [!code ++]
	        } // [!code ++]
	    ),
	    detail: { // [!code ++]
	        summary: 'Sign in the user', // [!code ++]
	        tags: ['authentication'] // [!code ++]
	    } // [!code ++]
	})
```

The detail fields follows an OpenAPI V3 definition with auto-completion and type-safety by default.

Detail is then passed to OpenAPI to put the description to OpenAPI route.

## Response headers

We can add response headers by wrapping a schema with `withHeader`:

```typescript
import { Elysia, t } from 'elysia'
import { openapi, withHeader } from '@elysia/openapi' // [!code ++]

new Elysia()
	.use(openapi())
	.get(
		'/thing',
		({ body, set }) => {
			set.headers['x-powered-by'] = 'Elysia'

			return body
		},
		{
		    response: withHeader( // [!code ++]
				t.Literal('Hi'), // [!code ++]
				{ // [!code ++]
					'x-powered-by': t.Literal('Elysia') // [!code ++]
				} // [!code ++]
			) // [!code ++]
		}
	)
```

Note that `withHeader` is an annotation only, and does not enforce or validate the actual response headers. You need to set the headers manually.

### Hide route

You can hide the route from the Swagger page by setting `detail.hide` to `true`

```typescript
import { Elysia, t } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
	.use(openapi())
	.post(
		'/sign-in',
		({ body }) => body,
		{
		    body: t.Object(
		        {
		            username: t.String(),
		            password: t.String()
		        },
		        {
		            description: 'Expected a username and password'
		        }
		    ),
		    detail: { // [!code ++]
		        hide: true // [!code ++]
		    } // [!code ++]
		}
	)
```

## Tags

Elysia can separate the endpoints into groups by using the Swagger tag system

Firstly define the available tags in the Swagger config object

```typescript
new Elysia().use(
    openapi({
        documentation: {
            tags: [
                { name: 'App', description: 'General endpoints' },
                { name: 'Auth', description: 'Authentication endpoints' }
            ]
        }
    })
)
```

Then use the detail property of the endpoint configuration section to assign that endpoint to the group

```typescript
new Elysia()
    .get('/', () => 'Hello Elysia', {
        detail: {
            tags: ['App']
        }
    })
    .group('/auth', (app) =>
        app.post(
            '/sign-up',
            ({ body }) =>
                db.user.create({
                    data: body,
                    select: {
                        id: true,
                        username: true
                    }
                }),
            {
                detail: {
                    tags: ['Auth']
                }
            }
        )
    )
```

This will produce a Swagger page as follows


### Tags group

Elysia may accept tags to add an entire instance or group of routes to a specific tag.

```typescript
import { Elysia, t } from 'elysia'

new Elysia({
    tags: ['user']
})
    .get('/user', 'user')
    .get('/admin', 'admin')
```

## Models

By using [reference model](/essential/validation.html#reference-model), Elysia will handle the schema generation automatically.

By separating models into a dedicated section and linked by reference.

```typescript
new Elysia()
    .model({
        User: t.Object({
            id: t.Number(),
            username: t.String()
        })
    })
    .get('/user', () => ({ id: 1, username: 'saltyaom' }), {
        response: {
            200: 'User'
        },
        detail: {
            tags: ['User']
        }
    })
```

## Guard

Alternatively, Elysia may accept guards to add an entire instance or group of routes to a specific guard.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .guard({
        detail: {
            description: 'Require user to be logged in'
        }
    })
    .get('/user', 'user')
    .get('/admin', 'admin')
```

## Change OpenAPI Endpoint

You can change the OpenAPI endpoint by setting [path](#path) in the plugin config.

```typescript
import { Elysia } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
    .use(
        openapi({
            path: '/v2/openapi'
        })
    )
    .listen(3000)
```

## Customize OpenAPI info

We can customize the OpenAPI information by setting [documentation.info](#documentationinfo) in the plugin config.

```typescript
import { Elysia } from 'elysia'
import { openapi } from '@elysia/openapi'

new Elysia()
    .use(
        openapi({
            documentation: {
                info: {
                    title: 'Elysia Documentation',
                    version: '1.0.0'
                }
            }
        })
    )
    .listen(3000)
```

This can be useful for

* adding a title
* setting an API version
* adding a description explaining what our API is about
* explaining what tags are available, what each tag means

## Security Configuration

To secure your API endpoints, you can define security schemes in the Swagger configuration. The example below demonstrates how to use Bearer Authentication (JWT) to protect your endpoints:

```typescript
new Elysia().use(
    openapi({
        documentation: {
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    })
)

export const addressController = new Elysia({
    prefix: '/address',
    detail: {
        tags: ['Address'],
        security: [
            {
                bearerAuth: []
            }
        ]
    }
})
```

This will ensure that all endpoints under the `/address` prefix require a valid JWT token for access.

---


---

---
url: 'https://elysiajs.com/patterns/opentelemetry.md'
---

# OpenTelemetry

To start using OpenTelemetry, install `@elysia/opentelemetry` and apply plugin to any instance.

```typescript
import { Elysia } from 'elysia'
import { opentelemetry } from '@elysia/opentelemetry'

new Elysia()
	.use(opentelemetry())
```

![OpenTelemetry visualize via Axiom](/assets/axiom.webp)

Why use OpenTelemetry with Elysia?

* 1 line config
* Span name is the function name
* Grouping relevant lifecycle together
* Wrap code to record a specific part
* Support Server-Sent Event, and response streaming
* Compatible with any OpenTelemetry compatible library

You may export telemetry data to Jaeger, Zipkin, New Relic, Axiom or any other OpenTelemetry compatible backend.

### Export OpenTelemetry data

We can export OpenTelemetry data to any backend that supports OpenTelemetry protocol.

Here's an example of exporting telemetry to [Axiom](https://axiom.co)

```typescript
import { Elysia } from 'elysia'
import { opentelemetry } from '@elysia/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

new Elysia().use(
	opentelemetry({
		spanProcessors: [
			new BatchSpanProcessor(
				new OTLPTraceExporter({
					url: 'https://api.axiom.co/v1/traces', // [!code ++]
					headers: {
						// [!code ++]
						Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`, // [!code ++]
						'X-Axiom-Dataset': Bun.env.AXIOM_DATASET // [!code ++]
					} // [!code ++]
				})
			)
		]
	})
)
```

## OpenTelemetry SDK

Elysia OpenTelemetry is for applying OpenTelemetry to Elysia server only.

You may use OpenTelemetry SDK normally, and the span is run under Elysia's request span, it will automatically appear in Elysia trace.

However, we also provide a `getTracer`, and `record` utility to collect span from any part of your application.

```typescript
import { Elysia } from 'elysia'
import { record } from '@elysia/opentelemetry'

export const plugin = new Elysia().get('', () => {
	return record('database.query', () => {
		return db.query('SELECT * FROM users')
	})
})
```

## Record utility

`record` is equivalent to OpenTelemetry's `startActiveSpan` but it will handle auto-closing and capture exception automatically.

You may think of `record` as a label for your code that will be shown in trace.

### Prepare your codebase for observability

Elysia OpenTelemetry will group lifecycle and read the **function name** of each hook as the name of the span.

It's a good time to **name your function**.

If your hook handler is an arrow function, you may refactor it to named function to understand the trace better, otherwise your trace span will be named as `anonymous`.

```typescript
const bad = new Elysia()
	// ⚠️ span name will be anonymous
	.derive(async ({ cookie: { session } }) => {
		return {
			user: await getProfile(session)
		}
	})

const good = new Elysia()
	// ✅ span name will be getProfile
	.derive(async function getProfile({ cookie: { session } }) {
		return {
			user: await getProfile(session)
		}
	})
```

## getCurrentSpan

`getCurrentSpan` is a utility to get the current span of the current request when you are outside of the handler.

```typescript
import { getCurrentSpan } from '@elysia/opentelemetry'

function utility() {
	const span = getCurrentSpan()
	span.setAttributes({
		'custom.attribute': 'value'
	})
}
```

This works outside of the handler by retrieving current span from `AsyncLocalStorage`

## setAttributes

`setAttributes` is a utility to set attributes to the current span.

```typescript
import { setAttributes } from '@elysia/opentelemetry'

function utility() {
	setAttributes({
		'custom.attribute': 'value'
	})
}
```

This is a syntax sugar for `getCurrentSpan().setAttributes`

## Configuration

See [opentelemetry plugin](/plugins/opentelemetry) for configuration option and definition.

## Instrumentations Advanced Concept

Many instrumentation libraries required that the SDK **MUST** run before importing the module.

For example, to use `PgInstrumentation`, the `OpenTelemetry SDK` must run before importing the `pg` module.

To achieve this in Bun, we can

1. Separate an OpenTelemetry setup into a different file
2. create `bunfig.toml` to preload the OpenTelemetry setup file

Let's create a new file in `src/instrumentation.ts`

```ts [src/instrumentation.ts]
import { opentelemetry } from '@elysia/opentelemetry'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'

export const instrumentation = opentelemetry({
	instrumentations: [new PgInstrumentation()]
})
```

Then we can apply this `instrumentaiton` plugin into our main instance in `src/index.ts`

```ts [src/index.ts]
import { Elysia } from 'elysia'
import { instrumentation } from './instrumentation.ts'

new Elysia().use(instrumentation).listen(3000)
```

Then create a `bunfig.toml` with the following:

```toml [bunfig.toml]
preload = ["./src/instrumentation.ts"]
```

This will tell Bun to load and setup `instrumentation` before running the `src/index.ts` allowing OpenTelemetry to do its setup as needed.

### Deploying to production Advanced Concept

If you are using `bun build` or other bundlers.

As OpenTelemetry relies on monkey-patching `node_modules/<library>`. It's required to make instrumentations work properly, we need to specify libraries to be instrumented as an external module to exclude it from being bundled.

For example, if you are using `@opentelemetry/instrumentation-pg` to instrument `pg` library. We need to exclude `pg` from being bundled and make sure that it is importing `node_modules/pg`.

To make this work, we may specify `pg` as an external module with `--external pg`

```bash
bun build --compile --external pg --outfile server src/index.ts
```

This tells bun not to bundle `pg` into the final output file, and will be imported from the **node\_modules** directory at runtime. So on a production server, you must also keep the **node\_modules** directory.

It's recommended to specify packages that should be available in a production server as **dependencies** in **package.json** and use `bun install --production` to install only production dependencies.

```json
{
	"dependencies": {
		"pg": "^8.15.6"
	},
	"devDependencies": {
		"@elysia/opentelemetry": "^1.2.0",
		"@opentelemetry/instrumentation-pg": "^0.52.0",
		"@types/pg": "^8.11.14",
		"elysia": "^1.2.25"
	}
}
```

Then after running a build command, on a production server

```bash
bun install --production
```

If the node\_modules directory still includes development dependencies, you may remove the node\_modules directory and reinstall production dependencies again.

---


---

---
url: 'https://elysiajs.com/patterns/cookie.md'
---

# Cookie&#x20;

Elysia provides a mutable signal for interacting with Cookie.

There's no get/set, you can extract the cookie name and retrieve or update its value directly.

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Get
        name.value

        // Set
        name.value = "New Value"
    })
```

By default, Reactive Cookie can automatically encode/decode object types allowing us to treat cookies as objects without worrying about the encoding/decoding. **It just works**.

::: warning
You may get a warning when using cookie.name as it might be `undefined`

Elysia cookie can never be `undefined` because it's a Proxy object. `cookie` is always defined, only its value (via cookie.value) can be undefined.

This can be fixed by using \[a cookie schema] or disabling [strictNullChecks](https://www.typescriptlang.org/tsconfig/#strictNullChecks) in `tsconfig.json`
:::

## Reactivity

The Elysia cookie is reactive. This means that when you change the cookie value, the cookie will be updated automatically based on an approach like signals.

A single source of truth for handling cookies is provided by Elysia cookies, which have the ability to automatically set headers and sync cookie values.

Since cookies are Proxy-dependent objects by default, the extract value can never be **undefined**; instead, it will always be a value of `Cookie<unknown>`, which can be obtained by invoking the **.value** property.

We can treat the cookie jar as a regular object, iteration over it will only iterate over an already-existing cookie value.

## Cookie Attribute

To use Cookie attributes, you can use one of the following:

1. Setting the property directly
2. Using `set` or `add` to update cookie properties.

See [cookie attribute config](/patterns/cookie.html#config) for more information.

### Assign Property

You can get/set properties of a cookie like any normal object, the reactivity model synchronizes the cookie value automatically.

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // get
        name.domain

        // set
        name.domain = 'millennium.sh'
        name.httpOnly = true
    })
```

## set

**set** permits updating multiple cookie properties all at once through **reset all property** and overwrite the property with a new value.

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        name.set({
            domain: 'millennium.sh',
            httpOnly: true
        })
    })
```

## add

Like **set**, **add** allows us to update multiple cookie properties at once, but instead will only overwrite the properties defined instead of resetting.

## remove

To remove a cookie, you can use either:

1. name.remove
2. delete cookie.name

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie, cookie: { name } }) => {
        name.remove()

        delete cookie.name
    })
```

## Cookie Schema

You can strictly validate cookie type and provide type inference for cookies by using cookie schema with `t.Cookie`.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Set
        name.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            name: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        })
    })
```

## Nullable Cookie

To handle nullable cookie value, you can use `t.Optional` on the cookie name you want to be nullable.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Set
        name.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            name: t.Optional(
                t.Object({
                    id: t.Numeric(),
                    name: t.String()
                })
            )
        })
    })
```

## Cookie Signature

With the introduction of Cookie Schema and `t.Cookie` type, we can create a unified type for handling sign/verify cookie signature automatically.

Cookie signature is a cryptographic hash appended to a cookie's value, generated using a secret key and the content of the cookie to enhance security by adding a signature to the cookie.

This makes sure that the cookie value is not modified by malicious actors, helping verify the authenticity and integrity of the cookie data.

## Using Cookie Signature

By providing a cookie secret and `sign` property to indicate which cookie should have signature verification.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        }, {
            secrets: 'Fischl von Luftschloss Narfidort',
            sign: ['profile']
        })
    })
```

Elysia then sign and unsign cookie value automatically.

## Constructor

You can use Elysia constructor to set global cookie `secret` and `sign` values to apply to all routes globally instead of inlining to every route you need.

```ts
import { Elysia, t } from 'elysia'

new Elysia({
    cookie: {
        secrets: 'Fischl von Luftschloss Narfidort',
        sign: ['profile']
    }
})
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        })
    })
```

## Cookie Rotation

Elysia handles cookie secret rotation automatically.

Cookie Rotation is a migration technique to sign a cookie with a newer secret, while also be able to verify the old signature of the cookie.

```ts
import { Elysia } from 'elysia'

new Elysia({
    cookie: {
        secrets: ['Vengeance will be mine', 'Fischl von Luftschloss Narfidort']
    }
})
```

### Unsigned Cookie Transition

Elysia supports graceful transition from unsigned to signed cookies.

By setting `null` in an array of `cookie.secrets`, Elysia will allow unsigned cookies to pass through while checking invalid cookie signatures when available.

```ts
import { Elysia } from 'elysia'

new Elysia({
    cookie: {
        secrets: ['Vengeance will be mine', 'Fischl von Luftschloss Narfidort', null]
    }
})
```

Elysia will then use the first `secrets` to sign the new cookie allowing graceful transition.

It's recommended to only allow unsigned cookies during the transition period to prevent unsafe cookies from occurring.

## Config

Below is a cookie config accepted by Elysia.

### secret

The secret key for signing/verifying cookies.

If an array is passed, it will use Key Rotation.

Key rotation is when an encryption key is retired and replaced by generating a new cryptographic key.

***

Below is a config that extends from [cookie](https://npmjs.com/package/cookie)

### domain

Specifies the value for the [Domain Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.3).

By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.

### encode

@default `encodeURIComponent`

Specifies a function that will be used to encode a cookie value.

Since the value of a cookie has a limited character set (and must be a simple string), this function can be used to encode a value into a string suited for a cookie value.

The default function is the global `encodeURIComponent`, which will encode a JavaScript string into UTF-8 byte sequences and then URL-encode any that fall outside of the cookie range.

### expires

Specifies the Date object to be the value for the [Expires Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.1).

By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on conditions like exiting a web browser application.

::: tip
The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but not all clients may obey this, so if both are set, they should point to the same date and time.
:::

### httpOnly

@default `false`

Specifies the boolean value for the [HttpOnly Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.6).

When truthy, the HttpOnly attribute is set, otherwise, it is not.

By default, the HttpOnly attribute is not set.

::: tip
be careful when setting this to true, as compliant clients will not allow client-side JavaScript to see the cookie in `document.cookie`.
:::

### maxAge

@default `undefined`

Specifies the number (in seconds) to be the value for the [Max-Age Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.2).

The given number will be converted to an integer by rounding down. By default, no maximum age is set.

::: tip
The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but not all clients may obey this, so if both are set, they should point to the same date and time.
:::

### path

Specifies the value for the [Path Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.4).

By default, the path handler is considered the default path.

### priority

Specifies the string to be the value for the [Priority Set-Cookie attribute](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
`low` will set the Priority attribute to Low.
`medium` will set the Priority attribute to Medium, the default priority when not set.
`high` will set the Priority attribute to High.

More information about the different priority levels can be found in [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).

::: tip
This is an attribute that has not yet been fully standardized and may change in the future. This also means many clients may ignore this attribute until they understand it.
:::

### sameSite

Specifies the boolean or string to be the value for the [SameSite Set-Cookie attribute](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
`true` will set the SameSite attribute to Strict for strict same-site enforcement.
`false` will not set the SameSite attribute.
`'lax'` will set the SameSite attribute to Lax for lax same-site enforcement.
`'none'` will set the SameSite attribute to None for an explicit cross-site cookie.
`'strict'` will set the SameSite attribute to Strict for strict same-site enforcement.
More information about the different enforcement levels can be found in [the specification](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).

::: tip
This is an attribute that has not yet been fully standardized and may change in the future. This also means many clients may ignore this attribute until they understand it.
:::

### secure

Specifies the boolean value for the [Secure Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5). When truthy, the Secure attribute is set, otherwise, it is not. By default, the Secure attribute is not set.

::: tip
Be careful when setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.
:::

---


---

---
url: 'https://elysiajs.com/tutorial/patterns/standalone-schema.md'
---

# Standalone Schema

When we define a schema using Guard, the schema will be added to a route. But it will be **overridden** if the route provides a schema:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		body: t.Object({
			age: t.Number()
		})
	})
	.post(
		'/user',
		({ body }) => body,
		{
			// This will override the guard schema
			body: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```

If we want a schema to **co-exist** with route schema, we can define it as **standalone schema**:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		schema: 'standalone', // [!code ++]
		body: t.Object({
			age: t.Number()
		})
	})
	.post(
		'/user',
		// body will have both age and name property
		({ body }) => body,
		{
			body: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```

## Schema Library Interoperability

Schemas between standalone schemas can be from different validation libraries.

For example you can define a standalone schema using **zod**, and a local schema using **Elysia.t**, and both will works interchangeably.

## Assignment

Let's make both `age` and `name` properties required in the request body by using standalone schema.

\<template #answer>

We can define a standalone schema by adding `schema: 'standalone'` in the guard options.

```typescript
import { Elysia, t } from 'elysia'
import { z } from 'zod'

new Elysia()
	.guard({
		schema: 'standalone', // [!code ++]
		body: z.object({
			age: z.number()
		})
	})
	.post(
		'/user',
		({ body }) => body,
		{
			body: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/patterns/unit-test.md'
---

# Unit Test&#x20;

Being WinterTC compliant, we can use Request / Response classes to test an Elysia server.

Elysia provides the **Elysia.handle** method, which accepts a Web Standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and returns [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response), simulating an HTTP Request.

Bun includes a built-in [test runner](https://bun.sh/docs/cli/test) that offers a Jest-like API through the `bun:test` module, facilitating the creation of unit tests.

Create **test/index.test.ts** in the root of the project directory with the following:

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Elysia', () => {
    it('returns a response', async () => {
        const app = new Elysia().get('/', () => 'hi')

        const response = await app
            .handle(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

Then we can perform tests by running **bun test**

```bash
bun test
```

New requests to an Elysia server must be a fully valid URL, **NOT** a part of a URL.

The request must provide the URL as follows:

| URL                   | Valid |
| --------------------- | ----- |
| http://localhost/user | ✅    |
| /user                 | ❌    |

We can also use other testing libraries like Jest to create Elysia unit tests.

## Eden Treaty test

We may use Eden Treaty to create an end-to-end type safety test for Elysia server as follows:

```typescript twoslash
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia().get('/hello', 'hi')

const api = treaty(app)

describe('Elysia', () => {
    it('returns a response', async () => {
        const { data, error } = await api.hello.get()

        expect(data).toBe('hi')
              // ^?
    })
})
```

See [Eden Treaty Unit Test](/eden/treaty/unit-test) for setup and more information.

---


---

---
url: 'https://elysiajs.com/patterns/trace.md'
---

# Trace

Performance is an important aspect for Elysia.

We don't want to be fast for benchmarking purposes, we want you to have a really fast server in a real-world scenario.

There are many factors that can slow down our app - and it's hard to identify them, but **trace** can help solve that problem by injecting start and stop code to each life-cycle.

Trace allows us to inject code before and after each life-cycle event, block and interact with the execution of the function.

::: warning
trace doesn't work with dynamic mode `aot: false`, as it requires the function to be static and known at compile time otherwise it will have a large performance impact.
:::

## Trace

Trace uses a callback listener to ensure that callback function is finished before moving on to the next lifecycle event.

To use `trace`, you need to call `trace` method on the Elysia instance, and pass a callback function that will be executed for each life-cycle event.

You may listen to each lifecycle by adding `on` prefix followed by the lifecycle name, for example `onHandle` to listen to the `handle` event.

```ts
import { Elysia } from 'elysia'

const app = new Elysia()
    .trace(async ({ onHandle }) => {
	    onHandle(({ begin, onStop }) => {
			onStop(({ end }) => {
        		console.log('handle took', end - begin, 'ms')
			})
	    })
    })
    .get('/', () => 'Hi')
    .listen(3000)
```

Please refer to [Life Cycle Events](/essential/life-cycle#events) for more information:

![Elysia Life Cycle](/assets/lifecycle-chart.svg)

## Children

Every event except `handle` has children, which is an array of events that are executed inside for each lifecycle event.

You can use `onEvent` to listen to each child event in order

```ts
import { Elysia } from 'elysia'

const sleep = (time = 1000) =>
    new Promise((resolve) => setTimeout(resolve, time))

const app = new Elysia()
    .trace(async ({ onBeforeHandle }) => {
        onBeforeHandle(({ total, onEvent }) => {
            console.log('total children:', total)

            onEvent(({ onStop }) => {
                onStop(({ elapsed }) => {
                    console.log('child took', elapsed, 'ms')
                })
            })
        })
    })
    .get('/', () => 'Hi', {
        beforeHandle: [
            function setup() {},
            async function delay() {
                await sleep()
            }
        ]
    })
    .listen(3000)
```

In this example, total children will be `2` because there are 2 children in the `beforeHandle` event.

Then we listen to each child event by using `onEvent` and print the duration of each child event.

## Trace Parameter

When each lifecycle is called

```ts
import { Elysia } from 'elysia'

const app = new Elysia()
	// This is trace parameter
	// hover to view the type
	.trace((parameter) => {
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

`trace` accepts the following parameters:

### id - `number`

Randomly generated unique ID for each request

### context - `Context`

Elysia's [Context](/essential/handler.html#context), eg. `set`, `store`, `query`, `params`

### set - `Context.set`

Shortcut for `context.set`, to set a headers or status of the context

### store - `Singleton.store`

Shortcut for `context.store`, to access a data in the context

### time - `number`

Timestamp of when request is called

### on\[Event] - `TraceListener`

An event listener for each life-cycle event.

You may listen to the following life-cycle:

* **onRequest** - get notified of every new request
* **onParse** - array of functions to parse the body
* **onTransform** - transform request and context before validation
* **onBeforeHandle** - custom requirement to check before the main handler, can skip the main handler if response returned.
* **onHandle** - function assigned to the path
* **onAfterHandle** - interact with the response before sending it back to the client
* **onMapResponse** - map returned value into a Web Standard Response
* **onError** - handle error thrown during processing request
* **onAfterResponse** - cleanup function after response is sent

## Trace Listener

A listener for each life-cycle event

```ts
import { Elysia } from 'elysia'

const app = new Elysia()
	.trace(({ onBeforeHandle }) => {
		// This is trace listener
		// hover to view the type
		onBeforeHandle((parameter) => {

		})
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

Each lifecycle listener accepts the following

### name - `string`

The name of the function, if the function is anonymous, the name will be `anonymous`

### begin - `number`

The time when the function is started

### end - `Promise<number>`

The time when the function is ended, will be resolved when the function is ended

### error - `Promise<Error | null>`

Error that was thrown in the lifecycle, will be resolved when the function is ended

### onStop - `callback?: (detail: TraceEndDetail) => any`

A callback that will be executed when the lifecycle is ended

```ts
import { Elysia } from 'elysia'

const app = new Elysia()
	.trace(({ onBeforeHandle, set }) => {
		onBeforeHandle(({ onStop }) => {
			onStop(({ elapsed }) => {
				set.headers['X-Elapsed'] = elapsed.toString()
			})
		})
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

It's recommended to mutate context in this function as there's a lock mechanism to ensure the context is mutated successfully before moving on to the next lifecycle event

## TraceEndDetail

A parameter that passed to `onStop` callback

### end - `number`

The time when the function is ended

### error - `Error | null`

Error that was thrown in the lifecycle

### elapsed - `number`

Elapsed time of the lifecycle or `end - begin`

---


---

---
url: 'https://elysiajs.com/patterns/typebox.md'
---

# TypeBox (Elysia.t)

Here's common patterns for writing validation types using `Elysia.t`.

## Primitive Type

The TypeBox API is designed around and is similar to TypeScript types.

There are many familiar names and behaviors that intersect with TypeScript counterparts, such as **String**, **Number**, **Boolean**, and **Object**, as well as more advanced features like **Intersect**, **KeyOf**, and **Tuple** for versatility.

If you are familiar with TypeScript, creating a TypeBox schema behaves the same as writing a TypeScript type, except it provides actual type validation at runtime.

To create your first schema, import **Elysia.t** from Elysia and start with the most basic type:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/', ({ body }) => `Hello ${body}`, {
		body: t.String()
	})
	.listen(3000)
```

This code tells Elysia to validate an incoming HTTP body, ensuring that the body is a string. If it is a string, it will be allowed to flow through the request pipeline and handler.

If the shape doesn't match, it will throw an error into the [Error Life Cycle](/essential/life-cycle.html#on-error).

![Elysia Life Cycle](/assets/lifecycle-chart.svg)

### Basic Type

TypeBox provides basic primitive types with the same behavior as TypeScript types.

The following table lists the most common basic types:

```typescript
t.String()
```

```typescript
string
```

```typescript
t.Number()
```

```typescript
number
```

```typescript
t.Boolean()
```

```typescript
boolean
```

```typescript
t.Array(
    t.Number()
)
```

```typescript
number[]
```

```typescript
t.Object({
    x: t.Number()
})
```

```typescript
{
    x: number
}
```

```typescript
t.Null()
```

```typescript
null
```

```typescript
t.Literal(42)
```

```typescript
42
```

Elysia extends all types from TypeBox, allowing you to reference most of the API from TypeBox for use in Elysia.

See [TypeBox's Type](https://github.com/sinclairzx81/typebox#json-types) for additional types supported by TypeBox.

### Attribute

TypeBox can accept arguments for more comprehensive behavior based on the JSON Schema 7 specification.

```typescript
t.String({
    format: 'email'
})
```

```typescript
saltyaom@elysia.com
```

```typescript
t.Number({
    minimum: 10,
    maximum: 100
})
```

```typescript
10
```

```typescript
t.Array(
    t.Number(),
    {
        /**
         * Minimum number of items
         */
        minItems: 1,
        /**
         * Maximum number of items
         */
        maxItems: 5
    }
)
```

```typescript
[1, 2, 3, 4, 5]
```

```typescript
t.Object(
    {
        x: t.Number()
    },
    {
        /**
         * @default false
         * Accept additional properties
         * that not specified in schema
         * but still match the type
         */
        additionalProperties: true
    }
)
```

```typescript
x: 100
y: 200
```

See [JSON Schema 7 specification](https://json-schema.org/draft/2020-12/json-schema-validation) for more explanation of each attribute.

## Honorable Mentions

The following are common patterns often found useful when creating a schema.

### Union

Allows a field in `t.Object` to have multiple types.

```typescript
t.Union([
    t.String(),
    t.Number()
])
```

```typescript
string | number
```

```
Hello
123
```

### Optional

Allows a field in `t.Object` to be undefined or optional.

```typescript
t.Object({
    x: t.Number(),
    y: t.Optional(t.Number())
})
```

```typescript
{
    x: number,
    y?: number
}
```

```typescript
{
    x: 123
}
```

### Partial

Allows all fields in `t.Object` to be optional.

```typescript
t.Partial(
    t.Object({
        x: t.Number(),
        y: t.Number()
    })
)
```

```typescript
{
    x?: number,
    y?: number
}
```

```typescript
{
    y: 123
}
```

## Elysia Type

`Elysia.t` is based on TypeBox with pre-configuration for server usage, providing additional types commonly found in server-side validation.

You can find all the source code for Elysia types in `elysia/type-system`.

The following are types provided by Elysia:

### UnionEnum

`UnionEnum` allows the value to be one of the specified values.

```typescript
t.UnionEnum(['rapi', 'anis', 1, true, false])
```

### File

A singular file, often useful for **file upload** validation.

```typescript
t.File()
```

File extends the attributes of the base schema, with additional properties as follows:

#### type

Specifies the format of the file, such as image, video, or audio.

If an array is provided, it will attempt to validate if any of the formats are valid.

```typescript
type?: MaybeArray<string>
```

#### minSize

Minimum size of the file.

Accepts a number in bytes or a suffix of file units:

```typescript
minSize?: number | `${number}${'k' | 'm'}`
```

#### maxSize

Maximum size of the file.

Accepts a number in bytes or a suffix of file units:

```typescript
maxSize?: number | `${number}${'k' | 'm'}`
```

#### File Unit Suffix:

The following are the specifications of the file unit:
m: MegaByte (1048576 byte)
k: KiloByte (1024 byte)

### Files

Extends from [File](#file), but adds support for an array of files in a single field.

```typescript
t.Files()
```

Files extends the attributes of the base schema, array, and File.

### Cookie

Object-like representation of a Cookie Jar extended from the Object type.

```typescript
t.Cookie({
    name: t.String()
})
```

Cookie extends the attributes of [Object](https://json-schema.org/draft/2020-12/json-schema-validation#name-validation-keywords-for-obj) and [Cookie](https://github.com/jshttp/cookie#options-1) with additional properties as follows:

#### secrets

The secret key for signing cookies.

Accepts a string or an array of strings.

```typescript
secrets?: string | string[]
```

If an array is provided, [Key Rotation](https://crypto.stackexchange.com/questions/41796/whats-the-purpose-of-key-rotation) will be used. The newly signed value will use the first secret as the key.

### Nullable

Allows the value to be null but not undefined.

```typescript
t.Nullable(t.String())
```

### MaybeEmpty

Allows the value to be null and undefined.

```typescript
t.MaybeEmpty(t.String())
```

For additional information, you can find the full source code of the type system in [`elysia/type-system`](https://github.com/elysiajs/elysia/blob/main/src/type-system/index.ts).

### Form

A syntax sugar for our `t.Object` with support for verifying return value of [form](/essential/handler.html#formdata) (FormData).

```typescript
t.Form({
	someValue: t.File()
})
```

### UInt8Array

Accepts a buffer that can be parsed into a `Uint8Array`.

```typescript
t.UInt8Array()
```

This is useful when you want to accept a buffer that can be parsed into a `Uint8Array`, such as in a binary file upload. It's designed to use for the validation of body with `arrayBuffer` parser to enforce the body type.

### ArrayBuffer

Accepts a buffer that can be parsed into a `ArrayBuffer`.

```typescript
t.ArrayBuffer()
```

This is useful when you want to accept a buffer that can be parsed into a `Uint8Array`, such as in a binary file upload. It's designed to use for the validation of body with `arrayBuffer` parser to enforce the body type.

### ObjectString

Accepts a string that can be parsed into an object.

```typescript
t.ObjectString()
```

This is useful when you want to accept a string that can be parsed into an object but the environment does not allow it explicitly, such as in a query string, header, or FormData body.

### BooleanString

Accepts a string that can be parsed into a boolean.

Similar to [ObjectString](#objectstring), this is useful when you want to accept a string that can be parsed into a boolean but the environment does not allow it explicitly.

```typescript
t.BooleanString()
```

### Numeric

Numeric accepts a numeric string or number and then transforms the value into a number.

```typescript
t.Numeric()
```

This is useful when an incoming value is a numeric string, for example, a path parameter or query string.

Numeric accepts the same attributes as [Numeric Instance](https://json-schema.org/draft/2020-12/json-schema-validation#name-validation-keywords-for-num).

## Elysia behavior

Elysia uses TypeBox by default.

However, to help make handling HTTP easier. Elysia has some dedicated types and has some behavioral differences from TypeBox.

## Optional

To make a field optional, use `t.Optional`.

This will allow clients to optionally provide a query parameter. This behavior also applies to `body`, `headers`.

This is different from TypeBox where optional is to mark a field of an object as optional.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/optional', ({ query }) => query, {
		query: t.Optional(
			t.Object({
				name: t.String()
			})
		)
	})
```

## Number to Numeric

By default, Elysia will convert a `t.Number` to [t.Numeric](#numeric) when provided as route schema.

Because parsed HTTP headers, query, and URL parameters are always strings. This means that even if a value is a number, it will be treated as a string.

Elysia overrides this behavior by checking if a string value looks like a number then converting it appropriately.

This is only applied when it is used as a route schema and not in a nested `t.Object`.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/:id', ({ id }) => id, {
		params: t.Object({
			// Converted to t.Numeric()
			id: t.Number()
		}),
		body: t.Object({
			// NOT converted to t.Numeric()
			id: t.Number()
		})
	})

// NOT converted to t.Numeric()
t.Number()
```

## Boolean to BooleanString

Similar to [Number to Numeric](#number-to-numeric)

Any `t.Boolean` will be converted to `t.BooleanString`.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/:id', ({ id }) => id, {
		params: t.Object({
			// Converted to t.Boolean()
			id: t.Boolean()
		}),
		body: t.Object({
			// NOT converted to t.Boolean()
			id: t.Boolean()
		})
	})

// NOT converted to t.BooleanString()
t.Boolean()
```

---


---

---
url: 'https://elysiajs.com/patterns/typescript.md'
---

# TypeScript

Elysia has first-class support for TypeScript out of the box.

Most of the time, you wouldn't need to add any TypeScript annotations manually.

## Inference

Elysia infers the type of request and response based on the schema you provide.

```ts twoslash
import { Elysia, t } from 'elysia'
import { z } from 'zod'

const app = new Elysia()
  	.post('/user/:id', ({ body }) => body, {
  	//                     ^?
	  	body: t.Object({
			id: t.String()
		}),
		query: z.object({
			name: z.string()
		})
   	})
```

Elysia can automatically infer types from schema like TypeBox and [your favorite validation library](/essential/validation#standard-schema) like:

* Zod
* Valibot
* ArkType
* Effect Schema
* Yup
* Joi

### Schema to Type

All of schema library supported by Elysia can be converted to TypeScript type.

\<Tab
id="quickstart"
:names="\['TypeBox', 'Zod', 'Valibot', 'ArkType']"
:tabs="\['typebox', 'zod', 'valibot', 'arktype']"
noTitle

>

```ts twoslash
import { Elysia, t } from 'elysia'

const User = t.Object({
  	id: t.String(),
  	name: t.String()
})

type User = typeof User['static']
//    ^?
```

```ts twoslash
import { z } from 'zod'

const User = z.object({
  	id: z.string(),
  	name: z.string()
})

type User = z.infer<typeof User>
//    ^?
```

```ts twoslash
import * as v from 'valibot'

const User = v.object({
  	id: v.string(),
  	name: v.string()
})

type User = v.InferOutput<typeof User>
//    ^?
```

```ts twoslash
import { type } from 'arktype'

const User = type({
  	id: 'string',
  	name: 'string'
})

type User = typeof User.infer
//    ^?
```

## Type Performance

Elysia is built with type inference performance in mind.

Before every release, we have a local benchmark to ensure that type inference is always snappy, fast, and doesn't blow up your IDE with "Type instantiation is excessively deep and possibly infinite" error.

Most of the time writing Elysia, you wouldn't encounter any type performance issue.

However, if you do, here is how to break down what's slowing down your type inference:

1. Navigate to the root of your project and run

```
tsc --generateTrace trace --noEmit --incremental false
```

This should generate a `trace` folder in your project root.

2. Open [Perfetto UI](https://ui.perfetto.dev) and drag the `trace/trace.json` file

![Perfetto](/assets/perfetto.webp)

> It should show you a flame graph like this

Then you can find a chunk that takes a long time to be evaluated, click on it and it should show you how long the inference take, and which file, and line number it is coming from.

This should help you to identify the bottleneck of your type inference.

### Eden

If you are having a slow type inference issue when using [Eden](/eden/overview), you can try using a sub app of Elysia to isolate the type inference.

```ts [backend/src/index.ts]
import { Elysia } from 'elysia'
import { plugin1, plugin2, plugin3 } from './plugin'

const app = new Elysia()
	.use([plugin1, plugin2, plugin3])
  	.listen(3000)

export type app = typeof app

// Export sub app
export type subApp = typeof plugin1 // [!code ++]
```

And on your frontend, you can import the sub app instead of the whole app.

```ts [frontend/src/index.ts]
import { treaty } from '@elysia/eden'
import type { subApp } from 'backend/src'

const api = treaty<subApp>('localhost:3000') // [!code ++]
```

This should make your type inference faster as it doesn't need to evaluate the whole app.

See [Eden Treaty](/eden/overview) to learn more about Eden.

---


---

---
url: 'https://elysiajs.com/tutorial/features/unit-test.md'
---

# Unit Test

Elysia provides a **Elysia.fetch** function to easily test your application.

**Elysia.fetch** takes a Web Standard Request, and returns a Response similar to the browser's fetch API.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/', 'Hello World')

app.fetch(new Request('http://localhost/'))
	.then((res) => res.text())
	.then(console.log)
```

This will run a request like an **actual request** (not simulated).

### Test

This allows us to easily test our application without running a server.

::: code-group

```typescript [Bun Test]
import { describe, it, expect } from 'bun:test'

import { Elysia } from 'elysia'

describe('Elysia', () => {
	it('should return Hello World', async () => {
		const app = new Elysia().get('/', 'Hello World')

		const text = await app.fetch(new Request('http://localhost/'))
			.then(res => res.text())

		expect(text).toBe('Hello World')
	})
})
```

```typescript [Vitest]
import { describe, it, expect } from 'vitest'

import { Elysia } from 'elysia'

describe('Elysia', () => {
	it('should return Hello World', async () => {
		const app = new Elysia().get('/', 'Hello World')

		const text = await app.fetch(new Request('http://localhost/'))
			.then(res => res.text())

		expect(text).toBe('Hello World')
	})
})
```

```typescript [Jest]
import { describe, it, test } from '@jest/globals'

import { Elysia } from 'elysia'

describe('Elysia', () => {
	test('should return Hello World', async () => {
		const app = new Elysia().get('/', 'Hello World')

		const text = await app.fetch(new Request('http://localhost/'))
			.then(res => res.text())

		expect(text).toBe('Hello World')
	})
})
```

:::

See Unit Test.

## Assignment

Let's click the  icon in the preview to see how's the request is logged.

---


---

---
url: 'https://elysiajs.com/tutorial/patterns/validation-error.md'
---

# Validation Error

If you use `Elysia.t` for validation, you can provide a custom error message based on the field that fails the validation.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post(
		'/',
		({ body }) => body,
		{
			body: t.Object({
				age: t.Number({
					error: 'Age must be a number' // [!code ++]
				})
			}, {
				error: 'Body must be an object' // [!code ++]
			})
		}
	)
	.listen(3000)
```

Elysia will override the default error message with the custom one you provide, see Custom Validation Message.

## Validation Detail

By default Elysia also provides a Validation Detail to explain what's wrong with the validation as follows:

```json
{
	"type": "validation",
	"on": "params",
	"value": { "id": "string" },
	"property": "/id",
	"message": "id must be a number", // [!code ++]
	"summary": "Property 'id' should be one of: 'numeric', 'number'",
	"found": { "id": "string" },
	"expected": { "id": 0 },
	"errors": [
		{
			"type": 62,
			"schema": {
				"anyOf": [
					{ "format": "numeric", "default": 0, "type": "string" },
					{ "type": "number" }
				]
			},
			"path": "/id",
			"value": "string",
			"message": "Expected union value",
			"errors": [{ "iterator": {} }, { "iterator": {} }],
			"summary": "Property 'id' should be one of: 'numeric', 'number'"
		}
	]
}
```

However, when you provide a custom error message, it will completely override Validation Detail

To bring back the validation detail, you can wrap your custom error message in a Validation Detail function.

```typescript
import { Elysia, t, validationDetail } from 'elysia' // [!code ++]

new Elysia()
	.post(
		'/',
		({ body }) => body,
		{
			body: t.Object({
				age: t.Number({
					error: validationDetail('Age must be a number') // [!code ++]
				})
			}, {
				error: validationDetail('Body must be an object') // [!code ++]
			})
		}
	)
	.listen(3000)
```

## Assignment

Let's try to extend Elysia's context.

\<template #answer>

We can provide a custom error message by providing `error` property to the schema.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post(
		'/',
		({ body }) => body,
		{
			body: t.Object({
				age: t.Number({
                    error: 'thing' // [!code ++]
                })
			})
		}
	)
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/patterns/websocket.md'
---

# WebSocket

WebSocket is a real-time protocol for communication between your client and server.

Unlike HTTP where our client repeatedly asks the website for information and waits for a reply each time, WebSocket sets up a direct line where our client and server can send messages back and forth directly, making the conversation quicker and smoother without having to start over with each message.

SocketIO is a popular library for WebSocket, but it is not the only one. Elysia uses [uWebSocket](https://github.com/uNetworking/uWebSockets) which Bun uses under the hood with the same API.

To use WebSocket, simply call `Elysia.ws()`:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .ws('/ws', {
        message(ws, message) {
            ws.send(message)
        }
    })
    .listen(3000)
```

## WebSocket message validation:

Same as normal routes, WebSockets also accept a **schema** object to strictly type and validate requests.

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .ws('/ws', {
        // validate incoming message
        body: t.Object({
            message: t.String()
        }),
        query: t.Object({
            id: t.String()
        }),
        message(ws, { message }) {
            // Get schema from `ws.data`
            const { id } = ws.data.query
            ws.send({
                id,
                message,
                time: Date.now()
            })
        }
    })
    .listen(3000)
```

WebSocket schema can validate the following:

* **message** - An incoming message.
* **query** - Query string or URL parameters.
* **params** - Path parameters.
* **header** - Request's headers.
* **cookie** - Request's cookie
* **response** - Value returned from handler

By default Elysia will parse incoming stringified JSON message as Object for validation.

## Configuration

You can set Elysia constructor to set the Web Socket value.

```ts
import { Elysia } from 'elysia'

new Elysia({
    websocket: {
        idleTimeout: 30
    }
})
```

Elysia's WebSocket implementation extends Bun's WebSocket configuration, please refer to [Bun's WebSocket documentation](https://bun.sh/docs/api/websockets) for more information.

The following is a brief configuration from [Bun WebSocket](https://bun.sh/docs/api/websockets#create-a-websocket-server)

### perMessageDeflate

@default `false`

Enable compression for clients that support it.

By default, compression is disabled.

### maxPayloadLength

The maximum size of a message.

### idleTimeout

@default `120`

After a connection has not received a message for this many seconds, it will be closed.

### backpressureLimit

@default `16777216` (16MB)

The maximum number of bytes that can be buffered for a single connection.

### closeOnBackpressureLimit

@default `false`

Close the connection if the backpressure limit is reached.

## Methods

Below are the new methods that are available to the WebSocket route

## ws

Create a websocket handler

Example:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .ws('/ws', {
        message(ws, message) {
            ws.send(message)
        }
    })
    .listen(3000)
```

Type:

```typescript
.ws(endpoint: path, options: Partial<WebSocketHandler<Context>>): this
```

* **endpoint** - A path to be exposed as websocket handler
* **options** - Customize WebSocket handler behavior

## WebSocketHandler

WebSocketHandler extends config from [config](#configuration).

Below is a config which is accepted by `ws`.

## open

Callback function for new websocket connection.

Type:

```typescript
open(ws: ServerWebSocket<{
    // uid for each connection
    id: string
    data: Context
}>): this
```

## message

Callback function for incoming websocket message.

Type:

```typescript
message(
    ws: ServerWebSocket<{
        // uid for each connection
        id: string
        data: Context
    }>,
    message: Message
): this
```

`Message` type based on `schema.message`. Default is `string`.

## close

Callback function for closing websocket connection.

Type:

```typescript
close(ws: ServerWebSocket<{
    // uid for each connection
    id: string
    data: Context
}>): this
```

## drain

Callback function for the server is ready to accept more data.

Type:

```typescript
drain(
    ws: ServerWebSocket<{
        // uid for each connection
        id: string
        data: Context
    }>,
    code: number,
    reason: string
): this
```

## parse

`Parse` middleware to parse the request before upgrading the HTTP connection to WebSocket.

## beforeHandle

`Before Handle` middleware which execute before upgrading the HTTP connection to WebSocket.

Ideal place for validation.

## transform

`Transform` middleware which execute before validation.

## transformMessage

Like `transform`, but execute before validation of WebSocket message

## header

Additional headers to add before upgrading connection to WebSocket.

---


---

