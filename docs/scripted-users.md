# Scripted Users

> ⚠️ **Dev environment only.** These credentials must NEVER be used outside local development.

The application seeds two users on first start (Story 4.4). They satisfy the brief's "users can be scripted" requirement (no in-app user management).

| Username | Password | Notes                  |
|----------|----------|------------------------|
| `evi`    | `1234`   | Mirrors the original FE hardcoded user (`src/pages/Login.jsx`). |
| `nik`    | `5678`   | Same.                  |

## How seeding works

- `DataSeeder.SeedAsync` runs on every app startup but is idempotent — it inserts users only if `Users` is empty.
- Passwords are hashed with **BCrypt** (`BCrypt.Net-Next`).
- To reset and re-seed:

```sh
dotnet ef database update 0 --project backend/WebCalculator.Api
dotnet run --project backend/WebCalculator.Api
```

## For real production

Either remove `DataSeeder.SeedAsync` from the startup hook, or replace `ScriptedUsers` with credentials sourced from environment variables / a secret store. Out of scope for this exercise.
