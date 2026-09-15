# 🎯 SPM EXAM MASTER NOTES — Hours 2–8
> **How to use:** Every concept has a plain-English explanation first, then the technical detail.
> 🔴 `EXAM Q:` = the actual question you should expect on the exam.

---

# ⏱️ HOUR 2 — Project Planning & Estimation

## WHY PLANNING MATTERS
Think of planning like packing for a trip. You don't pack to *guarantee* no problems — you pack so that if something goes wrong, you're not completely lost. Planning doesn't stop bad things from happening; it makes sure everyone *knows the assumptions, decisions, and risks upfront* so they're not surprised later.

- Planning **does NOT remove uncertainty** — it makes assumptions, constraints, and dependencies **EXPLICIT**
- Poor planning → unrealistic estimates → delay & rework → low morale → customer dissatisfaction

---

## PLANNING MAP — 6 Activities
When a project manager plans, they don't just make a to-do list. They plan across 6 different areas. Think of it like planning a construction project — you need to know *what it costs, who does what, what tools are needed, what can go wrong, what good quality means, and how you track versions of the design*.

> 🔴 `EXAM Q:` *"List and briefly describe the 6 major planning activities."*

| # | Activity | What it covers |
|---|----------|----------------|
| 1 | ESTIMATE | Effort, cost, duration |
| 2 | SCHEDULE | Activities, dependencies, milestones |
| 3 | RESOURCES | People, tools, infrastructure |
| 4 | RISK | Identify, analyze, respond |
| 5 | QUALITY | Standards, reviews, acceptance |
| 6 | CONFIGURATION | Baselines, change, versions |

---

## PLANNING FLOW — 8 Steps in ORDER
These are the steps you follow when building a project plan. They *must be done in this order* because each step depends on the one before it — you can't schedule work before you know what the work is.

1. Clarify scope → 2. Choose process → 3. Estimate → 4. Build WBS → 5. Sequence & schedule → 6. Plan resources → 7. Plan risk & quality → 8. **Integrate & baseline**

---

## LIFECYCLE CHOICE
A lifecycle is the *shape* of how the project runs — do you finish everything before showing it (Waterfall), or do you build and show small pieces frequently (Agile)? There is no single best answer — it depends on how clear the requirements are and how much uncertainty exists.

- **PREDICTIVE (Waterfall):** Requirements are fixed and clear from the start
- **ITERATIVE:** You refine the solution in repeated cycles (e.g., design → feedback → redesign)
- **INCREMENTAL:** You deliver working pieces one at a time (early users get early features)
- **AGILE/HYBRID:** Combines iterative + incremental + frequent customer feedback

> ⚠️ **EXAM TRAP:** No lifecycle is universally best — context determines choice.

---

## ROLLING-WAVE PLANNING
Imagine you're planning a road trip but you only know the first 2 days in detail. As you drive, you figure out the rest. That's rolling-wave — *plan nearby work in detail, plan far-off work at a high level, and refine as you get closer.*

Near-term = DETAILED. Distant = HIGH LEVEL. Like driving at night with headlights.

---

## SPMP — SOFTWARE PROJECT MANAGEMENT PLAN (IEEE 1058)
The SPMP is the master document that says: *"Here is how we will run this project."* It covers everything — how we'll estimate, who does what, what our schedule is, what risks exist, how quality will be checked, and how we track configuration. Think of it as the project's instruction manual.

> 🔴 `EXAM Q:` *"What are the sections of an SPMP? List all 10."*

**10 sections:**
01 Introduction | 02 Estimates | 03 Resource plan | 04 Schedule/WBS | 05 Risk management | 06 Tracking & control | 07 Quality assurance | 08 Configuration management | 09 Process tailoring | 10 Supporting plans

**3 Baselines** (think: snapshots that are "locked in" as official reference points):
- **Scope baseline** — what is in/out of the project
- **Schedule baseline** — when things are expected to happen
- **Cost baseline** — approved budget over time

---

## ESTIMATION

### Estimation Chain
Estimation is like figuring out how long it will take to build a house before you have a blueprint. You start with *size* (how big?), turn that into *effort* (how much human work?), then into *duration* (how many weeks?), then *cost* (how much money?), and finally *resources* (which people and tools?).

> 🔴 `EXAM Q:` *"Distinguish between effort, duration, and staffing. Why can't you just divide effort by people?"*

**SIZE → EFFORT → DURATION → COST → RESOURCES**
- **EFFORT** = total human work e.g., 56 person-months (10 people working for 5.6 months)
- **DURATION** = calendar time (not same as effort — parallel work speeds things up)
- **BROOKS' LAW:** "Adding manpower to a late software project makes it LATER." (New people need time to learn, which slows the team down.)

---

