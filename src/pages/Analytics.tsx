import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, BarChart3, Users, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TradingStats {
  mostTradedPairs: Array<{
    pair: string;
    count: number;
    volume: number;
  }>;
  largestWin: {
    amount: number;
    pair: string;
  };
  pairAnalytics?: {
    pair: string;
    buyPercentage: number;
    sellPercentage: number;
    totalTrades: number;
  };
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [requestPending, setRequestPending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has dashboard access or is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Also check for approved dashboard requests as a fallback
      const { data: approvedRequest } = await supabase
        .from('dashboard_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('request_type', 'analytics_dashboard')
        .eq('status', 'approved')
        .single();

      if (profile && profile.role === 'admin' || approvedRequest) {
        setHasAccess(true);
        await fetchStats();
      } else {
        // Check if request is pending
        const { data: pendingRequest } = await supabase
          .from('dashboard_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('request_type', 'analytics_dashboard')
          .eq('status', 'pending')
          .single();

        if (pendingRequest) {
          setRequestPending(true);
        }
      }
    } catch (error: any) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('dashboard_requests')
        .insert({
          user_id: user.id,
          request_type: 'analytics_dashboard',
          reason: 'Requesting access to advanced trading analytics dashboard'
        });

      if (error) throw error;

      // Send message to admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .single();
      
      if (adminProfile) {
        await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: adminProfile.id,
            content: 'User is requesting access to the advanced analytics dashboard',
            subject: 'Analytics Dashboard Access Request',
            message_type: 'system'
          });
      }

      setRequestPending(true);
      toast({
        title: "Request sent!",
        description: "Your request for analytics access has been sent to the admin.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch most traded pairs by count
      const { data: pairCounts } = await supabase
        .from('trades')
        .select('pair, lot_size')
        .not('pair', 'is', null);

      // Process data for most traded pairs
      const pairStats = new Map();
      pairCounts?.forEach(trade => {
        const existing = pairStats.get(trade.pair) || { count: 0, volume: 0 };
        pairStats.set(trade.pair, {
          count: existing.count + 1,
          volume: existing.volume + trade.lot_size
        });
      });

      const mostTradedPairs = Array.from(pairStats.entries())
        .map(([pair, stats]) => ({ pair, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Fetch largest win
      const { data: largestWinData } = await supabase
        .from('trades')
        .select('pnl, pair')
        .not('pnl', 'is', null)
        .order('pnl', { ascending: false })
        .limit(1);

      const largestWin = largestWinData?.[0] ? {
        amount: largestWinData[0].pnl,
        pair: largestWinData[0].pair
      } : { amount: 0, pair: '' };

      setStats({
        mostTradedPairs,
        largestWin
      });
    } catch (error: any) {
      toast({
        title: "Error loading stats",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPairAnalytics = async (pair: string) => {
    try {
      const { data: pairTrades } = await supabase
        .from('trades')
        .select('trade_type')
        .eq('pair', pair);

      if (pairTrades && pairTrades.length > 0) {
        const buyTrades = pairTrades.filter(t => t.trade_type === 'buy').length;
        const sellTrades = pairTrades.filter(t => t.trade_type === 'sell').length;
        const totalTrades = pairTrades.length;

        setStats(prev => prev ? {
          ...prev,
          pairAnalytics: {
            pair,
            buyPercentage: (buyTrades / totalTrades) * 100,
            sellPercentage: (sellTrades / totalTrades) * 100,
            totalTrades
          }
        } : null);
      }
    } catch (error: any) {
      toast({
        title: "Error loading pair analytics",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {!hasAccess ? (
          <Card className="bg-gray-900 border-gray-800 text-center py-12">
            <CardContent>
              <BarChart3 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Advanced Analytics Dashboard</h2>
              {requestPending ? (
                <div>
                  <p className="text-gray-400 mb-4">Your request is pending admin approval.</p>
                  <p className="text-sm text-gray-500">You'll be notified when access is granted.</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-6">
                    Access advanced trading analytics including community insights, 
                    pair analysis, and performance benchmarks.
                  </p>
                  <Button 
                    onClick={requestAccess}
                    className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
                  >
                    Request Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Trading Analytics</h1>
              <p className="text-gray-400">Community insights and trading statistics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Traded Pairs */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Most Traded Pairs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.mostTradedPairs.map((pair, index) => (
                      <div key={pair.pair} className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <div className="flex items-center">
                          <span className="text-green-400 font-bold mr-3">#{index + 1}</span>
                          <span className="text-white font-medium">{pair.pair}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-white">{pair.count} trades</div>
                          <div className="text-gray-400">{pair.volume.toFixed(2)} lots</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Largest Win */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Coins className="w-5 h-5 mr-2 text-green-400" />
                    Largest Win (Anonymous)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      ${stats?.largestWin.amount.toFixed(2)}
                    </div>
                    <div className="text-gray-400">
                      on {stats?.largestWin.pair}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pair Analysis */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-400" />
                  Pair Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <select
                    value={selectedPair}
                    onChange={(e) => {
                      setSelectedPair(e.target.value);
                      fetchPairAnalytics(e.target.value);
                    }}
                    className="bg-gray-800 border-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="">Select a pair</option>
                    {stats?.mostTradedPairs.map(pair => (
                      <option key={pair.pair} value={pair.pair}>{pair.pair}</option>
                    ))}
                  </select>
                </div>

                {stats?.pairAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 p-4 rounded text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {stats.pairAnalytics.buyPercentage.toFixed(1)}%
                      </div>
                      <div className="text-gray-400">Buy Orders</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {stats.pairAnalytics.sellPercentage.toFixed(1)}%
                      </div>
                      <div className="text-gray-400">Sell Orders</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded text-center">
                      <div className="text-2xl font-bold text-white">
                        {stats.pairAnalytics.totalTrades}
                      </div>
                      <div className="text-gray-400">Total Trades</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
