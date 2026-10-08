-- A pitch re-run now requires a freshly uploaded deck: pitches.deck_version is bumped on every
-- upload and pitch_runs.deck_version records the version a run scored.

alter table pitches add column if not exists deck_version integer not null default 1;

alter table pitch_runs add column if not exists deck_version integer;
update pitch_runs set deck_version = 1 where deck_version is null;
alter table pitch_runs alter column deck_version set not null;
alter table pitch_runs alter column deck_version set default 1;