### Top-Down vs Bottom-Up Estimation
**Top-down** = start with the big picture and split it. Good when you don't have details yet.
**Bottom-up** = estimate every small task and add them up. More accurate but you need details first.

| | TOP-DOWN | BOTTOM-UP |
|--|---------|---------|
| **When** | Early, details unknown | Later, details known |
| **How** | Estimate whole → break down | Estimate each task → aggregate |
| **Accuracy** | Less accurate | More accurate |

---

### LOC vs Function Points
**LOC** (Lines of Code) = you count source code lines. Problem: you can only count after coding, and coding style varies.
**Function Points** = you count the *functionality* the software must provide (inputs, outputs, files, etc.) from the *requirements document* — before a single line of code is written. That's why FP is preferred for early estimation.

> 🔴 `EXAM Q:` *"Why are Function Points preferred over LOC for early estimation?"*

| | LOC | Function Points |
|--|-----|----------------|
| **Problem** | Hard to estimate EARLY | Can measure from REQUIREMENTS |
| **Use** | When code exists | Before coding begins |

---

### Function Point — 5 Components
These are the 5 types of things you count when measuring how much functionality a system has. Think of a university registration system:
- Students *submit a form* → External Input
- System *prints a report* → External Output
- System *stores student records* → Internal Logical File
- System *reads course data from another system* → External Interface File
- Student *queries their own record* → External Inquiry

> 🔴 `EXAM Q:` *"Name and describe the 5 components of Function Points."*

1. **EI** — External Inputs (data entering system)
2. **EO** — External Outputs (reports/messages/exports)
3. **ILF** — Internal Logical Files (data maintained by system)
4. **EIF** — External Interface Files (data maintained elsewhere)
5. **EQ** — External Inquiries (interactive input-output)
> Each weighted: Simple / Average / Complex → total = Function Point count

---

### PARAMETRIC FORMULA
A mathematical model that says: effort grows with size, but not linearly — bigger projects are disproportionately harder.
> **Effort = a × Size^b**
> a and b are constants calibrated from past real projects. Size is measured in KLOC (thousands of lines of code).

---

### COCOMO — Constructive Cost Model
COCOMO takes the parametric formula one step further by also adjusting for *how hard the project is* — based on 15 factors like team skill, reliability requirements, tool quality, etc.

1. Initial estimate: Effort = a × Size^b
2. Rate 15 cost drivers (on a scale: low to very high)
3. Adjusted effort = initial estimate × combined adjustment factor

### COCOMO Cost Driver Categories — 4
> 🔴 `EXAM Q:` *"Name the 4 categories of COCOMO cost drivers with examples."*

1. **PRODUCT** — reliability, database size, complexity (how hard is the software itself?)
2. **PLATFORM** — execution-time, memory constraints (how demanding is the hardware/platform?)
3. **PEOPLE** — analyst and programmer capability, experience (how skilled is the team?)
4. **PROJECT** — tools, development schedule pressure (what resources and constraints exist?)

---

### Phase Distribution
Many students think writing code = most of the work. It's not.

> ⚠️ **EXAM TRAP:** Design (40%) + Testing (22%) = 62% > Coding (38%). Coding is NOT the most work!

- Product design: 16% | Detailed design: 24% | **Coding & unit test: 38%** | Integration & test: 22%

---

### Effort vs Duration vs Staffing
Imagine 9 women can't make a baby in 1 month. Some tasks just can't be parallelized. Same with software — more people doesn't always mean faster delivery.

- **EFFORT** = total human work (e.g., 56 person-months)
- **DURATION** = calendar time (depends on what can run in parallel)
- **STAFFING** = can't divide effort by people linearly → **Brooks' Law applies**

---

# ⏱️ HOUR 3 — WBS & Scheduling

## WBS — Work Breakdown Structure
Think of a WBS like a family tree for work. At the top is the whole project. Below it, you break it into major chunks. Then break those chunks into smaller chunks, until each piece is small enough to assign to someone and estimate. The WBS is *only about scope (what work exists)* — not time or order.

> 🔴 `EXAM Q:` *"What is WBS? List its 4 principles. How does it differ from a schedule?"*

- Hierarchical decomposition of TOTAL project **SCOPE** into manageable components
- **100% rule:** Not in WBS = NOT in the project. Everything is accounted for.
- **WBS = WHAT. Schedule = WHEN.**

### 4 WBS Principles
1. **SCOPE-BASED** — covers 100% of the work
2. **HIERARCHICAL** — major deliverables broken into smaller parts
3. **MANAGEABLE** — lowest level can be estimated, assigned, and tracked
4. **NON-OVERLAPPING** — sibling elements don't duplicate the same work

---

## MILESTONES — ZERO DURATION
A milestone is a *checkpoint*, not a task. It marks that something has been achieved — like "Requirements Approved" or "System Test Complete." It takes no time itself; it just signals the end of a phase.

