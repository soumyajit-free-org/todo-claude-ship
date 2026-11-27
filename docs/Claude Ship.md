# Claude Ship: a beginner's guide


Claude Ship is a set of agents from Anthropic, launched on 23 November 2026, that take a finished code change the rest of the way: it opens the pull request, reviews it, fixes failing checks and reviewer comments, and reports who still has to approve. You still press Merge yourself.

## Overview

Claude Ship automates the part of the day that comes *after* the code is written: opening the pull request, waiting on CI, fixing what it breaks, answering reviewers, resolving conflicts, and chasing approvals.

It is not one tool. It is four parts, and they split into two groups that have almost nothing to do with each other.

| Part | What it does | Runs on | Status |
| --- | --- | --- | --- |
| `/ship` (and `/steward`) | Opens your pull request, reviews it, then keeps fixing it until it is merge-ready | Your own machine | Rolling out |
| Code Review | Reviews every pull request in a repository and posts ranked inline comments | Anthropic's servers | Generally available |
| PR Steward | Fixes failing checks, merge conflicts and review comments on anyone's pull request | Anthropic's servers | Public beta |
| Claude Approvals | Applies an approval policy your team writes, and reports who still has to approve | Anthropic's servers | Public beta |

**Group A is `/ship`.** It is personal. It runs in your terminal, acts with your own GitHub login, and works only on your own pull requests. Any paid Claude plan includes it, and setup takes about a minute. This is where a beginner starts.

**Group B is the other three.** They are organisational. An Owner switches them on for whole repositories, they run on Anthropic's servers, they act on everybody's pull requests, and they need a Team or Enterprise plan. They are also billed separately, on token usage.

One rule holds across all four: **Claude Ship never merges your code.** `/ship` stops when the pull request is ready and tells you so. PR Steward is built so it cannot approve or merge. Claude Approvals reports a verdict but GitHub's branch rules decide what that verdict does. Pressing Merge stays a human act.

&#91;embedded content: Claude Ship on a pull request · 5 stages, 4 agents\]

The first three stages are where `/ship` works on your own pull request; the same three are where the organisational agents work on everybody's. The last stage never leaves your hands.

## Benefits

The gain is the dead time between "the code works" and "it is merged" — the waiting, the context switches, the small fixes that each cost a fresh look at the branch.

| The chore today | What happens instead |
| --- | --- |
| You push, CI goes red six minutes later, you have already moved on | Claude reads the failure, fixes the code, pushes, and re-runs the check |
| A reviewer leaves eight comments at 9pm | By morning each one is addressed, with a comment saying what changed and how to revert it |
| `main` moves while you work, your branch conflicts | Claude merges `main` into your branch and resolves the conflict |
| You write the commit message and the pull request description | Both are written from the conversation you just had with Claude |
| The boring pull requests get a rubber-stamp review | Every change gets the same depth of review, ranked Important, Nit, or Pre-existing |
| "Payments changes need two reviewers" lives in someone's head | It lives in a file, and GitHub enforces it |

Three benefits are worth calling out on their own.

**A second pair of eyes when you do not have one.** If you work alone, or you are the only person who knows that part of the codebase, the review is the thing you have been missing. It reads your change against the surrounding code, not in isolation.

**Context, not just a diff.** Because `/ship` runs in the session where you did the work, it knows what you were *trying* to do. That is why its review is sharper than a tool that only sees the patch.

**Fewer round trips.** Most review cycles are not disagreements — they are small, obvious fixes that still cost a day because of the gap between the comment and your next free hour. Those collapse to minutes.

## Use Cases

`/ship` earns its keep on a change that has to survive CI and a reviewer. It is pure overhead on a one-line typo fix you could have pushed in ten seconds.

**Reach for it when:**

- The change is real work — a feature, a fix with tests, something touching more than one file
- Your repository has CI that takes minutes, so the feedback loop is slow and you will context-switch while waiting
- You are about to step away: start the watch, come back to a pull request that has already answered its reviewers
- Nobody is going to review it properly, and you want the change read by something before it lands
- The branch has drifted from `main` and you know a conflict is coming
- You are new to the codebase and want the surrounding code checked for conventions you have not learned yet

**Leave it alone when:**

- The change is trivial — a typo, a version bump, a comment
- You are experimenting and do not want a pull request yet. Use `/code-review` instead: it reviews your branch and touches nothing
- You are about to close the laptop. The watch needs the session open, the machine awake, and that branch checked out
- You cannot trust everyone with write access to the repository. During a watch, Claude merges `main` into your branch and runs your tests — on your machine, with your credentials
- You are on native Windows without WSL. `/ship` will open the pull request and review it, but the watch never starts, so you lose the useful half

