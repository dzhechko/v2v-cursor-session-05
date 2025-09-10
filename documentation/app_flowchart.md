flowchart TD
  Landing[Landing Page] --> Booking[Demo Booking]
  Booking --> Calendly[Calendly Integration]
  Landing --> Register[User Registration]
  Register --> APIKey[API Key Entry]
  APIKey --> Dashboard[User Dashboard]
  Dashboard --> Practice[Start Voice Practice]
  Practice --> VoiceSession[Voice Interaction Session]
  VoiceSession --> Analysis[AI Conversation Analysis]
  Analysis --> Feedback[Feedback and Metrics]
  Feedback --> Dashboard
  Dashboard --> Account[Manage Account]
  Account --> Billing[Stripe Billing]
  Account --> Profile[Profile Management]