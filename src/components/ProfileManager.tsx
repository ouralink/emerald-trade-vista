
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Settings, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface TradingAccount {
  id: string;
  user_id: string;
  account_name: string;
  broker: string;
  account_type: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export default function ProfileManager() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_name: '',
    broker: '',
    account_type: 'demo',
    initial_balance: 10000
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch trading accounts
      const { data: accountsData } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setTradingAccounts(accountsData || []);
      if (accountsData && accountsData.length > 0) {
        setSelectedAccount(accountsData[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully!",
      });

      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createTradingAccount = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('trading_accounts')
        .insert({
          user_id: user.id,
          ...newAccount
        });

      if (error) throw error;

      toast({
        title: "Trading account created successfully!",
      });

      setShowAccountDialog(false);
      setNewAccount({
        account_name: '',
        broker: '',
        account_type: 'demo',
        initial_balance: 10000
      });
      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Error creating trading account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAccountMetrics = (accountId: string) => {
    // This would be calculated from trades table in real implementation
    return {
      totalTrades: 0,
      winRate: 0,
      totalPnL: 0,
      currentBalance: 10000
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile & Trading Accounts</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="profile" className="text-white data-[state=active]:bg-green-600">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="accounts" className="text-white data-[state=active]:bg-green-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trading Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, username: e.target.value} : null)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
              </div>
              <Button
                onClick={() => updateProfile({ username: profile?.username })}
                className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
              >
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Trading Accounts</h2>
            <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Trading Account</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a new trading account to track separately
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={newAccount.account_name}
                      onChange={(e) => setNewAccount(prev => ({...prev, account_name: e.target.value}))}
                      placeholder="My Main Account"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="broker">Broker</Label>
                    <Input
                      id="broker"
                      value={newAccount.broker}
                      onChange={(e) => setNewAccount(prev => ({...prev, broker: e.target.value}))}
                      placeholder="MetaTrader 4, OANDA, etc."
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select value={newAccount.account_type} onValueChange={(value) => setNewAccount(prev => ({...prev, account_type: value}))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="initial_balance">Initial Balance ($)</Label>
                    <Input
                      id="initial_balance"
                      type="number"
                      value={newAccount.initial_balance}
                      onChange={(e) => setNewAccount(prev => ({...prev, initial_balance: parseFloat(e.target.value) || 0}))}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={createTradingAccount}
                    className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
                  >
                    Create Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tradingAccounts.map((account) => {
              const metrics = getAccountMetrics(account.id);
              return (
                <Card key={account.id} className="bg-gray-900/50 border-gray-800 hover:border-green-500/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{account.account_name}</CardTitle>
                      <Badge variant={account.account_type === 'live' ? 'default' : 'secondary'} 
                             className={account.account_type === 'live' ? 'bg-green-600' : 'bg-gray-600'}>
                        {account.account_type.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">{account.broker}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Initial:</span>
                        <p className="text-white font-mono">${account.initial_balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Current:</span>
                        <p className="text-white font-mono">${metrics.currentBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Trades:</span>
                        <p className="text-white">{metrics.totalTrades}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Win Rate:</span>
                        <p className="text-white">{metrics.winRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <span className="text-gray-400 text-sm">Total P&L:</span>
                      <p className={`font-semibold ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {tradingAccounts.length === 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No trading accounts yet</h3>
                <p className="text-gray-500 mb-4">Create your first trading account to start journaling</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
