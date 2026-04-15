# PRD Meta-Prompt — How to Use

Copy everything inside the "PROMPT TEMPLATE" block below and paste it into any LLM (Claude, GPT-4, Gemini, etc.).
Before submitting, replace every `{{PLACEHOLDER}}` with your real values. You may leave a placeholder blank and ask the LLM to make reasonable assumptions, but the more context you provide the sharper the output will be.

The prompt is opinionated by design: it pushes the LLM to write like a senior PM at a product-led growth (PLG) company — outcome-first, crisp, and decision-ready.

---

## PROMPT TEMPLATE

```
You are a senior Product Manager at a product-led growth company with 10+ years of experience shipping B2B and B2C products. Your writing is crisp, opinionated, and grounded in business outcomes. You avoid vague prose, filler sentences, and over-engineering. Every claim you make is tied to a user behavior, a metric, or a strategic bet.

Your task is to write a thorough, business-oriented Product Requirements Document (PRD) for the following initiative:

- Product / Feature name: {{PRODUCT_NAME}}
- Primary target user: {{TARGET_USER}}
- Core problem being solved: {{PROBLEM}}
- Business context / strategic rationale: {{BUSINESS_CONTEXT}}
- Known constraints (time, budget, tech, regulatory, etc.): {{CONSTRAINTS}}
- Stage (0→1 new product | existing product improvement | sunset): {{STAGE}}

---

Write the PRD now. Follow each section precisely. Be specific — use numbers, named personas, and concrete examples wherever possible. Do not hedge with "could" or "might" when you can be definitive. Flag genuine uncertainty explicitly rather than papering over it.

---

## 1. Executive Summary (≤ 150 words)

Write a single, tight paragraph that answers:
- What are we building and for whom?
- What measurable business outcome does it drive?
- Why now — what market or internal signal makes this the right moment?

A non-technical executive should be able to read this and immediately understand the bet we are making.

---

## 2. Business Context & Opportunity Sizing

### 2.1 Strategic fit
State in 2–3 sentences how this initiative maps to the company's current strategic priorities or OKRs. Name the specific objective it advances.

### 2.2 Market opportunity
Provide a concise TAM → SAM → SOM breakdown. Use real or estimated numbers. If data is unavailable, state your assumptions explicitly and how you would validate them.

### 2.3 Competitive landscape
Name 2–4 competitors or substitutes. For each, state their key strength and their key weakness relative to this initiative. Conclude with our differentiated angle in one sentence.

### 2.4 Revenue / growth impact
Quantify the expected impact: projected ARR, conversion rate lift, retention improvement, cost reduction, or other relevant financial metric. State the time horizon (e.g., 12 months post-launch).

---

## 3. Problem Statement

### 3.1 The problem
Write the problem as a customer-centric narrative: who experiences it, in what situation, with what consequence. Avoid solution language.

### 3.2 Evidence
List 3–5 concrete data points or qualitative signals that validate the problem (e.g., support tickets, NPS verbatims, churn reasons, usage analytics, sales call themes). If data is hypothetical, label it clearly and propose how to gather it.

### 3.3 Cost of inaction
What happens if we build nothing? Quantify where possible (lost revenue, churn rate, competitor gain).

---

## 4. User Personas & Jobs-to-Be-Done

For each relevant persona (aim for 2–3), write a structured block:

**Persona name:** [Give a memorable name, not a demographic label]
**Role / context:** [Job title, company size, industry if relevant]
**Primary job-to-be-done:** [One sentence in the format: "When [situation], I want to [motivation], so I can [outcome]."]
**Key frustrations today:** [Bullet list of 3–4 pain points with current solutions]
**Success looks like:** [What does the ideal experience feel like for this persona?]
**Influence on purchase / adoption:** [Decision-maker | Champion | End-user | Blocker]

---

## 5. Goals & Success Metrics

### 5.1 North Star metric
Name one metric that best captures whether users are getting value from this feature. Explain why it is the right north star.

### 5.2 OKRs (for the next 2 quarters post-launch)

Objective: [Inspiring, qualitative goal]
- KR1: [Specific, measurable, time-bound]
- KR2: [Specific, measurable, time-bound]
- KR3: [Specific, measurable, time-bound]

Write 1–2 OKR sets. Each KR must have a clear baseline (current state) and target (desired state).

### 5.3 Guardrail metrics
List 2–3 metrics that must NOT regress as a result of this work (e.g., page load time, existing feature engagement, support volume).

---

## 6. Functional Requirements

Structure requirements as user stories with clear acceptance criteria. Group by capability area (not by sprint or technical layer).

For each requirement:

**[REQ-XXX] Title**
- Priority: P0 (launch blocker) | P1 (launch goal) | P2 (post-launch)
- User story: As a [persona], I want [action] so that [outcome].
- Acceptance criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Criterion 3
- Notes / edge cases: [Any ambiguity, edge cases, or design decisions that need resolution]

Write at least 6 requirements covering the core user journey end-to-end. Be specific enough that an engineer or designer can act on each requirement without a follow-up meeting.

---

## 7. Non-Functional Requirements

Address each of the following. Be specific — avoid generic statements like "the system should be fast."

- **Performance:** Specific latency / throughput targets under defined load conditions.
- **Scalability:** Expected usage growth over 12–24 months and how the system must accommodate it.
- **Security & Privacy:** Data classification, access control requirements, relevant compliance standards (GDPR, SOC 2, HIPAA, etc.).
- **Reliability / Availability:** Uptime SLA, acceptable error rate, incident response expectation.
- **Accessibility:** WCAG level target, any specific assistive technology requirements.
- **Internationalisation:** Languages, locales, currencies, or date formats required at launch vs. later.
- **Observability:** Logging, monitoring, alerting expectations for the engineering team.

---

## 8. Out of Scope

List specific capabilities, user segments, platforms, or integrations that are explicitly NOT part of this initiative, and briefly state why (defer, separate workstream, strategic choice). A clear out-of-scope section prevents scope creep and misaligned expectations.

---

## 9. Dependencies, Risks & Assumptions

### 9.1 Dependencies
List internal (other teams, shared services, design system) and external (third-party APIs, vendors, regulatory approvals) dependencies. For each, state the owner and the risk if the dependency is delayed.

### 9.2 Risks

Use this format for each risk:

| Risk | Likelihood (H/M/L) | Impact (H/M/L) | Mitigation |
|---|---|---|---|
| [Risk description] | | | [Concrete mitigation step] |

Include at least 4 risks spanning product, technical, market, and execution dimensions.

### 9.3 Assumptions
List the key assumptions this PRD is built on. For each, state how it will be validated and by when.

---

## 10. Launch & Go-to-Market Considerations

### 10.1 Launch strategy
Recommend a rollout approach (feature flag, beta cohort, geographic rollout, full launch) with rationale. State the definition of "launch ready."

### 10.2 Pricing & packaging (if applicable)
Which pricing tier will this feature sit in? Does it require a packaging change? What is the upsell or expansion motion?

### 10.3 Internal enablement
What do Sales, Support, and Customer Success need to know before launch? List the artifacts required (one-pager, demo script, FAQ, knowledge base article).

### 10.4 Marketing moment
Is there a marketing moment attached to this launch (press release, Product Hunt, conference, email campaign)? What is the messaging angle in one sentence?

### 10.5 Post-launch review
When will the first post-launch review happen? What data will be reviewed and who owns the decision to iterate, pivot, or stop?

---

## 11. Open Questions

List every significant unresolved question that could affect scope, design, or business outcome. For each question, state:
- The question itself (be specific)
- Who owns the answer
- The deadline by which it must be resolved to avoid blocking work
- The fallback decision if no answer is reached in time

Format as a numbered list. Aim for 5–10 questions.

---

## Writing Standards to Apply Throughout

- Use plain, direct language. Write at an 8th-grade reading level.
- Prefer active voice over passive voice.
- Every metric must have a unit and a time horizon.
- Every claim must be backed by data, a named source, or an explicit assumption label.
- Avoid acronyms without defining them on first use.
- If you are uncertain about something, say so explicitly and propose a resolution path rather than guessing.
- The final PRD should be self-contained: a new team member should be able to read it and understand the full context without any other document.
```

---

## Usage Notes

**Minimum required placeholders to fill in:**
- `{{PRODUCT_NAME}}` — the name of the product or feature
- `{{TARGET_USER}}` — who this is primarily built for (e.g., "early-career sales reps at mid-market SaaS companies")
- `{{PROBLEM}}` — the core problem in one or two sentences

**Optional but strongly recommended:**
- `{{BUSINESS_CONTEXT}}` — company strategy, OKRs, or the "why now" signal
- `{{CONSTRAINTS}}` — known hard limits (deadline, budget, tech stack, headcount)
- `{{STAGE}}` — helps the LLM calibrate depth (a 0→1 PRD is very different from an incremental improvement PRD)

**Tips for better output:**
1. Paste in any existing research (customer interviews, analytics screenshots, competitor notes) after the template — the LLM will incorporate it into the relevant sections.
2. If a section produces vague output, follow up with: "Rewrite section X. Be more specific. Use real numbers or state your assumptions explicitly."
3. For regulated industries (fintech, healthtech, legaltech), add a short paragraph after `{{CONSTRAINTS}}` describing your compliance environment.
4. This prompt works best with Claude Sonnet/Opus, GPT-4o, or Gemini 1.5 Pro with a long context window — some sections benefit from extended reasoning.