**Where it does not fit at all.** Claude Ship works on the stage *after* code exists. Deciding what to build, writing the spec, breaking it into tasks — that is a different problem, and tools like GitHub's Spec Kit cover it. The two do not overlap and work well together: plan the work, build it, then `/ship` it.

**For the organisational agents** (Code Review, PR Steward, Approvals), the threshold is different again. They pay off once several people push to shared repositories and reviews become a queue. For a two-person team they are usually more administration than they are worth.

## Setup Guide

There is nothing to install inside your repository — no workflow file, no GitHub App, no configuration. You install three command-line tools once, sign in to two accounts, and you are done.

| Tool | Minimum version | Why it matters |
| --- | --- | --- |
| Claude Code | 2.1.330 (2.1.331+ preferred) | Below this, `/ship` does not exist |
| GitHub CLI (`gh`) | 2.63 | How Claude opens the pull request and reads comments as you. Without it, no watch starts |
| git | 2.38 | Needed to merge `main` into your branch when there is a conflict |

You also need a paid Claude plan — Pro, Max, Team, Enterprise or Console. The free plan does not include Claude Code.

### Step 1 — Install Claude Code

On macOS:

```bash
curl -fsSL https://claude.ai/install.sh | bash
# or: brew install --cask claude-code
```

On Windows, install WSL first and work inside it:

```powershell
wsl --install
```

That puts a small Ubuntu Linux system inside Windows. Reboot if asked, open **Ubuntu** from the Start menu, pick a Linux username and password, then run the macOS command above at the Ubuntu prompt.

If you must stay on native Windows:

```powershell
irm https://claude.ai/install.ps1 | iex
# or: winget install Anthropic.ClaudeCode
```

### Step 2 — Install the GitHub CLI and git

```bash
# macOS
brew install gh

# WSL or Linux
sudo apt update && sudo apt install gh git
```

```powershell
# Native Windows
winget install GitHub.cli
winget install Git.Git
```

On native Windows, installing Git for Windows matters for more than git: it provides Git Bash, which Claude Code's shell tool uses.

### Step 3 — Sign in

```bash
gh auth login
```

Choose GitHub.com, then HTTPS, then authenticate via browser. This is what lets Claude push branches and open pull requests under your name.

```bash
claude
```

The first run opens a browser to log in to your Claude account.

### Step 4 — Verify

```bash
claude --version      # 2.1.330 or higher
gh --version          # 2.63 or higher
git --version         # 2.38 or higher
gh auth status        # "Logged in to github.com as <you>"
claude doctor         # read-only health check, changes nothing
```

If Claude Code is too old, run `claude update`.

### Why WSL matters on Windows

On native Windows, `/ship` opens the pull request and reviews your change — and then stops. **The watch never starts.** Everything that happens after the pull request exists is the reason to use `/ship` at all, so run it on a Mac or inside WSL.

One tip inside WSL: keep your code in the Linux filesystem (`~/projects/...`), not under `/mnt/c/Users/...`. Working across the boundary is slow and causes odd file-permission problems.

### Optional, but pays off quickly

Two files in your repository save you repeating yourself on every pull request.

`CLAUDE.md` at the repository root holds permanent project facts:

```markdown
# Project
Next.js and Postgres. Run tests with `pnpm test`, not `npm test`.
All database access goes through src/db/client.ts — never import pg directly.
```

`.claude/skills/steward/SKILL.md` holds instructions for looking after pull requests specifically:

```markdown
---
name: steward
description: How to tend pull requests in this repo
---

- Install deps with `npm ci`, run tests with `npm test`
- The check that matters is `ci / test`. The `e2e` check is flaky — re-run it
  once, then leave it and say so in a comment
- Never edit files under src/generated/
```

## Real-Time Usage

### Try the safe version first

`/code-review` reads your branch and tells you what is wrong. It opens nothing, pushes nothing, and touches no remote. Use it to see whether Claude understands your codebase before you let it act.

```bash
cd ~/my-app
git checkout -b claude-test
# make a small change, ideally with a deliberate bug in it
claude
```

Then at the Claude Code prompt:

```
/code-review
```

Findings come back in the conversation a minute or two later. If it caught your deliberate bug, everything works. Delete the branch and move on.

### The full flow

```bash
cd ~/my-app
git checkout -b fix/login-redirect   # never work on main
claude                                # start the session IN that folder
```

**Do the work inside the session.** Ask Claude to make the change, discuss it, iterate:

```
The login page redirects to the wrong URL after a password reset.
Fix it and add a test.
```

This step is the one people skip, and it is the one that matters. `/ship` writes the commit message and the pull request description **from this conversation**, and its review understands what you were trying to do because it was part of the attempt. Coding in your editor and then opening a fresh session just to type `/ship` throws that away.

