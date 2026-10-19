# BlockWarriors panel operations

This fork tracks upstream **v2.0.0-beta.2** on `blockwarriors-v2`. Pterodactyl v2 is open beta. Keep the upstream history and license; use the theme/extension surface for customization instead of changing authentication, authorization, or the core server engine.

## Build and validate

```sh
npm ci
npm run sdk:generate
npm run sdk:testing
npm ci --prefix packages/blockwarriors
npm run typecheck --prefix packages/blockwarriors
npm run test --prefix packages/blockwarriors
npm run build --prefix packages/blockwarriors
python3 -m unittest discover -s tools/blockwarriors -v
```

Install the built `packages/blockwarriors` directory using `php artisan p:extension:install <package> --enable`; use `--replace` for subsequent versions. Activate with `php artisan p:theme:activate blockwarriors`. Run `p:extension:doctor <package>` first. Ship the manifest and `dist` files together. Generated artifacts and credentials are not committed.

For a local synthetic-data preview, run Vite with `packages/blockwarriors/preview.config.mjs` from that package directory. Query `?page=login`, `?page=agents`, or the default dashboard. This fixture gallery has no live credentials or production data and is not part of the deployed extension.

## Member experience

White/neutral surfaces, black controls, green accents; responsive header and login. Server navigation emphasizes Console, Files, Backups, and Members. Advanced retains Network, Startup, Settings, Schedules, Databases, Activity, and extension screens where the member has permission. Admin navigation remains available only when the upstream model authorizes it. The theme changes presentation, never access control.

Agent access explains personal Client API keys and links to the tested Python CLI. Existing APIs, SFTP, password reset, passwords, and two-factor authentication remain upstream behavior. Google sign-in is a separate integration pending an organization-owned provider project; see [the design](google-sign-in.md).

## Upgrade procedure

Read the [upstream native migration guide](https://docs.pterodactyl.io/v2/upgrading/upgrading-from-v1) and [rehearsal guide](https://docs.pterodactyl.io/v2/upgrading/testing-the-upgrade) for every new release. Keep a private operations inventory outside this public repository.

1. Inventory versions and dependencies, live services, users/servers/nodes/API keys, and custom integrations. Nest API endpoints are removed in v2; update integrations that call them.
2. Back up database, full panel files, encryption key/environment, web/worker configuration, and Wings binary/config. Verify archive checksums and retain an off-host copy. These backups contain credentials and must remain private.
3. Rehearse against a separate database with an account unable to access the production database. Run migration commands with network isolation, no queue worker or scheduler, and separate cache/session state. Never regenerate APP_KEY. Run missing v1 migrations using the current v1 code before v2.
4. Compare counts and password/2FA/node-token/API-token/ownership fields. Test preserved keys, page rendering, theme compatibility, and node read operations. Restore the backup into a separate database and verify old-version/API boot as the rollback rehearsal.
5. Place the live panel in maintenance mode and stop its worker; take a fresh final database backup. Install v2 into a separate directory, preserve the environment and key, migrate, then swap directories. Keep the original directory intact.
6. Add the upstream static-only `/assets/` nginx block so extension assets cannot execute as PHP; reject hidden files. Check nginx configuration before reload. Restart PHP/queue worker only after the new directory and permissions are ready.
7. Check HTTPS, login bootstrap, API keys, server lists, both nodes, and logs before ending maintenance. If a gate fails before reopening, restore the original directory/config and the final database backup. After reopening, rollback needs incident coordination because database restoration discards subsequent panel writes and cannot undo external server changes.

The PHP `intl` extension is required; preserve a compatible PHP 8.3 installation for both old and new panels. The migration does not require restarting Minecraft containers. Changing Wings versions is a separate operation; validate its compatibility on every node, not just the panel host.

## Recovery and upstream updates

`?safe_mode=1` lets an administrator recover to the stock theme. `php artisan p:theme:activate classic` is the CLI fallback. UI rollback does not require a database rollback. Keep the beta release pinned and rehearse each update; do not use an unpinned automated `p:upgrade` for a major migration.

Node/API reachability is not a complete game lifecycle test. Reserve a disposable server to exercise power operations, console WebSockets, SFTP, schedules, and backups before relying on this beta for a tournament. Never use someone's active game as a destructive smoke test.
