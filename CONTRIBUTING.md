# Contributing

This repo's requirement lifecycle (intent → spec → branch → plan →
implement → PR → merge) is defined in `CLAUDE.md`. This file is the fuller,
step-by-step walkthrough of that same lifecycle — for a human contributor or
an agent picking up work in this repo, especially across multiple devices or
sessions.

## Why this matters: work here is picked up across devices

There's no external issue tracker — `intent/`, `spec/`, `plan.md` and the PR
itself *are* the tracker. Work on a given requirement can start on one
device or agent session and continue on a completely different one (a
laptop, a phone, a different Claude Code session, a CI-triggered agent). The
only thing every one of those has in common is GitHub. So:

**Push every commit, and open the PR as early as possible — right after the
spec's first commit, well before the plan or implementation exist.** (Not
right after the intent: GitHub won't open a PR with no diff between head and
base, and a freshly-branched `<type>/NNN-slug` has nothing beyond `main` yet — the
spec is what gives the PR something to show. See step 4 below.) An
uncommitted local branch, or a pushed branch with no PR, is invisible to
whoever/whatever picks this up next. A pushed branch with an open (draft) PR
is not — its diff, its description, and its checklist of what's done are all
one link away, from any device.

**This lifecycle applies to bug fixes too, not just new features.** A bug
report still gets an intent file first — what's broken, how it was
observed — before any code changes, even when the fix turns out to be a
few lines. The only difference for a bug is the branch name (step 2).

## The lifecycle

1. **Intent** — first run the `grilling` skill (model-invoked) — or the
   user-invoked `grill-me` skill if you're a human contributor — to get
   interrogated about the requirement until every branch of its design tree
   is resolved (see `.claude/skills/grill-me/` and `.claude/skills/grilling/`).
   Then write `intent/NNN-slug.md` on `main` from those resolved decisions,
   describing what's wanted and why (for a bug: what's broken and how it
   was observed). Commit and push straight to `main`.
2. **Branch** — create `<type>/NNN-slug` off `main`, following the
   [Conventional Branch](https://conventionalbranch.org) spec (see
   `.claude/skills/conventional-branch/`): `<type>` is `feature`, `bugfix`,
   `hotfix`, `release`, or `chore` for the nature of the requirement (most
   are `feature/`; a bug fix is `bugfix/`, not the repo's earlier ad-hoc
   `bug/` prefix, to stay within the published spec), and `NNN-slug` is named
   after the intent's slug as before (e.g. `feature/003-inheritance-tax`,
   `bugfix/006-mobile-data-menu-overflow`). Push it immediately, even with
   nothing on it yet beyond `main`'s history.
3. **Spec** — write `spec/NNN-slug.md` resolving the intent's open
   questions into a concrete spec. Commit and push to the branch straight
   away — this is also what makes step 4 possible (see below), not a step to
   defer.
4. **Open the PR — as a draft, as soon as there's a first commit on the
   branch.** GitHub refuses to open a PR with zero diff between head and
   base, so "immediately" in practice means "right after the spec's first
   commit," not literally before it — a branch pushed with nothing beyond
   `main`'s history (end of step 2) can't have a PR opened against it yet.
   Title the PR after the requirement; body references the intent file path
   (e.g. "Implements `intent/003-inheritance-tax.md`") and says what stage
   the work is at. See "Opening the PR" below for the exact command. This is
   still the step people skip and the step that matters most for
   cross-device continuity — do it the moment it's possible, not once the
   code is ready.
5. **Plan** — write `plan.md` on the branch, breaking the spec into an
   implementation sequence. Push it too. It's a working file only — it gets
   deleted in the same PR that implements the requirement, never merged to
   stay.
6. **Implement** — make the change (see `CLAUDE.md`'s "Working in this
   repo" for `index.html`/`sw.js` conventions). Push commits as you go
   rather than batching everything into one commit at the end — every push
   updates the same open PR, so progress is visible from any device
   watching it.
7. **Test & document** — run `node tests/test-engine.js`, validate
   calculation changes against `docs/TOOL_DOCUMENTATION.md` §5.4, update
   `docs/TOOL_DOCUMENTATION.md` itself (including a new §8 Build history
   entry), add a `CHANGELOG.md` entry, and add a `USER_CHANGELOG` entry in
   `index.html` if — and only if — the change is user-facing (`CLAUDE.md`
   has the exact test). Push.
8. **Mark the PR ready for review** once implementation, tests and docs are
   all pushed — this is the signal that the draft is now a real review
   request, not just an in-progress marker.
9. **Cleanup, in the same PR** — move `intent/NNN-slug.md` and
   `spec/NNN-slug.md` into `intent/done/` / `spec/done/`, and `git rm
   plan.md`. A merged PR should leave none of these behind in the live
   directories or repo root.
10. **Merge, then sync `main` and hand off branch cleanup.** Check out
    `main`, fetch, fast-forward-merge (`git checkout main && git fetch
    origin main && git merge --ff-only origin/main`) so the local
    checkout matches what's live, then delete the local copy of the
    branch (`git branch -d <type>/NNN-slug`). The remote branch can't be deleted
    from this environment — this git proxy rejects `git push --delete`
    with a 403, and no GitHub MCP tool here deletes branches either. Don't
    keep retrying either approach: give the user a direct link to
    **https://github.com/aggallim/retirement-planner/branches** (or point
    out the "Delete branch" button GitHub shows on the merged PR's own
    page) and let them do it. A merged, undeleted remote branch is inert —
    this is a hand-off for convenience, not something blocking anything.