**Check what is about to be committed.** In a second terminal:

```bash
git status
```

Read the list. `/ship` commits everything in it — modified files and untracked files — with no confirmation prompt. To hold something back:

```bash
git stash push -u -- scratch-notes.txt
```

**Ship it.** Back in the session:

```
/ship
```

A line ending `Esc to cancel` appears before the commit, and again before the push. Do nothing and it continues after a few seconds. Then Claude opens the pull request, reviews the change, and the watch begins.

**Merge it yourself** on GitHub when Claude reports that the checks pass and the comments are answered.

### Steering it while it runs

Just talk to it at the prompt. Before `/ship`, or any time during the watch:

```
This is a hotfix for incident INC-4412. Reviewers only care about the retry
logic. Do not touch the snapshot files.
```

```
From now on, do not push code or reply to reviewers without asking me first.
Show me the findings and wait.
```

That second one is a request, not an enforced setting — Claude normally honours it, but nothing blocks it.

### Commands worth memorising

| Command | What it does |
| --- | --- |
| `/code-review` | Review my branch. Nothing else |
| `/code-review --fix` | Review, then apply the fixes to my files |
| `/ship` | Open the pull request, review it, start the watch |
| `/steward` | Pull request already open — skip the review, just start fixing |
| `/ship low` | A cheaper, shallower review (`high` is the default) |
| `/ship 41` | Work on pull request 41 instead |
| `/ship terms` | Show exactly what Claude may do right now |
| `/ship stop` | End the watch |
| `/tasks` | Is the watch still alive? |

### Rules while a watch runs

A watch lasts up to seven days, or until the pull request merges or closes. For it to survive, keep the session open, the machine awake, and that branch checked out. It ends if you press `Esc`, switch branches, run `/clear` or `/resume`, change git's settings, or hit a usage limit. Look for a line beginning `Stopped watching`.

To start your next feature meanwhile, clone the repository into a second folder and open a separate session there. Do not touch the watched checkout.

### Five things that will bite you

1. **`/ship` does not ask before committing.** Run `git status` first, every time.
2. **It detects secrets by filename only.** It knows `.env` is dangerous. It does not know you pasted an API key on line 40 of `config.js`.
3. **Public repositories behave differently.** `/ship` will not commit loose uncommitted files there — commit them yourself first.
4. **The watch runs code on your computer.** It merges `main` into your branch and runs your tests, with your credentials. Use it only where you trust everyone with write access.
5. **Permission mode decides whether it works alone.** Auto mode lets Claude work while you are away. Manual mode makes it wait at every step, so nothing happens while you are gone.

### If something goes wrong

| Symptom | Likely cause |
| --- | --- |
| `/ship` is not in the command list | Claude Code below 2.1.330 — run `claude update` |
| It reviewed, but no watch started | Native Windows, `gh` below 2.63, `bypassPermissions` mode, or a background session |
| It committed and pushed nothing | Public repository, a file named like a secret, or someone else's pull request is open on that branch |
| The watch stopped on its own | You pressed `Esc`, switched branches, ran `/clear`, changed git settings, or hit a usage limit |
| Claude waits at every step | You are in manual mode — switch to auto mode |

If `/ship` committed something you did not want and you cancelled before the push, this undoes the commit and keeps your files:

```bash
git reset HEAD~1
```

## Sources

All pages were read on 26 November 2026. Claude Ship launched on 23 November 2026, so details are still moving — check the version numbers against the docs before you rely on them.

- [Introducing Claude Ship](https://claude.com/resources/articles/introducing-claude-ship) — the launch announcement
- [Claude Ship](https://code.claude.com/docs/en/claude-ship) — the three agents, plans and billing
- [Get a pull request ready with /ship and /steward](https://code.claude.com/docs/en/ship-command) — prerequisites, arguments, what a watch does and what ends it
- [Review locally with /code-review](https://code.claude.com/docs/en/code-review-local) — targets, flags and effort levels
- [Read and request reviews on a pull request](https://code.claude.com/docs/en/code-review-pull-requests) — severity levels and the `@claude` comment commands
- [Set up Code Review](https://code.claude.com/docs/en/code-review-setup) — the admin path: GitHub App, repositories, review level and timing
- [Customize Code Review](https://code.claude.com/docs/en/code-review-customize) — `REVIEW.md` and `CLAUDE.md`
- [Set up Claude Approvals](https://code.claude.com/docs/en/approvals-setup) — observe mode, enforcement and spend limits
- [Claude Approvals policy file reference](https://code.claude.com/docs/en/approvals-policy) — every key of `.claude/approvals.yml`
- [Installing Claude Code](https://code.claude.com/docs/en/setup) — system requirements and install commands
