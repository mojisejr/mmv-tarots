# ksearch

Knowledge Search - Full-text search across all knowledge entries with context and previews.

## Usage

```
/ksearch "[query]"
```

## Examples

```bash
/ksearch "CU12 lock-back"    # Search for CU12 lock-back solutions
/ksearch "database migration" # Search for database migration knowledge
/ksearch "async deadlock"     # Search for async deadlock solutions
/ksearch "performance issue"  # Search for performance-related knowledge
```

## Implementation

### Search Process

1. **Validate Input**:
   - Check query is provided and not empty
   - Validate GitHub CLI (`gh`) availability

2. **Execute Search**:
   - Use GitHub CLI search with query
   - Filter by `knowledge` label
   - Limit results to 20 most relevant
   - Sort by relevance and creation date

3. **Process Results**:
   - Extract issue metadata (number, title, labels, created date, URL)
   - Parse category from `knowledge-{category}` labels
   - Format dates for readability
   - Generate content previews

### Result Display

For each matching knowledge entry:

1. **Basic Information**:
   ```
   #123 - KNOW-DEVICE-001: CU12 Lock-Back Solution
   📂 Category: device
   📅 Date: 2024-01-15
   🔗 Link: https://github.com/owner/repo/issues/123
   ```

2. **Content Preview**:
   - Extract from "Problem Statement" section
   - Fall back to first few lines of issue body
   - Limit to 80-100 characters
   - Add ellipsis for truncated content

3. **Search Statistics**:
   - Total number of matching entries
   - Categories represented in results
   - Search query used

### Search Algorithm

Uses GitHub's built-in search capabilities:
- Full-text search across issue titles and bodies
- Relevance ranking based on match quality
- Filters for `knowledge` labeled issues only
- Excludes bot/automated accounts
- Recent results prioritized

## Query Optimization

### Effective Search Terms

- **Specific technical terms**: "async", "mutex", "serialization"
- **Component names**: "CU12", "Stripe", "PostgreSQL"
- **Problem descriptions**: "memory leak", "performance issue"
- **Category-specific terms**: "hardware", "database", "frontend"

### Search Tips

- Use quotes for exact phrases: `"async deadlock"`
- Combine terms: `"database" "migration" "performance"`
- Try different keywords if initial search is empty
- Use category names to narrow results

## Error Handling

- **Empty query**: Prompt for search terms with examples
- **No results**: Suggest alternative search strategies
- **API errors**: Retry with exponential backoff
- **Rate limiting**: Wait and retry automatically

## Search Results Examples

### Successful Search
```
🔍 Searching knowledge entries for: 'CU12 lock-back'

📚 Search Results:
==================

1. #156 - KNOW-DEVICE-003: CU12 Lock-Back Mechanism Fix
   📂 Category: device
   📅 Date: 2024-02-10
   🔗 Link: https://github.com/owner/repo/issues/156
   📝 Preview: Solution involves adjusting timing sequence and adding...

2. #089 - KNOW-DEVICE-001: Hardware Interface Lock Issues
   📂 Category: device
   📅 Date: 2024-01-15
   🔗 Link: https://github.com/owner/repo/issues/89
   📝 Preview: Problem with device lock-back causing system hangs...

📊 Found 2 knowledge entries matching: 'CU12 lock-back'
```

### No Results
```
🔍 Searching knowledge entries for: 'nonexistent topic'

📭 No knowledge entries found matching: 'nonexistent topic'

💡 Tips:
   • Try different keywords
   • Use broader search terms
   • Check spelling
   • Browse categories with /kcategory [category]
```

## Integration

- **Before**: `/khub` to browse all knowledge
- **Related**: `/kcategory` for category browsing, `/krecent` for recent entries
- **After**: Access specific knowledge entries via provided URLs
- **Discovery**: Complementary to browsing and category navigation

## Search Features

- **Full-text search**: Across titles and content
- **Category filtering**: Automatic categorization of results
- **Relevance ranking**: Most relevant results first
- **Content previews**: Brief descriptions of entries
- **Direct access**: Clickable URLs to full entries

## Files

- GitHub Issues API - Search source
- Knowledge Issues - Search targets
- Category Labels - Result organization

## Notes

- Searches across all knowledge entries regardless of category
- Results include relevance-ranked matches
- Content previews help identify relevant entries
- Direct URLs provided for immediate access
- Complements browsing and category navigation methods
- Useful for finding specific solutions or topics