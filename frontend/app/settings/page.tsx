'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createClient } from '../../lib/supabase';

interface ApiKey {
  id?: string;
  service: string;
  key: string;
  is_active: boolean;
  last_used?: string;
}

interface ApiKeyForm {
  elevenlabs_api_key: string;
  elevenlabs_agent_id: string;
  openai_api_key: string;
}

export default function SettingsPage() {
  const [formData, setFormData] = useState<ApiKeyForm>({
    elevenlabs_api_key: '',
    elevenlabs_agent_id: '',
    openai_api_key: ''
  });
  
  const [showKeys, setShowKeys] = useState({
    elevenlabs_api_key: false,
    elevenlabs_agent_id: false,
    openai_api_key: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      setIsLoading(true);
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to access settings');
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      
      // Load existing API keys
      await loadApiKeys();
      
    } catch (error) {
      console.error('Settings initialization error:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/api-keys', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const keys = data.api_keys || [];
        
        // Map API keys to form data
        const elevenlabsKey = keys.find((k: ApiKey) => k.service === 'elevenlabs');
        const elevenlabsAgent = keys.find((k: ApiKey) => k.service === 'elevenlabs_agent');
        const openaiKey = keys.find((k: ApiKey) => k.service === 'openai');
        
        setFormData({
          elevenlabs_api_key: elevenlabsKey?.key || '',
          elevenlabs_agent_id: elevenlabsAgent?.key || '',
          openai_api_key: openaiKey?.key || ''
        });
        
        console.log('✅ API keys loaded successfully');
      }
    } catch (error) {
      console.warn('⚠️ Could not load existing API keys (this is normal for new users):', error);
    }
  };

  const validateApiKey = async (service: string, key: string) => {
    if (!key.trim()) return false;
    
    setIsValidating(true);
    
    try {
      // Basic validation patterns
      if (service === 'elevenlabs' && !key.startsWith('sk_')) {
        toast.error('ElevenLabs API key should start with "sk_"');
        return false;
      }
      
      if (service === 'openai' && !key.startsWith('sk-')) {
        toast.error('OpenAI API key should start with "sk-"');
        return false;
      }
      
      // TODO: Add actual API validation calls here
      // For now, just check format
      
      setValidationStatus(prev => ({ ...prev, [service]: true }));
      toast.success(`${service} API key format is valid`);
      return true;
      
    } catch (error) {
      setValidationStatus(prev => ({ ...prev, [service]: false }));
      toast.error(`Invalid ${service} API key`);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to save settings');
        return;
      }

      const keysToSave = [];
      
      if (formData.elevenlabs_api_key.trim()) {
        keysToSave.push({
          service: 'elevenlabs',
          key: formData.elevenlabs_api_key.trim()
        });
      }
      
      if (formData.elevenlabs_agent_id.trim()) {
        keysToSave.push({
          service: 'elevenlabs_agent',
          key: formData.elevenlabs_agent_id.trim()
        });
      }
      
      if (formData.openai_api_key.trim()) {
        keysToSave.push({
          service: 'openai',
          key: formData.openai_api_key.trim()
        });
      }
      
      if (keysToSave.length === 0) {
        toast.error('Please provide at least one API key');
        return;
      }
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ api_keys: keysToSave })
      });
      
      if (response.ok) {
        toast.success('API keys saved successfully!');
        console.log('✅ API keys saved');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save API keys');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleKeyVisibility = (field: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your API keys for AI training sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* API Keys Section */}
          <div className="px-6 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">API Configuration</h2>
              <p className="text-gray-600">
                Add your API keys to enable AI-powered voice training. Your keys are encrypted and stored securely.
              </p>
            </div>

            {/* Setup Instructions */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Required for Voice Training</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>ElevenLabs API Key:</strong> For real-time voice conversations</li>
                    <li>• <strong>ElevenLabs Agent ID:</strong> Your specific AI agent configuration</li>
                    <li>• <strong>OpenAI API Key:</strong> For detailed conversation analysis</li>
                  </ul>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              {/* ElevenLabs API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ElevenLabs API Key *
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showKeys.elevenlabs_api_key ? 'text' : 'password'}
                    value={formData.elevenlabs_api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, elevenlabs_api_key: e.target.value }))}
                    className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sk_..."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => validateApiKey('elevenlabs', formData.elevenlabs_api_key)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Validate key"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('elevenlabs_api_key')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showKeys.elevenlabs_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Get your API key from <a href="https://elevenlabs.io/app/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ElevenLabs Settings</a>
                </p>
              </div>

              {/* ElevenLabs Agent ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ElevenLabs Agent ID *
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showKeys.elevenlabs_agent_id ? 'text' : 'password'}
                    value={formData.elevenlabs_agent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, elevenlabs_agent_id: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Agent ID..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('elevenlabs_agent_id')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys.elevenlabs_agent_id ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Find your Agent ID in <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Conversational AI section</a>
                </p>
              </div>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key *
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showKeys.openai_api_key ? 'text' : 'password'}
                    value={formData.openai_api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, openai_api_key: e.target.value }))}
                    className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sk-..."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => validateApiKey('openai', formData.openai_api_key)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Validate key"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('openai_api_key')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showKeys.openai_api_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI API Keys</a>
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">All API keys are encrypted and stored securely</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isValidating}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isSaving || isValidating
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSaving ? 'Saving...' : 'Save API Keys'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
