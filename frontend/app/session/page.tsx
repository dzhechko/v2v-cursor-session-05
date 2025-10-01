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
  const handleSessionEnd = async (duration: number, elevenLabsConversationId?: string, transcript?: any[]) => {
    const currentConversationId = elevenLabsConversationId || conversationId || `unknown-${Date.now()}`;
    console.log('🏁 ElevenLabs session ended:', {
      conversationId: currentConversationId,
      duration,
      messageCount: transcript?.length || 0
    });

    try {
      // Simply redirect to results page - analysis will happen there
      console.log('📊 Redirecting to analysis page...');
      toast.success(`🎉 Session completed! Duration: ${Math.round(duration/60)} minutes`);

      setTimeout(() => {
        router.push(`/session/${currentConversationId}/results`);
      }, 1000);

    } catch (error) {
      console.error('❌ Error handling session end:', error);
      toast.error('Session completed but there was an issue');
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
