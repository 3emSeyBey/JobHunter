---
name: research-council
description: Use when the user wants deep, multi-perspective research on a topic. Triggers on "/research-council <topic>", "convene a council", "council of agents on X", "multi-perspective research", "deep dive on X with multiple viewpoints", "research panel", or similar. Dispatches N parallel research subagents — each carrying a distinct analytical lens — then synthesizes findings into a consensus / disagreement / gaps report with citations.
---

# Research Council

## Overview

Council = parallel research subagents, each with a **distinct lens**, run concurrently, then a synthesis pass. Goal: surface views a single-pass research would miss — contrarian angles, second-order effects, domain blindspots.

Use when topic is non-trivial AND benefits from multi-perspective scrutiny (strategy, policy, tech bets, market entry, ethics, design tradeoffs, hiring decisions, etc.).

Do **not** use for: simple factual lookups, single-source citation chases, code search. Overkill there.

## Workflow

```
1. Parse topic + scope
2. Pick council composition (3–6 lenses)
3. Confirm composition w/ user (1 short message, unless user said "go autonomous")
4. Dispatch all agents in PARALLEL (single message, multiple Agent tool calls)
5. Collect findings
6. Synthesize: consensus / disagreement / gaps / recommendations
7. Deliver report w/ citations
```

## Step 1 — Parse topic + scope

Extract from user input:
- **Topic** (what to research)
- **Decision context** (why — informs lens choice). If unclear, ask one line.
- **Depth** (quick scan vs deep dive). Default: deep.
- **Time horizon** (current state vs 5-yr outlook). Default: current + near-term.

## Step 2 — Pick council composition

Default roster (adapt to topic):

| Lens | Job |
|------|-----|
| **Skeptic** | Steelman why this fails / is overhyped. Find disconfirming evidence. |
| **Proponent** | Steelman why this works / is undervalued. Find supporting evidence + best case. |
| **Historian** | Prior art, analogous cases, what happened last time. |
| **Practitioner** | Field reports — what operators / users actually say. Forums, post-mortems, real deployments. |
| **Quant / Market** | Numbers, market size, adoption curves, unit economics. |
| **Adversary / Risk** | Failure modes, attack surface, regulatory risk, second-order harms. |

Pick **3–6** based on topic:
- Tech bet → Skeptic + Proponent + Practitioner + Quant
- Policy / ethics → Proponent + Skeptic + Historian + Adversary
- Hiring / org → Practitioner + Skeptic + Historian
- Market entry → Quant + Proponent + Adversary + Practitioner

You may invent custom lenses if topic demands (e.g. "Regulator", "End-user", "Engineer", "Investor").

## Step 3 — Confirm composition

Output **one short block**:

```
Topic: <topic>
Council: <lens1>, <lens2>, <lens3>, <lens4>
Depth: <quick|deep>
Proceeding unless redirected.
```

If user told you to go autonomous, skip the pause — just print the block and proceed.

## Step 4 — Dispatch in parallel

**Critical**: all Agent calls go in a **single message** with multiple tool_use blocks. Sequential = wrong.

Each agent gets `subagent_type: "general-purpose"` and a self-contained prompt:

```
You are the <LENS> on a research council investigating: <TOPIC>.

Your lens: <one-paragraph description of what this lens specifically hunts for>.

Decision context: <why user is researching this>.

Method:
- Use WebSearch + WebFetch to gather evidence. Minimum 5 distinct sources.
- Prefer primary sources, post-mortems, data, named practitioners over listicles.
- Quote specific claims with URLs. No vague "studies show".
- Flag confidence level on each claim (high / medium / low).

Return format (markdown):
## <LENS> findings
### Top claims
- [claim] — <source URL> — confidence: <level>
### Strongest evidence
<2-3 paragraphs of the most decision-relevant findings from this lens>
### What I'd change my mind on
<what evidence would flip this lens's view>
### Open questions
<gaps this lens cannot resolve alone>

Under 600 words total. Evidence over prose.
```

Vary the `<LENS>` paragraph per role. Skeptic hunts disconfirming evidence; Practitioner hunts field reports; etc.

## Step 5 — Collect findings

Wait for all agents. If one fails / returns thin, note it in synthesis — do not silently drop.

## Step 6 — Synthesize

Read all reports. Produce:

```markdown
# Council report: <topic>

## TL;DR
<3–5 bullets, decision-relevant>

## Consensus
<claims ≥2 lenses agreed on, with strongest cite each>

## Disagreement
<where lenses split, what each side anchors on>

## Gaps
<questions no lens could answer — what to investigate next>

## Recommendation
<if decision context given: what the evidence supports, with caveats. Else: skip.>

## Sources
<deduped URL list>
```

Length: 400–900 words. No filler. Cite inline.

## Step 7 — Deliver

Print the synthesis. Offer **one** follow-up: "Want a deeper pass on <gap>?" or "Want a different lens added?". Don't volunteer more.

## Iron rules

1. **Parallel dispatch always.** Sequential council = broken council. One message, N Agent calls.
2. **Lenses must actually disagree.** If all agents say the same thing, you picked redundant lenses. Re-roster.
3. **Cite or cut.** Uncited claims get deleted in synthesis. No "experts believe".
4. **Synthesis ≠ averaging.** Disagreement is a finding, not noise. Surface it.
5. **Confidence labels survive to final report.** Don't launder low-confidence claims into the TL;DR without the label.
6. **No solo research first.** Don't pre-research the topic yourself before dispatching — that biases the synthesis. Dispatch, then read.

## Invocation patterns

- `/research-council <topic>` → run full workflow
- `convene a council on <topic>` → same
- `research council: <topic>, lenses: skeptic, quant, historian` → user-specified roster, skip Step 2 auto-pick
- `quick council on <topic>` → depth = quick, 3 lenses max, agents capped at ~300 words each

## Example

User: `/research-council should we adopt Bun for our Node backend in 2026`

You output:
```
Topic: Adopt Bun for Node backend (2026)
Council: Proponent, Skeptic, Practitioner, Quant
Depth: deep
Proceeding unless redirected.
```

Then dispatch 4 Agent calls in one message. Then synthesize.
