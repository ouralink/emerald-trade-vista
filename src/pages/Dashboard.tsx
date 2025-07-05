
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PlusCircle, BarChart3, Calendar, List, Grid3X3, LogOut, MessageSquare, User as UserIcon, Settings, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TradeForm from "@/components/TradeForm";
import TradesList from "@/components/TradesList";
import TradingMetrics from "@/components/TradingMetrics";
import TradingAccountManager from "@/components/TradingAccountManager";
import MoodTracker from "@/components/MoodTracker";
import MessageCenter from "@/components/MessageCenter";
import AdminSettings from "@/components/AdminSettings";
import MoodPrompt from "@/components/MoodPrompt";
import TradingStrategies from "@/components/TradingStrategies";
import NotificationCenter from "@/components/NotificationCenter";
import ProfileManager from "@/components/ProfileManager";
import type { User } from "@supabase/supabase-js";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'calendar'>('list');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        
        // Fetch user profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (showMessages) {
    return <MessageCenter onBack={() => setShowMessages(false)} />;
  }

  if (showAdminSettings) {
    return <AdminSettings onBack={() => setShowAdminSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                EchoNest
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowTradeForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Trade
              </Button>
              <Button 
                onClick={() => navigate('/profile')}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button 
                onClick={() => setShowMessages(true)}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Button 
                onClick={() => navigate('/analytics')}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button 
                onClick={() => navigate('/economics')}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Economics
              </Button>
              {userProfile?.role === 'admin' && (
                <>
                  <Button 
                    onClick={() => navigate('/admin')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                  <Button 
                    onClick={() => setShowAdminSettings(true)}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </>
              )}
              <Button onClick={handleSignOut} className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
          <p className="text-gray-400">Track your trades and analyze performance</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-green-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="accounts" className="text-white data-[state=active]:bg-green-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="trades" className="text-white data-[state=active]:bg-green-600">
              <List className="w-4 h-4 mr-2" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="strategies" className="text-white data-[state=active]:bg-green-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="mood" className="text-white data-[state=active]:bg-green-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Mood Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <TradingMetrics />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <TradingAccountManager />
          </TabsContent>

          <TabsContent value="trades" className="space-y-6">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-black' : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={viewMode === 'card' ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-black' : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-black' : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <TradesList viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6">
            <TradingStrategies />
          </TabsContent>

          <TabsContent value="mood" className="space-y-6">
            <MoodTracker />
          </TabsContent>
        </Tabs>
      </main>

      {/* Trade Form Modal */}
      {showTradeForm && (
        <TradeForm
          isOpen={showTradeForm}
          onClose={() => setShowTradeForm(false)}
        />
      )}
      {/* Message Center */}
      {showMessages && (
        <MessageCenter onBack={() => setShowMessages(false)} />
      )}

      {/* Admin Settings */}
      {showAdminSettings && (
        <AdminSettings onBack={() => setShowAdminSettings(false)} />
      )}

      {/* Mood Prompt */}
      <MoodPrompt 
        isOpen={showMoodPrompt}
        onClose={() => setShowMoodPrompt(false)}
      />
    </div>
  );
}
