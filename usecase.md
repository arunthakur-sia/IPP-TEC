# TEC Innovation Program — Agent Platform: End-to-End Use Case & Functional Flow

This document walks through **every screen, field, and role transition** in the app, as one continuous story — from a participant's first login to a completed Demo Day jury pack. It is written from the field level up: for each form, what each input is, what it accepts, what triggers validation, and what happens on submit.

> Source of truth for everything below: `src/app/**`, `src/components/**`, `src/lib/**`. Field labels are quoted exactly as they appear in the UI (English; Arabic equivalents exist for every string via the locale switcher).

---

## 1. Identity model — how sign-in actually works today

Sign-in is real: an email + password form at **`/login`**, checked against a password hash stored server-side. There are still **no self-service sign-ups** — the account universe is the same five seeded demo accounts as before, one per role, now each with real credentials (`src/lib/db/queries/users.ts`):

| Role | Seeded name | Seeded email |
|---|---|---|
| `participant` | Amina Al Marri (participant) | participant@pilot.tec.gov.ae |
| `mentor` | Omar Hassan (mentor) | mentor@pilot.tec.gov.ae |
| `coach` | Sara Al Suwaidi (coach) | coach@pilot.tec.gov.ae |
| `program_office` | Program Office | program-office@pilot.tec.gov.ae |
| `jury` | Demo Day Jury | jury@pilot.tec.gov.ae |

All five share one demo password out of the box: **`TecDemo#2026`** (override via `DEMO_ACCOUNT_PASSWORD` in `.env.local`; see README).

**How a session is established** (`src/lib/auth/session.ts`, `src/lib/auth/sessionToken.ts`, `src/lib/auth/password.ts`):
1. The **Sign in** form (`/login`, `LoginForm.tsx`) takes **Email** and **Password**, `POST`s them as JSON to `/api/auth/login`.
2. The server looks up the account by email, hashes the submitted password with the same scrypt parameters used at seed time, and compares it (constant-time) against the stored hash.
3. On a match, it sets a signed, `httpOnly` session cookie — an HMAC-SHA256 token over the user id and a 7-day expiry, so it can't be hand-edited into someone else's account the way a plain user-id cookie could. On a mismatch, the form shows a single generic **"Invalid email or password."** for both a wrong password and an unknown email (no account-enumeration hint).
4. **Every route is gated centrally**, not per-page: `src/proxy.ts` runs before any page or API route, verifies that signed cookie, and redirects an unauthenticated visitor straight to `/login?next={originalPath}` (or returns a `401` for an unauthenticated API call) before the page ever renders. Each protected Server Component also re-checks via `requireUser()` as defense in depth.
5. **"Sign out"**, in the top bar next to the user's name, `POST`s to `/api/auth/logout`, which deletes the session cookie and returns to `/login`.

**Role changes what you can act on, not what you can see.** Server-side gating (`requireRole`) exists on exactly two endpoints beyond the base sign-in requirement — mentor decisions and coach decisions (see §4.6 and §5.8). Everywhere else, UI-level checks (`isOwner`, `isMentor`, `canDecide`) hide or disable the action controls, but a signed-in user who happens to view another role's page can still *see* most things.

**When a user must switch identity in this walkthrough:** every time the active step needs a different role than the one currently signed in — e.g. moving from filling in a canvas (participant) to confirming a verdict (mentor). Since there's no role-switcher anymore, that means **signing out and signing back in** as the other seeded account. Each step below states the exact role required.

> Still true from before: this is **demo/pilot-only identity**, not real SSO. The plan explicitly defers TEC intranet/SSO integration to the pilot; today's sign-in only proves "you know one of the five seeded passwords," not a real corporate identity.

---

## 2. Roles at a glance

