🎨🎨🎨 ENTERING CREATIVE PHASE: DATA MODEL DESIGN 🎨🎨🎨
Focus: Session Data Structure Design
Objective: Design optimal data model for voice session storage, analysis, and retrieval with performance optimization
Requirements: GDPR compliance, efficient queries, data integrity, analytics support

📌 CREATIVE PHASE START: Session Data Structure Design
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ PROBLEM
   Description: Design a comprehensive data model for storing voice training sessions that supports real-time updates, efficient analytics queries, GDPR compliance, and multi-tenant isolation while optimizing for performance
   Requirements:
   - Store session metadata (duration, participants, status)
   - Handle real-time transcript updates during sessions
   - Support audio metadata and quality metrics
   - Enable efficient analytics and reporting queries
   - Maintain data integrity across related entities
   - Support GDPR data deletion and anonymization
   - Optimize for multi-tenant Row-Level Security performance
   - Handle concurrent session updates without conflicts
   Constraints:
   - Supabase PostgreSQL limitations and RLS overhead
   - Large transcript data storage considerations
   - Real-time update performance requirements
   - Multi-tenant query optimization challenges
   - GDPR data retention and deletion requirements

2️⃣ OPTIONS
   Option A: Normalized Relational Model - Separate tables for each data type
   Option B: JSON Document Model - Session data as JSON with metadata tables
   Option C: Hybrid Model - Structured metadata with JSON analytics data
   Option D: Time-Series Model - Event-based session data storage

3️⃣ ANALYSIS
   | Criterion | Normalized | JSON Document | Hybrid | Time-Series |
   |-----------|------------|---------------|---------|-------------|
   | Query Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
   | Storage Efficiency | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
   | Real-time Updates | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
   | Analytics Support | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
   | GDPR Compliance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
   | Implementation | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
   
   Key Insights:
   - Normalized model provides best query performance but complex real-time updates
   - JSON document model simple but limited analytics capabilities
   - Hybrid model balances structured queries with flexible analytics storage
   - Time-series model excellent for real-time but complex for business queries

4️⃣ DECISION
   Selected: Option C: Hybrid Model with Structured Metadata + JSON Analytics
   Rationale: Optimal balance of query performance, analytics flexibility, and GDPR compliance while supporting efficient real-time updates

5️⃣ IMPLEMENTATION NOTES
   - Use structured tables for core session metadata and relationships
   - Store variable analytics data as JSONB for flexibility
   - Implement efficient indexing strategy for multi-tenant queries
   - Add trigger-based audit logging for GDPR compliance
   - Use connection pooling for high-concurrency session updates
   - Implement data archival strategy for old sessions
   - Add data validation constraints for integrity

🎨 CREATIVE CHECKPOINT: Data Model Architecture Defined
- Progress: Core data structure approach selected
- Decisions: Hybrid structured + JSON model with optimization
- Next steps: Define specific table schemas and relationships

## Detailed Data Model Implementation

### Core Session Schema Design

