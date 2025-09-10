🎨🎨🎨 ENTERING CREATIVE PHASE: ARCHITECTURE DESIGN 🎨🎨🎨
Focus: Multi-Tenant Security Architecture
Objective: Design secure, scalable multi-tenant data isolation and access control system
Requirements: Zero data leakage, role-based access, GDPR compliance, performance optimization

📌 CREATIVE PHASE START: Multi-Tenant Security Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ PROBLEM
   Description: Implement a comprehensive multi-tenant security architecture that ensures complete data isolation while supporting complex role hierarchies (Super Admin/Admin/User) and maintaining high performance
   Requirements:
   - Zero data leakage between tenants (companies)
   - Role-based access control with hierarchical permissions
   - GDPR compliance with right-to-delete functionality
   - Performance optimization for large-scale queries
   - Audit logging for security compliance
   - API key security and encryption
   - Session management and JWT handling
   Constraints:
   - Supabase Row-Level Security (RLS) limitations
   - Serverless function statelessness
   - Database query performance requirements
   - GDPR data retention and deletion requirements
   - API rate limiting and cost optimization

2️⃣ OPTIONS
   Option A: Shared Database with RLS - Single database with row-level policies
   Option B: Database Per Tenant - Separate database instances per company
   Option C: Hybrid Schema Isolation - Shared DB with schema-level separation
   Option D: Application-Level Security - Pure application logic for tenant isolation

3️⃣ ANALYSIS
   | Criterion | Shared RLS | DB Per Tenant | Schema Isolation | App-Level |
   |-----------|------------|---------------|------------------|-----------|
   | Data Isolation | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
   | Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
   | Cost Efficiency | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
   | Scalability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
   | Complexity | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
   | GDPR Compliance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
   
   Key Insights:
   - Shared RLS provides good balance of security and simplicity
   - DB per tenant offers maximum isolation but high operational overhead
   - Schema isolation provides strong separation with moderate complexity
   - App-level security fast but relies on application logic correctness

4️⃣ DECISION
   Selected: Option A: Enhanced Shared Database with Advanced RLS + Application Guards
   Rationale: Best balance of security, performance, and operational simplicity while meeting all requirements through layered security approach

5️⃣ IMPLEMENTATION NOTES
   - Implement comprehensive RLS policies for all tables
   - Add application-level security guards as secondary validation
   - Use JWT claims for tenant identification and role management
   - Implement audit logging with encrypted sensitive data
   - Add API key encryption and secure rotation mechanisms
   - Create GDPR-compliant data deletion workflows
   - Implement rate limiting per tenant to prevent abuse

🎨 CREATIVE CHECKPOINT: Security Model Defined
- Progress: Core security architecture selected
- Decisions: Layered security with RLS + application validation
- Next steps: Define specific policies and implementation patterns

## Detailed Security Implementation

### Row-Level Security Policy Design

**Core Tables and Policies**:

```sql
-- Companies table (tenant root)
CREATE POLICY "Companies: Super Admins see all" ON companies
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Companies: Admins see own company" ON companies  
  FOR ALL TO authenticated
  USING (id = (auth.jwt() ->> 'company_id')::uuid);

-- Profiles table (user data)
CREATE POLICY "Profiles: Users see own data" ON profiles
  FOR ALL TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Profiles: Admins see company users" ON profiles
  FOR ALL TO authenticated  
  USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid AND
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
  );

-- Sessions table (training data)
CREATE POLICY "Sessions: Users see own sessions" ON sessions
  FOR ALL TO authenticated
  USING (profile_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));
```

### Role-Based Access Control Matrix

| Resource | Super Admin | Admin | User |
|----------|-------------|-------|------|
| All Companies | Full Access | Own Company Only | No Access |
| All Users | Full Access | Company Users | Own Profile |
| All Sessions | Full Access | Company Sessions | Own Sessions |
| Billing Settings | Full Access | Company Billing | View Only |
| API Keys | Platform Keys | Company Keys | Own Keys |
| Usage Analytics | Global | Company | Personal |

