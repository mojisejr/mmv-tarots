# mode

Set or show the execution mode for task assignment and implementation workflow.

## Usage

```
/mode [manual|copilot|status]
```

## Commands

- `manual` - Set mode to MANUAL (tasks assigned to human developer)
- `copilot` - Set mode to COPILOT (tasks assigned to @copilot)
- `status` - Show current execution mode

## Examples

```bash
/mode manual    # Set execution mode to manual
/mode copilot   # Set execution mode to copilot
/mode status    # Show current mode
```

## Mode-Specific Behavior

### MANUAL Mode
- `/plan` creates tasks assigned to human developer
- `/impl` provides workflow guidance for human implementation
- Human developer handles all implementation steps
- Use `/pr` to create pull request after implementation

### COPILOT Mode
- `/plan` creates tasks assigned to @copilot
- `/impl` triggers automatic implementation by @copilot
- Copilot handles complete workflow including PR creation
- Includes all validation steps and quality checks

## Implementation

When this command is executed:

1. **Check mode file**: Read `.claude/current_mode` or default to "manual"
2. **Set mode** (if specified): Write new mode to `.claude/current_mode`
3. **Display current status**: Show mode and behavior description
4. **Provide guidance**: Explain next steps based on current mode

## Files

- `.claude/current_mode` - Stores current execution mode
- Default mode: "manual"

## Integration

This command integrates with:
- `/plan` - Uses current mode to assign tasks
- `/impl` - Triggers different behavior based on mode
- Workflow system - Affects task assignment and implementation

## Notes

- Mode persists across Claude Code sessions
- Changing mode affects only future tasks, not existing ones
- Use `/mode status` to check current mode before planning tasks