"A milestone without an observable deliverable is just a hope."

---

## DEPENDENCY TYPES
Dependencies define the *order* in which activities must happen. You can't test before you code, right? These are the four types of logical relationships between activities.

- **FS** (Finish-to-Start): Activity B *starts* only after Activity A *finishes* ← most common
- **SS** (Start-to-Start): B can *start* when A *starts* (can overlap at the beginning)
- **FF** (Finish-to-Finish): B *finishes* when A *finishes* (must end together)
- **External**: Depends on something outside your project (vendor, regulator, customer)

---

## Gantt vs Network Diagrams
These are two different tools for showing the schedule. Use Gantt when you're presenting to stakeholders. Use a network diagram when you need to analyze dependencies and find the critical path.

| | Gantt | Network Diagram |
|--|-------|---------|
| **Best for** | COMMUNICATION (readable, visual) | CRITICAL PATH analysis |
| **Strength** | Easy to understand timeline | Shows dependency logic |
| **Weakness** | Doesn't show why tasks depend on each other | Hard to read timeline at a glance |

---

## CPM — Critical Path Method
The critical path is the *longest chain of dependent tasks* in the project. Whatever that total is — that's your minimum project duration. You can't finish before that. Any delay on a critical path task = the whole project is delayed.

**Float (Slack)** = how much you can delay a non-critical task without affecting the project end date.

> 🔴 `EXAM Q:` *"Given a network diagram, find the critical path and the float of each non-critical activity."*

- **Critical Path** = LONGEST path through network = EARLIEST possible project completion
- **Float** = time activity can slip WITHOUT delaying project finish
- **Critical path activities = ZERO float** (no wiggle room)
- "CRITICAL" does NOT mean technically hardest. It means **SCHEDULE-CRITICAL** (schedule depends on it).

### CPM Worked Example
- Path A→B→D→E = 2+3+5+2 = **12 days** ← CRITICAL PATH (longest)
- Path A→C→D→E = 2+2+5+2 = 11 days
- Float of C = 12 − 11 = **1 day** (C can be delayed by 1 day without affecting project end)

---

## PERT — Program Evaluation and Review Technique
PERT is used when you're not sure exactly how long a task will take. Instead of one estimate, you give three: best case, most likely, worst case. PERT then calculates a weighted average — giving 4× weight to the "most likely" estimate because it's... most likely.

> 🔴 `EXAM Q:` *"Calculate the PERT expected duration given O, M, P values."*

> **E = (O + 4M + P) / 6**
> - O = Optimistic (everything goes perfectly)
> - M = Most Likely (normal conditions)
> - P = Pessimistic (lots of problems)

**Example:** O=4, M=7, P=13 → (4 + 28 + 13) ÷ 6 = 45 ÷ 6 = **7.5 days**

---

## Schedule Compression — When You're Running Late
Sometimes you need to finish faster. There are two ways to compress the schedule — both have trade-offs.

| | Fast Tracking | Crashing |
|--|-------------|---------|
| **Method** | Do sequential tasks in PARALLEL | Add MORE PEOPLE or resources |
| **Benefit** | Shorter duration | Shorter critical path |
| **Risk** | More rework if parallelism creates conflicts | Higher cost, diminishing returns |

---

## RACI Matrix — Who Does What?
When multiple people are involved in a project, it gets confusing who is responsible for what. RACI makes it explicit.

- **R** = Responsible — who actually does the work (e.g., developer codes it)
- **A** = Accountable — who owns the result and accepts it (e.g., tech lead signs off)
- **C** = Consulted — who gives input (e.g., security expert reviews it)
- **I** = Informed — who just needs to know it happened (e.g., project sponsor)

---

# ⏱️ HOUR 4 — Risk Management

## RISK vs DEFECT vs PROBLEM
This distinction trips up a lot of students. The key is *when* it exists:
- **Risk** = something that *might* go wrong in the future (uncertain)
- **Defect** = something that is *already wrong* in the code or document right now
- **Problem/Issue** = a risk that *already happened* — it's no longer uncertain, it's a crisis

> 🔴 `EXAM Q:` *"Classify each of the following scenarios as a risk, defect, or problem."*

| Term | When |
|------|------|
| **RISK** | Possible FUTURE event — may or may not happen |
| **DEFECT** | Flaw that ALREADY EXISTS in a work product |
| **PROBLEM** | Risk that HAS MATERIALIZED — requires action NOW |

> ⚠️ **TRAP:** "A bug found in code" = DEFECT, not a risk!

---

## SRM — Systematic Risk Management (2 Domains)
SRM is the structured approach to dealing with risk. It has two sides: first *understand* your risks, then *act* on them.

- **ASSESSMENT** (understand): Identification → Analysis → Prioritization
- **CONTROL** (act): Planning → Resolution → Monitoring → Correction

