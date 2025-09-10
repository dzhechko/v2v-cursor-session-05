# Product Context

## Product Vision
Empower sales professionals to master their craft through AI-powered, voice-to-voice practice sessions that provide instant, actionable feedback for continuous skill improvement.

## User Journey

### Discovery & Onboarding
1. **Landing Page**: Visitor discovers platform features
2. **Demo Path**: Schedule live demo via Calendly
3. **Signup Path**: Immediate registration with free trial
4. **API Setup**: Configure ElevenLabs + OpenAI keys
5. **First Session**: 2-minute free trial experience

### Core Usage Loop
1. **Dashboard**: Check remaining minutes, subscription status
2. **Practice Session**: Start voice-to-voice AI simulation
3. **Real-time Feedback**: Live transcription and session timer
4. **Analysis**: Detailed performance breakdown post-session
5. **Improvement**: Review metrics and coaching recommendations

### Growth & Retention
1. **Usage Tracking**: Monitor practice frequency and improvement
2. **Billing**: Upgrade plans based on usage patterns
3. **Team Features**: Admin dashboards for team performance
4. **Notifications**: Session summaries and billing updates

## Feature Requirements

### Core Features (MVP)
- **Voice Practice**: Real-time voice-to-voice AI conversations
- **Analysis Engine**: GPT-4o powered performance evaluation
- **User Management**: Registration, authentication, role-based access
- **Billing System**: Stripe-powered subscription management
- **Demo Booking**: Integrated Calendly scheduling

### Key Metrics Tracked
- Talk time ratio (user vs AI)
- Filler words frequency
- Speaking pace (words per minute)
- Sentiment analysis
- Objection handling effectiveness
- Overall skill scores

## Business Logic

### Trial Management
- 2-minute free trial for new users
- Minute tracking and enforcement
- Trial expiration notifications

### Subscription Tiers
- **Starter**: Basic features with minute limits
- **Pro**: Enhanced features and higher limits  
- **Enterprise**: Unlimited usage with team management

### Role-Based Access
- **Super Admin**: Platform-wide management
- **Admin**: Company-level user and billing management
- **User**: Personal practice sessions and reports

## Integration Points

### External APIs
- **ElevenLabs**: Voice streaming and audio analysis
- **OpenAI**: Conversation evaluation and coaching
- **Stripe**: Payment processing and subscription management
- **Calendly**: Demo scheduling integration
- **Resend**: Email notifications and receipts

### Data Flow
- Voice data → ElevenLabs → Real-time streaming
- Session transcripts → GPT-4o → Performance analysis
- User actions → Supabase → Data persistence
- Billing events → Stripe → Webhook processing
