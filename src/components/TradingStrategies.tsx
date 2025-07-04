import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Target, TrendingUp } from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: string[];
  is_active: boolean;
  total_trades: number;
  avg_pnl: number;
  win_rate: number;
  created_at: string;
}

export default function TradingStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: ''
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trading_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading strategies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStrategy = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rulesArray = formData.rules.split('\n').filter(rule => rule.trim());
      
      const strategyData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        rules: rulesArray,
      };

      let error;
      if (editingStrategy) {
        ({ error } = await supabase
          .from('trading_strategies')
          .update(strategyData)
          .eq('id', editingStrategy.id));
      } else {
        ({ error } = await supabase
          .from('trading_strategies')
          .insert(strategyData));
      }

      if (error) throw error;

      toast({
        title: editingStrategy ? "Strategy updated!" : "Strategy created!",
      });

      setShowForm(false);
      setEditingStrategy(null);
      setFormData({ name: '', description: '', rules: '' });
      fetchStrategies();
    } catch (error: any) {
      toast({
        title: "Error saving strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteStrategy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trading_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Strategy deleted",
      });

      fetchStrategies();
    } catch (error: any) {
      toast({
        title: "Error deleting strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleStrategyStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('trading_strategies')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Strategy ${!isActive ? 'activated' : 'deactivated'}`,
      });

      fetchStrategies();
    } catch (error: any) {
      toast({
        title: "Error updating strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description || '',
      rules: strategy.rules.join('\n')
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-green-400 text-lg">Loading strategies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Trading Strategies</h2>
          <p className="text-gray-400">Create and manage your trading strategies</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500">
              <Plus className="w-4 h-4 mr-2" />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-400">
                {editingStrategy ? 'Edit Strategy' : 'Create Strategy'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Strategy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Trend Following"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your strategy..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="rules">Rules (one per line)</Label>
                <Textarea
                  id="rules"
                  placeholder="Only trade during London session&#10;Risk max 2% per trade&#10;Take profit at 1:2 RR"
                  value={formData.rules}
                  onChange={(e) => setFormData({...formData, rules: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                  rows={5}
                />
              </div>
              <Button 
                onClick={saveStrategy}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
              >
                {editingStrategy ? 'Update Strategy' : 'Create Strategy'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-400" />
                    {strategy.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    {strategy.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={strategy.is_active ? 'default' : 'secondary'}
                  className={strategy.is_active ? 'bg-green-600' : 'bg-gray-600'}
                >
                  {strategy.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategy.rules.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Rules:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {strategy.rules.slice(0, 3).map((rule, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {rule}
                        </li>
                      ))}
                      {strategy.rules.length > 3 && (
                        <li className="text-gray-500">+{strategy.rules.length - 3} more rules</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm text-gray-400">Trades</div>
                    <div className="text-white font-semibold">{strategy.total_trades}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Avg P&L</div>
                    <div className={`font-semibold ${strategy.avg_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${strategy.avg_pnl.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                    <div className="text-white font-semibold">{strategy.win_rate.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => startEdit(strategy)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => toggleStrategyStatus(strategy.id, strategy.is_active)}
                    className={`flex-1 ${strategy.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {strategy.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => deleteStrategy(strategy.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {strategies.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No strategies yet</p>
            <p className="text-gray-500 mb-4">Create your first trading strategy to get started</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}