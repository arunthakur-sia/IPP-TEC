-- Evidence uploads (docs, PDFs, images) are kept in a private storage bucket
-- and passed to the LLM directly when the validation session runs.
alter table idea_evidence add column if not exists file_path text;
alter table idea_evidence add column if not exists file_name text;
alter table idea_evidence add column if not exists file_mime text;

insert into storage.buckets (id, name, public)
values ('idea-evidence', 'idea-evidence', false)
on conflict (id) do nothing;
