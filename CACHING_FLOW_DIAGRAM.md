# Analysis Caching Flow Diagram

## Request Flow: Before Caching Implementation

```
User Views Conversation Analysis
           │
           ▼
    API Route Handler
           │
           ▼
   Fetch ElevenLabs Data ────────► ElevenLabs API
           │                          (every time!)
           ▼
   Extract Transcript
           │
           ▼
   Call OpenAI GPT-4o ───────────► OpenAI API
           │                        ($0.01-0.05 cost)
           │                        (5-10 seconds)
           ▼
   Format Analysis Results
           │
           ▼
   Return to Frontend
           │
           ▼
   Display to User
```

**Problems:**
- ❌ Every view triggers expensive API calls
- ❌ User waits 5-10 seconds every time
- ❌ Costs accumulate rapidly
- ❌ Rate limits can be hit
- ❌ Analysis can vary between views


## Request Flow: After Caching Implementation

### First Request (Cache Miss)

```
User Views Conversation Analysis
           │
           ▼
    API Route Handler
           │
           ▼
   Check Database Cache ─────────► Database
           │                         │
           │                         ▼
           │                    No Cached Result
           │                         │
           │◄────────────────────────┘
           │
           ▼
   Fetch ElevenLabs Data ────────► ElevenLabs API
           │
           ▼
   Extract Transcript
           │
           ▼
   Call OpenAI GPT-4o ───────────► OpenAI API
           │                        ($0.01-0.05 cost)
           │                        (5-10 seconds)
           ▼
   Format Analysis Results
           │
           ├─────────────────────┐
           │                     │
           ▼                     ▼
   Return to Frontend    Save to Database ────► Database
           │                     │              (session + analysis)
           │                     ▼
           │              Cache Saved ✅
           │
           ▼
   Display to User
```

### Subsequent Requests (Cache Hit)

```
User Views Same Conversation Again
           │
           ▼
    API Route Handler
           │
           ▼
   Check Database Cache ─────────► Database
           │                         │
           │                         ▼
           │                    Found Cached! ✅
           │                         │
           │◄────────────────────────┘
           │                    (<100ms)
           ▼
   Return Cached Results
   (NO API CALLS!) 🎉
           │
           ▼
   Display to User
   (Instant!)
```

**Benefits:**
- ✅ Instant results (<100ms)
- ✅ No GPT API cost
- ✅ Consistent analysis
- ✅ No rate limit concerns
- ✅ Better user experience


## Database Schema Relationships

```
┌─────────────────────────┐
│   salesai_sessions      │
├─────────────────────────┤
│ id (PK)                 │
│ profile_id (FK)         │
│ conversation_id (UNIQUE)│◄─── Links to ElevenLabs
│ title                   │
│ status                  │
│ duration_seconds        │
│ analytics_summary       │◄─── Quick metrics
│ created_at              │
└───────────┬─────────────┘
            │
            │ 1:1 relationship
            │
            ▼
┌─────────────────────────┐
│salesai_analysis_results │
├─────────────────────────┤
│ id (PK)                 │
│ session_id (FK, UNIQUE) │◄─── One analysis per session
│ analysis_type           │
│ provider (openai)       │
│ version (gpt-4o)        │
│ results (JSONB)         │◄─── Full GPT response cached here
│ confidence_score        │
│ created_at              │
└─────────────────────────┘
```

## Cache Lookup Query Flow

```sql
-- Step 1: Find session by conversation_id
SELECT
  id,
  conversation_id,
  analytics_summary,
  -- Join to get analysis results
  salesai_analysis_results(*)
FROM salesai_sessions
WHERE conversation_id = 'conv_xxx'
SINGLE;

-- Result possibilities:
-- 1. No row found → Cache MISS (first analysis)
-- 2. Row found, no analysis_results → Cache MISS (partial data)
-- 3. Row found with analysis_results → Cache HIT ✅
```

## Cache Save Flow

