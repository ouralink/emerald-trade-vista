
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Trade {
  id: string;
  pair: string;
  trade_type: 'buy' | 'sell';
  entry_price: number;
  exit_price?: number;
  lot_size: number;
  stop_loss?: number;
  take_profit?: number;
  status: 'open' | 'closed';
  pnl?: number;
  notes?: string;
  tags?: string[];
  screenshot_urls?: string[];
  opened_at: string;
  closed_at?: string;
}

interface TradesListProps {
  viewMode: 'list' | 'card' | 'calendar';
}

export default function TradesList({ viewMode }: TradesListProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading trades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeTrade = async (tradeId: string, exitPrice: number) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      // Calculate P&L
      const pnl = trade.trade_type === 'buy' 
        ? (exitPrice - trade.entry_price) * trade.lot_size * 100000
        : (trade.entry_price - exitPrice) * trade.lot_size * 100000;

      const { error } = await supabase
        .from('trades')
        .update({
          exit_price: exitPrice,
          pnl: pnl,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade closed successfully!",
        description: `P&L: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}`,
      });

      fetchTrades();
    } catch (error: any) {
      toast({
        title: "Error closing trade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading trades...</div>;
  }

  if (trades.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No trades yet</h3>
          <p className="text-gray-500">Start by adding your first trade</p>
        </CardContent>
      </Card>
    );
  }

  const TradeCard = ({ trade }: { trade: Trade }) => (
    <Card className="bg-gray-900/50 border-gray-800 hover:border-green-500/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-white">{trade.pair}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}
                className={trade.trade_type === 'buy' ? 'bg-green-600' : 'bg-red-600'}
              >
                {trade.trade_type.toUpperCase()}
              </Badge>
              <Badge 
                variant={trade.status === 'open' ? 'outline' : 'secondary'}
                className={trade.status === 'open' ? 'border-yellow-500 text-yellow-400' : 'bg-gray-600'}
              >
                {trade.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          {trade.status === 'open' && (
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                const exitPrice = prompt('Enter exit price:');
                if (exitPrice) closeTrade(trade.id, parseFloat(exitPrice));
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Entry:</span>
            <p className="text-white font-mono">{trade.entry_price}</p>
          </div>
          {trade.exit_price && (
            <div>
              <span className="text-gray-400">Exit:</span>
              <p className="text-white font-mono">{trade.exit_price}</p>
            </div>
          )}
          <div>
            <span className="text-gray-400">Lot Size:</span>
            <p className="text-white">{trade.lot_size}</p>
          </div>
          {trade.pnl !== null && trade.pnl !== undefined && (
            <div>
              <span className="text-gray-400">P&L:</span>
              <p className={`font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {trade.tags && trade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trade.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {trade.notes && (
          <p className="text-gray-400 text-sm">{trade.notes}</p>
        )}

        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          {format(new Date(trade.opened_at), 'MMM d, yyyy HH:mm')}
          {trade.status === 'open' && (
            <>
              <Clock className="w-3 h-3 ml-3 mr-1" />
              Open
            </>
          )}
        </div>

        {trade.screenshot_urls && trade.screenshot_urls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {trade.screenshot_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Trade screenshot ${index + 1}`}
                className="w-full h-16 object-cover rounded border border-gray-700"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>
    );
  }

  if (viewMode === 'calendar') {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p>Calendar view coming soon...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <TradeCard key={trade.id} trade={trade} />
      ))}
    </div>
  );
}
