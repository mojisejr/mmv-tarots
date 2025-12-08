# Usage Guide — Workflow Commands (Detailed)

This file provides a step-by-step guide for using the workflow commands after cloning this template and running `setup.sh`.

## 1) Prepare your local environment

```bash
# clone the template and move into the project
git clone https://github.com/<your-account>/<template-repo>.git my-project
cd my-project

# (optional) run the interactive setup helper that can create a GitHub repo and update CLAUDE.md
./setup.sh

### Notes about using template vs creating repo

- If you used GitHub's "Use this template" feature to create a new repository on GitHub, your new repo will already exist on GitHub and your local clone may already have an `origin` remote. In that case run:

```bash
# If origin exists and points to your new repo, run setup.sh with skip-create so it uses the existing origin
./setup.sh --skip-create
```

- If you cloned this template locally and want the script to create a new repo for you (push and set `origin`), run the script without `--skip-create` and answer the interactive prompts. You can also pass `--repo <owner/repo>` to prefill the repo.

- Non-interactive / automation options:

```bash
# Create repo non-interactively and mark it as a template
./setup.sh --repo my-org/my-template-repo --yes --mark-template

# Skip creating repo (useful when you used "Use this template")
./setup.sh --skip-create
```


# Ensure gh is authenticated (if you plan to create a repo)
gh auth status || gh auth login

# Ensure your claude CLI is available and configured (if you plan to use AI-assisted updates)
which claude || echo 'Install or alias your claude CLI before running AI-assisted commands'
```

## 2) Set execution mode

The workflow supports two execution modes: MANUAL and COPILOT. Use `=mode` (legacy) or `/mode` to change or check mode.

```bash
=mode manual      # set mode to MANUAL (human implements tasks)
=mode copilot     # set mode to COPILOT (agent implements tasks)
=mode status      # show current mode
```

## 3) Create a Context Issue (conversation + planning)

Use the Context Issue Template when you need to capture a long-running discussion or design conversation. You can create it via the web or with the template content; the in-repo shorthand commands are:

```text
/fcs [topic-name]      # Create a context issue using the Issue Template (slash command)
=fcs > [topic-name]    # Legacy alias
```

Fill the sections in `docs/ISSUE-TEMP.md`: CONTEXT OBJECTIVE, DISCUSSION LOG, CURRENT STATUS and the PLANNING READINESS CHECKLIST. Update it after each meeting or session.

## 4) Produce atomic Task Issues from the Context

When the context is ready for planning, create atomic tasks (single deliverable issues) using the Task Issue Template.

```text
/plan [task description]     # Create a task issue using docs/TASK-ISSUE-TEMP.md
=plan > [task description]   # Legacy alias
```

Follow the task template: single responsibility, independent execution, exact file paths and validation steps. Each task includes mandatory build/lint/test steps (customize these commands in the template to match your stack).

## 5) Switch mode if needed and implement (=impl)

Once a task issue exists, implement it depending on the mode.

```text
=impl [issue-number]          # Start implementation workflow for issue (legacy)
/impl [issue-number]          # Slash command to trigger implementation
```

Implementation checklist (apply before commit):
- Create feature branch (follow the branch naming convention in `AGENTS.md`)
- Run build, lint and tests (update commands in the task template to match your stack)
- Commit using the required commit format
- Push branch and open PR

Example branch flow (adapt to your project):

```bash
git checkout -b feature/task-123-add-thing
# implement changes
[build/lint/test commands]
git add .
git commit -m "feat: add thing

- Address #123: add thing
- Validation: build/lint/test passed"
git push -u origin feature/task-123-add-thing
```

## 6) Capture knowledge after implementation

After completing an implementation or a discovery, capture lessons in the knowledge template.

```text
=kupdate [category] "Short topic title"   # Create a knowledge issue using docs/KNOWLEDGE-TEMP.md
/kupdate [category] "Short topic title"   # Slash command variant
```

Fill the sections in `docs/KNOWLEDGE-TEMP.md`: Problem, Solution, AI feedback, Things to avoid and Links/References.

## 7) Other useful commands

```text
/khub                # View the Knowledge Hub (if implemented as an issue)
/ksearch "query"     # Search across knowledge entries
/krecent             # Show recent knowledge updates
/mode status         # Show current execution mode
```

## Tips and customization

- Update the build/lint/test placeholders in `docs/TASK-ISSUE-TEMP.md` to reflect your project's exact commands (e.g., `cargo build`/`cargo test` for Rust, `npm run build`/`npm test` for Node).
- If you prefer fully non-interactive setup, consider adding `--repo`, `--visibility` and `--yes` flags to `setup.sh` so it can run in CI or scripts.
- Keep the workflow and safety sections unchanged unless you want to intentionally adapt them for a different team or governance model.

---

If you want, I can add a short `docs/TEMPLATE-VARS.md` listing all placeholders and a small script to perform string substitutions when creating a new project from the template.
