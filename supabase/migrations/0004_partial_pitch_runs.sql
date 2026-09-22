-- structure/content/coherence results were only ever written to
-- pitch_runs at the very end of the graph (in the readiness node), after
-- all six mock jury turns are answered — so the Structure Map, Pitch
-- Studio comments and Coherence Report tabs stayed empty for the entire
-- mock-jury phase even though those results were already computed. The
-- app now upserts a pitch_runs row progressively as each stage finishes,
-- so these columns must allow null until readiness actually runs.

alter table pitch_runs alter column dimensions drop not null;
alter table pitch_runs alter column actions drop not null;
alter table pitch_runs alter column readiness_score drop not null;
alter table pitch_runs alter column verdict drop not null;
