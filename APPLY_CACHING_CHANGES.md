# Quick Guide: Apply Analysis Caching Changes

## Overview
This guide walks through applying the conversation analysis caching feature to prevent redundant GPT API calls.

## Prerequisites
- Access to Supabase Dashboard
- Code already updated in repository

## Step 1: Apply Database Migration

### For New Databases
If this is a fresh database setup, just run the complete schema:

```bash
# In Supabase Dashboard > SQL Editor
# Run: infra/supabase/setup.sql
```

The schema already includes the `conversation_id` column and unique constraints.

### For Existing Databases
If you already have a running database with data, apply the migration:

1. **Open Supabase Dashboard**
   - Go to your project
   - Navigate to SQL Editor

2. **Run Migration Script**
   ```sql
   -- Copy and paste content from:
   -- infra/supabase/migrations/001_add_conversation_id_and_caching.sql
   ```

3. **Verify Migration Success**
   ```sql
   -- Check if conversation_id column exists
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'salesai_sessions' AND column_name = 'conversation_id';

   -- Expected result:
   -- column_name: conversation_id
   -- data_type: character varying
   -- is_nullable: YES

   -- Check unique constraint exists
   SELECT constraint_name, table_name
   FROM information_schema.table_constraints
   WHERE table_name = 'salesai_analysis_results'
   AND constraint_type = 'UNIQUE'
   AND constraint_name LIKE '%session_id%';

   -- Expected result:
   -- constraint_name: salesai_analysis_results_session_id_key
   -- table_name: salesai_analysis_results
   ```

## Step 2: Deploy Code Changes

### If Using Vercel
Code changes are already in your repository. Just push to trigger deployment:

```bash
git add .
git commit -m "Add conversation analysis caching"
git push origin main
```

Vercel will automatically deploy the changes.

### If Running Locally
No additional steps needed - the code is already updated.

```bash
# Restart your dev server if it's running
npm run dev
```

## Step 3: Verify Caching Works

### Test Cache Miss (First Analysis)
1. Open browser console (F12)
2. Analyze a conversation for the first time
3. Watch network tab - should see request to OpenAI API
4. Check server logs for:
   ```
   🤖 OpenAI analysis completed
   💾 Caching analysis to database
   ✅ Analysis successfully cached in database
   ```

### Test Cache Hit (Subsequent Analysis)
1. View the same conversation again
2. Network tab should show NO OpenAI API call
3. Response should be instant (<100ms)
4. Check server logs for:
   ```
   ✅ Found cached analysis in database - returning cached result
   ```

### Verify in Database
```sql
-- Check cached conversations
SELECT
  id,
  conversation_id,
  status,
  analytics_summary->>'overall_score' as score,
  created_at
FROM salesai_sessions
WHERE conversation_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check analysis results are cached
SELECT
  s.conversation_id,
  ar.analysis_type,
  ar.provider,
  ar.created_at as cached_at
FROM salesai_analysis_results ar
JOIN salesai_sessions s ON s.id = ar.session_id
ORDER BY ar.created_at DESC
LIMIT 10;
```

## Step 4: Monitor Performance

### Check Cache Hit Rate
After a few days of usage:

```sql
-- Calculate cache effectiveness
WITH conversations AS (
  SELECT COUNT(*) as total
  FROM salesai_sessions
  WHERE conversation_id IS NOT NULL
),
cached AS (
  SELECT COUNT(*) as cached
  FROM salesai_analysis_results
)
SELECT
  c.total as total_conversations,
  ca.cached as cached_conversations,
  ROUND((ca.cached::numeric / c.total) * 100, 2) as cache_rate_percent
FROM conversations c, cached ca;
```

### Monitor Logs
Watch for these indicators:

**Good Signs:**
- `✅ Found cached analysis in database` - Cache working
- `💾 Caching analysis to database` - New analyses being cached
- Fast response times (<100ms for cached)

**Warning Signs:**
- `❌ Failed to cache analysis` - Check database permissions
- `⚠️ No profile found` - Authentication issues
- Slow responses on cached conversations - Database performance issue

## Troubleshooting

### Issue: "conversation_id column doesn't exist"
**Solution:** Run migration script again:
```sql
-- In Supabase SQL Editor
ALTER TABLE salesai_sessions ADD COLUMN conversation_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_salesai_sessions_conversation ON salesai_sessions (conversation_id);
```

### Issue: "Duplicate key violation on session_id"
**Solution:** Clean up duplicate analysis results:
```sql
-- Remove duplicates, keep most recent
DELETE FROM salesai_analysis_results
WHERE id NOT IN (
  SELECT DISTINCT ON (session_id) id
  FROM salesai_analysis_results
  ORDER BY session_id, created_at DESC
);

-- Add unique constraint
ALTER TABLE salesai_analysis_results
ADD CONSTRAINT salesai_analysis_results_session_id_key UNIQUE (session_id);
```

### Issue: Cache not being saved
**Check:**
1. User is authenticated (check authorization header)
2. Profile exists in database
3. Database permissions are correct
4. Check server logs for specific error messages

```sql
-- Verify RLS policies allow INSERT
SELECT * FROM salesai_sessions WHERE profile_id = 'your-profile-id';
SELECT * FROM salesai_analysis_results WHERE session_id IN (
  SELECT id FROM salesai_sessions WHERE profile_id = 'your-profile-id'
);
```

### Issue: Still seeing OpenAI API calls
**Debug:**
1. Check browser cache isn't interfering (hard refresh)
2. Verify conversation_id is consistent
3. Check logs for cache lookup attempts
4. Confirm database migration was successful

## Rollback (If Needed)

If you encounter issues and need to rollback:

```sql
-- 1. Remove unique constraint
ALTER TABLE salesai_analysis_results
DROP CONSTRAINT IF EXISTS salesai_analysis_results_session_id_key;

-- 2. Remove conversation_id column
ALTER TABLE salesai_sessions
DROP COLUMN IF EXISTS conversation_id;

-- 3. Remove index
DROP INDEX IF EXISTS idx_salesai_sessions_conversation;
```

Then revert the code changes in your repository.

## Success Checklist

- [ ] Migration script executed successfully
- [ ] Database columns and constraints verified
- [ ] Code deployed to production/staging
- [ ] First analysis test completed (cache miss)
- [ ] Second analysis test completed (cache hit)
- [ ] Server logs show caching messages
- [ ] Response time <100ms for cached results
- [ ] Database queries confirm cached data exists
- [ ] No errors in application logs

## Support

If you encounter issues:
1. Check `ANALYSIS_CACHING_IMPLEMENTATION.md` for detailed documentation
2. Review server logs for error messages
3. Verify database migration completed successfully
4. Test with a fresh conversation to rule out data issues

## Expected Results

**Before Caching:**
- Every conversation view: 5-10 seconds
- OpenAI API call every time
- ~$0.01-0.05 per view

**After Caching:**
- First view: 5-10 seconds (normal)
- Subsequent views: <100ms (instant!)
- 90-99% reduction in API costs
- Better user experience

🎉 Congratulations! Your analysis caching is now active and saving costs!
