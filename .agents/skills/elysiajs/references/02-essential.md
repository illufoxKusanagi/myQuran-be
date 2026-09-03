# Elysia Essential Architecture (Routes, Handlers, Lifecycle & Validation)

> Core architecture: routing mechanics, handler parameters, lifecycle pipeline, TypeBox validation, best practices, and guards.

## Table of Contents

- [Best Practice (essential/best-practice.md)](#best-practice)
- [Encapsulation (tutorial/getting-started/encapsulation.md)](#encapsulation)
- [Guard (tutorial/getting-started/guard.md)](#guard)
- [Handler&#x20; (essential/handler.md)](#handler-x20)
- [Handler and Context (tutorial/getting-started/handler-and-context.md)](#handler-and-context)
- [Lifecycle (tutorial/getting-started/life-cycle.md)](#lifecycle)
- [Lifecycle&#x20; (essential/life-cycle.md)](#lifecycle-x20)
- [Plugin (tutorial/getting-started/plugin.md)](#plugin)
- [Plugin&#x20; (essential/plugin.md)](#plugin-x20)
- [Routing&#x20; (essential/route.md)](#routing-x20)
- [Status (tutorial/getting-started/status-and-headers.md)](#status)
- [Validation (tutorial/getting-started/validation.md)](#validation)
- [Validation&#x20; (essential/validation.md)](#validation-x20)

---

---
url: 'https://elysiajs.com/essential/best-practice.md'
---

# Best Practice

Elysia is a pattern-agnostic framework, leaving the decision of which coding patterns to use up to you and your team.

However, there are several concerns when trying to adapt an MVC pattern [(Model-View-Controller)](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) with Elysia, and we found it hard to decouple and handle types.

This page is a guide on how to follow Elysia structure best practices combined with the MVC pattern, but it can be adapted to any coding pattern you prefer.

## Folder Structure

Elysia is unopinionated about folder structure, leaving you to **decide** how to organize your code yourself.

However, **if you don't have a specific structure in mind**, we recommend a feature-based folder structure where each feature has its own folder containing controllers, services, and models.

```
| src
  | modules
	| auth
	  | index.ts (Elysia controller)
	  | service.ts (service)
	  | model.ts (model)
	| user
	  | index.ts (Elysia controller)
	  | service.ts (service)
	  | model.ts (model)
  | utils
	| a
	  | index.ts
	| b
	  | index.ts
```

This structure allows you to easily find and manage your code and keep related code together.

Here's an example code of how to distribute your code into a feature-based folder structure:

::: code-group

```typescript [auth/index.ts]
import { Elysia } from 'elysia'

import { Auth } from './service'
import { AuthModel } from './model'

export const auth = new Elysia({ prefix: '/auth' })
	.get(
		'/sign-in',
		async ({ body, cookie: { session } }) => {
			const response = await Auth.signIn(body)

			// Set session cookie
			// (Elysia cookie is proxy, it can never be null/undefined)
			session!.value = response.token

			return response
		}, {
			body: AuthModel.signInBody,
			// response is optional, use to enforce return type
			response: {
				200: AuthModel.signInResponse,
				400: AuthModel.signInInvalid
			}
		}
	)
```

```typescript [auth/service.ts]
// Service handles business logic, decoupled from Elysia controller
import { status } from 'elysia'

import type { AuthModel } from './model'

// If a class doesn't need to store a property,
// you can use an `abstract class` to avoid class allocation
export abstract class Auth {
	static async signIn({ username, password }: AuthModel['signInBody']) {
		const user = await sql`
			SELECT password
			FROM users
			WHERE username = ${username}
			LIMIT 1`

		if (!await Bun.password.verify(password, user.password))
			// You can throw an HTTP error directly
			throw status(
				400,
				'Invalid username or password' satisfies AuthModel['signInInvalid']
			)

		return {
			username,
			token: await generateAndSaveTokenToDB(user.id)
		}
	}
}
```

```typescript [auth/model.ts]
// Model define the data structure and validation for the request and response
import { t, type UnwrapSchema } from 'elysia'

export const AuthModel = {
	signInBody: t.Object({
		username: t.String(),
		password: t.String(),
	}),
	signInResponse: t.Object({
		username: t.String(),
		token: t.String(),
	}),
	signInInvalid: t.Literal('Invalid username or password')
} as const

// Optional, cast all model to TypeScript type
export type AuthModel = {
	[k in keyof typeof AuthModel]: UnwrapSchema<typeof AuthModel[k]>
}
```

:::

Each file has its own responsibility:

* **Controller**: Handles HTTP routing, request validation, and cookies.
* **Service**: Handles business logic, decoupled from the Elysia controller if possible.
* **Model**: Defines the data structure and validation for the request and response.

Feel free to adapt this structure to your needs and use any coding pattern you prefer.

::: note
You may get a warning when using `cookie.name` as it might be `undefined` depending on your TypeScript configuration.

Elysia cookie can never be `undefined` because it's a Proxy object. `cookie` is always defined, only its value (via cookie.value) can be undefined.

This can be fixed by using a \[cookie schema] or disable [strictNullChecks](https://www.typescriptlang.org/tsconfig/#strictNullChecks) in `tsconfig.json`
:::

## Controller

Due to the type soundness of Elysia, it's not recommended to use a traditional controller class that is tightly coupled with Elysia's `Context` because:

1. **Elysia types are complex** and heavily depend on plugins and multiple levels of chaining.
2. **Hard to type**; Elysia types could change at any time, especially with decorators and store.
3. **Loss of type integrity** and inconsistency between types and runtime code.

We recommend one of the following approaches to implement a controller in Elysia.

1. Use Elysia instance as a controller itself
2. Create a controller that is not tied with HTTP request or Elysia.

***

### 1. Elysia instance as a controller

> 1 Elysia instance = 1 controller

Treat an Elysia instance as a controller, and define your routes directly on the Elysia instance.

```typescript
// ✅ Do
import { Elysia } from 'elysia'
import { Service } from './service'

new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)
    })
```

This approach allows Elysia to infer the `Context` type automatically, ensuring type integrity and consistency between types and runtime code.

```typescript
// ❌ Don't
import { Elysia, t, type Context } from 'elysia'

abstract class Controller {
    static root(context: Context) {
        return Service.doStuff(context.stuff)
    }
}

new Elysia()
    .get('/', Controller.root)
```

This approach makes it hard to type `Context` properly, and may lead to loss of type integrity.

### 2. Controller without HTTP request

If you want to create a controller class, we recommend creating a class that is not tied to HTTP request or Elysia at all.

This approach allows you to decouple the controller from Elysia, making it easier to test, reuse, and even swap a framework while still following the MVC pattern.

```typescript
import { Elysia } from 'elysia'

abstract class Controller {
	static doStuff(stuff: string) {
		return Service.doStuff(stuff)
	}
}

new Elysia()
	.get('/', ({ stuff }) => Controller.doStuff(stuff))
```

Tying the controller to the Elysia Context may lead to:

1. Loss of type integrity
2. Making it harder to test and reuse
3. Vendor lock-in

We recommend keeping the controller decoupled from Elysia as much as possible.

### ❌ Don't: Pass entire `Context` to a controller

**Context is a highly dynamic type** that can be inferred from Elysia instance.

Do not pass an entire `Context` to a controller, instead use object destructuring to extract what you need and pass it to the controller.

```typescript
import type { Context } from 'elysia'

abstract class Controller {
	constructor() {}

	// ❌ Don't do this
	static root(context: Context) {
		return Service.doStuff(context.stuff)
	}
}
```

This approach makes it hard to type `Context` properly, and may lead to loss of type integrity.

### Testing

If you're using Elysia as a controller, you can test your controller using `handle` to directly call a function (and it's lifecycle)

```typescript
import { Elysia } from 'elysia'
import { Service } from './service'

import { describe, it, expect } from 'bun:test'

const app = new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)

        return 'ok'
    })

describe('Controller', () => {
	it('should work', async () => {
		const response = await app
			.handle(new Request('http://localhost/'))
			.then((x) => x.text())

		expect(response).toBe('ok')
	})
})
```

You may find more information about testing in [Unit Test](/patterns/unit-test.html).

## Service

A service is a set of utility/helper functions decoupled as business logic to use in a module/controller, in our case, an Elysia instance.

Any technical logic that can be decoupled from controller may live inside a **Service**.

There are 2 types of service in Elysia:

1. Non-request dependent service
2. Request dependent service

### 1. Abstract away Non-request dependent service

We recommend abstracting service classes/functions away from Elysia.

If the service or function isn't tied to an HTTP request or doesn't access a `Context`, it's recommended to implement it as a static class or function.

```typescript
import { Elysia, t } from 'elysia'

abstract class Service {
    static fibo(number: number): number {
        if(number < 2)
            return number

        return Service.fibo(number - 1) + Service.fibo(number - 2)
    }
}

new Elysia()
    .get('/fibo', ({ body }) => {
        return Service.fibo(body)
    }, {
        body: t.Numeric()
    })
```

If your service doesn't need to store a property, you can use an `abstract class` and `static` methods to avoid allocating a class instance.

### 2. Request dependent service as Elysia instance

**If the service is a request-dependent service** or needs to process HTTP requests, we recommend abstracting it as an Elysia instance to ensure type integrity and inference:

```typescript
import { Elysia } from 'elysia'

// ✅ Do
const AuthService = new Elysia({ name: 'Auth.Service' })
    .macro({
        isSignIn: {
            resolve({ cookie, status }) {
                if (!cookie.session.value)
                	return status(401, 'Unauthorized')

                return {
                	session: cookie.session.value,
                }
            }
        }
    })

const UserController = new Elysia()
    .use(AuthService)
    .get('/profile', ({ Auth: { user } }) => user, {
    	isSignIn: true
    })
```

::: tip
Elysia handles [plugin deduplication](/essential/plugin.html#plugin-deduplication) by default, so you don't have to worry about performance, as it will be a singleton if you specify a **"name"** property
:::

### ✅ Do: Decorate only request dependent property

It's recommended to `decorate` only for request-dependent properties, such as `requestIP`, `requestTime`, or `session`.

Overusing decorators ties your code to Elysia, making it harder to test and reuse.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.decorate('requestIP', ({ request }) => request.headers.get('x-forwarded-for') || request.ip)
	.decorate('requestTime', () => Date.now())
	.decorate('session', ({ cookie }) => cookie.session.value)
	.get('/', ({ requestIP, requestTime, session }) => {
		return { requestIP, requestTime, session }
	})
```

## Model

Models or [DTOs (Data Transfer Objects)](https://en.wikipedia.org/wiki/Data_transfer_object) are handled by [Elysia.t (Validation)](/essential/validation.html#elysia-type).

Elysia has a built-in validation system that can infer types from your code and validate them at runtime.

### ✅ Do: Use Elysia's validation system

Elysia's strength is prioritizing a single source of truth for both types and runtime validation.

Instead of declaring an interface, reuse validation's model instead:

```typescript twoslash
// ✅ Do
import { Elysia, t, type UnwrapSchema } from 'elysia'

export const models = {
	customBody: t.Object({
		username: t.String(),
		password: t.String()
	})
}

// Optional if you want to extract the type from the model
type CustomBody = UnwrapSchema<typeof models.customBody>
//    ^?






// Or make the entire object as type
type Models = {
	[k in keyof typeof models]: UnwrapSchema<typeof models[k]>
}

// ❌ Don't: declare model and type separately
interface ICustomBody {
	username: string
	password: string
}
```

We can get type of model by using `typeof` with `.static` property from the model.

Then you can use the `CustomBody` type to infer the type of the request body.

```typescript twoslash
import { Elysia, t } from 'elysia'

const models = {
	customBody: t.Object({
		username: t.String(),
		password: t.String()
	})	
}
// ---cut---
// ✅ Do
new Elysia()
	.post('/login', ({ body }) => {
	                 // ^?
		return body
	}, {
		body: models.customBody
	})
```

### ❌ Don't: Declare a class instance as a model

Do not declare a class instance as a model:

```typescript
// ❌ Don't
class CustomBody {
	username: string
	password: string

	constructor(username: string, password: string) {
		this.username = username
		this.password = password
	}
}

// ❌ Don't
interface ICustomBody {
	username: string
	password: string
}
```

### Group

You can group multiple models into a single object to make it more organized.

```typescript
import { Elysia, t } from 'elysia'

export const AuthModel = {
	sign: t.Object({
		username: t.String(),
		password: t.String()
	})
}

const models = AuthModel.models
```

### Model Injection

Though this is optional, if you are strictly following MVC pattern, you may want to inject like a service into a controller. We recommended using [Elysia reference model](/essential/validation#reference-model)

Using Elysia's model reference

```typescript twoslash
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

const AuthModel = new Elysia()
    .model({
        sign: customBody
    })

const models = AuthModel.models

const UserController = new Elysia({ prefix: '/auth' })
    .use(AuthModel)
    .prefix('model', 'auth.')
    .post('/sign-in', async ({ body, cookie: { session } }) => {
                             // ^?

        return true
    }, {
        body: 'auth.Sign'
    })
```

This approach provides several benefits:

1. Allows you to name a model and provide auto-completion.
2. Modifies schemas for later usage, or performs a [remap](/essential/handler.html#remap).
3. Shows up as "models" in OpenAPI-compliant clients, eg. OpenAPI.
4. Improves TypeScript inference speed as model types will be cached during registration.

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/encapsulation.md'
---

# Encapsulation

Elysia hooks are **encapsulated** to its own instance only.

If you create a new instance, it will not share hooks with other instances.

```ts
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(
		({ query: { name }, status }) => {
			if(!name)
				return status(401)
		}
	)
	.get('/profile', () => 'Hi!')

new Elysia()
	.use(profile)
	.patch('/rename', () => 'Ok! XD')
	.listen(3000)
```

> Try changing the path in the URL bar to **/rename** and see the result

**Elysia isolates lifecycle** unless explicitly stated.

This is similar to **export** in JavaScript, where you need to export the function to make it available outside the module.

To **"export"** the lifecycle to other instances, you must specify the scope.

### Scope

There are 3 scopes available:

1. **local** (default) - apply to only current instance and descendant only
2. **scoped** - apply to parent, current instance and descendants
3. **global** - apply to all instance that apply the plugin (all parents, current, and descendants)

In our case, we want to apply the sign-in check to the `app` which is a direct parent, so we can use either **scoped** or **global**.

```ts
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(
		{ as: 'scoped' }, // [!code ++]
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

Casting lifecycle to **"scoped"** will export lifecycle to **parent instance**.
While **"global"** will export lifecycle to **all instances** that has a plugin.

Learn more about this in scope.

## Guard

Similar to lifecycle, **schema** is also encapsulated to its own instance.

We can specify guard scope similar to lifecycle.

```typescript
import { Elysia } from 'elysia'

const user = new Elysia()
	.guard({
		as: 'scoped', // [!code ++]
		query: t.Object({
			age: t.Number(),
			name: t.Optional(t.String())
		}),
		beforeHandle({ query: { age }, status }) {
			if(age < 18) return status(403)
		}
	})
	.get('/profile', () => 'Hi!')
	.get('/settings', () => 'Settings')
```

It's very important to note that every hook will affect all routes **after** its declaration.

See Scope for more information.

## Assignment

Let's define a scope for `nameCheck`, and `ageCheck` to make our app works.

\<template #answer>

We can modify scope as follows:

1. modify `nameCheck` scope to **scoped**
2. modify `ageCheck` scope to **global**

```typescript
import { Elysia, t } from 'elysia'

const nameCheck = new Elysia()
	.onBeforeHandle(
		{ as: 'scoped' }, // [!code ++]
		({ query: { name }, status }) => {
			if(!name) return status(401)
		}
	)

const ageCheck = new Elysia()
	.guard({
		as: 'global', // [!code ++]
		query: t.Object({
			age: t.Number(),
			name: t.Optional(t.String())
		}),
		beforeHandle({ query: { age }, status }) {
			if(age < 18) return status(403)
		}
	})

const name = new Elysia()
	.use(nameCheck)
	.patch('/rename', () => 'Ok! XD')

const profile = new Elysia()
	.use(ageCheck)
	.use(name)
	.get('/profile', () => 'Hi!')

new Elysia()
	.use(profile)
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/guard.md'
---

# Guard

When you need to apply multiple hooks to your application, instead of repeating hooks multiple times, you can use `guard` to bulk add hooks to your application.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.onBeforeHandle(({ query: { name }, status }) => { // [!code --]
		if(!name) return status(401) // [!code --]
	}) // [!code --]
	.onBeforeHandle(({ query: { name } }) => { // [!code --]
		console.log(name) // [!code --]
	}) // [!code --]
	.onAfterResponse(({ responseValue }) => { // [!code --]
		console.log(responseValue) // [!code --]
	}) // [!code --]
	.guard({ // [!code ++]
		beforeHandle: [ // [!code ++]
			({ query: { name }, status }) => { // [!code ++]
				if(!name) return status(401) // [!code ++]
			}, // [!code ++]
			({ query: { name } }) => { // [!code ++]
				console.log(name) // [!code ++]
			} // [!code ++]
		], // [!code ++]
		afterResponse({ responseValue }) { // [!code ++]
			console.log(responseValue) // [!code ++]
		} // [!code ++]
	}) // [!code ++]
	.get(
		'/auth',
		({ query: { name = 'anon' } }) => `Hello ${name}!`,
		{
			query: t.Object({
				name: t.String()
			})
		}
	)
	.get(
		'/profile',
		({ query: { name = 'anon' } }) => `Hello ${name}!`,
		{
			query: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```

Not only that, you can also apply **schema** to multiple routes using `guard`.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		beforeHandle: [
			({ query: { name }, status }) => {
				if(!name) return status(401)
			},
			({ query: { name } }) => {
				console.log(name)
			}
		],
		afterResponse({ responseValue }) {
			console.log(responseValue)
		},
		query: t.Object({ // [!code ++]
			name: t.String() // [!code ++]
		}) // [!code ++]
	})
	.get(
		'/auth',
		({ query: { name = 'anon' } }) => `Hello ${name}!`,
		{ // [!code --]
			query: t.Object({ // [!code --]
				name: t.String() // [!code --]
			}) // [!code --]
		} // [!code --]
	)
	.get(
		'/profile',
		({ query: { name = 'anon' } }) => `Hello ${name}!`,
		{ // [!code --]
			query: t.Object({ // [!code --]
				name: t.String() // [!code --]
			}) // [!code --]
		} // [!code --]
	)
	.listen(3000)
```

This will apply hooks and schema to every route **after .guard** is called in the same instance.

See Guard for more information.

## Assignment

Let's put 2 types of hooks into practice.

\<template #answer>

We can use `beforeHandle` to intercept the request before it reaches the handler, and return a response with `status` method.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onBeforeHandle(({ query: { name }, status }) => {
		if(!name) return status(401)
	})
	.get('/auth', ({ query: { name = 'anon' } }) => {
		return `Hello ${name}!`
	})
	.get('/profile', ({ query: { name = 'anon' } }) => {
		return `Hello ${name}!`
	})
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/essential/handler.md'
---

# Handler&#x20;

**Handler** - a function that accepts an HTTP request and returns a response.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    // the function `() => 'hello world'` is a handler
    .get('/', () => 'hello world')
    .listen(3000)
```

A handler may be a literal value, and can be inlined.

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/', 'Hello Elysia')
    .get('/video', file('kyuukurarin.mp4'))
    .listen(3000)
```

Using an **inline value** always returns the same value which is useful to optimize performance for static resources like files.

This allows Elysia to compile the response ahead of time to optimize performance.

::: tip
Providing an inline value is not a cache.

Static resource values, headers and status can be mutated dynamically using lifecycle.
:::

## Context

**Context** contains request information which is unique for each request, and is not shared except for `store` (global mutable state).

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', (context) => context.path)
            // ^ This is a context
```

**Context** can only be retrieved in a route handler. It consists of:

#### Property

* [**body**](/essential/validation.html#body) - [HTTP message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages), form or file upload.
* [**query**](/essential/validation.html#query) - [Query String](https://en.wikipedia.org/wiki/Query_string), includes additional parameters for search query as JavaScript Object. (Query is extracted from a value after pathname starting from '?' question mark sign)
* [**params**](/essential/validation.html#params) - Elysia's path parameters parsed as JavaScript object
* [**headers**](/essential/validation.html#headers) - [HTTP Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers), additional information about the request like User-Agent, Content-Type, Cache Hint.
* [**cookie**](#cookie) - A global mutable signal store for interacting with Cookie (including get/set)
* [**store**](#state) - A global mutable store for Elysia instance

#### Utility Function

* [**redirect**](#redirect) - A function to redirect a response
* [**status**](#status) - A function to return custom status code
* [**set**](#set) - Property to apply to Response:
  * [**headers**](#set.headers) - Response headers

#### Additional Property

* [**request**](#request) - [Web Standard Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
* [**server**](#server-bun-only) - Bun server instance
* **path** - Pathname of the request

## status&#x20;

A function to return a custom status code with type narrowing.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ status }) => status(418, "Kirifuji Nagisa"))
    .listen(3000)
```

It's recommended to use the **never-throw** approach to return **status** instead of throwing as it:

* allows TypeScript to check if a return value is correctly typed to the response schema
* autocompletion for type narrowing based on status code
* type narrowing for error handling using End-to-end type safety ([Eden](/eden/overview))

## Set

**set** is a mutable property that forms a response accessible via `Context.set`.

```ts
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ set, status }) => {
		set.headers = { 'X-Teapot': 'true' }

		return status(418, 'I am a teapot')
	})
	.listen(3000)
```

### set.headers

Allows us to append or delete response headers represented as an Object.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set }) => {
        set.headers['x-powered-by'] = 'Elysia'

        return 'a mimir'
    })
    .listen(3000)
```

::: tip
Elysia provides auto-completion for lowercase for case-sensitivity consistency, eg. use `set-cookie` rather than `Set-Cookie`.
:::

Redirect a request to another resource.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ redirect }) => {
        return redirect('https://youtu.be/whpVWVWBW4U?&t=8')
    })
    .get('/custom-status', ({ redirect }) => {
        // You can also set custom status to redirect
        return redirect('https://youtu.be/whpVWVWBW4U?&t=8', 302)
    })
    .listen(3000)
```

When using redirect, returned value is not required and will be ignored. As response will be from another resource.

Set a default status code if not provided.

It's recommended to use this in a plugin that only needs to return a specific status code while allowing the user to return a custom value. For example, HTTP 201/206 or 403/405, etc.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(({ set }) => {
        set.status = 418

        return 'Kirifuji Nagisa'
    })
    .get('/', () => 'hi')
    .listen(3000)
```

Unlike the `status` function, `set.status` cannot infer the return value type, therefore it can't check if the return value is correctly typed to the response schema.

::: tip
HTTP Status indicates the type of response. If the route handler is executed successfully without error, Elysia will return the status code 200.
:::

You can also set a status code using the common name of the status code instead of using a number.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set }) => {
        set.status = 418

        return 'Kirifuji Nagisa'
    })
    .listen(3000)
```

## Cookie

Elysia provides a mutable store for interacting with cookies.

There's no need for get/set; you can extract the cookie name and retrieve or update its value directly.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/set', ({ cookie: { name } }) => {
		// Get
        name.value

        // Set
        name.value = "New Value"
	})
```

See [Patterns: Cookie](/patterns/cookie) for more information.

## Redirect

Redirect a request to another resource.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ redirect }) => {
		return redirect('https://youtu.be/whpVWVWBW4U?&t=8')
	})
	.get('/custom-status', ({ redirect }) => {
		// You can also set custom status to redirect
		return redirect('https://youtu.be/whpVWVWBW4U?&t=8', 302)
	})
	.listen(3000)
```

When using redirect, returned value is not required and will be ignored. As response will be from another resource.

## Formdata

We can return a `FormData` by returning the `form` utility directly from the handler.

```typescript
import { Elysia, form, file } from 'elysia'

new Elysia()
	.get('/', () => form({
		name: 'Tea Party',
		images: [file('nagi.web'), file('mika.webp')]
	}))
	.listen(3000)
```

This pattern is useful if you ever need to return a file or multipart form data.

### Return a file

Or alternatively, you can return a single file by returning `file` directly without `form`.

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
	.get('/', file('nagi.web'))
	.listen(3000)
```

## Stream

To return a response streaming out of the box, use a generator function with the `yield` keyword.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})
```

In this example, we stream a response by using the `yield` keyword.

## Server Sent Events (SSE)

Elysia supports [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) by providing a `sse` utility function.

```typescript
import { Elysia, sse } from 'elysia'

new Elysia()
	.get('/sse', function* () {
		yield sse('hello world')
		yield sse({
			event: 'message',
			data: {
				message: 'This is a message',
				timestamp: new Date().toISOString()
			},
		})
	})
```

When a value is wrapped in `sse`, Elysia will automatically set the response headers to `text/event-stream` and format the data as an SSE event.

### Headers in Server-Sent Event

Headers can only be set before the first chunk is yielded.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* ({ set }) {
		// This will set headers
		set.headers['x-name'] = 'Elysia'
		yield 1
		yield 2

		// This will do nothing
		set.headers['x-id'] = '1'
		yield 3
	})
```

Once the first chunk is yielded, Elysia will send the headers to the client, therefore mutating headers after the first chunk is yielded will do nothing.

### Conditional Stream

If the response is returned without yield, Elysia will automatically convert stream to normal response instead.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* () {
		if (Math.random() > 0.5) return 'ok'

		yield 1
		yield 2
		yield 3
	})
```

This allows us to conditionally stream a response or return a normal response if necessary.

### Automatic cancellation

Before response streaming is completed, if the user cancels the request, Elysia will automatically stop the generator function.

### Eden

[Eden](/eden/overview) will interpret a stream response as `AsyncGenerator` allowing us to use `for await` loop to consume the stream.

```typescript
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
```

## Request

Elysia is built on top of [Web Standard Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) which is shared between multiple runtime like Node, Bun, Deno, Cloudflare Worker, Vercel Edge Function, and more.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/user-agent', ({ request }) => {
		return request.headers.get('user-agent')
	})
	.listen(3000)
```

This allows access to low-level request information if necessary.

## Server Bun only

Server instance is a Bun server instance, allowing us to access server information like port number or request IP.

Server will only be available when HTTP server is running with `listen`.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/port', ({ server }) => {
		return server?.port
	})
	.listen(3000)
```

### Request IP Bun only

We can get request IP by using `server.requestIP` method

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/ip', ({ server, request }) => {
		return server?.requestIP(request)
	})
	.listen(3000)
```

## Extending context Advanced concept

Elysia provides a minimal Context by default, allowing you to extend the Context for your specific needs using state, decorate, derive, and resolve.

See [Extends Context](/patterns/extends-context) for more information on how to extend a Context.

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/handler-and-context.md'
---

# Handler and Context

**Handler** - a resource or a route function to send data back to client.

```ts
import { Elysia } from 'elysia'

new Elysia()
    // `() => 'hello world'` is a handler
    .get('/', () => 'hello world')
    .listen(3000)
```

A handler can also be a literal value, see Handler

```ts
import { Elysia } from 'elysia'

new Elysia()
    // `'hello world'` is a handler
    .get('/', 'hello world')
    .listen(3000)
```

Using an inline value can be useful for static resources like **files**.

## Context

Contains information about each request. It is passed as the only argument of a handler.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', (context) => context.path)
            // ^ This is a context
```

**Context** stores information about the request like:

* body - data sent by client to server like form data, JSON payload.
* query - query string as an object. (Query is extracted from a value after pathname starting from '?' question mark sign)
* params - Path parameters parsed as object
* headers - HTTP Header, additional information about the request like "Content-Type".

See Context.

## Preview

You can preview the result by looking under the **editor** section.

There should be a tiny navigator on the **top left** of the preview window.

You can use it to switch between path and method to see the response.

You can also click  to edit body, and headers.

## Assignment

Let's try extracting context parameters:

\<template #answer>

1. We can extract `body`, `query`, and `headers` from the first parameter of a callback function.
2. We can then return them like `{ body, query, headers }`.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.post('/', ({ body, query, headers }) => {
		return {
			query,
			body,
			headers
		}
	})
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/life-cycle.md'
---

# Lifecycle

Lifecycle **hooks** are functions that are executed on a specific event during the request-response cycle.

They allow you to run custom logic at a certain point

* request - when a request is received
* beforeHandle - before executing a handler
* afterResponse - after a response is sent, etc.
* error - when an error occurs

This can be useful for tasks like logging, authentication, etc.

To register a lifecycle hook, you can pass it as the 3rd argument of a route method:

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/1', () => 'Hello Elysia!')
	.get('/auth', () => {
		console.log('This is executed after "beforeHandle"')

		return 'Oh you are lucky!'
	}, {
		beforeHandle({ request, status }) {
			console.log('This is executed before handler')

			if(Math.random() <= 0.5)
				return status(418)
		}
	})
	.get('/2', () => 'Hello Elysia!')
```

Here we use `status(418)` which is the "I'm a teapot" status code. You can also use the string name directly: `status("I'm a teapot")`. See Status for more on using status codes.

When `beforeHandle` returns a value, it will skip the handler and return the value instead.

This is useful for things like authentication, where you want to return a `401 Unauthorized` response if the user is not authenticated.

See Life Cycle, Before Handle for a more detailed explanation.

## Hook

A function that intercepts the **lifecycle event**. because a function **"hooks"** into the lifecycle event

Hook can be categorized into 2 types:

1. Local Hook - execute on a specific route
2. Interceptor Hook - execute on every route **after the hook is registered**

## Local Hook

A local hook is executed on a specific route.

To use a local hook, you can inline hook into a route handler:

```typescript
// Similar to previous code snippet
import { Elysia } from 'elysia'

new Elysia()
	.get('/1', () => 'Hello Elysia!')
	.get('/auth', () => {
		console.log('Run after "beforeHandle"')

		return 'Oh you are lucky!'
	}, {
		// This is a Local Hook
		beforeHandle({ request, status }) {
			console.log('Run before handler')

			if(Math.random() <= 0.5)
				return status(418)
		}
	})
	.get('/2', () => 'Hello Elysia!')
```

## Interceptor Hook

Register hook into every **handler that came after the hook is called** for the current instance only.

To add an interceptor hook, you can use `.on` followed by a lifecycle event:

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/1', () => 'Hello Elysia!')
	.onBeforeHandle(({ request, status }) => {
		console.log('This is executed before handler')

		if(Math.random() <= 0.5)
			return status(418)
	})
	// "beforeHandle" is applied
	.get('/auth', () => {
		console.log('This is executed after "beforeHandle"')

		return 'Oh you are lucky!'
	})
	// "beforeHandle" is also applied
	.get('/2', () => 'Hello Elysia!')
```

Unlike Local Hook, Interceptor Hook will add the hook to every route that came after the hook is registered.

## Assignment

Let's put 2 types of hooks into practice.

\<template #answer>

We can use `beforeHandle` to intercept the request before it reaches the handler, and return a response with `status` method.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onBeforeHandle(({ query: { name }, status }) => {
		if(!name) return status(401)
	})
	.get('/auth', ({ query: { name = 'anon' } }) => {
		return `Hello ${name}!`
	})
	.get('/profile', ({ query: { name = 'anon' } }) => {
		return `Hello ${name}!`
	})
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/essential/life-cycle.md'
---

# Lifecycle&#x20;

Instead of a sequential process, Elysia's request handling is divided into multiple stages called **lifecycle events**.

It's designed to separate the process into distinct phases based on their responsibility without interfering with each others.

Here are the lifecycle events in order:

***

Elysia's lifecycle can be illustrated as the following.
![Elysia Life Cycle Graph](/assets/lifecycle-chart.svg)

> Click on image to enlarge

## Why

Let’s say we want to send back some HTML.

Normally, we’d set the **"Content-Type"** header to **"text/html"** so the browser can render it.

But manually setting one for each route is tedious.

Instead, what if the framework could detect when a response is HTML and automatically set the header for you? That’s where the idea of a lifecycle comes in.

## Hook

Each function that intercepts the **lifecycle event** is called a **"hook"**.

(as the function **"hooks"** into the lifecycle event)

Hooks can be categorized into 2 types:

1. [Local Hook](#local-hook): Execute on a specific route
2. [Interceptor Hook](#interceptor-hook): Execute on every route **after the hook is registered**

::: tip
The hook will accept the same Context as a handler; you can imagine adding a route handler but at a specific point.
:::

## Local Hook

A local hook is executed on a specific route.

To use a local hook, you can inline hook into a route handler:

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysia/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ responseValue, set }) {
            if (isHtml(responseValue))
                set.headers['Content-Type'] = 'text/html; charset=utf8'
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

The response should be listed as follows:

| Path | Content-Type             |
| ---- | ------------------------ |
| /    | text/html; charset=utf8  |
| /hi  | text/plain; charset=utf8 |

## Interceptor Hook

Register hook into every handler **of the current instance** that came after.

To add an interceptor hook, you can use `.on` followed by a lifecycle event in camelCase:

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysia/html'

new Elysia()
    .get('/none', () => '<h1>Hello World</h1>')
    .onAfterHandle(({ responseValue, set }) => {
        if (isHtml(responseValue))
            set.headers['Content-Type'] = 'text/html; charset=utf8'
    })
    .get('/', () => '<h1>Hello World</h1>')
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

The response should be listed as follows:

| Path  | Content-Type             |
| ----- | ------------------------ |
| /none | text/**plain**; charset=utf8 |
| /     | text/**html**; charset=utf8  |
| /hi   | text/**html**; charset=utf8  |

Events from other plugins are also applied to the route, so the order of code is important.

## Order of code

Event will only apply to routes **after** it is registered.

If you put the `onError` before plugin, plugin will not inherit the `onError` event.

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

This also applies to the plugin.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onBeforeHandle(() => {
		console.log('1')
	})
	.use(someRouter)
	.onBeforeHandle(() => {
		console.log('2')
	})
	.listen(3000)
```

In this example, only **1** will be logged because the event is registered after the plugin.

Every event follows the same rule except `onRequest`.
Because onRequest happens on request, it doesn't know which route to apply it to, so it's a global event

## Request

The first lifecycle event to be executed for every new request.

As `onRequest` is designed to provide only the most crucial context to reduce overhead, it is recommended to use in the following scenarios:

* Caching
* Rate Limiter / IP/Region Lock
* Analytic
* Provide custom header, eg. CORS

#### Example

Below is a pseudocode to enforce rate-limits on a certain IP address.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .use(rateLimiter)
    .onRequest(({ rateLimiter, ip, set, status }) => {
        if (rateLimiter.check(ip)) return status(420, 'Enhance your calm')
    })
    .get('/', () => 'hi')
    .listen(3000)
```

If a value is returned from `onRequest`, it will be used as the response and the rest of the lifecycle will be skipped.

### Pre Context

The `onRequest` context is typed as `PreContext`, a minimal representation of `Context` with the following attributes:
request: `Request`

* set: `Set`
* store
* decorators

Context doesn't provide `derived` value because derive is based on `onTransform` event.

## Parse

Parse is an equivalent of **body parser** in Express.

A function to parse the body; the return value will be appended to `Context.body`. If not, Elysia will continue iterating through additional parser functions assigned by `onParse` until either body is assigned or all parsers have been executed.

By default, Elysia will parse the body with content-type of:

* `text/plain`
* `application/json`
* `multipart/form-data`
* `application/x-www-form-urlencoded`

It's recommended to use the `onParse` event to provide a custom body parser that Elysia doesn't provide.

#### Example

Below is an example code to retrieve value based on custom headers.

```typescript
import { Elysia } from 'elysia'

new Elysia().onParse(({ request, contentType }) => {
    if (contentType === 'application/custom-type') return request.text()
})
```

The returned value will be assigned to `Context.body`. If not, Elysia will continue iterating through additional parser functions from **onParse** stack until either body is assigned or all parsers have been executed.

### Context

`onParse` context extends from `Context` with the following additional properties:

* contentType: Content-Type header of the request

All of the context is based on normal context and can be used like normal context in route handler.

### Parser

By default, Elysia will try to determine body parsing function ahead of time and pick the most suitable function to speed up the process.

Elysia is able to determine that body function by reading `body`.

Take a look at this example:

```typescript
import { Elysia, t } from 'elysia'

new Elysia().post('/', ({ body }) => body, {
    body: t.Object({
        username: t.String(),
        password: t.String()
    })
})
```

Elysia reads the body schema and finds that the type is entirely an object, so it's likely that the body will be JSON. Elysia then picks the JSON body parser function ahead of time and tries to parse the body.

Here are the criteria that Elysia uses to select the body parser type:

* `application/json`: body typed as `t.Object`
* `multipart/form-data`: body typed as `t.Object`, and is 1 level deep with `t.File`
* `application/x-www-form-urlencoded`: body typed as `t.URLEncoded`
* `text/plain`: other primitive type

This allows Elysia to optimize body parser ahead of time, and reduce overhead in compile time.

### Explicit Parser

However, in some scenarios if Elysia fails to pick the correct body parser function, we can explicitly tell Elysia to use a certain function by specifying `type`.

```typescript
import { Elysia } from 'elysia'

new Elysia().post('/', ({ body }) => body, {
    // Short form of application/json
    parse: 'json'
})
```

This allows us to control Elysia behavior for picking body parser function to fit our needs in a complex scenario.

`type` may be one of the following:

```typescript
type ContentType = |
    // Shorthand for 'text/plain'
    | 'text'
    // Shorthand for 'application/json'
    | 'json'
    // Shorthand for 'multipart/form-data'
    | 'formdata'
    // Shorthand for 'application/x-www-form-urlencoded'
    | 'urlencoded'
    // Skip body parsing entirely
    | 'none'
    | 'text/plain'
    | 'application/json'
    | 'multipart/form-data'
    | 'application/x-www-form-urlencoded'
```

### Skip Body Parsing

When you need to integrate a third-party library with an HTTP handler like `trpc` or `orpc`, and it throws `Body is already used`.

This is because Web Standard Request can be parsed only once.

Both Elysia and the third-party library both has its own body parser, so you can skip body parsing on Elysia side by specifying `parse: 'none'`

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.post(
		'/',
		({ request }) => library.handle(request),
		{
			parse: 'none'
		}
	)
```

### Custom Parser

You can register a custom parser with `parser`:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .parser('custom', ({ request, contentType }) => {
        if (contentType === 'application/elysia') return request.text()
    })
    .post('/', ({ body }) => body, {
        parse: ['custom', 'json']
    })
```

## Transform

Executed just before **Validation** process, designed to mutate context to conform with the validation or appending new value.

It's recommended to use transform for the following:

* Mutating the existing context to conform with validation.
* `derive` is based on `onTransform` with support for providing type.

#### Example

Below is an example of using transform to mutate params to be numeric values.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        }),
        transform({ params }) {
            const id = +params.id

            if (!Number.isNaN(id)) params.id = id
        }
    })
    .listen(3000)
```

## Derive

Append new value to context directly **before validation**. It's stored in the same stack as **transform**.

Unlike **state** and **decorate**, which assign values before the server starts, **derive** assigns a property when each request happens. This allows us to extract a piece of information into a property.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers }) => {
        const auth = headers['Authorization']

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

Because **derive** is assigned once a new request starts, **derive** can access Request properties like **headers**, **query**, **body** where **store**, and **decorate** can't.

Unlike **state** and **decorate**, properties assigned by **derive** are unique and not shared with other requests.

::: tip
You might want to use [resolve](#resolve) instead of derive in most cases.

Resolve is similar to derive but execute after validation. This makes resolve more secure as we can validate the incoming data before using it to derive new properties.
:::

### Queue

`derive` and `transform` are stored in the same queue.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onTransform(() => {
        console.log(1)
    })
    .derive(() => {
        console.log(2)

        return {}
    })
```

The console should log as the following:

```bash
1
2
```

## Before Handle

Executed after validation and before the main route handler.

Designed to provide a custom validation to provide a specific requirement before running the main handler.

If a value is returned, the route handler will be skipped.

It's recommended to use Before Handle in the following situations:

* Restricted access check: authorization, user sign-in
* Custom request requirement over data structure

#### Example

Below is an example of using the before handle to check for user sign-in.

```typescript
import { Elysia } from 'elysia'
import { validateSession } from './user'

new Elysia()
    .get('/', () => 'hi', {
        beforeHandle({ set, cookie: { session }, status }) {
            if (!validateSession(session.value)) return status(401)
        }
    })
    .listen(3000)
```

The response should be listed as follows:

| Is signed in | Response     |
| ------------ | ------------ |
| ❌           | Unauthorized |
| ✅           | Hi           |

### Guard

When we need to apply the same before handle to multiple routes, we can use `guard` to apply the same before handle to multiple routes.

```typescript
import { Elysia } from 'elysia'
import { signUp, signIn, validateSession, isUserExists } from './user'

new Elysia()
    .guard(
        {
            beforeHandle({ set, cookie: { session }, status }) {
                if (!validateSession(session.value)) return status(401)
            }
        },
        (app) =>
            app
                .get('/user/:id', ({ body }) => signUp(body))
                .post('/profile', ({ body }) => signIn(body), {
                    beforeHandle: isUserExists
                })
    )
    .get('/', () => 'hi')
    .listen(3000)
```

## Resolve

Append new value to context **after validation**. It's stored in the same stack as **beforeHandle**.

Resolve syntax is identical to [derive](#derive), below is an example of retrieving a bearer header from the Authorization plugin.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .guard(
        {
            headers: t.Object({
                authorization: t.TemplateLiteral('Bearer ${string}')
            })
        },
        (app) =>
            app
                .resolve(({ headers: { authorization } }) => {
                    return {
                        bearer: authorization.split(' ')[1]
                    }
                })
                .get('/', ({ bearer }) => bearer)
    )
    .listen(3000)
```

Using `resolve` and `onBeforeHandle` is stored in the same queue.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(() => {
        console.log(1)
    })
    .resolve(() => {
        console.log(2)

        return {}
    })
    .onBeforeHandle(() => {
        console.log(3)
    })
```

The console should log as the following:

```bash
1
2
3
```

Same as **derive**, properties assigned by **resolve** are unique and not shared with other requests.

### Guard resolve

As resolve is not available in local hook, it's recommended to use guard to encapsulate the **resolve** event.

```typescript
import { Elysia } from 'elysia'
import { isSignIn, findUserById } from './user'

new Elysia()
    .guard(
        {
            beforeHandle: isSignIn
        },
        (app) =>
            app
                .resolve(({ cookie: { session } }) => ({
                    userId: findUserById(session.value)
                }))
                .get('/profile', ({ userId }) => userId)
    )
    .listen(3000)
```

## After Handle

Execute after the main handler, for mapping a returned value of **before handle** and **route handler** into a proper response.

It's recommended to use After Handle in the following situations:

* Transform requests into a new value, eg. Compression, Event Stream
* Add custom headers based on the response value, eg. **Content-Type**

#### Example

Below is an example of using the after handle to add HTML content type to response headers.

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysia/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response))
                set.headers['content-type'] = 'text/html; charset=utf8'
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

The response should be listed as follows:

| Path | Content-Type             |
| ---- | ------------------------ |
| /    | text/html; charset=utf8  |
| /hi  | text/plain; charset=utf8 |

### Returned Value

If a value is returned After Handle will use a return value as a new response value unless the value is **undefined**

The above example could be rewritten as the following:

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysia/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response)) {
                set.headers['content-type'] = 'text/html; charset=utf8'
                return new Response(response)
            }
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

Unlike **beforeHandle**, after a value is returned from **afterHandle**, the iteration of **afterHandle will NOT be skipped**.

### Context

`onAfterHandle` context extends from `Context` with the additional property of `response`, which is the response to return to the client.

The `onAfterHandle` context is based on the normal context and can be used like the normal context in route handlers.

## Map Response

Executed just after **"afterHandle"**, designed to provide custom response mapping.

It's recommended to use transform for the following:

* Compression
* Map value into a Web Standard Response

#### Example

Below is an example of using mapResponse to provide Response compression.

```typescript
import { Elysia } from 'elysia'

const encoder = new TextEncoder()

new Elysia()
    .mapResponse(({ responseValue, set }) => {
        const isJson = typeof responseValue === 'object'

        const text = isJson
            ? JSON.stringify(responseValue)
            : (responseValue?.toString() ?? '')

        set.headers['Content-Encoding'] = 'gzip'

        return new Response(Bun.gzipSync(encoder.encode(text)), {
            headers: {
                'Content-Type': `${
                    isJson ? 'application/json' : 'text/plain'
                }; charset=utf-8`
            }
        })
    })
    .get('/text', () => 'mapResponse')
    .get('/json', () => ({ map: 'response' }))
    .listen(3000)
```

Like **parse** and **beforeHandle**, after a value is returned, the next iteration of **mapResponse** will be skipped.

Elysia automatically handles merging **set.headers** from **mapResponse**. You don't need to worry about appending **set.headers** to the Response manually.

## On Error (Error Handling)

Designed for error handling. It will be executed when an error is thrown in any lifecycle.

It's recommended to use **onError** in the following situations:

* providing custom error messages
* fail-safe handling, an error handler, or retrying a request
* logging and analytics

#### Example

Elysia catches all the errors thrown in the handler, classifies the error code, and pipes them to `onError` middleware.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onError(({ error }) => {
        return new Response(error.toString())
    })
    .get('/', () => {
        throw new Error('Server is during maintenance')

        return 'unreachable'
    })
```

With `onError` we can catch and transform the error into a custom error message.

::: tip
It's important that `onError` must be registered before the handler you want to apply it to.
:::

### Custom 404 message

For example, returning custom 404 messages:

```typescript
import { Elysia, NotFoundError } from 'elysia'

new Elysia()
    .onError(({ code, status, set }) => {
        if (code === 'NOT_FOUND') return status(404, 'Not Found :(')
    })
    .post('/', () => {
        throw new NotFoundError()
    })
    .listen(3000)
```

### Context

`onError` context extends from `Context` with the following additional properties:

* **error**: A value that was thrown
* **code**: *Error Code*

### Error Code

Elysia error code consists of:

* **NOT\_FOUND**
* **PARSE**
* **VALIDATION**
* **INTERNAL\_SERVER\_ERROR**
* **INVALID\_COOKIE\_SIGNATURE**
* **INVALID\_FILE\_TYPE**
* **UNKNOWN**
* **number** (based on HTTP Status)

By default, the thrown error code is `UNKNOWN`.

::: tip
If no error response is returned, the error will be returned using `error.name`.
:::

### Local Error

Same as other lifecycle events, we provide an error into a [scope](/essential/plugin.html#scope) using guard:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'Hello', {
        beforeHandle({ set, request: { headers }, error }) {
            if (!isSignIn(headers)) throw error(401)
        },
        error() {
            return 'Handled'
        }
    })
    .listen(3000)
```

## After Response

Executed after the response sent to the client.

It's recommended to use **After Response** in the following situations:

* Clean up response
* Logging and analytics

#### Example

Below is an example of using the response handle to check for user sign-in.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onAfterResponse(() => {
        console.log('Response', performance.now())
    })
    .listen(3000)
```

Console should log as the following:

```bash
Response 0.0000
Response 0.0001
Response 0.0002
```

### Response

Similar to [Map Response](#map-resonse), `afterResponse` also accepts a `responseValue` value.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onAfterResponse(({ responseValue }) => {
		console.log(responseValue)
	})
	.get('/', () => 'Hello')
	.listen(3000)
```

`response` from `onAfterResponse` is not a Web Standard `Response` but is a value that is returned from the handler.

To get headers and status returned from the handler, we can access `set` from the context.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onAfterResponse(({ set }) => {
		console.log(set.status, set.headers)
	})
	.get('/', () => 'Hello')
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/plugin.md'
---

# Plugin

Every Elysia instance can be plug-and-play with other instances using the `use` method.

```typescript
import { Elysia } from 'elysia'

const user = new Elysia()
	.get('/profile', 'User Profile')
	.get('/settings', 'User Settings')

new Elysia()
	.use(user) // [!code ++]
	.get('/', 'Home')
	.listen(3000)
```

Once applied, all routes from `user` instance will be available in `app` instance.

### Plugin Config

You can also create a plugin that takes an argument and returns an Elysia instance to make a more dynamic plugin.

```typescript
import { Elysia } from 'elysia'

const user = ({ log = false }) => new Elysia() // [!code ++]
	.onBeforeHandle(({ request }) => {
		if (log) console.log(request)
	})
	.get('/profile', 'User Profile')
	.get('/settings', 'User Settings')

new Elysia()
	.use(user({ log: true })) // [!code ++]
	.get('/', 'Home')
	.listen(3000)
```

It's also recommended that you read about [Key Concept: Dependency](/key-concept#dependency) to understand how Elysia handles dependencies between plugins.

## Assignment

Let's apply the `user` instance to the `app` instance.

\<template #answer>

Similar to the above example, we can use the `use` method to plug the `user` instance into the `app` instance.

```typescript
import { Elysia } from 'elysia'

const user = new Elysia()
	.get('/profile', 'User Profile')
	.get('/settings', 'User Settings')

const app = new Elysia()
	.use(user) // [!code ++]
	.get('/', 'Home')
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/essential/plugin.md'
---

# Plugin&#x20;

A plugin is a part that is **decoupled** from the main instance.

Every Elysia instance can run independently or be used as part of another instance.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .decorate('plugin', 'hi')
    .get('/plugin', ({ plugin }) => plugin)

const app = new Elysia()
    .use(plugin)
    .get('/', ({ plugin }) => plugin)
               // ^?
    .listen(3000)
```

We can use the plugin by passing an instance to **Elysia.use**.

The plugin will inherit all properties of the plugin instance like `state`, `decorate` but **WILL NOT inherit plugin [lifecycle](/essential/life-cycle)** as it's [isolated by default](#scope) (mentioned in the next section ↓).

Elysia will also handle the type inference automatically as well.

::: tip
It's highly recommended that you have read [Key Concept: Dependency](/key-concept.html#dependency) before continuing.
:::

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

This approach force you to be explicit about dependencies allowing better tracking, modularity.

### Deduplication&#x20;

By default, each plugin will be re-executed **every time** applying to another instance.

To prevent this, Elysia can deduplicate [lifecycle](/essential/life-cycle) with **a unique identifier** using `name` and optional `seed` property.

```ts
import { Elysia } from 'elysia'

// `name` is an unique identifier
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

Adding the `name` and optional `seed` to the instance will make it a unique identifier to prevent it from being called multiple times.

Learn more about this in [plugin deduplication](/essential/plugin.html#plugin-deduplication).

### Global vs Explicit Dependency

There are some cases where global dependency makes more sense than an explicit one.

**Global** plugin example:

* **Plugin that doesn't add types** - eg. cors, compress, helmet
* Plugin that add global [lifecycle](/essential/life-cycle) that no instance should have control over - eg. tracing, logging

Example use cases:

* OpenAPI/Open - Global document
* OpenTelemetry - Global tracer
* Logging - Global logger

In cases like this, it makes more sense to create it as a global dependency instead of applying it to every instance.

However, if your dependency doesn't fit into these categories, it's recommended to use **explicit dependency** instead.

**Explicit dependency** example:

* **Plugin that add types** - eg. macro, state, model
* Plugin that add business logic that instance can interact with - eg. Auth, Database

Example use cases:

* State management - eg. Store, Session
* Data modeling - eg. ORM, ODM
* Business logic - eg. Auth, Database
* Feature module - eg. Chat, Notification

## Scope &#x20;

Elysia [lifecycle](/essential/life-cycle) methods are **encapsulated** within their own instance.

This means if you create a new instance, it will not share the lifecycle methods with other instances.

```ts
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(({ cookie }) => {
		throwIfNotSignIn(cookie)
	})
	.get('/profile', () => 'Hi there!')

const app = new Elysia()
	.use(profile)
	// ⚠️ This will NOT have a sign-in check
	.patch('/rename', ({ body }) => updateProfile(body))
```

In this example, the `isSignIn` check will only apply to `profile` but not `app`.

> Try changing the path in the URL bar to **/rename** and see the result

**Elysia isolate [lifecycle](/essential/life-cycle) by default** unless explicitly stated. This is similar to **export** in JavaScript, where you need to export the function to make it available outside the module.

To **"export"** the lifecycle to other instances, you must specify the scope.

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

### Scope level

Elysia has 3 levels of scope as the following:

Scope types are as follows:

1. **local** (default) - applies to the current instance and its descendants only
2. **scoped** - applies to the parent, current instance, and descendants
3. **global** - applies to all instances that use the plugin (all parents, current, and descendants)

Let's review what each scope level does by using the following example:

```typescript
import { Elysia } from 'elysia'


const child = new Elysia()
    .get('/child', 'hi')

const current = new Elysia()
	// ? Value based on the table provided below
    .onBeforeHandle({ as: 'local' }, () => { // [!code ++]
        console.log('hi')
    })
    .use(child)
    .get('/current', 'hi')

const parent = new Elysia()
    .use(current)
    .get('/parent', 'hi')

const main = new Elysia()
    .use(parent)
    .get('/main', 'hi')
```

By changing the `type` value, the result should be as follows:

| type       | child | current | parent | main |
| ---------- | ----- | ------- | ------ | ---- |
| local      | ✅    | ✅      | ❌      | ❌   |
| scoped     | ✅    | ✅      | ✅      | ❌   |
| global     | ✅    | ✅      | ✅      | ✅   |

### Descendant

By default, a plugin will **apply a hook to itself and its descendants** only.

If the hook is registered in a plugin, instances that use the plugin will **NOT** inherit hooks and schema.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .onBeforeHandle(() => {
        console.log('hi')
    })
    .get('/child', 'log hi')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'not log hi')
```

To apply a hook globally, we need to specify the hook as global.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .onBeforeHandle(() => {
        return 'hi'
    })
    .get('/child', 'child')
    .as('scoped')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'parent')
```

## Config

To make the plugin more useful, allowing customization via config is recommended.

You can create a function that accepts parameters that may change the behavior of the plugin to make it more reusable.

```typescript
import { Elysia } from 'elysia'

const version = (version = 1) => new Elysia()
        .get('/version', version)

const app = new Elysia()
    .use(version(1))
    .listen(3000)
```

### Functional callback

It's recommended to define a new plugin instance instead of using a function callback.

Functional callbacks allow access to existing properties of the main instance. For example, checking if specific routes or stores exist, but they make encapsulation and scope harder to handle correctly.

To define a functional callback, create a function that accepts Elysia as a parameter.

```typescript
import { Elysia } from 'elysia'

const plugin = (app: Elysia) => app
    .state('counter', 0)
    .get('/plugin', () => 'Hi')

const app = new Elysia()
    .use(plugin)
    .get('/counter', ({ store: { counter } }) => counter)
    .listen(3000)
```

Once passed to `Elysia.use`, functional callback behaves as a normal plugin except the property is assigned directly to the main instance.

::: tip
You should not worry about the performance difference between a functional callback and creating an instance.

Elysia can create 10k instances in a matter of milliseconds, the new Elysia instance has even better type inference performance than the functional callback.
:::

## Guard&#x20;

Guard allows you to apply a hook and schema to multiple routes all at once.

```typescript twoslash
const signUp = <T>(a: T) => a
const signIn = <T>(a: T) => a
const isUserExists = <T>(a: T) => a
// ---cut---
import { Elysia, t } from 'elysia'

new Elysia()
    .guard(
        { // [!code ++]
            body: t.Object({ // [!code ++]
                username: t.String(), // [!code ++]
                password: t.String() // [!code ++]
            }) // [!code ++]
        }, // [!code ++]
        (app) => // [!code ++]
            app
                .post('/sign-up', ({ body }) => signUp(body))
                .post('/sign-in', ({ body }) => signIn(body), {
                                                     // ^?
                    beforeHandle: isUserExists
                })
    )
    .get('/', 'hi')
    .listen(3000)
```

This code applies validation for `body` to both '/sign-in' and '/sign-up' instead of inlining the schema one by one, but does not apply to '/'.

We can summarize the route validation as the following:
| Path | Has validation |
| ------- | ------------- |
| /sign-up | ✅ |
| /sign-in | ✅ |
| / | ❌ |

Guard accepts the same parameters as inline hooks; the only difference is that you can apply a hook to multiple routes in the scope.

This means that the code above is translated into:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/sign-up', ({ body }) => signUp(body), {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign-in', ({ body }) => body, {
        beforeHandle: isUserExists,
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .get('/', () => 'hi')
    .listen(3000)
```

### Grouped Guard

We can use a group with prefixes by providing 3 parameters to the group.

1. Prefix - Route prefix
2. Guard - Schema
3. Scope - Elysia app callback

With the same API as guard apply to the 2nd parameter, instead of nesting group and guard together.

Consider the following example:

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .group('/v1', (app) =>
        app.guard(
            {
                body: t.Literal('Rikuhachima Aru')
            },
            (app) => app.post('/student', ({ body }) => body)
                                            // ^?
        )
    )
    .listen(3000)
```

From nested grouped guards, we can merge group and guard together by providing guard scope to the 2nd parameter of group:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/v1',
        (app) => app.guard( // [!code --]
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app.post('/student', ({ body }) => body)
        ) // [!code --]
    )
    .listen(3000)
```

This results in the following syntax:

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/v1',
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app.post('/student', ({ body }) => body)
                                       // ^?
    )
    .listen(3000)
```

## Scope cast Advanced Concept

To apply a hook to a parent, you may use one of the following:

1. [inline as](#inline-as) applies to only a single hook
2. [guard as](#guard-as) applies to all hooks in a guard
3. [instance as](#instance-as) applies to all hooks in an instance

### Inline as

Every event listener will accept `as` parameter to specify the scope of the hook.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive({ as: 'scoped' }, () => { // [!code ++]
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

However, this method applies to only a single hook and may not be suitable for multiple hooks.

### Guard as

Every event listener will accept `as` parameter to specify the scope of the hook.

```typescript
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.guard({
		as: 'scoped', // [!code ++]
		response: t.String(),
		beforeHandle() {
			console.log('ok')
		}
	})
    .get('/child', 'ok')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'hello')
```

Guard allows us to apply `schema` and `hook` to multiple routes all at once while specifying the scope.

However, it doesn't support `derive` and `resolve` method.

### Instance as

`as` reads all hooks and schema scopes of the current instance, modifying them.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive(() => {
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)
    .as('scoped') // [!code ++]

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

Sometimes we want to reapply plugin to parent instance as well but as it's limited by `scoped` mechanism, it's limited to 1 parent only.

To apply to the parent instance, we need to **lift the scope up** to the parent instance, and `as` is the perfect method to do so.

Which means if you have `local` scope, and want to apply it to the parent instance, you can use `as('scoped')` to lift it up.

```typescript twoslash
// @errors: 2304 2345
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.guard({
		response: t.String()
	})
	.onBeforeHandle(() => { console.log('called') })
	.get('/ok', () => 'ok')
	.get('/not-ok', () => 1)
	.as('scoped') // [!code ++]

const instance = new Elysia()
	.use(plugin)
	.get('/no-ok-parent', () => 2)
	.as('scoped') // [!code ++]

const parent = new Elysia()
	.use(instance)
	// This now error because `scoped` is lifted up to parent
	.get('/ok', () => 3)
```

## Lazy Load

Modules are eagerly loaded by default.

Elysia will make sure that all modules are registered before the server starts.

However, some modules may be computationally heavy or blocking, making the server startup slow.

To solve this, Elysia allows you to provide an async plugin that will not block the server startup.

### Deferred Module

The deferred module is an async plugin that can be registered after the server is started.

```typescript
// plugin.ts
import { Elysia, file } from 'elysia'
import { loadAllFiles } from './files'

export const loadStatic = async (app: Elysia) => {
    const files = await loadAllFiles()

    files.forEach((asset) => app
        .get(asset, file(file))
    )

    return app
}
```

And in the main file:

```typescript
import { Elysia } from 'elysia'
import { loadStatic } from './plugin'

const app = new Elysia()
    .use(loadStatic)
```

### Lazy Load Module

Same as an async plugin, the lazy-load module will be registered after the server is started.

A lazy-load module can be either synchronous or asynchronous; as long as the module is used with `import`, the module will be lazy-loaded.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .use(import('./plugin'))
```

Using module lazy-loading is recommended when the module is computationally heavy and/or blocking.

To ensure module registration before the server starts, we can use `await` on the deferred module.

### Testing

In a test environment, we can use `await app.modules` to wait for deferred and lazy-loading modules.

```typescript
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Modules', () => {
    it('inline async', async () => {
        const app = new Elysia()
              .use(async (app) =>
                  app.get('/async', () => 'async')
              )

        await app.modules

        const res = await app
            .handle(new Request('http://localhost/async'))
            .then((r) => r.text())

        expect(res).toBe('async')
    })
})
```

---


---

---
url: 'https://elysiajs.com/essential/route.md'
---

# Routing&#x20;

Web servers use the request's **path and method** to look up the correct resource, known as **"routing"**.

We can define a route with **an HTTP verb method**, a path and a function to execute when matched.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hello')
    .get('/hi', 'hi')
    .listen(3000)
```

We can access the web server by going to **http://localhost:3000**

By default, web browsers will send a GET method when visiting a page.

::: tip
Using the interactive browser above, hover on the blue highlight area to see different results between each path.
:::

## Path type

Paths in Elysia can be grouped into 3 types:

* **static paths** - static strings to locate the resource
* **dynamic paths** - segments can be any value
* **wildcards** - path until a specific point can be anything

You can use all of the path types together to compose a behavior for your web server.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/1', 'static path')
    .get('/id/:id', 'dynamic path')
    .get('/id/*', 'wildcard path')
    .listen(3000)
```

## Static Path

Static path is a hardcoded string to locate the resource on the server.

```ts
import { Elysia } from 'elysia'

new Elysia()
	.get('/hello', 'hello')
	.get('/hi', 'hi')
	.listen(3000)
```

## Dynamic path

Dynamic paths match some part and capture the value to extract extra information.

To define a dynamic path, we can use a colon `:` followed by a name.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
                      // ^?
    .listen(3000)
```

Here, a dynamic path is created with `/id/:id`, which tells Elysia to capture the value `:id` segment with values like **/id/1**, **/id/123**, **/id/anything**.

When requested, the server should return the response as follows:

| Path                   | Response  |
| ---------------------- | --------- |
| /id/1                  | 1         |
| /id/123                | 123       |
| /id/anything           | anything  |
| /id/anything?name=salt | anything  |
| /id                    | Not Found |
| /id/anything/rest      | Not Found |

Dynamic paths are great to include things like IDs that can be used later.

We refer to the named variable path as **path parameter** or **params** for short.

### Multiple path parameters

You can have as many path parameters as you like, which will then be stored into a `params` object.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/id/:id/:name', ({ params: { id, name } }) => id + ' ' + name)
                             // ^?
    .listen(3000)
```

The server will respond as follows:

| Path                   | Response      |
| ---------------------- | ------------- |
| /id/1                  | 1             |
| /id/123                | 123           |
| /id/anything           | anything      |
| /id/anything?name=salt | anything      |
| /id                    | Not Found     |
| /id/anything/rest      | anything rest |

## Optional path parameters

Sometimes we might want a static and dynamic path to resolve the same handler.

We can make a path parameter optional by adding a question mark `?` after the parameter name.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id?', ({ params: { id } }) => `id ${id}`)
                          // ^?
    .listen(3000)
```

## Wildcards

Dynamic paths allow capturing a single segment while wildcards allow capturing the rest of the path.

To define a wildcard, we can use an asterisk `*`.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/*', ({ params }) => params['*'])
                    // ^?
    .listen(3000)
```

## Path priority

Elysia has path priorities as follows:

1. static paths
2. dynamic paths
3. wildcards

If both a static and a dynamic path are present, Elysia will resolve the static path rather than the dynamic path.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/1', 'static path')
    .get('/id/:id', 'dynamic path')
    .get('/id/*', 'wildcard path')
    .listen(3000)
```

## HTTP Verb

HTTP defines a set of request methods to indicate the desired action to be performed for a given resource

There are several HTTP verbs, but the most common ones are:

### GET

Requests using GET should only retrieve data.

### POST

Submits a payload to the specified resource, often causing state changes or side effects.

### PUT

Replaces all current representations of the target resource using the request's payload.

### PATCH

Applies partial modifications to a resource.

### DELETE

Deletes the specified resource.

***

To handle each of the different verbs, Elysia has a built-in API for several HTTP verbs by default, similar to `Elysia.get`

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hello')
    .post('/hi', 'hi')
    .listen(3000)
```

The Elysia HTTP method accepts the following parameters:

* **path**: Pathname
* **function**: Function to respond to the client
* **hook**: Additional metadata

You can read more about the HTTP methods on [HTTP Request Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

## Custom Method

We can accept custom HTTP Methods with `Elysia.route`.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/get', 'hello')
    .post('/post', 'hi')
    .route('M-SEARCH', '/m-search', 'connect') // [!code ++]
    .listen(3000)
```

**Elysia.route** accepts the following:

* **method**: HTTP Verb
* **path**: Pathname
* **function**: Function to respond to the client
* **hook**: Additional metadata

::: tip
Based on [RFC 7231](https://www.rfc-editor.org/rfc/rfc7231#section-4.1), HTTP Verb is case-sensitive.

It's recommended to use the UPPERCASE convention for defining a custom HTTP Verb with Elysia.
:::

### ALL method

Elysia provides an `Elysia.all` for handling any HTTP method for a specified path using the same API like **Elysia.get** and **Elysia.post**

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .all('/', 'hi')
    .listen(3000)
```

Any HTTP method that matches the path, will be handled as follows:
| Path | Method | Result |
| ---- | -------- | ------ |
| / | GET | hi |
| / | POST | hi |
| / | DELETE | hi |

## Handle

Most developers use REST clients like Postman, Insomnia or Hoppscotch to test their API.

However, Elysia can be programmatically tested using `Elysia.handle`.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', 'hello')
    .post('/hi', 'hi')
    .listen(3000)

app.handle(new Request('http://localhost/')).then(console.log)
```

**Elysia.handle** is a function to process an actual request sent to the server.

::: tip
Unlike unit test's mock, **you can expect it to behave like an actual request** sent to the server.

But also useful for simulating or creating unit tests.
:::

## Group

When creating a web server, you will often have multiple routes sharing the same prefix:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .post('/user/sign-in', 'Sign in')
    .post('/user/sign-up', 'Sign up')
    .post('/user/profile', 'Profile')
    .listen(3000)
```

This can be improved with `Elysia.group`, allowing us to apply prefixes to multiple routes at the same time by grouping them together:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .group('/user', (app) =>
        app
            .post('/sign-in', 'Sign in')
            .post('/sign-up', 'Sign up')
            .post('/profile', 'Profile')
    )
    .listen(3000)
```

This code behaves the same as our first example and should be structured as follows:

| Path          | Result  |
| ------------- | ------- |
| /user/sign-in | Sign in |
| /user/sign-up | Sign up |
| /user/profile | Profile |

`.group()` can also accept an optional guard parameter to reduce boilerplate of using groups and guards together:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/user',
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app
            .post('/sign-in', 'Sign in')
            .post('/sign-up', 'Sign up')
            .post('/profile', 'Profile')
    )
    .listen(3000)
```

You may find more information about grouped guards in [scope](/essential/plugin.html#scope).

### Prefix

We can separate a group into a separate plugin instance to reduce nesting by providing a **prefix** to the constructor.

```typescript
import { Elysia } from 'elysia'

const users = new Elysia({ prefix: '/user' })
    .post('/sign-in', 'Sign in')
    .post('/sign-up', 'Sign up')
    .post('/profile', 'Profile')

new Elysia()
    .use(users)
    .get('/', 'hello world')
    .listen(3000)
```

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/status-and-headers.md'
---

# Status

A status code is an indicator of how the server handles the request.

You must have heard of the infamous **404 Not Found** when you visit a non-existing page.

That's a **status code**.

By default, Elysia will return **200 OK** for a successful request.

Elysia also returns many other status codes depending on the situation like:

* 400 Bad Request
* 422 Unprocessable Entity
* 500 Internal Server Error

You can also return a status code by returning your response using the `status` function.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ status }) => status(418, "I'm a teapot"))
	.listen(3000)
```

The status code can be a number or a string status name. These are equivalent:

```typescript
status(418, "I'm a teapot")
status("I'm a teapot", "I'm a teapot")
```

String status names provide TypeScript autocompletion for all valid HTTP statuses.

See Status.

## Redirect

Similarly, you can also redirect the request to another URL by returning the `redirect` function.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ redirect }) => redirect('https://elysiajs.com'))
	.listen(3000)
```

See Redirect.

## Headers

Unlike status code and redirect, which you can return directly, you might need to set headers multiple times in your application.

That's why instead of returning a `headers` function, Elysia provides a `set.headers` object to set headers.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ set }) => {
		set.headers['x-powered-by'] = 'Elysia'

		return 'Hello World'
	})
	.listen(3000)
```

Because `headers` represents **request headers**, Elysia distinguishes between request headers and response headers by prefixing **set.headers** for response.

See Headers.

## Assignment

Let's exercise what we have learned.

\<template #answer>

1. To set status code to `418 I'm a teapot`, we can use `status` function.
2. To redirect `/docs` to `https://elysiajs.com`, we can use `redirect` function.
3. To set a custom header `x-powered-by` to `Elysia`, we can use `set.headers` object.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ status, set }) => {
		set.headers['x-powered-by'] = 'Elysia'

		return status(418, 'Hello Elysia!')
	})
	.get('/docs', ({ redirect }) => redirect('https://elysiajs.com'))
	.listen(3000)
```

---


---

---
url: 'https://elysiajs.com/tutorial/getting-started/validation.md'
---

# Validation

Elysia offers data validation out of the box.

You can use `Elysia.t` to define a schema.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post(
		'/user',
		({ body: { name } }) => `Hello ${name}!`,
		{
			body: t.Object({
				name: t.String(),
				age: t.Number()
			})
		}
	)
	.listen(3000)
```

When you define a schema, Elysia will ensure the data is in a correct shape.

If the data doesn't match the schema, Elysia will return a **422 Unprocessable Entity** error.

See Validation.

### Bring your own

Alternatively, Elysia support **Standard Schema**, allowing you to use a library of your choice like **zod**, **yup** or **valibot**.

```typescript
import { Elysia } from 'elysia'
import { z } from 'zod'

new Elysia()
	.post(
		'/user',
		({ body: { name } }) => `Hello ${name}!`,
		{
			body: z.object({
				name: z.string(),
				age: z.number()
			})
		}
	)
	.listen(3000)
```

See Standard Schema for all compatible schema.

## Validation Type

You can validate the following property:

* `body`
* `query`
* `params`
* `headers`
* `cookie`
* `response`

Once a schema is defined, Elysia will infer types for you so you don't have to define a separate schema in TypeScript.

See Schema Type for each type.

## Response Validation

When you define a validation schema for `response`, Elysia will validate the response before sending it to the client, and type check the response for you.

You can also specify which status code to validate:

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get(
		'/user',
		() => `Hello Elysia!`,
		{
			response: {
				200: t.Literal('Hello Elysia!'),
				418: t.Object({
					message: t.Literal("I'm a teapot")
				})
			}
		}
	)
	.listen(3000)
```

See Response Validation.

## Assignment

Let's exercise what we have learned.

\<template #answer>

We can define a schema by using `t.Object` provided to the `body` property.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post(
		'/user',
		({ body: { name } }) => `Hello ${name}!`,
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
url: 'https://elysiajs.com/essential/validation.md'
---

# Validation&#x20;

Elysia provides a schema to validate data out of the box to ensure that the data is in the correct format.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

### TypeBox

**Elysia.t** is a schema builder based on [TypeBox](https://github.com/sinclairzx81/typebox) that provides type-safety at runtime, compile-time, and OpenAPI schema generation from a single source of truth.

Elysia tailors TypeBox for server-side validation for a seamless experience.

### Standard Schema

Elysia also supports [Standard Schema](https://github.com/standard-schema/standard-schema), allowing you to use your favorite validation library:

* Zod
* Valibot
* ArkType
* Effect Schema
* Yup
* Joi
* [and more](https://github.com/standard-schema/standard-schema)

To use Standard Schema, simply import the schema and provide it to the route handler.

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

You can use any validator together in the same handler without any issue.

## Schema type

Elysia supports declarative schemas with the following types:

***

These properties should be provided as the third argument of the route handler to validate the incoming request.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', () => 'Hello World!', {
        query: t.Object({
            name: t.String()
        }),
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

The response should be as follows:
| URL | Query | Params |
| --- | --------- | ------------ |
| /id/a | ❌ | ❌ |
| /id/1?name=Elysia | ✅ | ✅ |
| /id/1?alias=Elysia | ❌ | ✅ |
| /id/a?name=Elysia | ✅ | ❌ |
| /id/a?alias=Elysia | ❌ | ❌ |

When a schema is provided, the type will be inferred from the schema automatically and an OpenAPI type will be generated for API documentation, eliminating the redundant task of providing the type manually.

## Guard

Guard can be used to apply a schema to multiple handlers.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/none', ({ query }) => 'hi')
                   // ^?

    .guard({ // [!code ++]
        query: t.Object({ // [!code ++]
            name: t.String() // [!code ++]
        }) // [!code ++]
    }) // [!code ++]
    .get('/query', ({ query }) => query)
                    // ^?
    .listen(3000)
```

This code ensures that the query must have **name** with a string value for every handler after it. The response should be listed as follows:

The response should be listed as follows:

| Path          | Response |
| ------------- | -------- |
| /none         | hi       |
| /none?name=a  | hi       |
| /query        | error    |
| /query?name=a | a        |

If multiple global schemas are defined for the same property, the latest one will take precedence. If both local and global schemas are defined, the local one will take precedence.

### Guard Schema Type

Guard supports 2 types to define a validation.

### **override (default)**

Override schemas if they collide with each other.

![Elysia run with default override guard showing schema gets override](/blog/elysia-13/schema-override.webp)

### **standalone**&#x20;

Separate collided schemas, and run both independently resulting in both being validated.

![Elysia run with standalone merging multiple guard together](/blog/elysia-13/schema-standalone.webp)

To define schema type of guard with `schema`:

```ts
import { Elysia } from 'elysia'

new Elysia()
	.guard({
		schema: 'standalone', // [!code ++]
		response: t.Object({
			title: t.String()
		})
	})
```

## Body

An [HTTP message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages) is data sent to the server. It can be in the form of JSON, form-data, or any other format.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {
                    // ^?




		body: t.Object({
			name: t.String()
		})
	})
	.listen(3000)
```

The validation should be as follows:
| Body | Validation |
| --- | --------- |
| { name: 'Elysia' } | ✅ |
| { name: 1 } | ❌ |
| { alias: 'Elysia' } | ❌ |
| `undefined` | ❌ |

Elysia disables body-parser for **GET** and **HEAD** messages by default, following the specs of HTTP/1.1 [RFC2616](https://www.rfc-editor.org/rfc/rfc2616#section-4.3)

> If the request method does not include defined semantics for an entity-body, then the message-body SHOULD be ignored when handling the request.

Most browsers disable the attachment of the body by default for **GET** and **HEAD** methods.

#### Specs

Validate an incoming [HTTP Message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages) (or body).

These are additional messages for the web server to process.

The body is provided in the same way as the `body` in `fetch` API. The content type should be set accordingly to the defined body.

```typescript
fetch('https://elysiajs.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Elysia'
    })
})
```

### File

File is a special type of body that can be used to upload files.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {
                    // ^?





		body: t.Object({
			file: t.File({ format: 'image/*' }),
			multipleFiles: t.Files()
		})
	})
	.listen(3000)
```

By providing a file type, Elysia will automatically assume that the content-type is `multipart/form-data`.

### File (Standard Schema)

If you're using Standard Schema, it's important to note that Elysia will not be able to validate content type automatically similar to `t.File`.

But Elysia export a `fileType` that can be used to validate file type by using magic number.

```typescript
import { Elysia, fileType } from 'elysia'
import { z } from 'zod'

new Elysia()
	.post('/body', ({ body }) => body, {
		body: z.object({
			file: z.file().refine((file) => fileType(file, 'image/jpeg')) // [!code ++]
		})
	})
```

It's very important that you **should use the `fileType` utility to** validate the file type as **most validators don't actually validate the file** correctly, like checking the content type value which can lead to security vulnerabilities.

## Query

Query is the data sent through the URL. It can be in the form of `?key=value`.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/query', ({ query }) => query, {
                    // ^?




		query: t.Object({
			name: t.String()
		})
	})
	.listen(3000)
```

Query must be provided in the form of an object.

The validation should be as follows:
| Query | Validation |
| ---- | --------- |
| /?name=Elysia | ✅ |
| /?name=1 | ✅ |
| /?alias=Elysia | ❌ |
| /?name=ElysiaJS\&alias=Elysia | ✅ |
| / | ❌ |

#### Specs

A query string is part of the URL that starts with **?** and can contain one or more query parameters, which are key-value pairs used to convey additional information to the server, usually for customized behavior like filtering or searching.

![URL Object](/essential/url-object.svg)

Query is provided after the **?** in Fetch API.

```typescript
fetch('https://elysiajs.com/?name=Elysia')
```

When specifying query parameters, it's crucial to understand that all query parameter values are represented as strings. This is due to how they are encoded and appended to the URL.

### Coercion

Elysia will coerce applicable schema on `query` to respective type automatically.

See [Elysia behavior](/patterns/type#elysia-behavior) for more information.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ query }) => query, {
               // ^?




		query: t.Object({ // [!code ++]
			id: t.Number() // [!code ++]
		}) // [!code ++]
	})
	.listen(3000)
```

### Array

By default, Elysia treats query parameters as a single string even if specified multiple times.

To use arrays, we need to explicitly declare them as arrays.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ query }) => query, {
               // ^?




		query: t.Object({
			name: t.Array(t.String()) // [!code ++]
		})
	})
	.listen(3000)
```

Once Elysia detect that a property is assignable to array, Elysia will coerce it to an array of the specified type.

By default, Elysia format query array with the following format:

#### nuqs

This format is used by [nuqs](https://nuqs.47ng.com).

By using **,** as a delimiter, a property will be treated as array.

```
http://localhost?name=rapi,anis,neon&squad=counter
{
	name: ['rapi', 'anis', 'neon'],
	squad: 'counter'
}
```

#### HTML form format

If a key is assigned multiple times, the key will be treated as an array.

This is similar to HTML form format when an input with the same name is specified multiple times.

```
http://localhost?name=rapi&name=anis&name=neon&squad=counter
// name: ['rapi', 'anis', 'neon']
```

## Params

Params or path parameters are the data sent through the URL path.

They can be in the form of `/key`.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params }) => params, {
                      // ^?




		params: t.Object({
			id: t.Number()
		})
	})
```

Params must be provided in the form of an object.

The validation should be as follows:
| URL | Validation |
| --- | --------- |
| /id/1 | ✅ |
| /id/a | ❌ |

#### Specs

Path parameters (not to be confused with query string or query parameter).

**This is usually not needed as Elysia can infer types from path parameters automatically**, unless there is a need for a specific value pattern, such as a numeric value or template literal pattern.

```typescript
fetch('https://elysiajs.com/id/1')
```

### Params type inference

If a params schema is not provided, Elysia will automatically infer the type as a string.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params }) => params)
                      // ^?
```

## Headers

Headers are the data sent through the request's header.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/headers', ({ headers }) => headers, {
                      // ^?




		headers: t.Object({
			authorization: t.String()
		})
	})
```

Unlike other types, headers have `additionalProperties` set to `true` by default.

This means that headers can have any key-value pair, but the value must match the schema.

#### Specs

HTTP headers let the client and the server pass additional information with an HTTP request or response, usually treated as metadata.

This field is usually used to enforce some specific header fields, for example, `Authorization`.

Headers are provided in the same way as the `body` in `fetch` API.

```typescript
fetch('https://elysiajs.com/', {
    headers: {
        authorization: 'Bearer 12345'
    }
})
```

::: tip
Elysia will parse headers as lower-case keys only.

Please make sure that you are using lower-case field names when using header validation.
:::

## Cookie

Cookie is the data sent through the request's cookie.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/cookie', ({ cookie }) => cookie, {
                     // ^?



		cookie: t.Cookie({
			cookieName: t.String()
		})
	})
```

Cookies must be provided in the form of `t.Cookie` or `t.Object`.

Same as `headers`, cookies have `additionalProperties` set to `true` by default.

#### Specs

An HTTP cookie is a small piece of data that a server sends to the client. It's data sent with every visit to the same web server to let the server remember client information.

In simpler terms, it's a stringified state that is sent with every request.

This field is usually used to enforce some specific cookie fields.

A cookie is a special header field that the Fetch API doesn't accept a custom value for but is managed by the browser. To send a cookie, you must use a `credentials` field instead:

```typescript
fetch('https://elysiajs.com/', {
    credentials: 'include'
})
```

### t.Cookie

`t.Cookie` is a special type that is equivalent to `t.Object` but allows to set cookie-specific options.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/cookie', ({ cookie }) => cookie.name.value, {
                      // ^?




		cookie: t.Cookie({
			name: t.String()
		}, {
			secure: true,
			httpOnly: true
		})
	})
```

## Response

Response is the data returned from the handler.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/response', () => {
		return {
			name: 'Jane Doe'
		}
	}, {
		response: t.Object({
			name: t.String()
		})
	})
```

### Response per status

Responses can be set per status code.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/response', ({ status }) => {
		if (Math.random() > 0.5)
			return status(400, {
				error: 'Something went wrong'
			})

		return {
			name: 'Jane Doe'
		}
	}, {
		response: {
			200: t.Object({
				name: t.String()
			}),
			400: t.Object({
				error: t.String()
			})
		}
	})
```

This is an Elysia-specific feature, allowing us to make a field optional.

## Error Provider

There are two ways to provide a custom error message when the validation fails:

1. Inline `status` property
2. Using [onError](/essential/life-cycle.html#on-error) event

### Error Property

Elysia offers an additional **error** property, allowing us to return a custom error message if the field is invalid.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/', () => 'Hello World!', {
        body: t.Object({
            x: t.Number({
               	error: 'x must be a number'
            })
        })
    })
    .listen(3000)
```

The following is an example of using the error property on various types:

```typescript
t.String({
    format: 'email',
    error: 'Invalid email :('
})
```

```
Invalid Email :(
```

```typescript
t.Array(
    t.String(),
    {
        error: 'All members must be a string'
    }
)
```

```
All members must be a string
```

```typescript
t.Object({
    x: t.Number()
}, {
    error: 'Invalid object UnU'
})
```

```
Invalid object UnU
```

```typescript
t.Object({
    x: t.Number({
        error({ errors, type, validation, value }) {
            return 'Expected x to be a number'
        }
    })
})
```

```
Expected x to be a number
```

## Custom Error

TypeBox offers an additional "**error**" property, allowing us to return a custom error message if the field is invalid.

```typescript
t.String({
    format: 'email',
    error: 'Invalid email :('
})
```

```
Invalid Email :(
```

```typescript
t.Object({
    x: t.Number()
}, {
    error: 'Invalid object UnU'
})
```

```
Invalid object UnU
```

### Error message as function

In addition to a string, Elysia type's error can also accept a function to programmatically return a custom error for each property.

The error function accepts the same arguments as `ValidationError`

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/', () => 'Hello World!', {
        body: t.Object({
            x: t.Number({
                error() {
                    return 'Expected x to be a number'
                }
            })
        })
    })
    .listen(3000)
```

::: tip
Hover over the `error` to see the type.
:::

### Error is Called Per Field

Please note that the error function will only be called if the field is invalid.

Please consider the following table:

```typescript
t.Object({
    x: t.Number({
        error() {
            return 'Expected x to be a number'
        }
    })
})
```

```json
{
    x: "hello"
}
```

```typescript
t.Object({
    x: t.Number({
        error() {
            return 'Expected x to be a number'
        }
    })
})
```

```json
"hello"
```

```typescript
t.Object(
    {
        x: t.Number({
            error() {
                return 'Expected x to be a number'
            }
        })
    }, {
        error() {
            return 'Expected value to be an object'
        }
    }
)
```

```json
"hello"
```

### onError

We can customize the behavior of validation based on the [onError](/essential/life-cycle.html#on-error) event by narrowing down the error code to "**VALIDATION**".

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.onError(({ code, error }) => {
		if (code === 'VALIDATION')
		    return error.message
	})
	.listen(3000)
```

The narrowed-down error type will be typed as `ValidationError` imported from **elysia/error**.

**ValidationError** exposes a property named **validator**, typed as [TypeCheck](https://github.com/sinclairzx81/typebox#typecheck), allowing us to interact with TypeBox functionality out of the box.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .onError(({ code, error }) => {
        if (code === 'VALIDATION')
            return error.all[0].message
    })
    .listen(3000)
```

### Error List

**ValidationError** provides a method `ValidationError.all`, allowing us to list all of the error causes.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String(),
			age: t.Number()
		}),
		error({ code, error }) {
			switch (code) {
				case 'VALIDATION':
                    console.log(error.all)

                    // Find a specific error name (path is OpenAPI Schema compliance)
                    const name = error.all.find(
						(x) => x.summary && x.path === '/name'
					)

                    // If there is a validation error, then log it
                    if(name)
    					console.log(name)
			}
		}
	})
	.listen(3000)
```

For more information about TypeBox's validator, see [TypeCheck](https://github.com/sinclairzx81/typebox#typecheck).

## Reference Model

Sometimes you might find yourself declaring duplicate models or re-using the same model multiple times.

With a reference model, we can name our model and reuse it by referencing the name.

Let's start with a simple scenario.

Suppose we have a controller that handles sign-in with the same model.

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .post('/sign-in', ({ body }) => body, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        }),
        response: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

We can refactor the code by extracting the model as a variable and referencing it.

```typescript
import { Elysia, t } from 'elysia'

// Maybe in a different file eg. models.ts
const SignDTO = t.Object({
    username: t.String(),
    password: t.String()
})

const app = new Elysia()
    .post('/sign-in', ({ body }) => body, {
        body: SignDTO,
        response: SignDTO
    })
```

This method of separating concerns is an effective approach, but we might find ourselves reusing multiple models with different controllers as the app gets more complex.

We can resolve that by creating a "reference model", allowing us to name the model and use auto-completion to reference it directly in `schema` by registering the models with `model`.

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign-in', ({ body }) => body, {
        // with auto-completion for existing model name
        body: 'sign',
        response: 'sign'
    })
```

When we want to access the model's group, we can separate a `model` into a plugin, which when registered will provide a set of models instead of multiple imports.

```typescript
// auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

Then in an instance file:

```typescript twoslash
// @filename: auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })

// @filename: index.ts
// ---cut---
// index.ts
import { Elysia } from 'elysia'
import { authModel } from './auth.model'

const app = new Elysia()
    .use(authModel)
    .post('/sign-in', ({ body }) => body, {
        // with auto-completion for existing model name
        body: 'sign',
        response: 'sign'
    })
```

This approach not only allows us to separate concerns but also enables us to reuse the model in multiple places while integrating the model into OpenAPI documentation.

### Multiple Models

`model` accepts an object with the key as a model name and the value as the model definition. Multiple models are supported by default.

```typescript
// auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        number: t.Number(),
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

### Naming Convention

Duplicate model names will cause Elysia to throw an error. To prevent declaring duplicate model names, we can use the following naming convention.

Let's say that we have all models stored at `models/<name>.ts` and declare the prefix of the model as a namespace.

```typescript
import { Elysia, t } from 'elysia'

// admin.model.ts
export const adminModels = new Elysia()
    .model({
        'admin.auth': t.Object({
            username: t.String(),
            password: t.String()
        })
    })

// user.model.ts
export const userModels = new Elysia()
    .model({
        'user.auth': t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

This can prevent naming duplication to some extent, but ultimately, it's best to let your team decide on the naming convention.

Elysia provides an opinionated option to help prevent decision fatigue.

### TypeScript

We can get type definitions of every Elysia/TypeBox's type by accessing the `static` property as follows:

```ts twoslash
import { t } from 'elysia'

const MyType = t.Object({
	hello: t.Literal('Elysia')
})

type MyType = typeof MyType.static
//    ^?
```

This allows Elysia to infer and provide type automatically, reducing the need to declare duplicate schema

A single Elysia/TypeBox schema can be used for:

* Runtime validation
* Data coercion
* TypeScript type
* OpenAPI schema

This allows us to make a schema as a **single source of truth**.

---


---

