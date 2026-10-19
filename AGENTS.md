# BlockWarriors panel fork

- Keep upstream engine, permission checks, password/2FA flows, and encryption compatible.
- Put member presentation changes in packages/blockwarriors, using the v2 theme SDK.
- Read docs/blockwarriors/operations.md before deployment; back up and rehearse migrations.
- Never commit credentials, database dumps, real member fixtures, or personal machine paths/references.
- The CLI reads its token from the environment. Do not log tokens or add mutation retries.
- Use treehouse to create or manage worktrees. Use chrome-devtools-axi when Chrome is requested.