| Role | Can do |
|---|---|
| **Participant** | Create/edit ideas, run the Idea Validation Agent, submit evidence, answer clarify questions, do weekly follow-up check-ins, create pitches, upload decks, run the Pitch Validation Agent, answer mock-jury questions |
| **Mentor** | Everything a participant can view for *any* idea (not just their own) via `/workspace`, plus the exclusive right to confirm/override the agent's idea verdict |
| **Coach** | Sees the Program Office dashboard, plus the exclusive right to confirm/reject Demo Day readiness on a pitch |
| **Program Office** | Sees the cross-program dashboard (`/program`): all ideas, all pitches, cohort-level stats |
| **Jury** | Views the read-only **Jury Pack** (`/jury/[pitchId]`) for any pitch that has cleared coach review |

---

## 3. The story, end to end

We follow **Amina (participant)** taking one idea from a blank canvas through Demo Day. Every field she fills, every screen she sees, and every point where the story hands off to **Omar (mentor)**, **Sara (coach)**, the **Program Office**, or the **Jury** is called out as it happens.

### Phase A — Amina logs in and creates an idea

1. Amina opens the app. With no session cookie yet, `src/proxy.ts` redirects her straight to `/login`.
2. She signs in as **participant@pilot.tec.gov.ae** / `TecDemo#2026` on the Sign in form and is redirected to `/workspace`.
3. She sees **"Ideas"** (`/workspace`) — empty state: *"No ideas yet."* — with a **"New idea"** button (participant-only; mentors/others don't see it).
4. She clicks **New idea** → `/workspace/new` → `NewIdeaForm`.

**Fields on the New Idea form**, in order:

| Field | Type | Required to submit? | Notes |
|---|---|---|---|
| **Idea title** | single-line text input | Yes — submit button is disabled until non-empty | Free text, e.g. "Digital Visitor Badge Kiosk" |
| **Problem** | multi-line textarea (2 rows) | No hard block at creation, but see completeness gate below | What's broken today |
| **Affected users** | textarea | same | Who feels the problem |
| **Current workaround** | textarea | same | How people cope today |
| **Proposed solution** | textarea | same | Amina's idea |
| **Expected value to TEC** | textarea | same | Why TEC should care |
| **Known risks** | textarea | same | Self-identified risks |
| **Team size** | number input, min 1 | defaults to `1` | |
| **Hours/week available** | number input, min 0 | defaults to `5` | |

She clicks **"Create idea"**. This `POST`s to `/api/ideas` with `{ title, canvas, team }` and redirects to `/workspace/{ideaId}` — the **Idea Workspace** (Overview tab).

> Note: **alignment tags** and **team skills** are *not* on the creation form — they only appear later, on the editable Canvas card inside the workspace (see next step).

### Phase B — Completing the canvas (still Amina, participant)

On `/workspace/{ideaId}` (Overview), the left column shows the **Idea canvas** card (`CanvasEditor.tsx`), pre-filled with what she just entered, now editable in place:

- All six textareas from Phase A, each with a live **✓ / "Needs at least 20 characters"** indicator per field (`CANVAS_MIN_FIELD_LENGTH = 20`).
- **Alignment tags (comma separated)** — single-line input, e.g. `digital services, visitor experience`.
- **Team profile** sub-section: **Team size**, **Hours/week available** (numbers), **Skills (comma separated)** input.
- **"Save canvas"** button — `PATCH /api/ideas/{ideaId}` with the current `{ canvas, team }`.

Below the canvas is the **Evidence pack** card (`EvidencePanel.tsx`):
- A textarea — *"Paste an interview note, data point or link…"*.
- **"Add evidence"** button — `POST /api/ideas/{ideaId}/evidence` with `{ kind: "note", content }`. Each submission appends a timestamped entry to a running list; there is no dedicated "link" or "file" field in the UI today even though the data model supports `kind: note | data_point | link | file`.

**Validation gate — `checkCanvasCompleteness`:** the six text fields must each be **≥ 20 characters** after trimming, and `team.size` must be **≥ 1**. Until every field clears this bar, the right-hand **"Start validation session"** button stays disabled and shows: *"Finish the canvas fields marked above before starting."*

### Phase C — Starting the Idea Validation Agent (Amina)

Once the canvas is complete, the right column shows a **"Ready to validate"** card:
> "Complete the canvas on the left, then start the validation session. The agent will ask up to eight adaptive questions, then produce a scored assessment for your mentor to confirm."

Amina clicks **"Start validation session."** This:
1. `POST`s to `/api/ideas/{ideaId}/session`.
2. Server-side, if the idea has no mentor yet, it auto-assigns the single seeded mentor (Omar) — `assignMentor`.
3. Kicks off the LangGraph run (`intake → clarify → assess → critique → verdict → prototype_plan → mentor_review`), which immediately pauses (`interrupt()`) at the first **clarify** question.
4. The button shows a spinner with cycling status text ("Reading your idea canvas… / Checking the evidence pack… / Preparing the first question…") — this call can take up to a minute since it's a live LLM call.

### Phase D — The Clarify Q&A loop (Amina)

The right column now shows the **Validation session** card (`ClarifySessionPanel.tsx`) — this is a **multi-turn loop, up to 8 questions**:

- A progress bar: *"Question {n} of up to {max}."*
- A dimension chip (one of the six rubric pillars — see §6).
- The question text.
- A collapsible **"Why we ask this"** explanation.
- **Answer** — a required textarea (*"Type your answer…"*), autofocused.
- **"Submit answer"** button, disabled until non-empty.

On submit: `POST /api/ideas/{ideaId}/session/answer` with `{ answer }`. The panel then shows a "Thinking…" spinner with cycling status ("Reading your answer… / Checking rubric coverage… / Scoring against the six dimensions… / Running the quality critique… / Computing the verdict… / Drafting the prototype plan…") — this can take up to a minute, since the *last* answer triggers the full **assess → critique → verdict → prototype_plan** chain in one request.

This repeats — a new question replaces the old one (component is re-keyed by `clarificationId`) — until the graph decides it has enough information (max 8 turns) and moves on.

> **Resilience note:** if the page is reloaded mid-session and the in-memory LangGraph checkpoint was lost (e.g. a server restart), the UI instead shows **"Session in progress" → "Resume session"**, which safely replays from the durable Supabase state without repeating any already-answered question.

### Phase E — Scorecard (Amina views, read-only)

Once the graph clears `verdict` and `prototype_plan`, the right column switches to:
- **Scorecard summary** — verdict badge (`ready_to_prototype` / `refine_and_resubmit` / `pivot`), weighted score, confidence, top reasons.
- A **radar chart** across the six dimensions (`problem_clarity`, `user_evidence`, `strategic_fit`, `value_viability`, `feasibility`, `novelty_risk`).
- Other workspace tabs light up: **"6 pillars"** (`/workspace/{ideaId}/pillars` — per-dimension rating, anchor text, evidence citations, open questions) and **"Plan"** (`/workspace/{ideaId}/plan` — prototype plan + mentor review section).

Amina has one self-service action here: if she's the owner, she can click **re-assess**, which re-runs `startSession` to produce a new assessment version.

### Phase F — Mentor review (hand-off to Omar, mentor)

**This is a mandatory identity switch.** The idea cannot proceed to prototype-building until a mentor acts — the "Plan" tab shows, to anyone who isn't the mentor: *"Awaiting mentor review — A mentor will confirm, adjust or override the agent's verdict before this idea can move to prototype building."*

Amina signs out; Omar signs in as **mentor@pilot.tec.gov.ae** / `TecDemo#2026`, opens `/workspace/{ideaId}/plan`, and now sees the same card in **decide mode** (`MentorReviewPending`, `canDecide: true` because `user.role === "mentor"`):

- **Points to probe** — a bulleted list the agent surfaced from the critique pass (read-only).
- **Gate decision** — a row of pill buttons, pre-seeded to the agent's suggested verdict, one of: **Ready to prototype / Refine and resubmit / Pivot**. Omar can pick any of the three, overriding the agent if he disagrees.
- **Reason (required, stored for the audit trail)** — a required textarea; the **"Confirm decision"** button stays disabled until it's non-empty.

On submit: `POST /api/ideas/{ideaId}/session/mentor-decision` with `{ decision, reason }`. This route is the first of only two places the app enforces *role* server-side on top of the base sign-in check: `requireRole("mentor")` — a signed-in non-mentor gets a `403`, not just a hidden button.

If Omar's `decision` differs from the agent's suggested verdict, the UI records `overrodeAgent: true` and shows both verdicts side by side (agent's → mentor's) once decided. The idea's stage moves to `closed`.

### Phase G — Prototype plan and weekly check-ins (back to Amina)

If the mentor's decision is **"Ready to prototype,"** two things now appear on `/workspace/{ideaId}/plan`:
- **Prototype Plan** — the agent's riskiest-assumption framing, a primary + alternative prototype option (rung 1–5, e.g. "clickable mockup" vs "no-code prototype"), tools, build items, effort estimate, and a test protocol with a success threshold.
- **Weekly check-in (follow-up mode)** (`FollowUpPanel.tsx`) — a lightweight, ungated loop for ongoing prototype testing:
  - **Update** — a required textarea (*"How is the prototype test going this week?"*).
  - **"Send update"** button → `POST /api/ideas/{ideaId}/followup` with `{ updateText }`.
  - Response renders inline: a progress assessment, an optional **"Riskiest assumption changed"** flag + new framing, and a **recommendation**. No identity change needed — this is participant self-service, repeatable weekly, no cap on turns (unlike clarify/mock-jury).

### Phase H — Creating the pitch (Amina, participant)

Once at least one idea exists, Amina goes to **Pitches** (`/pitches`) → **New pitch** (`/pitches/new`) → `NewPitchForm`:

- **"Select the validated idea this pitch is for"** — a `<select>` populated from her ideas. If she has none yet, the form shows *"No ideas available yet — validate an idea first."* instead (there's no hard server-side check that the idea reached `ready_to_prototype` — any of her ideas is selectable).
- **"Create pitch"** button → `POST /api/pitches` with `{ ideaId }`, redirects to `/pitches/{pitchId}/studio`.

### Phase I — Uploading the deck (Amina)

On the **Pitch Studio** tab, before any deck exists, she sees **DeckUploadPanel.tsx**:

- **File input**, `accept=".pdf,.pptx"` — required (the upload button silently no-ops without a file selected).
- **Script or transcript (optional)** — a 4-row textarea for a rehearsal script.
- **"Upload"** button → `POST /api/pitches/{pitchId}/upload` as multipart `FormData` (`deck`, optional `script`). While in flight, the button reads **"Parsing…"** (real PDF/PPTX text+notes extraction, true slide order via `presentation.xml`).

### Phase J — Confirm parsed slides (Amina)

Next, **ParseCheckPanel.tsx** shows every extracted slide (title, body text, word count) plus a total word count and estimated speaking time. Amina's only job here: visually confirm nothing important was dropped, then click **"Looks right — confirm"** → `POST /api/pitches/{pitchId}/parse-check`. No text fields to fill — this is a checkpoint, not a form.

### Phase K — Running the Pitch Validation Agent (Amina)

From any pitch sub-tab, **RunAgentButton.tsx** offers **"Run agent"** (first run) or **"Re-run (new version)"** (subsequent runs). Clicking it:
1. `POST /api/pitches/{pitchId}/run`.
2. Runs `structure → content → coherence` synchronously, then pauses at the first **mock jury** question (an `interrupt()`), or goes straight to **coach_review_pending** if mock jury was already completed in a prior run.
3. The button shows: *"Running structure, content, coherence, mock jury and readiness…"*
4. On response, the app auto-navigates: to `/pitches/{pitchId}/mock-jury` if a jury question is pending, to `/pitches/{pitchId}/coach-review` if coach review is pending, otherwise to `/pitches/{pitchId}/readiness`.

No fields to fill for this step — it's a single trigger button. Results land on two read-only tabs Amina can inspect any time:
- **Structure Map** (`/pitches/{pitchId}/structure`) — which slide maps to which pitch-template section (problem/users/validation/prototype/value/ask/team/other), what's missing, suggested reorder.
- **Pitch Studio** with inline **slide comments** — per-slide, per-element (title/body/visual/notes) issues with a quoted excerpt, the issue, a suggested rewrite, and a priority (high/medium/low) — filterable via a **"High priority only"** checkbox.
- **Coherence Report** (`/pitches/{pitchId}/coherence`) — claims flagged supported / overstated / changed / unsupported against the idea's canvas + clarify Q&A.

### Phase L — Mock jury (Amina)

`/pitches/{pitchId}/mock-jury` (`MockJuryPanel.tsx`) is a **6-turn self-loop**, one persona-driven question per turn:

- Persona name in the card title (e.g. a rotating jury persona with its own focus area).
- Progress bar (`turnNumber / totalTurns`).
- The question.
- A **countdown timer** (visual only, doesn't block submission) seeded from `demoDayDefaultFormat.questionTimeSeconds`.
- **Answer** — required textarea (*"Answer as if you were on stage…"*), autofocused.
- **"Submit answer"** → `POST /api/pitches/{pitchId}/mock-jury/answer` with `{ answer }`. While in flight: *"Evaluating your answer…"*.

Below the live question, a **Session log** accumulates every prior turn: the question, Amina's answer, a short evaluation, and — where relevant — a **model answer** for comparison. After the 6th turn, the graph proceeds to **readiness** and then pauses again at **coach_review_pending**.

### Phase M — Readiness dashboard (Amina, self-service)

`/pitches/{pitchId}/readiness` shows the computed readiness score, verdict (`ready_for_demo_day` / `rehearse` / `rework`), and a prioritized **action list** (each item links back to the offending slide or jury turn, with a "done" checkbox for Amina's own tracking). A **"Re-run (new version)"** button lets her iterate: fix slides/rehearse, then re-run the whole `structure → … → readiness` chain to produce a new version, and the dashboard keeps every prior run for a before/after comparison — this is also what feeds the Program Office's "average readiness improvement" stat.

### Phase N — Coach review (hand-off to Sara, coach)

**Second mandatory identity switch.** `/pitches/{pitchId}/coach-review` for anyone who isn't the coach shows: *"A coach will confirm Demo Day readiness or ask for another rehearsal."*

Amina signs out; Sara signs in as **coach@pilot.tec.gov.ae** / `TecDemo#2026`, opens the same tab, and sees `CoachReviewPending` in decide mode:

- Two toggle pills: **"Confirm — ready for Demo Day"** or **"Request another rehearsal."**
- **Reason** — required textarea.
- **"Submit decision"** (disabled until reason is non-empty) → `POST /api/pitches/{pitchId}/coach-decision` with `{ decision, reason }`.

This is the **second and last** server-enforced *role* check on top of the base sign-in requirement: `requireRole("coach")` — a signed-in non-coach is rejected with `403` regardless of what the UI shows. If Sara chooses **"Request another rehearsal,"** the loop returns to Amina (sign out, sign back in as participant), who re-runs the agent (Phase K onward) to produce a new pitch-run version.

### Phase O — Jury pack (hand-off to Demo Day Jury)

Only once `coachReview.decision === "confirmed"` does `/jury/{pitchId}` render anything besides *"The jury pack is available only after coach confirmation."* Anyone with role `jury`, `coach`, `program_office`, or the idea's own owner can view it. No fields, no actions — a **read-only, printable summary** (`PrintButton.tsx`): idea verdict + pitch verdict badges, problem/solution/expected-value text, what was tested (prototype type + riskiest assumption), top 3 open readiness actions, and the coach's confirmation reason.

### Phase P — Program Office oversight (parallel, any time)

`/program` is visible to `program_office`, `mentor`, and `coach` roles (participants and jury are shown a permission message instead). No fields — a live rollup:
- **Avg. days to verdict** (target: under 5 days), **% ready ideas with a plan**, **mentor override rate %**, **avg. readiness improvement** between a pitch's first and latest run.
- A list of every idea (title, stage badge, verdict badge) and every pitch (id, stage badge, verdict badge, coach-decision badge), each linking back into that idea's workspace or pitch's readiness tab.
- A footnote acknowledging two metrics intentionally **not** collected in this build: participant usefulness ratings, and mentor/coach hours — shown as "—" rather than fabricated.

---

## 4. Field-level validation summary

| Field / gate | Rule | Where enforced |
|---|---|---|
| Sign-in email + password | both required; must match a stored account + password hash | `LoginForm`, disables "Sign in"; `/api/auth/login` returns `401` on any mismatch (generic message, no enumeration hint) |
| Any page/API request | must carry a valid, unexpired signed session cookie | `src/proxy.ts` (redirects to `/login`, or `401` for API calls) on every request; `requireUser()`/`getCurrentUser()` re-check per request |
| Idea canvas text fields (`problem`, `affectedUsers`, `currentWorkaround`, `proposedSolution`, `expectedValue`, `knownRisks`) | ≥ 20 trimmed characters each | `checkCanvasCompleteness` (client, blocks "Start validation session") |
| `team.size` | ≥ 1 | same |
| Idea title | non-empty | `NewIdeaForm`, disables "Create idea" |
| Clarify answer | non-empty | `ClarifySessionPanel`, disables "Submit answer" |
| Mentor decision reason | non-empty, required for audit trail | `MentorReviewPanel`, disables "Confirm decision" |
| Mentor role | must be `mentor` | server-side `requireRole("mentor")` on `/api/ideas/[ideaId]/session/mentor-decision` |
| Evidence note | non-empty | `EvidencePanel`, disables "Add evidence" |
| Follow-up update text | non-empty | `FollowUpPanel` |
| New pitch: idea selection | must select one from the dropdown | `NewPitchForm` |
| Deck upload | file required, `.pdf` or `.pptx` only | `DeckUploadPanel`, `accept` attribute + no-op without a file |
| Mock jury answer | non-empty | `MockJuryPanel`, disables "Submit answer" |
| Coach decision reason | non-empty | `CoachReviewPanel`, disables "Submit decision" |
| Coach role | must be `coach` | server-side `requireRole("coach")` on `/api/pitches/[pitchId]/coach-decision` |

---

## 5. Rubric dimensions referenced throughout the flow

**Idea Validation Agent (6 pillars):** Problem clarity · User evidence · Strategic fit with TEC · Value and viability · Feasibility · Novelty and risk awareness → verdict is one of **Ready to prototype / Refine and resubmit / Pivot**.

**Pitch Validation Agent (7 dimensions):** Narrative clarity · Evidence and traction · Value to TEC · Plan and ask · Delivery and timing · Visual clarity · Q&A resilience → verdict is one of **Ready for Demo Day / Rehearse / Rework**.

All ratings and verdicts are computed deterministically in application code (`lib/scoring/*.ts`) from model-provided per-dimension ratings — the model itself never outputs a final score or verdict.

---

## 6. Stage machines (for reference)

- **Idea:** `intake → clarify → assess → critique → verdict → prototype_plan → mentor_review → closed`
- **Pitch:** `upload → parse_check → structure → content → coherence → mock_jury → readiness → coach_review → closed`

Both are LangGraph state machines with real `interrupt()`/`Command(resume)` human-in-the-loop pauses at every point a human is required to type something (clarify answers, mentor decision, mock-jury answers, coach decision) — the graph genuinely suspends mid-run and resumes from the next HTTP request rather than simulating it.
