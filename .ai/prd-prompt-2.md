# Narrative PRD Meta-Prompt

## How to use this prompt

1. Fill in every `{{PLACEHOLDER}}` with your product's specifics before pasting into an LLM.
2. Remove any placeholder that is not applicable and adjust the surrounding sentence to stay grammatically correct.
3. Paste the entire "PROMPT TEMPLATE" block (everything between the dashed lines) into your LLM of choice.
4. The output will be a complete, narrative-style PRD. Review it with your team, then iterate — treat the first output as a draft, not a final artefact.
5. Re-run with adjusted inputs whenever scope or persona changes significantly.

---

## PROMPT TEMPLATE

---

You are a senior product manager with deep expertise in user-centred design and agile delivery. Your task is to write a comprehensive Product Requirements Document (PRD) for the product described below. The PRD must read as a living product brief — not a dry specification. Every requirement must be traceable back to a real human need. Engineers should be able to build from it; executives should be moved by it.

### INPUTS — fill these in before running

- **PRODUCT_NAME**: {{PRODUCT_NAME}}
- **TARGET_USER**: {{TARGET_USER}}  _(describe demographics, role, technical literacy, context of use)_
- **CORE_JOB_TO_BE_DONE**: {{CORE_JOB_TO_BE_DONE}}  _(one sentence: when [situation], the user wants to [motivation] so they can [expected outcome])_
- **BUSINESS_CONTEXT**: {{BUSINESS_CONTEXT}}  _(company stage, market, strategic reason for building this now)_
- **KNOWN_CONSTRAINTS**: {{KNOWN_CONSTRAINTS}}  _(budget, timeline, platform, regulatory, team size, etc.)_
- **OUT_OF_SCOPE**: {{OUT_OF_SCOPE}}  _(explicit list of things this PRD must NOT address)_

---

### SECTION 1 — Executive Narrative (≈ 300 words)

Open with a vivid, empathetic story written in the present tense. Make the reader feel the friction the {{TARGET_USER}} experiences today. Do not yet mention the product. Name your persona (a single composite person, not a demographic segment) and describe one specific day in their life where the absence of {{PRODUCT_NAME}} creates real pain. Use concrete sensory detail: what does the person see, hear, feel? What do they abandon half-done? What workaround do they use, and why does it feel like a betrayal of their time?

Then shift — same persona, same day, six months after {{PRODUCT_NAME}} ships. The same moment that was painful is now effortless. What changed? What can they now do that was impossible before? What do they no longer have to think about?

End the section with a one-sentence Product Vision Statement in the form: "{{PRODUCT_NAME}} exists so that [persona name] can [transformed capability], turning [old painful state] into [new empowered state]."

---

### SECTION 2 — User Personas & Context

For EACH distinct user type who will interact with {{PRODUCT_NAME}}, produce a persona card with the following fields. If there is only one user type, produce one card. Do not invent personas that are not implied by the inputs.

**Persona Card format:**
- **Name & role**: (fictional but realistic)
- **Age range**:
- **Technical literacy**: (1–5 scale with brief justification)
- **Primary device & environment**: (e.g., mobile on commute, desktop in open office)
- **Top 3 goals** related to {{CORE_JOB_TO_BE_DONE}}:
- **Top 3 frustrations** with today's alternatives:
- **Quote** that captures their worldview in one sentence (write this as if it came from a user interview):
- **Accessibility considerations**: any disability, language, or situational impairment relevant to this persona

---

### SECTION 3 — Before / After Comparison Table

Produce a markdown table with three columns: **Moment**, **Before {{PRODUCT_NAME}}**, **After {{PRODUCT_NAME}}**.

Cover at least eight distinct moments in the user journey — from first awareness of the need through to ongoing habitual use. For each moment, describe the current-state experience in plain language (no jargon), then describe the future-state experience with equal specificity. Avoid vague phrases like "easier" or "faster" — quantify where possible (e.g., "4 manual steps reduced to one tap", "error discovered at end-of-day rather than in real time").

---

### SECTION 4 — User Stories & Acceptance Criteria

Write user stories grouped by theme (e.g., Onboarding, Core Workflow, Notifications, Settings, Error Recovery). Each story must follow this format exactly:

**Story ID**: US-[theme abbreviation]-[number] (e.g., US-OB-01)  
**As a** [specific persona name from Section 2],  
**I want** [specific action or capability],  
**So that** [concrete benefit — must connect to {{CORE_JOB_TO_BE_DONE}}].

**Acceptance Criteria** (use Gherkin-style Given/When/Then):
- Given [precondition], When [action], Then [observable outcome].
- (Add as many criteria as needed for complete coverage — minimum three per story.)

**Definition of Done**:
- [ ] Acceptance criteria all pass in automated tests
- [ ] Behaviour verified on [list relevant platforms from {{KNOWN_CONSTRAINTS}}]
- [ ] Accessibility audit passed (WCAG 2.2 AA minimum)
- [ ] Error states handled and copy reviewed
- [ ] Performance benchmark met: [specify measurable threshold relevant to this story]
- [ ] Product manager sign-off on demo recording

Write a minimum of 12 user stories total. Aim for depth over breadth — a story with five rich acceptance criteria is better than three shallow stories.

---

### SECTION 5 — Prioritized Feature List (MoSCoW)

Produce a feature list derived directly from the user stories in Section 4. For each feature, state:
- **Feature name** (brief, imperative noun phrase)
- **MoSCoW priority**: Must / Should / Could / Won't (for this release)
- **Rationale**: one sentence grounding the priority in user impact or constraint from {{KNOWN_CONSTRAINTS}}
- **Linked stories**: list Story IDs from Section 4
- **Estimated complexity**: XS / S / M / L / XL (T-shirt sizing; add one sentence of justification)

