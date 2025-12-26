#!/usr/bin/env bash
# Interactive setup script for template repo
# - Prompts for repository URL and the `claude` CLI command/alias
# - Uses the provided claude CLI to generate an updated `CLAUDE.md` with project-specific metadata
# - Shows a diff and asks before overwriting
# - Validates presence of new workflow directories (.claude/, .github/)
# - Checks for all 16 slash commands and agent instructions

set -euo pipefail

# Simple CLI arg parsing for a couple of convenience flags
SKIP_CREATE=0
YES=0
MARK_TEMPLATE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-create)
      SKIP_CREATE=1
      shift
      ;;
    --repo)
      REPO_URL_ARG="$2"
      shift 2
      ;;
    --yes)
      YES=1
      shift
      ;;
    --mark-template)
      MARK_TEMPLATE=1
      shift
      ;;
    --help)
      echo "Usage: setup.sh [--skip-create] [--repo REPO_URL] [--yes] [--mark-template]"
      echo
      echo "Options:"
      echo "  --skip-create      Skip GitHub repo creation (use existing origin)"
      echo "  --repo REPO_URL    Pre-fill repository URL"
      echo "  --yes              Assume 'yes' to all prompts"
      echo "  --mark-template    Mark created repo as GitHub template"
      echo "  --help             Show this help message"
      echo
      echo "This script sets up a new project from the workflow template by:"
      echo "  1. Validating workflow directories (.claude/, .github/)"
      echo "  2. Creating a new GitHub repository (optional)"
      echo "  3. Updating CLAUDE.md with project-specific metadata"
      echo "  4. Preserving all workflow rules and command definitions"
      exit 0
      ;;
    *)
      # unknown flag - ignore
      shift
      ;;
  esac
done


ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

timestamp() { date +"%Y%m%d%H%M%S"; }

echo "Template setup helper"
echo
if [ ! -f CLAUDE.md ]; then
  echo "Warning: CLAUDE.md not found in repository root. Please ensure you run this from the template repo root." >&2
fi

# Validate new workflow structure (November 2025 update)
echo "Checking workflow template structure..."
REQUIRED_DIRS=(".claude/commands" ".github/agents" ".github/instructions")
MISSING_DIRS=()
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    MISSING_DIRS+=("$dir")
  fi
done

if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
  echo "⚠️  Warning: Missing workflow directories:" >&2
  for dir in "${MISSING_DIRS[@]}"; do
    echo "   - $dir" >&2
  done
  echo "Please ensure this template includes the latest November 2025 updates with .claude/ and .github/ directories." >&2
  read -r -p "Continue anyway? (y/N): " continue_anyway
  if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
    echo "Setup cancelled. Please update the template and try again." >&2
    exit 1
  fi
else
  echo "✓ All workflow directories found"
fi

if [ -n "${REPO_URL_ARG:-}" ]; then
  REPO_URL="$REPO_URL_ARG"
  echo "Using repository URL from flag: $REPO_URL"
else
  read -r -p "Enter repository URL for this project (or leave empty to skip): " REPO_URL
  if [ -z "$REPO_URL" ]; then
    echo "No repository URL provided; placeholders will remain if not filled.";
  fi
fi