---

## BOEHM'S 4 REASONS FOR RISK MANAGEMENT — Memory: **DROW**
Barry Boehm argued that managing risk is not just "being cautious" — it has specific business benefits. Knowing these 4 reasons is exam-ready.

> 🔴 `EXAM Q:` *"According to Boehm, why should software projects manage risk? Give all 4 reasons."*

1. Avoid **D**isasters — runaway budget, schedule, and defect-ridden products
2. Avoid costly **R**ework — fixing wrong/missing/ambiguous requirements later is expensive
3. Avoid **O**verkill — don't waste effort on areas with minimal risk
4. Support **W**in-win — customer gets what they need; team achieves business goals

---

## 6 RISK CATEGORIES
Software projects face risk from many directions — not just technical ones. Here are all 6:

> 🔴 `EXAM Q:` *"List the 6 risk categories in software projects with one example each."*

Memory: **"The Monkeys Fight Crazy Pigs Running"**

1. **T**echnical — new/unfamiliar technology, complex integrations, immature platforms
2. **M**anagement — poor planning, weak authority, lack of communication, experience gaps
3. **F**inancial — cash flow problems, budget cuts, ROI pressure
4. **C**ontractual/Legal — changing requirements by contract, regulation, warranty, safety
5. **P**ersonnel — key person leaves, skill gaps, team conflicts, low productivity
6. **R**esources — equipment unavailable, inadequate tools, distributed teams, computing limits

---

## RISK IDENTIFICATION TECHNIQUES — 5
You can't manage risks you don't know about. Here are 5 ways to find them:

1. **Brainstorming & Interviews** — gather the team and stakeholders; ask "what could go wrong?" Separate idea generation from evaluation.
2. **Decomposition** — break the project into components; each component reveals specific risks
3. **Assumption Analysis** — every assumption your plan makes is a potential risk. If the assumption turns out to be wrong, something will go wrong.
4. **Critical Path & Dependency Analysis** — activities on or near the critical path deserve extra risk attention (any delay = project delay)
5. **Taxonomies & Checklists** — use category lists (like the 6 above) to prompt thinking. Don't be *limited* to them though.

---

## RISK STATEMENT PATTERN
Vague risks are useless. A well-formed risk statement tells you *why* it might happen, *what* might happen, and *what the consequence* is.

> "Because of **[CAUSE]**, **[UNCERTAIN EVENT]** may occur, leading to **[EFFECT]**."

**Weak (vague):** "Integration risk."
**Strong:** "Because the payment API is still changing, interface incompatibility may occur, causing rework and a 3-week release delay."

---

## RISK ANALYSIS — 4 Questions
Once you identify a risk, you need to understand it. Answering all 4 is required for a complete analysis.

1. **LIKELIHOOD** — how probable is it? (Low/Med/High or 0–1)
2. **IMPACT** — how bad is it if it happens? (schedule, cost, quality, safety)
3. **TIMEFRAME** — when could it happen? Must we act now, or do we have time?
4. **INTERDEPENDENCE** — could this risk trigger or worsen other risks?

---

## RISK EXPOSURE — The Key Formula
Risk Exposure (RE) lets you *compare* risks with different probabilities and impacts by turning them into one comparable number — the expected loss.

> 🔴 `EXAM Q:` *"Calculate the Risk Exposure given probability and size of loss. What does the result mean?"*

> **RE = Probability × Size of Loss**

**Example:** P = 0.30, Loss = $40,000
→ RE = 0.30 × $40,000 = **$12,000**
This means: on average, you'd expect to lose $12,000 from this risk. It is NOT a guarantee — it's an expected value used to *prioritize* which risks deserve the most attention.

---

## RISK RESPONSE STRATEGIES — 5
Once you know your risks and their exposure, you decide how to respond. There are 5 strategies:

1. **AVOIDANCE** — eliminate the source of the risk entirely (e.g., cut a risky feature, choose a proven technology instead of a new one)
2. **INFO ACQUISITION** — reduce uncertainty before committing (e.g., build a small prototype to test if the approach works)
3. **TRANSFER** — shift the financial responsibility (e.g., contract terms, insurance, outsourcing). Note: the uncertainty doesn't disappear — just who pays for it.
4. **REDUCE PROBABILITY** — lower the chance it happens (e.g., training, standardizing, starting risky tasks early)
5. **REDUCE IMPACT** — limit the damage if it does happen (e.g., modular design so failure is isolated, backup suppliers, time buffers)

---

## CONTAINMENT vs CONTINGENCY
Both are responses to risk, but they happen at *different times*:

- **Containment** = action you take *before* the risk occurs to reduce its probability or impact. Like fireproofing a building — you do it before any fire.
- **Contingency** = action you *plan in advance* but only execute *if the risk materializes*. Like having a fire evacuation plan — you don't use it unless there's a fire.

