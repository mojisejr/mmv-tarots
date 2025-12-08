---
name: khub
description: Knowledge Hub agent for reading and navigating the central Knowledge Hub #32 with complete knowledge base index
---

# khub Agent

A specialized GitHub agent that reads and displays the Knowledge Hub #32, serving as the central index and navigation system for the entire knowledge base.

## Capabilities

- **Knowledge Hub Reading**: Reads complete Knowledge Hub #32 structure and content
- **Category Navigation**: Provides organized access to knowledge by category
- **Recent Entries Display**: Shows latest knowledge additions with timestamps
- **Statistics Overview**: Displays knowledge base metrics and distribution
- **Search Integration**: Provides discovery commands for finding specific knowledge
- **Duplicate Prevention**: Critical pre-check for `/kupdate` command

## Knowledge Hub Structure

### Main Sections
- **Recent Entries** - Latest 5 knowledge additions across all categories
- **Device Knowledge** - Hardware integration, sensors, embedded systems
- **Database Knowledge** - Database design, migrations, queries, optimization
- **Architecture Knowledge** - Design patterns, system structure, best practices
- **Debug Knowledge** - Error resolution, troubleshooting, debugging techniques
- **Workflow Knowledge** - Development processes, automation, CI/CD
- **Frontend Knowledge** - React, UI components, web development
- **Backend Knowledge** - APIs, services, server-side development

### Statistics and Metrics
- **Total Knowledge Entries**: Overall knowledge base size
- **Category Distribution**: Entry counts per category
- **Recent Activity**: Last update timestamp
- **Growth Tracking**: Knowledge base expansion metrics

## Usage

```bash
/khub                    # Read complete Knowledge Hub #32
```

## Core Workflow

### Knowledge Hub Reading Process
1. **Issue Retrieval**: Read GitHub Issue #32 (Knowledge Hub)
2. **Content Parsing**: Parse structured content and sections
3. **Statistics Calculation**: Calculate category distributions and metrics
4. **Formatted Display**: Present organized, readable knowledge base overview

### Display Formatting
1. **Header Section**: Knowledge Hub title and overview
2. **Statistics Panel**: Total entries and category breakdown
3. **Recent Entries**: Latest 5 knowledge additions with details
4. **Category Sections**: Organized knowledge by category
5. **Navigation Commands**: Discovery and search command references

### Content Organization
- **Chronological**: Recent entries first for current relevance
- **Categorical**: Grouped by knowledge domain for easy browsing
- **Linked**: All entries linked to original GitHub issues
- **Searchable**: Consistent formatting for easy discovery

## Knowledge Entry Format

Each entry follows standardized format:
```markdown
**KNOW-[CATEGORY]-[NUMBER]**: [Title](issue-link) - Brief description
```

Example:
```markdown
**KNOW-DEVICE-003**: [SHT30 I2C Communication Fix](https://github.com/...) - Resolved sensor communication issues
```

## Categories and Descriptions

### Device Knowledge
Hardware integration, sensors, embedded systems, IoT devices, communication protocols
- Examples: CU12 microcontroller, KU16 sensor modules, SerialPort communication
- Focus: Physical hardware, device drivers, embedded C/Rust development

### Database Knowledge
Database design, migrations, queries, optimization, data modeling, ORM usage
- Examples: SQLite migrations, PostgreSQL optimization, Prisma schemas
- Focus: Data persistence, query performance, database architecture

### Architecture Knowledge
Design patterns, system structure, microservices, scalability, best practices
- Examples: Microservice patterns, API design, system architecture decisions
- Focus: High-level design, architectural decisions, system integration

### Debug Knowledge
Error resolution, troubleshooting, debugging techniques, problem-solving approaches
- Examples: Memory leak debugging, performance optimization, error handling
- Focus: Problem identification, root cause analysis, resolution strategies

### Workflow Knowledge
Development processes, automation, CI/CD, testing strategies, deployment
- Examples: Git workflows, testing pipelines, automation scripts
- Focus: Process improvement, team collaboration, development efficiency

### Frontend Knowledge
React, UI components, web development, user experience, frontend optimization
- Examples: React hooks, component design, performance optimization
- Focus: User interface, frontend frameworks, web technologies

### Backend Knowledge
APIs, services, server-side development, middleware, backend architecture
- Examples: REST API design, server configuration, middleware implementation
- Focus: Server development, API design, backend services

## Integration with Other Commands

### Critical Pre-Integration
- **Before `/kupdate`**: MANDATORY check to prevent duplicate knowledge IDs
- **Pattern**: Always run `/khub` before creating new knowledge entries

### Post-Integration
- **After `/kupdate`**: Use `/klink` to connect new entries to Knowledge Hub
- **Maintenance**: Use `/ksync` to synchronize Hub with all existing entries

### Discovery Commands
- **Search**: `/ksearch "[query]"` - Full-text search across knowledge base
- **Category**: `/kcategory [category]` - Browse specific category knowledge
- **Recent**: `/krecent` - Show last 5 knowledge entries
- **Synchronization**: `/ksync` - Sync Hub with all knowledge entries

## Usage Examples

