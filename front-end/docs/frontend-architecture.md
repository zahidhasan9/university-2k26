# Frontend architecture

## Request boundaries

- Server Components call `authenticatedRequest()` from `lib/auth.ts`. It reads the secure access
  cookie on the server and calls Express directly.
- Interactive client reads use TanStack Query with `apiRequest()` from `lib/http-client.ts`.
- Interactive writes use `useEndpointMutation()` from `lib/api-hooks.ts`.
- Forms that need to inspect a non-2xx validation response use the response-style
  `apiResponseRequest()` adapter. It accepts canonical relative endpoints and uses the same
  centralized Axios configuration and authentication redirect behavior.
- Browser requests never receive or attach the access token themselves. They call the Next.js
  `/api/backend/*` proxy.

## State ownership

- TanStack Query owns remote/server state and mutation lifecycle state.
- Redux Toolkit owns cross-feature client state only.
- Local component state owns transient form values and UI state that is not shared.
- Server Components own initial page data where client-side caching is unnecessary.

## API paths

`lib/api-endpoints.ts` is the canonical endpoint registry. New feature code should use its constants
and path builders instead of duplicating URL literals.

## Code quality commands

```bash
npm run format
npm run format:check
npm run lint
npm run build
```
