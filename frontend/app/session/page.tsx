'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceSessionInterface from '../../components/voice-session/voice-session-interface';
import { toast } from 'react-hot-toast';
import { createClient } from '../../lib/supabase';

export default function SessionPage() {
  console.log('📟 SessionPage - ElevenLabs First Architecture!');
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();
  
  console.log('📟 SessionPage current state:', {
    conversationId,
    isReady,
    userInfo: !!userInfo
  });

  // Check user authentication
  useEffect(() => {
    const checkUserAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Auth check:', session ? `Logged in as ${session.user?.email}` : 'Not logged in');
      
      if (!session) {
        // Check for personalized demo data from demo-request page
        const demoUserData = localStorage.getItem('demo-user');
        if (demoUserData) {
          const userData = JSON.parse(demoUserData);
          setUserInfo(userData);
          console.log('📋 Personalized demo for:', userData.name, 'from', userData.company);
        } else {
          // No auth and no demo data, redirect to demo request
          toast.error('Please login or fill out demo request to continue');
          router.push('/demo-request');
          return;
        }
      } else {
        // Get user profile information
        try {
          const { data: profile } = await supabase
            .from('salesai_profiles')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();
          
          if (profile) {
            setUserInfo(profile);
            console.log('👤 User profile loaded:', profile.first_name, profile.last_name);
          }
        } catch (error) {
          console.warn('⚠️ Could not load user profile:', error);
        }
      }
    };

    checkUserAuth();
  }, []);

  // Handle session end with ElevenLabs conversation data
  const handleSessionEnd = async (duration: number, transcript?: any[]) => {
    const currentConversationId = conversationId || `unknown-${Date.now()}`;
    console.log('🏁 ElevenLabs session ended:', {
      conversationId: currentConversationId,
      duration,
      messageCount: transcript?.length || 0
    });

    try {
             // Get conversation data directly from ElevenLabs
       const conversationResponse = await fetch(`/api/elevenlabs/conversations/${currentConversationId}`);
       let conversationData = null;
       
       if (conversationResponse.ok) {
         conversationData = await conversationResponse.json();
         console.log('📡 ElevenLabs conversation data:', conversationData);
       }

       // Save minimal session record with ElevenLabs conversation_id
       const sessionRecord = {
         conversation_id: currentConversationId,
         duration_seconds: duration,
         message_count: transcript?.length || 0,
         ended_at: new Date().toISOString(),
         user_id: userInfo?.auth_id || null,
         status: 'completed'
       };

      const saveResponse = await fetch('/api/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userInfo?.auth_id && { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` })
        },
        body: JSON.stringify(sessionRecord)
      });

      if (saveResponse.ok) {
        const sessionData = await saveResponse.json();
        console.log('✅ Session record saved:', sessionData);
        toast.success(`🎉 Session completed! Duration: ${Math.round(duration/60)} minutes`);
      } else {
        console.warn('⚠️ Could not save session record');
        toast.success('🎉 Session completed!');
      }
      
             // Redirect to results page with ElevenLabs conversation_id
       setTimeout(() => {
         router.push(`/session/${currentConversationId}/results`);
       }, 1500);
       
     } catch (error) {
       console.error('❌ Error handling session end:', error);
       toast.error('Session completed but there was an issue saving data');
       setTimeout(() => {
         router.push('/dashboard');
       }, 2000);
     }
   };

   // Generate a temporary ID for the interface before ElevenLabs provides conversation_id
   const sessionId = conversationId || `temp-${Date.now()}`;

   return (
     <VoiceSessionInterface 
       sessionId={sessionId}
       onSessionEnd={handleSessionEnd}
     />
   );
}