# Offer to create a new GitHub repo from this clone using the `gh` CLI
if command -v gh >/dev/null 2>&1; then
  echo
  # If there's already an origin remote, prefer that and offer options
  ORIGIN_URL=$(git remote get-url origin 2>/dev/null || true)
  if [ -n "$ORIGIN_URL" ]; then
    echo "Found existing 'origin' remote: $ORIGIN_URL"
    if [ "$SKIP_CREATE" -eq 1 ]; then
      echo "--skip-create set: using existing origin as REPO_URL"
      REPO_URL="$ORIGIN_URL"
    else
      read -r -p "Use existing origin as REPO_URL and skip creating a new repo? (Y/n) [y=use existing / r=replace origin]: " use_choice
      use_choice=${use_choice:-Y}
      if [[ "$use_choice" =~ ^[Yy]$ ]]; then
        REPO_URL="$ORIGIN_URL"
        echo "Using existing origin: $REPO_URL"
      elif [[ "$use_choice" =~ ^[Rr]$ ]]; then
        # rename existing origin to upstream to preserve it
        echo "Renaming current origin to 'upstream' and creating a new repo as 'origin'..."
        git remote rename origin upstream || true
        # proceed to create new repo below
        CREATE_REPO_PROMPT=1
      else
        echo "Skipping repo creation; you can provide REPO_URL later or run setup again.";
        CREATE_REPO_PROMPT=0
      fi
    fi
  else
    CREATE_REPO_PROMPT=1
  fi

  if [ ${CREATE_REPO_PROMPT:-0} -eq 1 ] && [ "$SKIP_CREATE" -eq 0 ]; then
    read -r -p "Do you want to create a new GitHub repository from this code using 'gh'? (y/N): " create_repo
  if [[ "$create_repo" =~ ^[Yy]$ ]] || [ "$YES" -eq 1 ]; then
      read -r -p "Enter new repository name (owner/repo or just repo for your user/org): " GH_REPO
      read -r -p "Visibility ([public]/private): " GH_VIS
      GH_VIS=${GH_VIS:-public}
      read -r -p "Repository description (optional): " GH_DESC

      # Build gh create flags
      GH_FLAGS=("--source=." "--remote=origin")
      if [[ "$GH_VIS" == "private" ]]; then
        GH_FLAGS+=("--private")
      else
        GH_FLAGS+=("--public")
      fi
      if [ -n "$GH_DESC" ]; then
        GH_FLAGS+=("--description" "$GH_DESC")
      fi

      echo "Creating repository via: gh repo create $GH_REPO ${GH_FLAGS[*]}"
      if gh repo create "$GH_REPO" "${GH_FLAGS[@]}"; then
        echo "Repository created. Setting REPO_URL to the new repository's HTTPS URL."
        # Use gh repo view to get proper URL
        NEW_URL=$(gh repo view "$GH_REPO" --json url --jq .url 2>/dev/null || true)
        if [ -z "$NEW_URL" ]; then
          # Fallback to constructing URL from owner/repo
          if [[ "$GH_REPO" == *"/"* ]]; then
            NEW_URL="https://github.com/$GH_REPO"
          else
            GH_USER=$(gh api user --jq .login 2>/dev/null || true)
            if [ -n "$GH_USER" ]; then
              NEW_URL="https://github.com/$GH_USER/$GH_REPO"
            fi
          fi
        fi
        if [ -n "$NEW_URL" ]; then
          REPO_URL="$NEW_URL"
          echo "REPO_URL set to: $REPO_URL"
        fi

        # Optionally mark the created repo as a template
        if [ "$MARK_TEMPLATE" -eq 1 ]; then
          echo "Marking repository as a template via GitHub API..."
          # Extract owner/repo from GH_REPO input if possible
          TARGET_REPO="$GH_REPO"
          if [[ "$TARGET_REPO" != *"/"* ]]; then
            # prepend authenticated user
            GH_USER=$(gh api user --jq .login 2>/dev/null || true)
            if [ -n "$GH_USER" ]; then
              TARGET_REPO="$GH_USER/$TARGET_REPO"
            fi
          fi
          if [ -n "$TARGET_REPO" ]; then
            gh api -X PATCH /repos/$TARGET_REPO -f is_template=true >/dev/null 2>&1 && echo "Repository marked as template." || echo "Failed to mark repository as template.";
          fi
        fi
      else
        echo "gh repo create failed or was cancelled. You can create the repo manually and re-run the script." >&2
      fi
    fi
  fi
fi

read -r -p "Enter your claude CLI command/alias (default: claude): " CLAUDE_CMD
CLAUDE_CMD=${CLAUDE_CMD:-claude}

if ! command -v "$CLAUDE_CMD" >/dev/null 2>&1; then
  echo "The command '$CLAUDE_CMD' was not found in PATH." >&2
  read -r -p "Do you want to proceed in offline/manual mode? (y/N): " proceed
  if [[ ! "$proceed" =~ ^[Yy]$ ]]; then
    echo "Aborting. Install the claude CLI or provide the correct alias, then re-run this script." >&2
    exit 1
  else
    echo "Proceeding in manual mode. The script will not call the claude CLI.";
    USE_CLAUDE=false
  fi
else
  USE_CLAUDE=true
fi

