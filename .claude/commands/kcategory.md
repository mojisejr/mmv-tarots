# kcategory

Knowledge Category - Show all knowledge entries for specific category with full details.

## Usage

```
/kcategory [category]
```

## Categories

- `device` - CU12, KU16, SerialPort, hardware integration
- `database` - SQLite, Sequelize, migrations, queries
- `architecture` - Design patterns, structural decisions
- `debug` - Error solutions, troubleshooting, workarounds
- `workflow` - Process improvements, automation
- `frontend` - React, Electron, UI components
- `backend` - Node.js, APIs, services

## Examples

```bash
/kcategory device       # Show all device-related knowledge
/kcategory database     # Show all database knowledge
/kcategory debug        # Show debugging knowledge
/kcategory workflow     # Show workflow improvements
```

## Implementation

### Category Validation

1. **Input Validation**:
   - Check category is provided
   - Validate against allowed categories list
   - Show error with valid categories if invalid

2. **Category Mapping**:
   ```
   device → knowledge-device label
   database → knowledge-database label
   architecture → knowledge-architecture label
   debug → knowledge-debug label
   workflow → knowledge-workflow label
   frontend → knowledge-frontend label
   backend → knowledge-backend label
   ```

### Category Entries Retrieval

1. **Fetch Category Knowledge**:
   - Search issues with `knowledge` and `knowledge-{category}` labels
   - Sort by creation date (newest first)
   - Limit to 50 entries (comprehensive view)
   - Exclude bot/automated accounts

2. **Process Results**:
   - Extract metadata (number, title, date, URL)
   - Generate content previews
   - Format for consistent display

### Display Format

1. **Category Header**:
   ```
   📂 device Knowledge Entries
   ============================
   ```

2. **Entry Display**:
   ```
   1. #156 - KNOW-DEVICE-003: CU12 Lock-Back Solution
      📅 Created: 2024-02-10
      🔗 Link: https://github.com/owner/repo/issues/156
      📝 Preview: Solution involves adjusting timing sequence...
   ```

3. **Statistics Summary**:
   ```
   📊 device Category Statistics:
   ===============================
   Total device entries: 12
   Latest entry: KNOW-DEVICE-012: Sensor Communication Fix (2024-02-15)
   ```

## Category Statistics

For each category, provide:

1. **Total Count**: Number of entries in category
2. **Latest Entry**: Most recent knowledge entry
3. **Date Range**: First and latest entry dates
4. **Activity Level**: Recent vs. historical distribution

## Error Handling

- **Invalid category**: Show valid categories with descriptions
- **No entries found**: Friendly message with creation guidance
- **API errors**: Retry with exponential backoff
- **Rate limiting**: Wait and retry automatically

## Display Examples

### Successful Category Display
```
📂 device Knowledge Entries
===========================

📚 All device Knowledge Entries:
=================================

1. #156 - KNOW-DEVICE-003: CU12 Lock-Back Solution
   📅 Created: 2024-02-10
   🔗 Link: https://github.com/owner/repo/issues/156
   📝 Preview: Solution involves adjusting timing sequence and adding...

2. #089 - KNOW-DEVICE-001: Hardware Interface Lock Issues
   📅 Created: 2024-01-15
   🔗 Link: https://github.com/owner/repo/issues/89
   📝 Preview: Problem with device lock-back causing system hangs...

📊 device Category Statistics:
==============================
   Total device entries: 2
   Latest entry: KNOW-DEVICE-003: CU12 Lock-Back Solution (2024-02-10)
```

### No Entries
```
📂 workflow Knowledge Entries
============================

📭 No knowledge entries found in category: workflow

💡 Create the first workflow knowledge entry with:
   /kupdate workflow '[topic]'
```

## Category Actions Section

After showing category entries, provide relevant actions:

```
⚡ Category Actions:
===================
• Create new device entry: /kupdate device '[topic]'
• Search within device: /ksearch 'device [query]'
• Browse all knowledge: /khub
• Show recent entries: /krecent
```

## Integration

- **Before**: `/khub` to browse all categories
- **Related**: `/ksearch` for targeted search, `/krecent` for latest entries
- **After**: Create new entries with `/kupdate`, access entries via URLs
- **Discovery**: Focused exploration of specific knowledge areas

## Use Cases

- **Deep dive**: Comprehensive exploration of specific domain
- **Problem solving**: Find all solutions in relevant category
- **Learning**: Study all knowledge in specific area
- **Expertise building**: Become knowledgeable in specific domain
- **Gap identification**: See what problems have been solved in area

## Features

- **Category focus**: Comprehensive view of specific domain
- **Full listings**: All entries in category (up to 50)
- **Rich previews**: Detailed content descriptions
- **Statistics**: Category metrics and activity
- **Direct access**: Clickable URLs to all entries
- **Creation guidance**: Help for adding new entries

## Files

- GitHub Issues API - Source of category knowledge
- Category Labels - Organization and filtering
- Knowledge Issues - Individual entries displayed

## Notes

- Shows comprehensive view of specific knowledge domain
- Limited to 50 entries for performance while being thorough
- Content previews help identify relevant entries
- Statistics provide context for category activity
- Useful for deep exploration and learning
- Complements search and recent entries browsing