```mermaid
flowchart TD
    Main[("main")]
    Intent["1. Intent\nintent/NNN-slug.md\ncommitted straight to main"]
    Branch["2. Branch\n&lt;type&gt;/NNN-slug off main, pushed immediately"]
    Spec["3. Spec\nspec/NNN-slug.md\nfirst commit on the branch"]
    PR["4. Open PR as DRAFT\nhead: &lt;type&gt;/NNN-slug -> base: main\nbody links intent/NNN-slug.md\n(needs step 3's commit to exist)"]
    Plan["5. Plan\nplan.md (branch-only, never merged)"]
    Impl["6. Implement\nindex.html / sw.js"]
    Docs["7. Test & document\ntest-engine.js, TOOL_DOCUMENTATION.md, CHANGELOG.md,\nUSER_CHANGELOG if user-facing"]
    Ready["8. Mark PR ready for review"]
    Cleanup["9. Cleanup in the same PR\nintent+spec -> done/, delete plan.md"]
    Merge["10. Merge, sync main, delete local branch,\nhand off remote branch deletion to the user"]

    Main --> Intent --> Branch --> Spec --> PR
    PR --> Plan --> Impl --> Docs --> Ready --> Cleanup --> Merge --> Main

    Plan -. push, PR updates .-> PR
    Impl -. push, PR updates .-> PR
    Docs -. push, PR updates .-> PR

    classDef pr fill:#fef3c7,stroke:#d97706,color:#78350f;
    classDef ready fill:#d1fae5,stroke:#059669,color:#064e3b;
    class PR pr;
    class Ready ready;
```

The dotted arrows are the point: steps 5 through 7 don't happen in one
sitting on one machine. Each one is a push to the same branch, updating the
same already-open PR — so whoever (or whatever) continues the work next just
needs the PR link, not a handoff.

## Opening the PR

Once the branch is pushed and the spec's first commit is on it (a PR needs
at least one commit ahead of `main` to open):

```sh
git push -u origin <type>/NNN-slug
gh pr create --draft --base main --head <type>/NNN-slug \
  --title "Short description of the requirement" \
  --body "Implements intent/NNN-slug.md. Status: intent + spec drafted, implementation not yet started."
```

For a bug fix, use `bugfix/NNN-slug` as the branch name in both commands
above instead of `feature/NNN-slug`.

No GitHub CLI available? Use the GitHub web UI's "compare & pull request"
prompt after pushing, or the GitHub API/MCP tooling if you're an agent with
access to it — same result: a draft PR, base `main`, head `<type>/NNN-slug`, body
linking the intent file.

Update the PR body's "Status" line as you move through the lifecycle (it's
cheap, and it's what tells the next session where things stand without
reading every commit). Mark it ready for review at step 8.

**This repo has no `.github/pull_request_template.md`.** If one is added
later, follow its structure for the PR body instead of the free-form
"Implements + Status" line above.

## Agent sessions bound to a pre-named branch

Some agent environments (e.g. Claude Code remote sessions) assign a fixed
branch name up front rather than letting the agent pick `<type>/NNN-slug`
itself. In that case, skip step 2 (the branch already exists) but
everything else still applies exactly as above: commit and push the intent
immediately, push the spec's first commit, open the draft PR as soon as
that commit exists, and keep pushing every subsequent stage to that same
branch/PR.

A harness-assigned branch name like `claude/laughing-cannon-lz90c5` already
satisfies Conventional Branch's AI-agent prefix rule (`claude/`) as-is —
don't try to rename it to fit the `<type>/NNN-slug` pattern above by
default; that pattern is only for branches this lifecycle names itself. If
the user explicitly asks for the `<type>/NNN-slug` convention to be used
regardless, that request takes precedence: create and push a
correctly-named branch off the pre-named branch's work instead, and open
the PR from there.

## Other conventions

- One branch, one PR, per requirement — don't stack unrelated changes onto
  an open requirement PR.
- Commit messages and PR descriptions explain *why*, not just *what* — see
  `CLAUDE.md`'s general conventions.
- Everything else about working in this codebase (no build step, single-file
  PWA, performance rules, calculation verification checklist) is in
  `CLAUDE.md` — read that first.
