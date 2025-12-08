# krecent

Knowledge Recent - Show last 5 knowledge updates with previews and quick access.

## Usage

```
/krecent
```

## Implementation

### Recent Entries Retrieval

1. **Validate Dependencies**:
   - Check GitHub CLI (`gh`) availability

2. **Fetch Recent Knowledge**:
   - Search issues with `knowledge` label
   - Sort by creation date (newest first)
   - Limit to 10 most recent (to filter for quality)
   - Exclude bot/automated accounts
   - Filter for actual knowledge issues

3. **Process Results**:
   - Take top 5 most recent knowledge entries
   - Extract metadata (number, title, category, date, URL)
   - Generate content previews
   - Format for display

### Result Display

For each recent knowledge entry:

1. **Entry Header**:
   ```
   1. #156 - KNOW-DEVICE-003: CU12 Lock-Back Solution
   ```

2. **Metadata**:
   ```
   📂 Category: device
   📅 Created: 2024-02-10
   🔗 Link: https://github.com/owner/repo/issues/156
   ```

3. **Content Preview**:
   - Extract from "Problem Statement" section
   - Limit to 100 characters with ellipsis
   - Provide glimpse of knowledge content

### Statistics Summary

- Total recent entries shown
- Date range covered
- Categories represented

## Display Format

### Typical Output
```
🕐 Recent Knowledge Entries (Last 5)
===================================

1. #156 - KNOW-DEVICE-003: CU12 Lock-Back Solution
   📂 Category: device
   📅 Created: 2024-02-10
   🔗 Link: https://github.com/owner/repo/issues/156
   📝 Preview: Solution involves adjusting timing sequence and adding...

2. #142 - KNOW-DATABASE-008: Migration Performance Optimization
   📂 Category: database
   📅 Created: 2024-02-08
   🔗 Link: https://github.com/owner/repo/issues/142
   📝 Preview: Implemented batch processing and index optimization...

3. #129 - KNOW-DEBUG-004: Async Deadlock Resolution
   📂 Category: debug
   📅 Created: 2024-02-05
   🔗 Link: https://github.com/owner/repo/issues/129
   📝 Preview: Fixed deadlock by reordering mutex acquisition...

📊 Showing last 3 knowledge entries
```

### No Results
```
🕐 Recent Knowledge Entries (Last 5)
===================================

📭 No recent knowledge entries found

💡 Create your first knowledge entry with:
   /kupdate [category] '[topic]'
```

## Error Handling

- **No knowledge entries**: Friendly message with creation guidance
- **API errors**: Retry with exponential backoff
- **Rate limiting**: Wait and retry automatically
- **Parsing errors**: Graceful degradation of display

## Quick Actions Section

After showing recent entries, provide actionable next steps:

```
⚡ Quick Actions:
================
• Browse all knowledge: /khub
• Search knowledge: /ksearch '[query]'
• Browse by category: /kcategory [category]
• Create new entry: /kupdate [category] '[topic]'

📚 Available Categories:
  device, database, architecture, debug, workflow, frontend, backend
```

## Integration

- **Before**: `/khub` to browse complete knowledge base
- **Related**: `/ksearch` for targeted search, `/kcategory` for browsing
- **After**: Create new entries with `/kupdate`, access entries via URLs
- **Discovery**: Complementary to search and category navigation

## Use Cases

- **Quick awareness**: Stay updated with latest knowledge additions
- **Discovery**: Find recent solutions to current problems
- **Quality check**: Review recent knowledge entry quality
- **Trend identification**: See what types of problems are being solved
- **Team coordination**: Keep track of team learnings

## Features

- **Recent focus**: Shows latest 5 knowledge entries
- **Rich previews**: Brief content descriptions
- **Category context**: Automatic categorization
- **Direct access**: Clickable URLs to full entries
- **Quick actions**: Immediate next steps for exploration

## Files

- GitHub Issues API - Source of recent knowledge
- Knowledge Issues - Individual entries displayed
- Category Labels - Automatic categorization

## Notes

- Shows most recent knowledge regardless of category
- Limited to 5 entries for focused view
- Content previews help identify relevant entries
- Direct URLs provided for immediate access
- Complements search and category browsing
- Useful for keeping up with team learnings and discoveries