# Claude Code Slash Commands

This directory contains proper Claude Code slash commands implemented as markdown files that Claude processes and executes.

## 🎉 Implementation Complete!

All 13 workflow commands from your `=` command system have been successfully converted to proper Claude Code slash commands.

## Available Commands

### Mode Management
- **`/mode`** - Set or show execution mode (manual/copilot/status)

### Context Management
- **`/fcs`** - Create and manage context discussions

### Task Management
- **`/plan`** - Create task GitHub Issues
- **`/impl`** - Implementation workflow
- **`/pr`** - Create Pull Requests

### Knowledge Management (7 commands)
- **`/khub`** - Access Knowledge Hub #102
- **`/kupdate`** - Create knowledge entries
- **`/klink`** - Link knowledge to hub
- **`/ksync`** - Synchronize knowledge hub
- **`/ksearch`** - Search knowledge entries
- **`/krecent`** - Show recent knowledge
- **`/kcategory`** - Browse by category

### Other Commands
- **`/rrr`** - Create daily retrospectives

## Command Structure

Each command markdown file includes:

- **Usage** - Clear syntax and parameters
- **Examples** - Practical usage scenarios
- **Implementation** - Step-by-step execution details
- **Integration** - How commands work together
- **Error Handling** - Common issues and solutions
- **Files** - Related files and dependencies

## Key Features

### ✅ Proper Claude Code Implementation
- Markdown files in `.claude/commands/` directory
- Processed and executed by Claude Code
- Rich documentation and help built-in

### ✅ Enhanced Functionality
- Better error handling with helpful suggestions
- Comprehensive validation of prerequisites
- Progress tracking for multi-step operations
- GitHub CLI integration with error recovery

### ✅ Backward Compatibility
- All original `=` commands still supported
- Existing workflows continue to work
- Gradual migration to slash commands possible

## Usage Examples

### Basic Workflow
```bash
# Set execution mode
/mode manual

# Create context for discussion
/fcs payment-system

# Plan tasks from context
/plan Add Stripe webhook handler

# Implement task
/impl 123

# Create PR
/pr Ready for review
```

### Knowledge Workflow
```bash
# Check existing knowledge (MANDATORY)
/khub

# Create new knowledge entry
/kupdate database "SQLite migration performance fix"

# Link to knowledge hub (auto-prompted)
# y → /klink 124

# Search knowledge
/ksearch "migration performance"
```

## Files

```
.claude/commands/
├── mode.md         # Mode management
├── fcs.md          # Context management
├── plan.md         # Task planning
├── impl.md         # Implementation workflow
├── pr.md           # Pull request creation
├── khub.md         # Knowledge hub access
├── kupdate.md      # Knowledge creation
├── klink.md        # Knowledge linking
├── ksync.md        # Knowledge synchronization
├── ksearch.md      # Knowledge search
├── krecent.md      # Recent knowledge
├── kcategory.md    # Category browsing
├── rrr.md          # Daily retrospective
└── README.md       # This documentation
```

## Documentation

Updated documentation in:
- `CLAUDE.md` - Main project documentation
- `AGENTS.md` - Agent-specific documentation

Both files now include comprehensive slash command documentation while preserving all original `=` command information for backward compatibility.

## Getting Started

1. **Check current mode**: `/mode status`
2. **Create context**: `/fcs [topic]`
3. **Plan tasks**: `/plan [task description]`
4. **Implement**: `/impl [issue-number]`
5. **Create PR**: `/pr [feedback]`

For knowledge management:
1. **Read hub first**: `/khub`
2. **Create entry**: `/kupdate [category] "[topic]"`
3. **Link to hub**: Auto-prompted or `/klink [issue]`

## Benefits

- **Proper Integration**: Works seamlessly with Claude Code
- **Rich Documentation**: Each command is thoroughly documented
- **Error Handling**: Clear guidance for troubleshooting
- **Validation**: Prevents common mistakes
- **Workflow Enhancement**: Maintains all existing workflow benefits
- **Future-Proof**: Built on Claude Code's standard slash command system

---

**🎉 Your workflow system is now fully integrated with Claude Code!**