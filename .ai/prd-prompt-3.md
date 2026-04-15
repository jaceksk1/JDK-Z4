# Meta-Prompt: Lean Hypothesis-Driven PRD

## How to use this prompt

1. Fill in every `{{PLACEHOLDER}}` below with your real values before pasting.
2. Paste the entire "PROMPT TEMPLATE" section into any capable LLM (Claude, GPT-4o, Gemini 1.5 Pro, etc.).
3. The LLM will return a complete PRD. Push back on any section that exceeds half a page — force cuts.
4. Treat the output as a living doc. Update the decision log and kill criteria after every sprint retro.

Placeholders to fill in:
- `{{PRODUCT_NAME}}` — name of the feature or product
- `{{HYPOTHESIS}}` — your core belief about user + problem + solution in plain English
- `{{TARGET_USER}}` — one specific persona, not a demographic range
- `{{PROBLEM}}` — the specific pain, described in the user's own words if possible
- `{{SOLUTION}}` — the smallest describable intervention you want to ship
- `{{TARGET_METRIC}}` — the single number that will tell you if this worked
- `{{FALSIFICATION_CONDITION}}` — what data/observation would prove you wrong
- `{{TEAM_SIZE}}` — number of engineers + designers available
- `{{RUNWAY_WEEKS}}` — how many weeks until this must show results

---

## PROMPT TEMPLATE

---

You are a senior product manager at a fast-moving startup. Your job is to write a lean, hypothesis-driven PRD for **{{PRODUCT_NAME}}**.

### Constraints — read these first, obey them throughout:

- The entire PRD must fit in **2 pages or fewer** when printed (roughly 800–1000 words of body text, excluding headers).
- Every claim must be labeled either `[ASSUMPTION]` or `[VALIDATED]`. Do not present assumptions as facts.
- Bias strongly toward **shipping and learning** over completeness or polish.
- Use plain, direct language. No buzzwords, no passive voice, no filler.
- If a section would require more than 3–4 bullet points to convey, you are over-scoping — cut ruthlessly.

---

### Section 1 — The Bet (1 paragraph, max 80 words)

Write a single paragraph that captures: what we believe is true right now, why the timing is right (market signal, technology shift, or behavioral change), and what we will learn from this experiment. This is not a mission statement — it is a time-boxed bet.

---

### Section 2 — Core Hypothesis

State the hypothesis in this exact structure. Fill in from the user-supplied context below.

> We believe **{{TARGET_USER}}** has **{{PROBLEM}}**.  
> If we build **{{SOLUTION}}**, we expect **{{TARGET_METRIC}}** to move by [specify direction and magnitude].  
> We will know we are wrong if **{{FALSIFICATION_CONDITION}}**.

Then add one sentence explaining the single biggest risk to this hypothesis. Label it `[ASSUMPTION]` or `[VALIDATED]`.

---

### Section 3 — Spike / Experiment Plan (before full build)

List 2–3 cheap experiments or spikes to run **before** committing engineering resources to the full build. For each experiment state:
- What question it answers
- How long it takes (days, not weeks)
- What result would give you enough confidence to proceed

If all spikes pass, proceed to MVP. If any spike fails, revisit the hypothesis.

---

### Section 4 — MVP Scope

**In scope (ship this):** List the smallest set of capabilities — 3 to 5 bullet points max — that make the hypothesis testable with real users. Each bullet must be a user-observable behavior, not a technical task.

**Scope cut — NOT in MVP (list exactly 5 things):** Be explicit. Name five features, integrations, or polish items that a reasonable person might expect but that you are deliberately excluding from MVP. For each, write one clause explaining why it is cut (e.g., "not needed to validate the hypothesis", "can be faked manually", "adds 3+ weeks for marginal learning").

---

### Section 5 — North Star Metric and Leading Indicators

- **North Star Metric:** {{TARGET_METRIC}} — define it precisely (numerator, denominator, measurement window).
- **Leading Indicators (2–3):** Early signals, measurable within the first 2 weeks, that predict movement in the North Star. These are your weekly pulse check.
- **Vanity metrics to ignore:** Name 1–2 metrics that will look good but mean nothing for validating the hypothesis.

---

### Section 6 — Technical Constraints and Non-Negotiables

List only the constraints that are real and immovable — things that would cause a build to be scrapped if violated. Examples: compliance requirements, latency SLAs, existing system integrations that cannot be broken.

Do not list aspirational engineering standards here. Max 4 bullets.

Team context: **{{TEAM_SIZE}}** engineers/designers. Keep the scope honest.

---

### Section 7 — Decision Log

Use this table format. Fill in at least 3 decisions that were already made in scoping this PRD. Be honest about what was rejected and why — this is the most valuable section for future team members.

| Decision | Alternatives Considered | Why This Choice | Date |
|---|---|---|---|
| [Decision 1] | [Alt A, Alt B] | [Reasoning] | [Date] |
| [Decision 2] | [Alt A, Alt B] | [Reasoning] | [Date] |
| [Decision 3] | [Alt A, Alt B] | [Reasoning] | [Date] |

---

### Section 8 — 30 / 60 / 90-Day Milestones

Write exactly one sentence per milestone. Each sentence must describe a **verifiable external outcome**, not an internal activity.

- **Day 30:** [What is observable in the world — shipped, measured, or learned]
- **Day 60:** [What decision point or metric threshold is reached]
- **Day 90:** [What is true if this bet is working — specific, falsifiable]

Adjust timelines if {{RUNWAY_WEEKS}} is shorter than 13 weeks — compress proportionally and note it.

---

### Section 9 — Kill Criteria

Define 2–3 specific, pre-agreed conditions under which the team will **stop building this and pivot or kill it**. These must be:
- Quantitative where possible (e.g., "fewer than X users complete Y after Z weeks")
- Agreed before the build starts, not rationalized after data comes in
- Tied directly to the falsification condition in Section 2

Stating these upfront is a sign of good judgment, not pessimism. If you cannot define kill criteria, the hypothesis is not specific enough — go back to Section 2.

---

### Formatting rules for your output:

1. Use the section headers above verbatim.
2. Do not add new sections.
3. Do not pad any section to fill space. Short is correct.
4. At the very end, add one line: **"Word count: [N]"** so the reader can verify the 2-page constraint.
5. If any section required you to make a significant assumption on behalf of the user, flag it inline with `[ASSUMPTION — needs validation]`.

---

## Usage Notes

- This prompt works best when you have already done at least one customer conversation. If you have zero user evidence, run discovery first — a PRD written in a vacuum produces a beautiful document for a problem nobody has.
- The "Scope Cut" section (5 explicit exclusions) is the single highest-leverage section. Teams that skip it reliably over-build. Do not skip it.
- Review the Decision Log at every sprint retro. If a decision from the log turns out to be wrong, update it immediately — stale logs are worse than no log.
- Kill criteria are a commitment device. Write them when conviction is high; honor them when data is hard to read. If you find yourself arguing against your own kill criteria, that is a signal to re-examine the hypothesis, not to raise the threshold.
- This template is intentionally opinionated. If your organization requires compliance sections, legal review gates, or accessibility audits, append them as an addendum — do not let them inflate the core PRD.