```sql
-- Step 1: Upsert session (create or update)
INSERT INTO salesai_sessions (
  conversation_id,
  profile_id,
  title,
  status,
  duration_seconds,
  analytics_summary
) VALUES ($1, $2, $3, 'analyzed', $4, $5)
ON CONFLICT (conversation_id)
DO UPDATE SET
  status = 'analyzed',
  analytics_summary = EXCLUDED.analytics_summary,
  updated_at = NOW()
RETURNING id;

-- Step 2: Upsert analysis results (one per session)
INSERT INTO salesai_analysis_results (
  session_id,
  analysis_type,
  provider,
  version,
  results,
  confidence_score
) VALUES ($1, 'sales_conversation', 'openai', 'gpt-4o', $2, $3)
ON CONFLICT (session_id)
DO UPDATE SET
  results = EXCLUDED.results,
  confidence_score = EXCLUDED.confidence_score,
  created_at = NOW();
```

## Performance Comparison

### Timeline Visualization

#### Before Caching
```
Request 1: [━━━━━━━━━━] 8s  ($0.03)
Request 2: [━━━━━━━━━━] 8s  ($0.03)
Request 3: [━━━━━━━━━━] 9s  ($0.03)
Request 4: [━━━━━━━━━━] 7s  ($0.03)
Request 5: [━━━━━━━━━━] 8s  ($0.03)
───────────────────────────────
Total:      40s         $0.15
```

#### After Caching
```
Request 1: [━━━━━━━━━━] 8s  ($0.03)  ← First time (cache miss)
Request 2: [▪] 0.08s  ($0.00)  ← Cached!
Request 3: [▪] 0.09s  ($0.00)  ← Cached!
Request 4: [▪] 0.07s  ($0.00)  ← Cached!
Request 5: [▪] 0.08s  ($0.00)  ← Cached!
───────────────────────────────
Total:      8.32s      $0.03
Savings:    79% time   80% cost
```

### Cost Analysis (100 Conversation Views)

```
┌─────────────────┬──────────┬─────────┬──────────┐
│ Scenario        │ API Calls│ Time    │ Cost     │
├─────────────────┼──────────┼─────────┼──────────┤
│ Before Caching  │ 100      │ 800s    │ $3.00    │
│ After Caching   │ 10*      │ 87s     │ $0.30    │
│ Savings         │ 90%      │ 89%     │ 90%      │
└─────────────────┴──────────┴─────────┴──────────┘

* Assuming 10 unique conversations, each viewed 10 times
```

## Error Handling Flow

```
Cache Lookup Error
       │
       ├─ No session found ───────► Continue to API call
       │                            (expected for first view)
       │
       ├─ No analysis found ──────► Continue to API call
       │                            (partial data)
       │
       └─ Database error ─────────► Log warning, continue
                                    (don't block user)

Cache Save Error
       │
       ├─ Auth error ─────────────► Log warning
       │                            Return results anyway
       │
       ├─ Profile not found ──────► Log warning
       │                            Return results anyway
       │
       └─ Database write error ───► Log error
                                    Return results anyway
                                    (cache failure is non-fatal)
```

## Monitoring Points

```
🔍 Check 1: Cache Lookup
   ├─ Log: "Found cached analysis"
   └─ Metric: cache_hit_rate

💾 Check 2: Cache Save
   ├─ Log: "Analysis cached"
   └─ Metric: cache_save_success_rate

⏱️ Check 3: Response Time
   ├─ Cache hit: <100ms
   └─ Cache miss: 5-10s

💰 Check 4: Cost Tracking
   ├─ OpenAI API calls
   └─ Database queries
```

## Legend

```
│  ├  └  ─  ▼  ►  ◄  ┐  ┘  Flowchart connectors
[━━━━━] Progress bar (slow)
[▪]       Progress bar (fast)
✅        Success indicator
❌        Error/problem indicator
🎉        Celebration/success
💾        Database operation
🔍        Search/lookup operation
⏱️        Performance metric
💰        Cost metric
```