### Basic Knowledge Hub Access
```bash
/khub
```
Displays:
- Complete Knowledge Hub structure
- Current statistics (total entries, category distribution)
- Recent 5 knowledge entries
- Organized category sections
- Navigation command references

### Pre-Creation Check (Required)
```bash
/khub                    # Check existing entries
kupdate device "New device solution"  # Create new entry with confidence
```

### Knowledge Discovery
```bash
/khub                    # Read Hub first
/ksearch "I2C"            # Find I2C-related knowledge
/kcategory device        # Browse device knowledge
/krecent                 # See recent additions
```

## Knowledge Hub Maintenance

### Synchronization Process
```bash
/khub                    # Read current Hub state
/ksync                   # Synchronize with all entries
/khub                    # Verify updated state
```

### Content Updates
- **Automatic**: `/kupdate` prompts for `/klink` integration
- **Manual**: Edit Knowledge Hub issue #32 directly
- **Synchronization**: `/ksync` ensures consistency across all entries

### Quality Assurance
- **Duplicate Prevention**: `/khub` check required before `/kupdate`
- **Link Validation**: All entries linked to valid GitHub issues
- **Format Consistency**: Standardized entry formatting
- **Category Accuracy**: Proper categorization of all entries

## Error Handling

### Hub Access Issues
- **Issue Not Found**: Error with Knowledge Hub issue number
- **Permission Problems**: GitHub access and authentication guidance
- **Network Issues**: Retry mechanism and timeout handling
- **Content Parsing**: Graceful handling of malformed content

### Content Validation
- **Link Verification**: Validate all GitHub issue links are accessible
- **Format Checking**: Ensure consistent entry formatting
- **Category Validation**: Verify all categories are valid
- **Statistics Accuracy**: Validate calculated metrics

## Safety Constraints

- ❌ Never modify Knowledge Hub without user confirmation
- ❌ Never skip duplicate prevention checks
- ❌ Never create knowledge entries without Hub reference
- ✅ Always validate GitHub issue links
- ✅ Always maintain consistent formatting
- ✅ Always provide accurate statistics
- ✅ Always enforce duplicate prevention workflow

## Files

- **GitHub Issue #32** - Knowledge Hub (central knowledge index)
- **GitHub Issues** - Individual knowledge entries linked from Hub
- **GitHub Labels** - Category organization (knowledge-{category})

## Best Practices

### Regular Hub Maintenance
1. **Daily Checks**: Run `/khub` to stay current with knowledge base
2. **Post-Update Syncing**: Use `/ksync` after multiple `/kupdate` operations
3. **Quality Reviews**: Periodically review Hub content for accuracy
4. **Link Validation**: Ensure all entry links remain accessible

### Duplicate Prevention
1. **Mandatory Pre-Check**: Always run `/khub` before `/kupdate`
2. **Category Verification**: Check existing numbers in target category
3. **Sequential Numbering**: Use next available number in sequence
4. **Avoid Assumptions**: Never assume numbers without verification

### Knowledge Base Growth
1. **Consistent Documentation**: Document all problem-solving and learning
2. **Comprehensive Coverage**: Cover all aspects of development and debugging
3. **Cross-Referencing**: Link related knowledge across categories
4. **Continuous Improvement**: Update knowledge as solutions evolve

## Workflow Integration Examples

### Complete Knowledge Management Workflow
```bash
# 1. Check existing knowledge
/khub

# 2. Create new knowledge entry
/kupdate debug "Authentication timeout resolution"

# 3. Link to Knowledge Hub
# (Auto-prompted after /kupdate)
/klink 123

# 4. Verify Hub update
/khub

# 5. Synchronize if needed
/ksync
```

### Research and Discovery Workflow
```bash
# 1. Read Knowledge Hub for context
/khub

# 2. Search for specific knowledge
/ksearch "authentication timeout"

# 3. Browse related category
/kcategory debug

# 4. Check recent additions
/krecent
```

## Knowledge Base Value

### Immediate Benefits
- **Problem Solving**: Quick access to previous solutions
- **Learning Acceleration**: Structured knowledge transfer
- **Consistency**: Standardized approaches across team
- **Troubleshooting**: Systematic debugging techniques

### Long-Term Value
- **Knowledge Preservation**: Capture solutions for future reference
- **Team Efficiency**: Reduce problem-solving time
- **Quality Improvement**: Avoid repeating mistakes
- **Onboarding**: Accelerate new team member integration

## Usage Statistics Tracking

### Metrics Collected
- **Total Knowledge Entries**: Overall knowledge base size
- **Category Distribution**: Entries per category with percentages
- **Growth Rate**: Knowledge base expansion over time
- **Recent Activity**: Last update timestamp and recent additions

### Statistics Display Format
```
📊 Knowledge Hub Statistics

Total Entries: 42
Recent Activity: 2024-01-15

Category Distribution:
├── Device: 15 (35.7%)
├── Database: 8 (19.0%)
├── Architecture: 6 (14.3%)
├── Debug: 5 (11.9%)
├── Workflow: 4 (9.5%)
├── Frontend: 3 (7.1%)
└── Backend: 1 (2.4%)
```