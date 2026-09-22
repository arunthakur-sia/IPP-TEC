-- Deleting an idea should also remove any pitches built from it (their
-- own child rows - mock jury turns, pitch runs, coach reviews - already
-- cascade from 0001). Without this, deleting an idea that has a pitch
-- fails with a foreign key violation.

alter table pitches drop constraint pitches_idea_id_fkey;
alter table pitches add constraint pitches_idea_id_fkey
  foreign key (idea_id) references ideas(id) on delete cascade;
