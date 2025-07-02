
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, BarChart3 } from "lucide-react";

interface MetricsData {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  biggestWin: number;
  biggestLoss: number;
}

export default function TradingMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalTrades: 0,
    openTrades: 0,
    closedTrades: 0,
    totalPnL: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    biggestWin: 0,
    biggestLoss: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (trades && trades.length > 0) {
        const closedTrades = trades.filter(t => t.status === 'closed');
        const openTrades = trades.filter(t => t.status === 'open');
        
        const pnlValues = closedTrades
          .filter(t => t.pnl !== null)
          .map(t => t.pnl as number);
        
        const winningTrades = pnlValues.filter(pnl => pnl > 0);
        const losingTrades = pnlValues.filter(pnl => pnl < 0);
        
        const totalPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
        const winRate = pnlValues.length > 0 ? (winningTrades.length / pnlValues.length) * 100 : 0;
        
        const avgWin = winningTrades.length > 0 
          ? winningTrades.reduce((sum, pnl) => sum + pnl, 0) / winningTrades.length 
          : 0;
        
        const avgLoss = losingTrades.length > 0 
          ? losingTrades.reduce((sum, pnl) => sum + pnl, 0) / losingTrades.length 
          : 0;

        setMetrics({
          totalTrades: trades.length,
          openTrades: openTrades.length,
          closedTrades: closedTrades.length,
          totalPnL,
          winRate,
          avgWin,
          avgLoss,
          biggestWin: pnlValues.length > 0 ? Math.max(...pnlValues) : 0,
          biggestLoss: pnlValues.length > 0 ? Math.min(...pnlValues) : 0,
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading metrics...</div>;
  }

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    format = 'number' 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    trend?: 'positive' | 'negative' | 'neutral';
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `$${val.toFixed(2)}`;
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toString();
      }
    };

    const getTrendColor = () => {
      if (trend === 'positive') return 'text-green-400';
      if (trend === 'negative') return 'text-red-400';
      return 'text-white';
    };

    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">{title}</p>
              <p className={`text-2xl font-bold ${getTrendColor()}`}>
                {formatValue(value)}
              </p>
            </div>
            <Icon className="w-8 h-8 text-gray-500" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Trades"
          value={metrics.totalTrades}
          icon={BarChart3}
          trend="neutral"
        />
        <MetricCard
          title="Open Positions"
          value={metrics.openTrades}
          icon={Target}
          trend="neutral"
        />
        <MetricCard
          title="Total P&L"
          value={metrics.totalPnL}
          icon={DollarSign}
          trend={metrics.totalPnL >= 0 ? 'positive' : 'negative'}
          format="currency"
        />
        <MetricCard
          title="Win Rate"
          value={metrics.winRate}
          icon={Percent}
          trend={metrics.winRate >= 50 ? 'positive' : 'negative'}
          format="percentage"
        />
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Win"
          value={metrics.avgWin}
          icon={TrendingUp}
          trend="positive"
          format="currency"
        />
        <MetricCard
          title="Average Loss"
          value={Math.abs(metrics.avgLoss)}
          icon={TrendingDown}
          trend="negative"
          format="currency"
        />
        <MetricCard
          title="Biggest Win"
          value={metrics.biggestWin}
          icon={TrendingUp}
          trend="positive"
          format="currency"
        />
        <MetricCard
          title="Biggest Loss"
          value={Math.abs(metrics.biggestLoss)}
          icon={TrendingDown}
          trend="negative"
          format="currency"
        />
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Performance Chart</CardTitle>
          <CardDescription className="text-gray-400">
            Equity curve and trade performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <p>Performance chart coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