```sql
-- Sessions table (core metadata)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id), -- Denormalized for RLS performance
  
  -- Session metadata
  title VARCHAR(255) NOT NULL,
  status session_status DEFAULT 'active', -- active, completed, analyzed, archived
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Audio metadata  
  audio_quality JSONB, -- Sample rate, bitrate, codec info
  audio_file_url TEXT,
  audio_file_size BIGINT,
  
  -- Performance tracking
  minute_cost DECIMAL(10,4), -- Cost in user minutes consumed
  processing_status TEXT DEFAULT 'pending', -- pending, processing, complete, failed
  
  -- Analytics summary (for quick access)
  analytics_summary JSONB, -- Core metrics for dashboard
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_sessions_profile_company (profile_id, company_id),
  INDEX idx_sessions_status_created (status, created_at),
  INDEX idx_sessions_company_created (company_id, created_at)
);

-- Transcripts table (separate for large text data)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Content data
  content TEXT, -- Full transcript text
  structured_content JSONB, -- Speaker-segmented transcript with timestamps
  
  -- Processing metadata
  language VARCHAR(10) DEFAULT 'en-US',
  confidence_score DECIMAL(5,4), -- Speech-to-text confidence
  word_count INTEGER,
  
  -- GDPR compliance
  is_anonymized BOOLEAN DEFAULT FALSE,
  anonymized_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Full-text search optimization
  INDEX idx_transcript_search (to_tsvector('english', content))
);

-- Analysis results table (detailed AI feedback)
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Analysis metadata
  analysis_type VARCHAR(50), -- 'voice_metrics', 'conversation_analysis', 'combined'
  provider VARCHAR(50), -- 'elevenlabs', 'openai', 'combined'
  version VARCHAR(20), -- Analysis version for model tracking
  
  -- Results data (flexible JSON structure)
  results JSONB NOT NULL,
  
  -- Quality metrics
  confidence_score DECIMAL(5,4),
  processing_time_ms INTEGER,
  
  -- Cost tracking
  api_cost_usd DECIMAL(10,6),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for analytics queries
  INDEX idx_analysis_session_type (session_id, analysis_type),
  INDEX idx_analysis_provider_version (provider, version),
  INDEX idx_analysis_created (created_at)
);
```

### Real-Time Session Updates Strategy

**WebSocket Update Handling**:
```typescript
interface SessionUpdate {
  sessionId: string;
  updateType: 'transcript_chunk' | 'audio_metrics' | 'status_change';
  data: any;
  timestamp: Date;
}

class SessionUpdateManager {
  async handleRealtimeUpdate(update: SessionUpdate): Promise<void> {
    switch (update.updateType) {
      case 'transcript_chunk':
        await this.appendTranscriptChunk(update);
        break;
      case 'audio_metrics':
        await this.updateAudioMetrics(update);
        break;
      case 'status_change':
        await this.updateSessionStatus(update);
        break;
    }
    
    // Broadcast to connected clients
    await this.broadcastUpdate(update);
  }

  private async appendTranscriptChunk(update: SessionUpdate): Promise<void> {
    await supabase
      .from('transcripts')
      .update({
        structured_content: supabase.sql`
          structured_content || ${JSON.stringify(update.data)}::jsonb
        `,
        updated_at: new Date()
      })
      .eq('session_id', update.sessionId);
  }
}
```

### Analytics Optimization Schema

**Session Analytics Aggregation**:
```sql
-- Pre-computed analytics for performance
CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  profile_id UUID, -- Denormalized for performance
  company_id UUID, -- Denormalized for performance
  
  -- Core metrics (extracted from analysis_results for fast queries)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  talk_time_ratio DECIMAL(5,4), -- User talk time percentage
  filler_words_count INTEGER,
  speaking_pace_wpm INTEGER,
  sentiment_score DECIMAL(5,4),
  
  -- Skill scores
  opening_score INTEGER CHECK (opening_score >= 0 AND opening_score <= 100),
  questioning_score INTEGER CHECK (questioning_score >= 0 AND questioning_score <= 100),
  objection_handling_score INTEGER CHECK (objection_handling_score >= 0 AND objection_handling_score <= 100),
  closing_score INTEGER CHECK (closing_score >= 0 AND closing_score <= 100),
  
  -- Time-based analytics
  session_date DATE GENERATED ALWAYS AS (sessions.started_at::date) STORED,
  session_hour INTEGER GENERATED ALWAYS AS (EXTRACT(hour FROM sessions.started_at)) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes optimized for dashboard queries
  INDEX idx_analytics_profile_date (profile_id, session_date),
  INDEX idx_analytics_company_date (company_id, session_date),
  INDEX idx_analytics_scores (overall_score, talk_time_ratio, sentiment_score)
);
```

### GDPR Compliance Implementation

