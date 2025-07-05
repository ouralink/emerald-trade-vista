import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Archive, RotateCcw, Trash2, Settings2 } from "lucide-react";

interface TradingAccount {
  id: string;
  account_name: string;
  broker: string;
  account_type: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  last_used_at: string;
}

export default function TradingAccountManager() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    account_name: '',
    broker: '',
    account_type: 'live',
    initial_balance: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, [showArchived]);

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', showArchived)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading accounts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('trading_accounts').insert({
        user_id: user.id,
        account_name: formData.account_name,
        broker: formData.broker,
        account_type: formData.account_type,
        initial_balance: parseFloat(formData.initial_balance),
        current_balance: parseFloat(formData.initial_balance),
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
      });

      setFormData({ account_name: '', broker: '', account_type: 'live', initial_balance: '' });
      setShowAddForm(false);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const archiveAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('trading_accounts')
        .update({ is_archived: true })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Account archived",
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error archiving account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unarchiveAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('trading_accounts')
        .update({ is_archived: false })
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Account restored",
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error restoring account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to permanently delete this account? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Account deleted permanently",
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const setActiveAccount = async (accountId: string) => {
    try {
      // First deactivate all accounts
      await supabase
        .from('trading_accounts')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Then activate the selected account
      const { error } = await supabase
        .from('trading_accounts')
        .update({ is_active: true, last_used_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;

      setSelectedAccount(accountId);
      toast({
        title: "Active account updated",
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error setting active account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Trading Accounts</h2>
        <div className="flex gap-2">
          <Button
            variant="outline-green"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-green-400">Add Trading Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={createAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                    placeholder="My Trading Account"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Broker</Label>
                  <Input
                    value={formData.broker}
                    onChange={(e) => setFormData({...formData, broker: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                    placeholder="MetaTrader, TD Ameritrade, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData({...formData, account_type: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="paper">Paper Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
                    className="bg-gray-800 border-gray-700"
                    placeholder="10000.00"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient">
                    Create Account
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-white">{account.account_name}</CardTitle>
                  <p className="text-gray-400 text-sm">{account.broker}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={account.account_type === 'live' ? 'default' : 'secondary'}>
                    {account.account_type}
                  </Badge>
                  {account.is_active && <Badge className="bg-green-600">Active</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Initial:</span>
                  <p className="text-white font-mono">${account.initial_balance.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Current:</span>
                  <p className="text-white font-mono">${account.current_balance.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {!showArchived && (
                  <>
                    <Button
                      size="sm"
                      variant={account.is_active ? "secondary" : "outline-green"}
                      onClick={() => setActiveAccount(account.id)}
                      disabled={account.is_active}
                    >
                      <Settings2 className="w-3 h-3 mr-1" />
                      {account.is_active ? 'Active' : 'Set Active'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black"
                      onClick={() => archiveAccount(account.id)}
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                  </>
                )}
                
                {showArchived && (
                  <>
                    <Button
                      size="sm"
                      variant="outline-green"
                      onClick={() => unarchiveAccount(account.id)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAccount(account.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="text-center py-12">
            <Settings2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              {showArchived ? 'No archived accounts' : 'No trading accounts'}
            </h3>
            <p className="text-gray-500">
              {showArchived ? 'All your accounts are active' : 'Create your first trading account to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}