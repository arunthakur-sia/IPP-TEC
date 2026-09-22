-- TEC Innovation Program agent platform — initial schema.
-- Ported from the SQLite schema (lib/db/schema.ts, now retired) with JSON
-- text columns promoted to native jsonb and integer booleans promoted to
-- boolean. Row Level Security is enabled with a single "service role only"
-- policy per table: all reads/writes in this app go through server-side
-- code using the service_role key, which bypasses RLS entirely, so these
-- policies exist to make sure the anon/public key (if ever exposed to a
-- browser) cannot read or write anything.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('participant', 'mentor', 'coach', 'program_office', 'jury')),
  created_at timestamptz not null default now()
);

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  title text not null,
  canvas jsonb not null,
  team jsonb not null,
  stage text not null default 'intake',
  current_assessment_version integer not null default 0,
  mentor_id uuid references users(id),
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists idea_evidence (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id) on delete cascade,
  kind text not null,
  content text not null,
  url text,
  created_at timestamptz not null default now()
);

create table if not exists idea_clarifications (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id) on delete cascade,
  question text not null,
  why_we_ask text not null,
  answer text not null default '',
  dimension text,
  created_at timestamptz not null default now()
);

create table if not exists idea_assessments (
  idea_id uuid not null references ideas(id) on delete cascade,
  version integer not null,
  language text not null,
  dimensions jsonb not null,
  assumptions_to_verify jsonb not null,
  top_reasons jsonb not null,
  confidence text not null,
  weighted_score numeric not null,
  verdict text not null,
  hard_rule_triggered text,
  pivot_reframings jsonb,
  created_at timestamptz not null default now(),
  primary key (idea_id, version)
);

create table if not exists idea_prototype_plans (
  idea_id uuid not null references ideas(id) on delete cascade,
  version integer not null,
  riskiest_assumption text not null,
  primary_option jsonb not null,
  alternative_option jsonb not null,
  why_not_higher_fidelity text not null,
  created_at timestamptz not null default now(),
  primary key (idea_id, version)
);

create table if not exists idea_mentor_reviews (
  idea_id uuid not null references ideas(id) on delete cascade,
  assessment_version integer not null,
  mentor_id uuid not null references users(id),
  decision text not null,
  overrode_agent boolean not null,
  reason text not null,
  points_to_probe jsonb not null,
  decided_at timestamptz not null,
  minutes_to_decide numeric not null,
  primary key (idea_id, assessment_version)
);

create table if not exists pitches (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id),
  owner_id uuid not null references users(id),
  deck_file_name text,
  deck_storage_path text,
  slides jsonb not null default '[]'::jsonb,
  parse_confirmed boolean not null default false,
  script text,
  demo_format jsonb not null,
  stage text not null default 'upload',
  current_run_version integer not null default 0,
  coach_id uuid references users(id),
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pitch_mock_jury (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references pitches(id) on delete cascade,
  persona_id text not null,
  question text not null,
  weak_point_ref text,
  answer text,
  evaluation text,
  model_answer text,
  asked_at timestamptz not null default now(),
  answered_at timestamptz
);

create table if not exists pitch_runs (
  pitch_id uuid not null references pitches(id) on delete cascade,
  version integer not null,
  language text not null,
  structure jsonb not null,
  comments jsonb not null,
  coherence jsonb not null,
  dimensions jsonb not null,
  actions jsonb not null,
  readiness_score numeric not null,
  verdict text not null,
  hard_rule_triggered text,
  created_at timestamptz not null default now(),
  primary key (pitch_id, version)
);

create table if not exists pitch_coach_reviews (
  pitch_id uuid not null references pitches(id) on delete cascade,
  run_version integer not null,
  coach_id uuid not null references users(id),
  decision text not null,
  reason text not null,
  decided_at timestamptz not null,
  primary key (pitch_id, run_version)
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('idea', 'pitch')),
  entity_id uuid not null,
  actor_id uuid not null,
  action text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_idea_evidence_idea on idea_evidence(idea_id);
create index if not exists idx_idea_clarifications_idea on idea_clarifications(idea_id);
create index if not exists idx_pitches_idea on pitches(idea_id);
create index if not exists idx_pitch_mock_jury_pitch on pitch_mock_jury(pitch_id);
create index if not exists idx_audit_log_entity on audit_log(entity_type, entity_id);

-- Row Level Security: lock every table to the service role. The app never
-- talks to Supabase from the browser (all access goes through Next.js
-- server code using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS), so
-- these policies are a defense-in-depth backstop, not the primary access
-- control.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'users', 'ideas', 'idea_evidence', 'idea_clarifications', 'idea_assessments',
      'idea_prototype_plans', 'idea_mentor_reviews', 'pitches', 'pitch_mock_jury',
      'pitch_runs', 'pitch_coach_reviews', 'audit_log'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists service_role_only on %I', t);
    execute format(
      'create policy service_role_only on %I for all to service_role using (true) with check (true)',
      t
    );
  end loop;
end $$;