Group features by MoSCoW tier. Within each tier, order by user impact descending. The Won't list must explain *why* each item is deferred — "not now" is not a reason.

---

### SECTION 6 — Edge Cases & Failure Modes

For each Must-have feature identified in Section 5, enumerate at least three realistic edge cases or failure modes. Use the following format:

**Feature**: [feature name]  
**Edge case / failure mode**: [description — be specific, name real conditions like "network drops mid-upload" not "connectivity issues"]  
**Impact on user**: [what goes wrong from the user's perspective]  
**Mitigation / expected system behaviour**: [how the product should respond — be prescriptive]  
**Open question** (if any): [unresolved design or engineering decision that needs a decision before build]

Do not write generic error handling (e.g., "show error message"). Describe exact copy, fallback states, and recovery paths.

---

### SECTION 7 — Accessibility & Inclusivity Requirements

This section must be written as requirements, not aspirations. For each requirement, state:
- **Requirement ID**: AX-[number]
- **Standard or principle**: (WCAG 2.2 criterion, ARIA pattern, platform guideline, or inclusivity principle)
- **User scenario**: which persona and which moment in the journey this protects
- **Implementation note**: specific guidance for engineers (e.g., "all interactive elements must have a visible focus ring with minimum 3:1 contrast ratio against adjacent colours")
- **Test method**: how QA will verify this requirement (automated tool, manual screen-reader test, user test with participant from affected group, etc.)

Cover at minimum: keyboard navigation, screen reader compatibility, colour contrast, motion/animation (respect prefers-reduced-motion), text resizing to 200%, and touch target size. Add any requirements specific to the personas identified in Section 2.

---

### SECTION 8 — Rollout Strategy

Describe the release strategy in three phases. Write each phase as a narrative paragraph, not a bullet list, so that the sequencing logic is clear.

**Phase 1 — Closed Beta**  
Who gets access, how they are recruited, what instrumentation is in place, what questions the beta is designed to answer, and what the exit criteria are before moving to Phase 2. Be specific: name the metrics and their thresholds.

**Phase 2 — Limited GA (Controlled Ramp)**  
How traffic is gated (percentage rollout, feature flags, geography, cohort), what monitoring is active, what constitutes a rollback trigger, and what support capacity is required.

**Phase 3 — Full GA**  
What "done" looks like from a launch perspective, what marketing/comms is coordinated, how the team transitions from launch mode to iteration mode, and what the first post-launch review cadence looks like.

---

### SECTION 9 — Success Criteria (User's Perspective)

Do not list business KPIs here. Write success criteria as the user would describe them — in plain language, as if reading a review they might leave, or a quote they might give in a follow-up interview six months post-launch.

Then translate each user-stated criterion into a measurable proxy metric the team can track. Format as a two-column table:

| What success feels like to the user | Measurable proxy metric |
|--------------------------------------|------------------------|
| "I no longer dread [task]." | [specific metric, baseline, target, measurement method] |

Include at least six rows. Avoid vanity metrics (downloads, page views). Prefer behavioural signals (task completion rate, time-to-value, retention at day 30, support ticket volume for specific issue types).

---

### SECTION 10 — Red Team: The Case Against Building This

Write this section as a critical devil's advocate. Argue, as persuasively as possible, that {{PRODUCT_NAME}} should NOT be built — at least not now, not like this. Cover:

1. **Market / timing risk**: Is the problem real and big enough? Is the timing right or are there structural reasons the market isn't ready?
2. **Execution risk**: Given {{KNOWN_CONSTRAINTS}}, what is the realistic probability this ships on time and works as intended?
3. **Cannibalisation / strategic risk**: Could this undermine something the business already does well?
4. **User adoption risk**: What behaviours or beliefs must change for users to adopt this, and how hard is that change?
5. **Unintended consequences**: What could go wrong that the team hasn't thought about? Think safety, privacy, misuse, and second-order effects.

End the section with a one-paragraph rebuttal — written from the perspective of the product team — that acknowledges the strongest objections and explains why they proceed anyway. The rebuttal must not dismiss the objections; it must show that they have been heard and weighed.

---

### FORMATTING INSTRUCTIONS

- Write the entire PRD in clear, plain English. No buzzwords, no filler phrases ("leverage synergies", "best-in-class", "seamless experience").
- Use markdown headers (##, ###) and tables where specified. Use bold for labels. Use code blocks only for technical strings (API endpoints, regex patterns, etc.).
- Each section must be self-contained enough that an engineer, designer, or executive can read only that section and immediately understand its content without re-reading the whole document.
- Where a decision is genuinely unresolved, flag it explicitly with **[OPEN QUESTION]** in bold rather than papering over it.
- The total PRD should be substantial enough to guide a 3–6 month development effort. Do not abbreviate sections to save tokens.

---

## USAGE NOTES

- **Iteration**: After receiving the first output, you can re-prompt section by section. For example: "Expand Section 6 for the 'offline sync' feature with three more edge cases."
- **Tone calibration**: If your audience is more technical, add the instruction "prioritise implementation detail over narrative warmth" at the top of the prompt. For a pure executive audience, add "minimise technical implementation notes and maximise business impact framing."
- **Multi-product portfolios**: Run the prompt once per distinct product surface. Do not try to produce a single PRD for multiple products.
- **Placeholder checklist**: Before running, confirm all six placeholders are filled — PRODUCT_NAME, TARGET_USER, CORE_JOB_TO_BE_DONE, BUSINESS_CONTEXT, KNOWN_CONSTRAINTS, OUT_OF_SCOPE. Missing any one of them will produce generic, low-value output.
- **Model recommendation**: This prompt is calibrated for a long-context model with strong instruction-following. Models with a context window below 32k may truncate later sections.