**Data Deletion and Anonymization**:
```typescript
class GDPRSessionManager {
  async deleteUserSessionData(userId: string): Promise<void> {
    await supabase.rpc('gdpr_delete_user_sessions', { user_id: userId });
  }
  
  async anonymizeSessionData(sessionId: string): Promise<void> {
    const operations = [
      // Anonymize transcript content
      supabase
        .from('transcripts')
        .update({
          content: '[ANONYMIZED BY USER REQUEST]',
          structured_content: { anonymized: true, timestamp: new Date() },
          is_anonymized: true,
          anonymized_at: new Date()
        })
        .eq('session_id', sessionId),
      
      // Remove audio file and personal identifiers
      supabase
        .from('sessions')
        .update({
          audio_file_url: null,
          title: '[ANONYMIZED SESSION]'
        })
        .eq('id', sessionId),
        
      // Preserve analytics but remove personal context
      supabase
        .from('analysis_results')
        .update({
          results: supabase.sql`
            results - 'personal_context' - 'audio_samples'
          `
        })
        .eq('session_id', sessionId)
    ];
    
    await Promise.all(operations);
  }
}

-- GDPR deletion stored procedure
CREATE OR REPLACE FUNCTION gdpr_delete_user_sessions(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete in dependency order
  DELETE FROM analysis_results 
  WHERE session_id IN (
    SELECT id FROM sessions s 
    JOIN profiles p ON s.profile_id = p.id 
    WHERE p.auth_id = user_id
  );
  
  DELETE FROM session_analytics 
  WHERE session_id IN (
    SELECT id FROM sessions s 
    JOIN profiles p ON s.profile_id = p.id 
    WHERE p.auth_id = user_id
  );
  
  DELETE FROM transcripts 
  WHERE session_id IN (
    SELECT id FROM sessions s 
    JOIN profiles p ON s.profile_id = p.id 
    WHERE p.auth_id = user_id
  );
  
  DELETE FROM sessions 
  WHERE profile_id IN (
    SELECT id FROM profiles WHERE auth_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Performance Optimization Strategies

**Query Optimization Patterns**:
```sql
-- Efficient company dashboard query
CREATE VIEW company_session_metrics AS
SELECT 
  c.id as company_id,
  COUNT(s.id) as total_sessions,
  AVG(sa.overall_score) as avg_score,
  SUM(s.duration_seconds) as total_duration,
  COUNT(DISTINCT s.profile_id) as active_users
FROM companies c
LEFT JOIN sessions s ON c.id = s.company_id AND s.status = 'completed'
LEFT JOIN session_analytics sa ON s.id = sa.session_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id;

-- User progress tracking query
CREATE VIEW user_progress_metrics AS  
SELECT
  p.id as profile_id,
  COUNT(s.id) as session_count,
  AVG(sa.overall_score) as avg_score,
  AVG(sa.talk_time_ratio) as avg_talk_ratio,
  FIRST_VALUE(sa.overall_score) OVER (
    PARTITION BY p.id ORDER BY s.started_at
  ) as first_session_score,
  LAST_VALUE(sa.overall_score) OVER (
    PARTITION BY p.id ORDER BY s.started_at 
    RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) as latest_session_score
FROM profiles p
LEFT JOIN sessions s ON p.id = s.profile_id AND s.status = 'completed'
LEFT JOIN session_analytics sa ON s.id = sa.session_id
WHERE s.created_at >= NOW() - INTERVAL '90 days'
GROUP BY p.id;
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 CREATIVE PHASE END

🎨🎨🎨 EXITING CREATIVE PHASE - DECISION MADE 🎨🎨🎨
Summary: Hybrid data model with structured metadata tables and flexible JSON analytics, optimized for multi-tenant performance and GDPR compliance
Key Decisions: Separate tables for sessions/transcripts/analytics, JSONB for flexible data, pre-computed analytics views, comprehensive GDPR support
Next Steps: Implement database schema, create migration scripts, add RLS policies, build data access layers
