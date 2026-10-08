import { createHash } from "node:crypto";
import { ideaValidationRubric, tecStrategicPriorities } from "@/lib/skills/ideaValidationRubric";
import { prototypeCatalogue } from "@/lib/skills/prototypeCatalogue";
import { sampleClarifyingQuestions } from "@/lib/skills/clarifyingQuestions";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import { downloadEvidenceFile } from "@/lib/db/queries/ideas";
import { extractEvidenceText } from "@/lib/parsing/evidenceFile";
import type { Idea } from "@/lib/types/domain";

// Appendix B, "Role and boundaries": shared by every stage call for Agent 1.
export function roleAndBoundaries(locale: "en" | "ar"): string {
  return `You are the TEC Idea Validation Agent, a coach for participants in the TEC Innovation Professional Program.

What you do: run a structured challenge session on a submitted idea, rate it against a fixed rubric with written anchors, and recommend the cheapest digital or no-code prototype that would test the riskiest assumption.

What you do not do: you never approve or reject an idea yourself — a human mentor always confirms the gate decision. You never estimate budgets. You never compare one team's idea against another's.

Every claim you make must be anchored to something the participant actually submitted (a canvas field, a clarification answer, an evidence item) or to a cited source. If you don't have real web search results attached to this conversation, do not invent citations, statistics, market sizes or competitor names — state the claim as an assumption to verify instead. This build has no live web search tool wired up; treat every market or competitor claim as unverifiable and label it as an assumption.

Reply in ${locale === "ar" ? "Arabic" : "English"} — the participant is writing in this language for this session. Keep the same language for the whole session.

Tone: direct, specific, encouraging. Every critical point should be paired with what a stronger answer would contain.`;
}

// Appendix B, "Skills": the rubric anchors and TEC priorities, loaded on
// demand and marked as a stable, cacheable block (see lib/llm/structured.ts).
export function ideaSkillsBlock(): string {
  const rubricText = ideaValidationRubric
    .map(
      (d) =>
        `- ${d.name} (weight ${Math.round(d.weight * 100)}%): rating 1 = "${d.rating1Anchor}"; rating 5 = "${d.rating5Anchor}"`
    )
    .join("\n");
  const prioritiesText = tecStrategicPriorities.map((p) => `- ${p.title}: ${p.description}`).join("\n");
  const catalogueText = prototypeCatalogue
    .map(
      (r) =>
        `Rung ${r.rung} — ${r.type} (tools: ${r.typicalTools.join(", ")}; tests: ${r.tests}; effort: ${r.effortTeamDays.min}-${r.effortTeamDays.max} team-days)`
    )
    .join("\n");
  const sampleQuestions = sampleClarifyingQuestions.map((q) => `- [${q.dimension}] ${q.question}`).join("\n");

  return `## TEC validation rubric (six dimensions, written anchors)
${rubricText}

## TEC strategic priorities for this cohort
${prioritiesText}

## Prototype fidelity ladder (work down from rung 1; stop at the first rung that tests the riskiest assumption; never recommend building the full solution)
${catalogueText}

## Sample clarifying questions (adapt, do not read verbatim; ask only what is not already covered)
${sampleQuestions}`;
}

export function ideaRecordContext(idea: Idea): string {
  const evidenceText = idea.evidence.length
    ? idea.evidence.map((e) => `- [id: ${e.id}] [${e.kind}] ${e.content}${e.url ? ` (${e.url})` : ""}`).join("\n")
    : "(none submitted)";
  const clarificationsText = idea.clarifications.length
    ? idea.clarifications
        .filter((c) => c.answer)
        .map((c) => `- [id: ${c.id}] Q (${c.dimension ?? "general"}): ${c.question}\n  A: ${c.answer}`)
        .join("\n")
    : "(none yet)";

  return `## Idea canvas
Title: ${idea.title}
Problem: ${idea.canvas.problem}
Affected users: ${idea.canvas.affectedUsers}
Current workaround: ${idea.canvas.currentWorkaround}
Proposed solution: ${idea.canvas.proposedSolution}
Expected value to TEC: ${idea.canvas.expectedValue}
Known risks: ${idea.canvas.knownRisks}

## Team profile
Size: ${idea.team.size}; skills: ${idea.team.skills.join(", ") || "(unspecified)"}; hours/week available: ${idea.team.hoursPerWeek}

## Evidence pack (cite as "evidence.<id>" using the exact id shown in brackets)
${evidenceText}

## Clarifications answered so far (cite as "clarification.<id>" using the exact id shown in brackets)
${clarificationsText}`;
}

const NATIVE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/**
 * The user message for an idea: the text record plus every uploaded evidence
 * file passed straight to the model (PDFs and images natively; DOCX/text
 * files as extracted text, since the model can't read those formats).
 */
export async function ideaUserContent(idea: Idea, suffix = ""): Promise<string | ChatCompletionContentPart[]> {
  const text = `${ideaRecordContext(idea)}${suffix}`;
  const files = idea.evidence.filter((e) => e.file);
  if (files.length === 0) return text;

  const parts: ChatCompletionContentPart[] = [{ type: "text", text }];
  const seen = new Set<string>();
  for (const { file } of files) {
    if (!file) continue;
    const data = await downloadEvidenceFile(file.path);
    if (!data) continue;
    // The gateway names each document by its content hash and rejects the
    // whole request if two are identical, so send a repeated upload once.
    const digest = createHash("sha256").update(data).digest("hex");
    if (seen.has(digest)) continue;
    seen.add(digest);
    const lower = file.name.toLowerCase();
    if (file.mime === "application/pdf" || lower.endsWith(".pdf")) {
      parts.push({ type: "text", text: `Evidence file: ${file.name}` });
      parts.push({ type: "file", file: { filename: file.name, file_data: `data:application/pdf;base64,${data.toString("base64")}` } });
    } else if (NATIVE_IMAGE_TYPES.includes(file.mime)) {
      parts.push({ type: "text", text: `Evidence image: ${file.name}` });
      parts.push({ type: "image_url", image_url: { url: `data:${file.mime};base64,${data.toString("base64")}` } });
    } else {
      const extracted = await extractEvidenceText(file.name, file.mime, data);
      parts.push({ type: "text", text: extracted ? `Evidence file: ${file.name}\n${extracted}` : `Evidence file: ${file.name} (format not readable by the model)` });
    }
  }
  return parts;
}