> 🔴 `EXAM Q:` *"Distinguish between containment and contingency actions. Give an example of each."*

| | Containment | Contingency |
|--|------------|------------|
| **When** | BEFORE risk occurs | AFTER trigger fires |
| **Type** | Preventive | Reactive (but pre-planned!) |
| **Example** | Build prototype to test API early | Switch to backup API if primary fails |

---

## RISK LIFECYCLE — 5 States
A risk doesn't stay the same forever. It moves through states:

**IDENTIFIED** (we know it exists) → **ACTIVE** (we're managing it) → **TRIGGERED** (a warning sign appeared) → **REALIZED** (it happened — now an issue) → **RETIRED** (no longer relevant)

---

# ⏱️ HOUR 5 — Configuration Management (SCM)

## WHY SCM EXISTS
Imagine 5 developers all editing the same file at the same time with no coordination — one person's changes overwrite another's. Or imagine a customer calls about a bug in version 2.1, but your team has no idea what code was in version 2.1. SCM exists to solve these coordination and traceability problems.

## SCM DEFINITION
> "A discipline for **CONTROLLING the EVOLUTION of software systems.**"

---

## 4 SCM FUNCTIONS — Memory: **I-C-S-A**
These are the four core things SCM does. Think of them as *building blocks* — you can't have control without identification, and you can't audit without accounting.

> 🔴 `EXAM Q:` *"Name and describe the 4 classical SCM functions."*

| # | Function | Plain meaning |
|---|----------|--------------|
| 1 | **IDENTIFICATION** | Give every document, file, and build a unique name/version so we can refer to them unambiguously |
| 2 | **CONTROL** | Make sure changes only happen through an authorized process — no unauthorized edits |
| 3 | **STATUS ACCOUNTING** | Keep records and reports of what version is where, what changed, what's pending — the information function |
| 4 | **AUDIT & REVIEW** | Check that the product actually contains what it's supposed to (complete, consistent, correct) |

> "Identification is the FOUNDATION — you cannot control what you cannot IDENTIFY."

---

## CONFIGURATION ITEMS (CIs)
A CI is any work product that goes under configuration control. Students assume this means only source code. Wrong.

> ⚠️ **EXAM TRAP:** CIs include much more than code!

- Source code
- Requirements specifications
- Architecture/design documents
- **User manuals and documentation**
- **Build files** (make files, build scripts)
- **Test scripts and automation**

---

## VERSION TERMINOLOGY — 4 Terms
These four words sound similar but mean different things:

> 🔴 `EXAM Q:` *"Distinguish between version, revision, variant, and release."*

| Term | Plain meaning | Example |
|------|--------------|---------|
| **VERSION** | Any saved state of a file — a snapshot | PaymentService.java at 3pm Tuesday |
| **REVISION** | A new version that *replaces* the old one on the same line of development | V1 → V2 → V3 (same product, evolving) |
| **VARIANT** | A version for a *different context* — different OS, customer, platform | Windows version vs Linux version of same app |
| **RELEASE** | A selected, packaged set of versions delivered to users | "Release 2.0" shipped to all customers |

---

## BRANCHING PURPOSES — 4
A branch is like making a photocopy of your codebase so you can work on it separately without affecting the original. Teams branch for 4 main reasons:

> 🔴 `EXAM Q:` *"Give 4 reasons why a team would create a branch."*

1. **Release Maintenance** — fix bugs in the shipped version while new features are developed in parallel
2. **Feature Development** — work on a big new feature in isolation until it's ready to merge
3. **Experimentation** — try a risky idea without breaking the main codebase
4. **Product Variants** — maintain separate versions for different customers or platforms

> ⚠️ Trade-off: Branching increases parallelism but also increases complexity — the longer branches diverge, the harder they are to merge back.

---

## DEFECT REPORT vs CHANGE REQUEST
They're related but different things. A defect report says "something is broken." A change request says "please change this" — which might come from a defect, or from a new requirement, or a business decision.

> 🔴 `EXAM Q:` *"What is the difference between a defect report and a change request?"*

| | Defect Report | Change Request |
|--|---------------|---------------|
| **What it is** | Record of an *observed problem* | Proposal to *modify* something |
| **Content** | What went wrong, how to reproduce | What to change and why |
| **Link** | Can *lead to* a Change Request | May originate from a defect OR a new requirement |

> "NOT every change originates from a defect!"

---

## CONTROLLED CHANGE WORKFLOW — 6 Steps
Without this process, developers just "fix things" without knowing what version they're fixing, whether the fix affects other parts, or whether the change was even approved. The workflow prevents that chaos.

1. **Report/Request** — document the problem or proposed change
2. **Analyze impact** — what files are affected? What versions? What's the cost?
3. **Decide** — approve / defer / reject (AND record *why*)
4. **Implement** — against the CORRECT identified versions (not just "latest")
5. **Verify** — test and review the change
6. **Close/Release** — update records, baseline, and release if needed

---

## CCB — Configuration Control Board
The CCB is the governance committee that reviews and authorizes significant changes. Not every small fix goes through them, but important changes do.

Members typically: Project/product management + Technical leadership + QA + Customer representative.

---

## TRACEABILITY CHAIN
Traceability means being able to answer: *"Which version fixed that bug? What files changed? Was it in the release the customer has?"* The answer comes from a chain of linked records.

> 🔴 `EXAM Q:` *"Describe the end-to-end traceability chain in SCM."*

> **Problem Report → Affected CIs → New Versions → Build/Baseline → Verified Change → Release**

**Example:** PR-217 "duplicate payment" → CR-104 "fix retry logic" → PaymentService V18 → Build 2.0.1-rc1 → Tests pass → Release 2.0.1 (PR-217 marked fixed)

---

## CMM — Capability Maturity Model (5 Levels)
CMM describes how mature an organization's software processes are. Level 1 = chaotic, relies on individuals. Level 5 = continuously improving, data-driven. SCM is a key requirement at Level 2.

> 🔴 `EXAM Q:` *"Name and describe all 5 CMM levels. At which level does SCM appear?"*

| Level | Name | What it means |
|-------|------|--------------|
| 1 | **INITIAL** | No process. Success depends on heroic individuals. |
| 2 | **MANAGED** | Basic project practices are repeatable. **SCM lives here.** |
| 3 | **DEFINED** | Standard processes are documented and used organization-wide. |
| 4 | **QUANTITATIVELY MANAGED** | Metrics and statistics are used to control quality and process. |
| 5 | **OPTIMIZING** | Continuous improvement is built into the process. |

---

# ⏱️ HOUR 6 — Quality Management

## WHAT IS QUALITY?
Quality in software isn't just "does it run?" A program could run perfectly and still be useless. Quality has two sides: did we build *what was specified*, AND does it actually *satisfy the user*?

> 🔴 `EXAM Q:` *"Define software quality. Why are two perspectives needed?"*

| Perspective | Question | Example |
|-------------|---------|---------|
| **CONFORMANCE** | "Did we build WHAT WAS SPECIFIED?" | System matches the requirements doc |
| **STAKEHOLDER** | "Is the product USEFUL AND ACCEPTABLE to users?" | Users can actually use it in real life |

> "Passing a specification is NOT sufficient when the specification misses important user needs."

---

## 8 QUALITY ATTRIBUTES
These are the dimensions of quality — a product can be good in some and poor in others.

> 🔴 `EXAM Q:` *"List 4 or more quality attributes with examples."*

1. **Functional Suitability** — does it do what the user needs?
2. **Reliability** — does it perform consistently without failing?
3. **Performance Efficiency** — is it fast and resource-efficient enough?
4. **Usability** — can intended users actually use it easily?
5. **Security** — does it protect data and resist attacks?
6. **Maintainability** — can developers change it efficiently later?
7. **Compatibility** — does it work alongside other systems?
8. **Portability** — can it move across environments (Windows → Linux)?

---

## QA vs QC — Most Important Distinction
This is one of the most commonly tested concepts. QA is about *how you work* (process). QC is about *what you produce* (product). The analogy: QA is like having a kitchen hygiene policy; QC is like tasting the food before serving it.

> 🔴 `EXAM Q:` *"Distinguish between Quality Assurance and Quality Control. Give examples of each."* ← **Almost certain**

| | QA (Quality Assurance) | QC (Quality Control) |
|--|------------------------|---------------------|
| **Focus** | **PROCESS** | **PRODUCT** |
| **Question** | "Are we following the right process?" | "Does this specific product meet requirements?" |
| **Examples** | Defining standards, auditing, training | Peer review, code inspection, testing |

> "Successful projects need BOTH."

---

## COST OF QUALITY — 4 Categories
Quality isn't free — you spend money on it. The question is: do you spend it *early* (prevention, appraisal) or *late* (failure)? Spending early is always cheaper.

> 🔴 `EXAM Q:` *"Name and explain the 4 categories of cost of quality."*

| Category | When | Examples | Cost level |
|----------|------|---------|------------|
| **PREVENTION** | Before defects occur | Training, planning, standards | Cheapest |
| **APPRAISAL** | Before customer gets it | Reviews, testing, audits | Moderate |
| **INTERNAL FAILURE** | After found, before delivery | Rework, repair, re-test | Expensive |
| **EXTERNAL FAILURE** | After customer gets it | Support, incidents, reputation damage | Most expensive |

> A defect found in requirements and fixed there costs a fraction of the same defect reaching production. The difference is **10–100×.**

---

## VERIFICATION vs VALIDATION
These two terms sound similar but test completely different things. Use this anchor: **Verification = "are we following the recipe correctly?"** and **Validation = "is this the right recipe for what the customer wanted?"**

> 🔴 `EXAM Q:` *"What is the difference between verification and validation? Give an example of each."* ← **Almost certain**

| | VERIFICATION | VALIDATION |
|--|-------------|-----------|
| **Question** | "Are we building it **RIGHT**?" | "Are we building the **RIGHT THING**?" |
| **Focus** | Compliance with specs, standards, rules | Fits user needs and real-world context |
| **Example** | System response ≤ 2 sec as specified ✓ | Users can actually complete registration easily ✓ |

> "A product can pass every verification check and still fail validation — if the specification was wrong to begin with."

---

## PEER REVIEWS vs TESTING
Both find defects — but at different stages and in different ways:
- **Peer Reviews** = humans read and inspect a document or code *without running it*. Catches logic errors, missing requirements, wrong assumptions early and cheaply.
- **Testing** = actually *run* the software and observe what it does.

- **Reviews** = STATIC (no code execution) — can apply to requirements, design, code, test cases, plans
- **Testing** = DYNAMIC (code executes and produces outputs)

---

## TEST TYPES
> 🔴 `EXAM Q:` *"Distinguish black-box, white-box, and gray-box testing. When would you use regression vs smoke testing?"*

| Type | What the tester knows/does | Example |
|------|--------------------------|---------|
| **BLACK-BOX** | Only knows inputs/expected outputs; ignores internal code | Testing a login form without reading the code |
| **WHITE-BOX** | Knows the internal logic; tests code paths and conditions | Testing every if/else branch in the code |
| **GRAY-BOX** | Knows some internal structure; tests through the interface | Knowing the DB schema to write targeted API tests |
| **REGRESSION** | Re-runs existing tests after a code change to catch new breakage | Run all tests after fixing a bug |
| **SMOKE** | Quick basic check: "is this build even usable?" | Log in, load a page — if this fails, testing stops |
| **SANITY** | Focused check on one specific change or area | Check only the payment module after fixing a payment bug |

---

## POSITIVE vs NEGATIVE TESTING
- **POSITIVE** = test that the system does what it should when given valid input (happy path)
- **NEGATIVE** = test that the system *handles errors correctly* when given invalid, unexpected, or boundary input

**Example:** Password rules require 8+ characters.
- POSITIVE: Enter "mypass12" → system accepts it ✓
- NEGATIVE: Enter "abc" → system rejects it with a clear error message ✓ (not crash, not silent accept)

---

## TEST DESIGN TECHNIQUES — 6
> 🔴 `EXAM Q:` *"Name and briefly describe the 6 test-case design techniques."*

1. **Equivalence Partitioning** — group all inputs into classes that should behave the same; test one from each class (e.g., valid age group vs invalid age group)
2. **Boundary Value Analysis** — test right at the edges of valid/invalid ranges (e.g., age 17, 18, 19 if minimum is 18)
3. **Decision Tables** — map every combination of conditions to the expected result (good for business rules with many conditions)
4. **Cause-Effect Graphs** — model which inputs (causes) lead to which outputs (effects) and test the logical relationships
5. **Error Guessing** — use experience to guess where bugs are most likely; test those spots harder
6. **Data Comparison** — run the system and compare results to a known-correct expected dataset

---

## SQA PLAN — 7 Sections
The SQA Plan is the document that says: *"Here is how we will manage quality on this project."* It covers who does what, what standards apply, what reviews and tests will happen, and how defects are tracked.

> 🔴 `EXAM Q:` *"What are the contents of a Software Quality Assurance Plan?"*

1. Purpose & Scope | 2. Organization & Responsibilities | 3. Standards & Practices | 4. Reviews & Audits | 5. Testing | 6. Problem Reporting & Corrective Action | 7. Documentation & Records

---

# ⏱️ HOUR 7 — Stakeholders & Course Context

## TRIPLE CONSTRAINT
Every project has three things in tension: what you do (scope), how long it takes (time), and how much it costs (cost). You can't change one without affecting the others. Quality sits in the middle as the outcome of how you balance them.

> 🔴 `EXAM Q:` *"A client requests 5 extra features 2 weeks before delivery. How does this affect the triple constraint?"*

Answer structure: Adding scope → must extend time OR increase cost OR reduce quality. All three must be discussed.

---

## STAKEHOLDERS — 3 I's
A stakeholder is anyone who affects or is affected by the project. You need to manage them from day one — not just the client.

- **INVOLVEMENT** — actively participating in the project
- **INTEREST** — positively or negatively affected by the outcome
- **INFLUENCE** — can affect decisions, resources, or acceptance

Types: Sponsor, Client, End users, Team members, Vendors, Regulators

---

## POWER-INTEREST MATRIX
This tool helps you decide *how much attention to give each stakeholder*. Place them in a 2×2 grid based on their power (authority to affect the project) and interest (how much they care about the outcome). Then apply a strategy for each quadrant.

> 🔴 `EXAM Q:` *"Draw the Power-Interest matrix. Given a stakeholder, which quadrant do they belong in and what is your strategy?"*

```
High Power │ KEEP SATISFIED       │ MANAGE CLOSELY        │
           │ (high power,         │ (high power,          │
           │  low interest)       │  high interest)       │
           │ e.g., Senior exec    │ e.g., Project sponsor │
           │ who funds but        │ who is invested and   │
           │ doesn't attend       │ has decision power    │
───────────┼──────────────────────┼───────────────────────┤
Low Power  │ MONITOR              │ KEEP INFORMED         │
           │ (low/low)            │ (low power,           │
           │ e.g., External users │  high interest)       │
           │ with no authority    │ e.g., End users who   │
           │                      │ care but can't decide │
           └──────────────────────┴───────────────────────┘
              Low Interest              High Interest
```

---

## SMART OBJECTIVES
SMART helps you write project goals that are actually useful — not vague statements like "improve the system."

> ⚠️ **EXAM TRAP:** A = **ASSIGNABLE**, NOT "Achievable"! This comes up every year.

- **S** = Specific — what exactly will be done?
- **M** = Measurable — how will success be measured?
- **A** = **ASSIGNABLE** — who is responsible or affected?
- **R** = Realistic — can it be done with available resources?
- **T** = Time-bound — when will it be done by?

**Example:** "Reduce login response time to under 2 seconds for 95% of users by end of Sprint 3."

---

## PROJECT vs PRODUCT vs OPERATIONS
| | Project | Product | Operations |
|--|---------|---------|-----------|
| **Type** | Temporary, creates UNIQUE output | Continues evolving | Ongoing, REPEATED |
| **Creates** | Change | Capability | Stability |
| **Example** | Build the registration system | The registration platform | Daily user support/maintenance |

---

## SCOPE CREEP — 3 Responses
Scope creep is when small additions pile up unnoticed until the project is double its original size. The fix is not to say "no" — it's to make the *cost of change visible*.

1. Clarify the impact on time, cost, quality, and risk for each addition
2. Use a formal change request mechanism — every addition is documented and approved
3. Negotiate priorities — if we add this, what do we drop or delay?

---

# 📐 HOUR 8 — Formulas (DO NOT skip this section)

## ALL KEY FORMULAS — Memorize These

| Formula | Equation | When to use |
|---------|---------|------------|
| **PERT** | E = (O + 4M + P) / 6 | Estimating uncertain activity duration |
| **Risk Exposure** | RE = Probability × Size of Loss | Comparing and prioritizing risks |
| **Parametric Estimation** | Effort = a × Size^b | Early effort estimation from size |
| **CPM Float** | Float = Longest path total − Path total | Finding how much delay a task can absorb |

---

## MEGA MEMORY CHEAT SHEET

| Topic | Memory Trick |
|-------|-------------|
| 6 Risk categories | **"T**he **M**onkeys **F**ight **C**razy **P**igs **R**unning" |
| Boehm's 4 reasons | **DROW** (Disasters, Rework, Overkill, Win-win) |
| 4 SCM functions | **I-C-S-A** (Identification, Control, Status, Audit) |
| PERT formula | O + **4**M + P then ÷ 6 (M gets 4× weight) |
| RE formula | P × Loss = expected exposure |
| QA vs QC | A = PROCESS, C = PRODUCT |
| V&V | 1st V = "built it RIGHT?", 2nd V = "built the RIGHT THING?" |
| SMART 'A' | **ASSIGNABLE** — NOT "Achievable"! |
| Brooks' Law | More people + late project = LATER (not faster) |
| Risk vs Defect vs Problem | FUTURE / EXISTS NOW / HAPPENED |
| Containment vs Contingency | BEFORE trigger / AFTER trigger |
| CMM Level 2 | Where SCM appears as a key process area |

---

## KEY QUOTES (drop one of these in an answer for instant marks)
> "If you don't actively attack the risks, they will actively attack you." — **Gilb**

> "Adding manpower to a late software project makes it **later**." — **Brooks' Law**

> "Change is NORMAL in software projects. **Uncontrolled** change is the PROBLEM."

> "A project can be ON TIME and ON BUDGET and still **FAIL** if it delivers the WRONG OUTCOME."

> "Quality must be **PLANNED** — not inspected in at the end."

> "A milestone without an observable deliverable is just a **hope**."

> "You cannot control what you cannot **IDENTIFY**." — SCM principle

---

**🙏 You now have everything. Read each plain-English explanation once, then read the technical part. That's all you need. Go get that 40/40! 🎯**
