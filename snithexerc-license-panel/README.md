# SNITHEXERC License Panel

## Vercel environment variables

Set these in Vercel Project Settings → Environment Variables:

- `ADMIN_USERNAME` — your admin username
- `ADMIN_PASSWORD` — your admin password
- `SESSION_SECRET` — long random secret

Example:

ADMIN_USERNAME=snithexerc
ADMIN_PASSWORD=choose-your-own-password
SESSION_SECRET=generate-a-long-random-value

Do not commit these values.

## Deploy

Import this project into Vercel. The admin panel is `/`.

Login creates an HttpOnly, Secure, SameSite session cookie.

## Important production note

The included key store uses process memory as a development/demo store. Vercel serverless functions are not a durable database, so generated keys can disappear between invocations/redeploys.

Before using this for real licenses, replace the store in `api/keys.js` and `api/revoke.js` with a persistent database such as Vercel Postgres/Neon/Supabase or another server-side datastore. The client should never receive the full key database.

`/api/validate` should be implemented against that same persistent datastore for the C++ client.
