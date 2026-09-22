-- Adds password-based sign-in. Nullable so a future SSO/TEC-intranet
-- account (no local password) would still be a valid row; the app's
-- ensureSeeded() backfills a password hash onto the seeded demo accounts
-- the first time it runs against a database migrated from 0001 alone.

alter table users add column if not exists password_hash text;
