#!/bin/bash

# Test script to verify analysis caching works

echo "🧪 Testing Analysis Caching"
echo "=============================="
echo ""

# Get a recent conversation ID from ElevenLabs
CONVERSATION_ID=$(curl -s -X GET "https://api.elevenlabs.io/v1/convai/conversations" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  | jq -r '.conversations[0].conversation_id')

echo "📝 Testing with conversation: $CONVERSATION_ID"
echo ""

# Get Supabase auth token (you need to be logged in)
echo "🔐 Please make sure you're logged in to https://sales-ai-trainer.vercel.app"
echo "📋 Open browser console and run: localStorage.getItem('sb-<project>-auth-token')"
echo ""
echo -n "Enter your Supabase auth token: "
read AUTH_TOKEN

echo ""
echo "🔍 Test 1: Calling analyze API (should save to DB)..."
curl -X POST "https://sales-ai-trainer.vercel.app/api/elevenlabs/conversations/$CONVERSATION_ID/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v \
  2>&1 | grep -E "(HTTP|🔍|💾|✅|❌|⚠️)"

echo ""
echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2

echo "🔍 Test 2: Calling analyze API again (should return from cache)..."
curl -X POST "https://sales-ai-trainer.vercel.app/api/elevenlabs/conversations/$CONVERSATION_ID/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v \
  2>&1 | grep -E "(HTTP|Found cached|💾|✅|❌|⚠️)"

echo ""
echo ""
echo "✅ Test complete! Check if second request was faster."
echo "💡 If caching works, second request should show 'Found cached analysis'"