### Application-Level Security Guards

**TypeScript Implementation**:
```typescript
class SecurityGuard {
  static async validateTenantAccess(
    userId: string,
    resourceCompanyId: string,
    requiredRole: Role
  ): Promise<boolean> {
    const userProfile = await getUserProfile(userId);
    
    // Super admins can access everything
    if (userProfile.role === 'super_admin') return true;
    
    // Check company membership
    if (userProfile.company_id !== resourceCompanyId) return false;
    
    // Check role hierarchy
    return this.hasRequiredRole(userProfile.role, requiredRole);
  }

  static hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
    const roleHierarchy = {
      'user': 1,
      'admin': 2, 
      'super_admin': 3
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}
```

### API Key Security Architecture

**Encryption Strategy**:
```typescript
interface SecureAPIKey {
  id: string;
  user_id: string;
  service: 'elevenlabs' | 'openai';
  encrypted_key: string; // AES-256 encrypted
  key_hash: string;      // For validation without decryption
  created_at: Date;
  last_used: Date;
  is_active: boolean;
}

class APIKeyManager {
  static async storeKey(
    userId: string, 
    service: string, 
    plainKey: string
  ): Promise<void> {
    const encryptedKey = await encrypt(plainKey, process.env.ENCRYPTION_KEY!);
    const keyHash = await hash(plainKey);
    
    await supabase.from('api_keys').upsert({
      user_id: userId,
      service: service,
      encrypted_key: encryptedKey,
      key_hash: keyHash,
      is_active: true
    });
  }
  
  static async validateKey(
    userId: string,
    service: string,
    providedKey: string
  ): Promise<boolean> {
    const stored = await this.getStoredKey(userId, service);
    if (!stored) return false;
    
    const providedHash = await hash(providedKey);
    return providedHash === stored.key_hash;
  }
}
```

### GDPR Compliance Implementation

**Data Deletion Workflow**:
```typescript
class GDPRComplianceManager {
  static async deleteUserData(userId: string): Promise<void> {
    const operations = [
      // 1. Anonymize session transcripts
      this.anonymizeTranscripts(userId),
      
      // 2. Delete personal data
      this.deletePersonalData(userId),
      
      // 3. Remove API keys securely
      this.secureDeleteAPIKeys(userId),
      
      // 4. Create audit log
      this.logDataDeletion(userId)
    ];
    
    await Promise.all(operations);
  }
  
  private static async anonymizeTranscripts(userId: string): Promise<void> {
    // Replace with anonymized tokens instead of deletion
    // Preserves analytics while removing PII
    await supabase
      .from('transcripts')
      .update({ 
        content: '[ANONYMIZED]',
        speaker_id: '[ANONYMIZED]',
        anonymized_at: new Date()
      })
      .eq('user_id', userId);
  }
}
```

### Security Monitoring and Audit Logging

**Audit Log Structure**:
```typescript
interface AuditEvent {
  id: string;
  user_id: string;
  company_id: string;
  event_type: 'login' | 'data_access' | 'data_modification' | 'api_key_usage';
  resource: string;
  action: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  sensitive_data_accessed: boolean;
}

class SecurityMonitor {
  static async logSecurityEvent(event: Partial<AuditEvent>): Promise<void> {
    await supabase.from('audit_logs').insert({
      ...event,
      timestamp: new Date(),
      id: generateUUID()
    });
  }
  
  static async detectSuspiciousActivity(userId: string): Promise<Alert[]> {
    // Detect unusual access patterns
    // Multiple failed attempts
    // Access from new locations
    // Bulk data access
    return this.analyzeUserActivity(userId);
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 CREATIVE PHASE END

🎨🎨🎨 EXITING CREATIVE PHASE - DECISION MADE 🎨🎨🎨
Summary: Layered security architecture with RLS policies, application-level guards, encrypted API key management, and comprehensive GDPR compliance
Key Decisions: Enhanced shared database model, role-based hierarchy, audit logging, secure key management
Next Steps: Implement RLS policies, security guards, API key encryption, audit logging system
