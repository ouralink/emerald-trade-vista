import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Save } from "lucide-react";

interface AdminSettingsProps {
  onBack: () => void;
}

interface APIKeys {
  TWELVEDATA_API_KEY: string;
  GROQ_API_KEY: string;
  FRED_API_KEY: string;
  NEWS_API_KEY: string;
}

export default function AdminSettings({ onBack }: AdminSettingsProps) {
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    TWELVEDATA_API_KEY: '',
    GROQ_API_KEY: '',
    FRED_API_KEY: '',
    NEWS_API_KEY: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const formattedKeys = Object.entries(apiKeys).map(([key, value]) => {
        let key_type = '';
        switch (key) {
          case 'TWELVEDATA_API_KEY':
            key_type = 'twelve_data';
            break;
          case 'GROQ_API_KEY':
            key_type = 'groq';
            break;
          case 'FRED_API_KEY':
            key_type = 'fred';
            break;
          case 'NEWS_API_KEY':
            key_type = 'news_api';
            break;
        }
        return { key_type, api_key: value };
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      await fetch('/api/functions/v1/api-key-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ keys: formattedKeys })
      });

      toast({
        title: "API Keys Updated",
        description: "All API keys have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API keys.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyChange = (key: keyof APIKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={onBack}
            variant="outline" 
            className="border-gray-700 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-green-400" />
            <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-green-400">API Configuration</CardTitle>
            <CardDescription className="text-gray-400">
              Configure API keys for external services. Keep these secure and never share them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="twelvedata">TwelveData API Key</Label>
                <Input
                  id="twelvedata"
                  type="password"
                  placeholder="Enter TwelveData API key for market data"
                  value={apiKeys.TWELVEDATA_API_KEY}
                  onChange={(e) => handleKeyChange('TWELVEDATA_API_KEY', e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-500">
                  Used for real-time forex, stock, and crypto data. Get your key at{' '}
                  <a href="https://twelvedata.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                    twelvedata.com
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groq">Groq API Key</Label>
                <Input
                  id="groq"
                  type="password"
                  placeholder="Enter Groq API key for AI functions"
                  value={apiKeys.GROQ_API_KEY}
                  onChange={(e) => handleKeyChange('GROQ_API_KEY', e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-500">
                  Used for AI trade predictions and analysis. Get your key at{' '}
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                    console.groq.com
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fred">FRED API Key</Label>
                <Input
                  id="fred"
                  type="password"
                  placeholder="Enter FRED API key for economic data"
                  value={apiKeys.FRED_API_KEY}
                  onChange={(e) => handleKeyChange('FRED_API_KEY', e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-500">
                  Used for economic indicators and Federal Reserve data. Get your key at{' '}
                  <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                    FRED API
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="news">News API Key</Label>
                <Input
                  id="news"
                  type="password"
                  placeholder="Enter News API key for financial news"
                  value={apiKeys.NEWS_API_KEY}
                  onChange={(e) => handleKeyChange('NEWS_API_KEY', e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-500">
                  Used for financial and economic news feeds. Get your key at{' '}
                  <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                    newsapi.org
                  </a>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800">
              <Button 
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 mt-6">
          <CardHeader>
            <CardTitle className="text-green-400">Security Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">
                <strong>Important:</strong> These API keys are sensitive information. They are stored securely 
                and only accessible by admin users. Never share these keys or commit them to version control.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
