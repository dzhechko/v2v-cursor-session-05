🎨🎨🎨 ENTERING CREATIVE PHASE: ARCHITECTURE DESIGN 🎨🎨🎨
Focus: Real-Time Audio Architecture
Objective: Design scalable, low-latency audio streaming infrastructure for sales training sessions
Requirements: Sub-300ms latency, reliable connection handling, cost optimization

📌 CREATIVE PHASE START: Real-Time Audio Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ PROBLEM
   Description: Implement a real-time audio streaming architecture that enables bi-directional voice communication between users and ElevenLabs AI with minimal latency
   Requirements:
   - Target latency: < 300ms round-trip
   - Support for concurrent users (up to 100 simultaneously)
   - Reliable connection handling with automatic reconnection
   - Audio quality optimization (sample rate, compression)
   - Integration with session management and minute tracking
   - Cost optimization for API usage
   - Error handling and graceful degradation
   Constraints:
   - ElevenLabs API rate limits and quotas
   - Vercel function execution time limits (10 seconds)
   - Browser WebRTC capabilities and permissions
   - Network instability and mobile connections

2️⃣ OPTIONS
   Option A: Direct WebSocket to ElevenLabs - Browser directly connects to ElevenLabs
   Option B: Serverless Proxy Pattern - Vercel functions proxy audio streams
   Option C: Hybrid Approach - WebSocket for control, direct streaming for audio
   Option D: WebRTC P2P with Server Mediation - WebRTC with server coordination

3️⃣ ANALYSIS
   | Criterion | Direct WS | Proxy Pattern | Hybrid | WebRTC |
   |-----------|-----------|---------------|--------|---------|
   | Latency | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
   | Security | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
   | Scalability | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
   | Cost Control | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
   | Complexity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
   
   Key Insights:
   - Direct WebSocket offers best performance but exposes API keys
   - Proxy pattern provides security and cost control but adds latency
   - Hybrid approach balances performance and security concerns  
   - WebRTC most scalable but highest implementation complexity

4️⃣ DECISION
   Selected: Option C: Hybrid Approach with Smart Routing
   Rationale: Optimal balance of performance, security, and cost control while maintaining implementation feasibility

5️⃣ IMPLEMENTATION NOTES
   - Use WebSocket for session control and metadata
   - Direct ElevenLabs streaming for audio (with API key validation)
   - Implement connection pooling for WebSocket connections
   - Add circuit breaker pattern for ElevenLabs API failures
   - Use audio buffering to handle network jitter
   - Implement progressive audio quality degradation
   - Add comprehensive error recovery mechanisms

🎨 CREATIVE CHECKPOINT: Core Architecture Decided
- Progress: Primary streaming pattern selected
- Decisions: Hybrid WebSocket + Direct streaming approach
- Next steps: Detail component interactions and data flow

## Detailed Architecture Components

### Connection Management
**Component**: Session Connection Manager
**Responsibilities**:
- Establish and maintain WebSocket connections to Vercel functions
- Handle ElevenLabs API key validation and secure storage
- Manage connection lifecycle (connect, reconnect, disconnect)
- Implement exponential backoff for failed connections

**Implementation**:
```typescript
class SessionConnectionManager {
  private wsConnection: WebSocket;
  private audioStream: MediaStream;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  async establishConnection(apiKeys: APIKeys): Promise<void> {
    // Validate API keys with test call
    // Establish WebSocket to Vercel function
    // Set up audio stream handlers
  }
}
```

### Audio Pipeline Architecture
**Data Flow**:
1. **User Audio Capture** → Browser MediaRecorder API
2. **Audio Processing** → Real-time encoding (WebM/Opus)
3. **Stream Transmission** → Direct to ElevenLabs Conversational AI
4. **AI Response** → ElevenLabs WebSocket stream  
5. **Audio Playback** → Browser Audio API with buffering
6. **Transcription** → Real-time speech-to-text processing

### Error Handling Strategy
**Network Issues**:
- Connection drop detection (heartbeat mechanism)
- Automatic reconnection with exponential backoff
- Audio buffer management during network interruptions
- User notification of connection quality

**API Failures**:
- Circuit breaker pattern for ElevenLabs API
- Graceful degradation (disable AI, continue recording)
- Queue management for failed requests
- Cost optimization through request batching

### Performance Optimization
**Audio Quality Management**:
```typescript
interface AudioConfig {
  sampleRate: number; // 16kHz for optimal balance
  channels: number;   // Mono for bandwidth efficiency
  bitRate: number;    // Adaptive based on connection
}

class AdaptiveAudioManager {
  adjustQuality(connectionQuality: ConnectionQuality): AudioConfig {
    // Dynamic adjustment based on network conditions
  }
}
```

**Latency Reduction Techniques**:
- Audio pre-buffering (100ms buffer for jitter handling)
- Parallel processing of user speech and AI response preparation
- WebSocket connection keep-alive to avoid reconnection overhead
- Edge function deployment for regional proximity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 CREATIVE PHASE END

🎨🎨🎨 EXITING CREATIVE PHASE - DECISION MADE 🎨🎨🎨
Summary: Hybrid architecture with WebSocket control plane and direct audio streaming, prioritizing low latency while maintaining security
Key Decisions: Direct ElevenLabs streaming, adaptive audio quality, comprehensive error handling
Next Steps: Implement connection manager, audio pipeline components, add monitoring and analytics
