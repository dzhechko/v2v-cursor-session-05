# Architectural Diagrams & Analysis

## System Context Diagram

```mermaid
flowchart TD
    classDef user fill:#c5e8b7,stroke:#a5c897,color:#000
    classDef system fill:#f9d77e,stroke:#d9b95c,color:#000
    classDef external fill:#a8d5ff,stroke:#88b5e0,color:#000
    
    U1[Sales Professional] --> SalesAI[Sales Training Platform]
    U2[Admin] --> SalesAI
    U3[Super Admin] --> SalesAI
    U4[Prospect] --> SalesAI
    
    SalesAI --> EL[ElevenLabs API]
    SalesAI --> OAI[OpenAI GPT-4o]
    SalesAI --> CAL[Calendly]
    SalesAI --> STR[Stripe]
    SalesAI --> RES[Resend Email]
    
    class U1,U2,U3,U4 user
    class SalesAI system
    class EL,OAI,CAL,STR,RES external
```

## High-Level Architecture

```mermaid
flowchart TD
    classDef frontend fill:#f9d77e,stroke:#d9b95c,color:#000
    classDef backend fill:#a8d5ff,stroke:#88b5e0,color:#000
    classDef data fill:#c5e8b7,stroke:#a5c897,color:#000
    classDef integration fill:#f4b8c4,stroke:#d498a4,color:#000
    
    subgraph "Frontend Layer"
    UI[Next.js 14 App]
    LP[Landing Page]
    REG[Registration]
    DASH[Dashboard]
    SESS[Session UI]
    RPT[Reports]
    end
    
    subgraph "API Layer"
    GW[API Gateway/Routes]
    AUTH[Auth Middleware]
    RATE[Rate Limiting]
    end
    
    subgraph "Backend Services"
    AS[Auth Service]
    SS[Session Service]
    ANS[Analysis Service]
    BS[Billing Service]
    NS[Notification Service]
    end
    
    subgraph "Data Layer"
    SUPA[Supabase DB]
    RLS[Row-Level Security]
    CACHE[Session Cache]
    end
    
    subgraph "External APIs"
    EL[ElevenLabs]
    OAI[OpenAI]
    STR[Stripe]
    CAL[Calendly]
    RES[Resend]
    end
    
    UI --> GW
    GW --> AUTH
    AUTH --> AS
    GW --> SS
    GW --> ANS
    GW --> BS
    GW --> NS
    
    AS --> SUPA
    SS --> EL
    ANS --> OAI
    BS --> STR
    NS --> RES
    
    class UI,LP,REG,DASH,SESS,RPT frontend
    class GW,AUTH,RATE backend
    class AS,SS,ANS,BS,NS backend
    class SUPA,RLS,CACHE data
    class EL,OAI,STR,CAL,RES integration
```

## Component Architecture

```mermaid
flowchart TD
    classDef ui fill:#f9d77e,stroke:#d9b95c,color:#000
    classDef service fill:#a8d5ff,stroke:#88b5e0,color:#000
    classDef data fill:#c5e8b7,stroke:#a5c897,color:#000
    
    subgraph "Frontend Components"
    LPC[Landing Page Components]
    ARC[Auth & Registration Components]
    DBC[Dashboard Components]
    VSC[Voice Session Components]
    RPC[Report Components]
    BLC[Billing Components]
    end
    
    subgraph "API Services"
    API[Next.js API Routes]
    MW[Middleware Layer]
    VF[Vercel Functions]
    end
    
    subgraph "Business Services"
    UMS[User Management Service]
    SMS[Session Management Service]
    AMS[Analysis Management Service]
    BMS[Billing Management Service]
    EMS[Email Management Service]
    end
    
    subgraph "Data Services"
    DBS[Database Service]
    CCS[Cache Service]
    FLS[File Storage Service]
    end
    
    LPC & ARC & DBC & VSC & RPC & BLC --> API
    API --> MW
    MW --> VF
    VF --> UMS
    VF --> SMS
    VF --> AMS
    VF --> BMS
    VF --> EMS
    
    UMS --> DBS
    SMS --> DBS
    SMS --> CCS
    AMS --> DBS
    BMS --> DBS
    EMS --> DBS
    
    class LPC,ARC,DBC,VSC,RPC,BLC ui
    class API,MW,VF,UMS,SMS,AMS,BMS,EMS service
    class DBS,CCS,FLS data
```

## Data Architecture

```mermaid
flowchart TD
    classDef entity fill:#f9d77e,stroke:#d9b95c,color:#000
    classDef relation fill:#a8d5ff,stroke:#88b5e0,color:#000
    
    COMP[companies] --> PROF[profiles]
    PROF --> SESS[sessions]
    PROF --> SUB[subscriptions]
    PROF --> USE[usage]
    SESS --> FEED[feedback]
    SESS --> TRANS[transcripts]
    SUB --> BILL[billing_events]
    
    PROF -- "1:N" --> SESS
    PROF -- "1:N" --> USE
    PROF -- "1:1" --> SUB
    SESS -- "1:1" --> FEED
    SESS -- "1:1" --> TRANS
    SUB -- "1:N" --> BILL
    COMP -- "1:N" --> PROF
    
    class COMP,PROF,SESS,SUB,USE,FEED,TRANS,BILL entity
```

## Security Architecture

```mermaid
flowchart TD
    classDef security fill:#f9d77e,stroke:#d9b95c,color:#000
    classDef app fill:#a8d5ff,stroke:#88b5e0,color:#000
    classDef data fill:#c5e8b7,stroke:#a5c897,color:#000
    
    USER[Users] --> CDN[Vercel CDN]
    CDN --> WAF[Web Application Firewall]
    WAF --> LB[Load Balancer]
    LB --> NEXT[Next.js Frontend]
    
    NEXT --> JWT[JWT Validation]
    JWT --> RBAC[Role-Based Access]
    RBAC --> API[Protected API Routes]
    
    API --> SUPA[Supabase]
    SUPA --> RLS[Row-Level Security]
    RLS --> DATA[Encrypted Data]
    
    API --> EXT[External APIs]
    EXT --> KEYS[API Key Vault]
    
    class WAF,JWT,RBAC,RLS,KEYS security
    class NEXT,API app
    class SUPA,DATA data
    class USER,CDN,LB,EXT external
```

## Deployment Architecture

```mermaid
flowchart TD
    classDef env fill:#f9d77e,stroke:#d9b95c,color:#000
    classDef component fill:#a8d5ff,stroke:#88b5e0,color:#000
    
    subgraph "Production Environment"
    GITHUB[GitHub Repository] --> VERCEL[Vercel Platform]
    VERCEL --> EDGE[Edge Functions]
    VERCEL --> SSG[Static Site Generation]
    VERCEL --> FUNCS[Serverless Functions]
    end
    
    subgraph "Database Environment" 
    SUPABASE[Supabase Cloud]
    BACKUP[Automated Backups]
    MONITORING[Database Monitoring]
    end
    
    subgraph "External Services"
    STRIPE[Stripe Dashboard]
    ELEVENLABS[ElevenLabs Platform]
    OPENAI[OpenAI Platform]
    RESEND[Resend Platform]
    CALENDLY[Calendly Integration]
    end
    
    FUNCS --> SUPABASE
    FUNCS --> STRIPE
    FUNCS --> ELEVENLABS
    FUNCS --> OPENAI
    FUNCS --> RESEND
    SSG --> CALENDLY
    
    class Production,Database,External env
    class GITHUB,VERCEL,EDGE,SSG,FUNCS,SUPABASE,BACKUP,MONITORING component
```