if [ "$USE_CLAUDE" = true ]; then
  echo "Preparing prompt for $CLAUDE_CMD..."

  # Read current CLAUDE.md (if present) and include it as context for the assistant.
  CLAUDE_CONTENT=""
  if [ -f CLAUDE.md ]; then
    CLAUDE_CONTENT=$(sed -e 's/`/`\''`/g' CLAUDE.md)
  fi

  # Compose the instruction prompt. The assistant will update only project metadata and leave workflow sections intact.
  read -r -p "Would you like the assistant to attempt to detect and fill project metadata (project name, repo URL, author/email)? (Y/n): " fillmeta
  fillmeta=${fillmeta:-Y}

  PROMPT=$(cat <<EOF
You are an editing assistant. I will provide the current 'CLAUDE.md' file contents and some project inputs.

Task:
- Update the 'CLAUDE.md' file to fill in project-specific metadata (PROJECT_NAME, REPOSITORY_URL, AUTHOR_NAME, EMAIL) and make any small, safe adjustments to the "Technical Architecture" placeholders to reflect the detected or provided stack. Do NOT change or remove the workflow rules, safety rules, slash command definitions (all 16 commands), Response Quality Standards, Language Matching Policy, or templates—preserve them exactly unless a small clarification is required.

Inputs:
- REPOSITORY_URL: ${REPO_URL}
- If repository URL is empty, keep placeholders where appropriate.

Instructions:
1) Only replace high-level placeholder lines at the top of the file and the technical-architecture example entries where doing so makes the doc more project-relevant. Keep placeholders like [PRIMARY_LANGUAGE], [FRAMEWORK], etc., when the stack is ambiguous.
2) Do not change the command lists (all 16 slash commands), templates, rules, Response Quality Standards, Language Matching Policy, or step-by-step workflows.
3) If you update values, add a short single-line comment under each replaced value indicating it was auto-filled by the setup script (e.g., "<!-- auto-filled by setup.sh -->").
4) Output ONLY the full updated file contents (raw markdown) with no additional commentary.

This template includes November 2025 updates:
- 16 slash commands including /pck (plan check) and /aud (audit)
- Response Quality Standards (5-point framework)
- Automatic Language Matching Policy (Thai/English)
- Agent instructions in .github/agents/
- Response instructions in .github/instructions/

Here is the current file (begin CLAUDE.md):
-----BEGIN-CLAUDE-MD-----
${CLAUDE_CONTENT}
-----END-CLAUDE-MD-----

Please produce the updated CLAUDE.md now.
EOF
)

  # Run the claude CLI with the prompt. Capture output to a temp file.
  TMP_OUT="/tmp/CLAUDE.md.updated.$(timestamp)"
  echo "Invoking: $CLAUDE_CMD -p [prompt] ..."

  # Some claude CLI variants accept -p; forward the prompt. If your CLI requires a different flag, re-run with the appropriate alias.
  if "$CLAUDE_CMD" -p "$PROMPT" > "$TMP_OUT" 2>/dev/null; then
    echo "Assistant output captured to $TMP_OUT"
  else
    echo "Warning: the claude CLI invocation failed. Check your alias and that the CLI supports '-p'." >&2
    echo "You can re-run the script with the correct alias or update CLAUDE.md manually." >&2
    exit 1
  fi

  NEW_FILE="$TMP_OUT"
else
  # Offline/manual mode: create a skeleton updated file for the user to edit locally.
  NEW_FILE="/tmp/CLAUDE.md.updated.$(timestamp)"
  echo "Offline/manual mode: copying current CLAUDE.md to $NEW_FILE for manual editing. Fill placeholders and then copy back to repo root." > "$NEW_FILE"
  if [ -f CLAUDE.md ]; then
    cat CLAUDE.md >> "$NEW_FILE"
  else
    echo "# CLAUDE.md - fill project metadata" >> "$NEW_FILE"
  fi
fi

echo
echo "Showing a unified diff between current CLAUDE.md and the proposed update..."
if [ -f "$NEW_FILE" ]; then
  if command -v git >/dev/null 2>&1; then
    git --no-pager diff --no-index --color=always CLAUDE.md "$NEW_FILE" || true
  else
    if command -v diff >/dev/null 2>&1; then
      diff -u CLAUDE.md "$NEW_FILE" || true
    else
      echo "No diff tool available; please compare CLAUDE.md and $NEW_FILE manually.";
    fi
  fi
else
  echo "No updated file found to diff.";
fi

echo
read -r -p "Accept the proposed update and overwrite 'CLAUDE.md'? (y/N): " accept
if [[ "$accept" =~ ^[Yy]$ ]]; then
  backup="CLAUDE.md.bak.$(timestamp)"
  if [ -f CLAUDE.md ]; then
    mv CLAUDE.md "$backup"
    echo "Backed up old CLAUDE.md to $backup"
  fi
  cp "$NEW_FILE" CLAUDE.md
  echo "Updated CLAUDE.md written. Please review the file and commit the change.";
  echo
  echo "Verifying workflow template structure..."
  
  # Verify critical workflow files
  CRITICAL_FILES=(".claude/settings.local.json" "AGENTS.md" ".github/instructions/response.instructions.md")
  MISSING_FILES=()
  for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
      MISSING_FILES+=("$file")
    fi
  done
  
  if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "⚠️  Warning: Missing critical workflow files:" >&2
    for file in "${MISSING_FILES[@]}"; do
      echo "   - $file" >&2
    done
  else
    echo "✓ All critical workflow files present"
  fi
  
  echo
  echo "Suggested next steps:"
  echo "  1. Review the updated CLAUDE.md file"
  echo "  2. Customize tech stack placeholders if needed (search for [PRIMARY_LANGUAGE], [FRAMEWORK], etc.)"
  echo "  3. Read docs/USAGE.md for command reference"
  echo "  4. Commit the changes:"
  echo
  echo "  git add CLAUDE.md"
  echo "  git commit -m \"chore: update CLAUDE.md with project metadata (run setup.sh)\""
  echo
  echo "Your project is ready! Use the slash commands:"
  echo "  /mode, /fcs, /plan, /pck, /aud, /impl, /pr"
  echo "  /khub, /kupdate, /klink, /ksync, /ksearch, /krecent, /kcategory, /rrr"
  echo
else
  echo "Update declined. Proposed file remains at: $NEW_FILE"
fi

echo "Setup script finished."
