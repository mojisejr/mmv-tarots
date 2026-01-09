#!/bin/bash

# Configuration
# Load .env file from the script's root or current directory if it exists
if [ -f .env ]; then
    echo "Sourcing .env file..."
    # Export variables from .env (ignoring comments and empty lines)
    export $(grep -v '^#' .env | xargs)
fi

PROJECT_ID=${NEON_PROJECT_ID}
API_KEY=${NEON_API_KEY}
BRANCH_NAME="main" # Root branch to snapshot
SNAPSHOT_NAME="pre-deploy-backup"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

if [ -z "$PROJECT_ID" ] || [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: NEON_PROJECT_ID or NEON_API_KEY is not set in environment variables.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting Neon Single Rotating Snapshot...${NC}"

# 1. Get Project Branches to find the main branch ID
echo "Finding branch ID for '$BRANCH_NAME'..."
BRANCHES_JSON=$(curl -s "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches" \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Accept: application/json')

# Robust JSON extraction using Python
BRANCH_ID=$(echo "$BRANCHES_JSON" | python3 -c "import sys, json; data = json.load(sys.stdin); print(next((b['id'] for b in data.get('branches', []) if b['name'] == '$BRANCH_NAME'), ''))")

if [ -z "$BRANCH_ID" ]; then
   echo -e "${RED}Error: Branch '$BRANCH_NAME' not found.${NC}"
   exit 1
fi
echo -e "${GREEN}Found Branch ID: $BRANCH_ID${NC}"

# 2. Check for existing snapshot and rotate
echo "Checking for existing snapshot '$SNAPSHOT_NAME'..."
SNAPSHOTS_JSON=$(curl -s "https://console.neon.tech/api/v2/projects/$PROJECT_ID/snapshots" \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Accept: application/json')

EXISTING_SNAPSHOT_ID=$(echo "$SNAPSHOTS_JSON" | python3 -c "import sys, json; data = json.load(sys.stdin); print(next((s['id'] for s in data.get('snapshots', []) if s.get('name') == '$SNAPSHOT_NAME'), ''))")

if [ ! -z "$EXISTING_SNAPSHOT_ID" ]; then
    echo -e "${YELLOW}Found existing snapshot ($EXISTING_SNAPSHOT_ID). Deleting...${NC}"
    curl -s -X DELETE "https://console.neon.tech/api/v2/projects/$PROJECT_ID/snapshots/$EXISTING_SNAPSHOT_ID" \
      -H "Authorization: Bearer $API_KEY"
    echo -e "${GREEN}Deleted old snapshot.${NC}"
fi

# 3. Create new snapshot
echo "Creating new snapshot '$SNAPSHOT_NAME'..."
CREATE_RES=$(curl -s -X POST "https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches/$BRANCH_ID/snapshot" \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d "{\"name\": \"$SNAPSHOT_NAME\"}")

# Use grep to check for success simply
if echo "$CREATE_RES" | grep -q "\"id\""; then
    echo -e "${GREEN}Snapshot creation initiated successfully!${NC}"
    echo "Response: $CREATE_RES"
else 
    echo -e "${RED}Failed to create snapshot.${NC}"
    echo "Response: $CREATE_RES"
    exit 1
fi
