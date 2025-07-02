import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, TrendingUp, MessageSquare, BarChart3, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  stats: {
    totalTrades: number;
    totalPnL: string;
    winRate: string;
  };
}

interface DashboardRequest {
  id: string;
  user_id: string;
  request_type: string;
  reason: string;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<DashboardRequest[]>([]);
  const [tradingStats, setTradingStats] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch users with stats
      const { data } = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_all_users' }
      });
      
      if (data?.users) {
        setUsers(data.users);
      }

      // Fetch trading stats
      const statsResponse = await supabase.functions.invoke('admin-dashboard', {
        body: { action: 'get_trading_stats' }
      });
      
      if (statsResponse.data) {
        setTradingStats(statsResponse.data);
      }

      // Fetch dashboard requests
      const { data: requestsData } = await supabase
        .from('dashboard_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Get usernames separately
      if (requestsData) {
        const enrichedRequests = await Promise.all(
          requestsData.map(async (req: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', req.user_id)
              .single();
            
            return {
              ...req,
              profiles: profile || { username: 'Unknown' }
            };
          })
        );
        setRequests(enrichedRequests);
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get sender and receiver names separately
      if (messagesData) {
        const enrichedMessages = await Promise.all(
          messagesData.map(async (msg: any) => {
            const [senderProfile, receiverProfile] = await Promise.all([
              supabase.from('profiles').select('username').eq('id', msg.sender_id).single(),
              supabase.from('profiles').select('username').eq('id', msg.receiver_id).single()
            ]);
            
            return {
              ...msg,
              sender: senderProfile.data || { username: 'Unknown' },
              receiver: receiverProfile.data || { username: 'Unknown' }
            };
          })
        );
        setMessages(enrichedMessages);
      }

    } catch (error: any) {
      toast({
        title: "Error loading admin data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.functions.invoke('admin-dashboard', {
        body: { 
          action: 'approve_request',
          requestId,
          adminId: user.id
        }
      });

      toast({
        title: "Request approved successfully!",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error approving request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request rejected",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error rejecting request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedUser) return;

      await supabase.functions.invoke('admin-dashboard', {
        body: {
          action: 'send_message',
          senderId: user.id,
          receiverId: selectedUser,
          subject: messageSubject,
          content: messageContent
        }
      });

      toast({
        title: "Message sent successfully!",
      });

      setSelectedUser('');
      setMessageSubject('');
      setMessageContent('');
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, requests, and platform analytics</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-green-600">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-green-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-white data-[state=active]:bg-green-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-white data-[state=active]:bg-green-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Platform Users</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage all registered users and their trading performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">Username</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Role</TableHead>
                      <TableHead className="text-gray-300">Total Trades</TableHead>
                      <TableHead className="text-gray-300">Total P&L</TableHead>
                      <TableHead className="text-gray-300">Win Rate</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-gray-800">
                        <TableCell className="text-white">{user.username || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} 
                                 className={user.role === 'admin' ? 'bg-green-600' : 'bg-gray-600'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{user.stats.totalTrades}</TableCell>
                        <TableCell className={`font-mono ${parseFloat(user.stats.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${user.stats.totalPnL}
                        </TableCell>
                        <TableCell className="text-white">{user.stats.winRate}%</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => setSelectedUser(user.id)}
                            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                          >
                            Message
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {tradingStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Most Traded Pairs (by Count)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tradingStats.mostTradedByCount?.slice(0, 5).map(([pair, stats]: [string, any]) => (
                        <div key={pair} className="flex justify-between items-center">
                          <span className="text-white">{pair}</span>
                          <span className="text-green-400">{stats.count} trades</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Largest Wins (Anonymous)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tradingStats.largestWins?.slice(0, 5).map((win: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-white">{win.pair}</span>
                          <span className="text-green-400">+${parseFloat(win.pnl).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Dashboard Access Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and approve user requests for advanced analytics access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Request Type</TableHead>
                      <TableHead className="text-gray-300">Reason</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="border-gray-800">
                        <TableCell className="text-white">{request.profiles?.username || 'Unknown'}</TableCell>
                        <TableCell className="text-gray-300">{request.request_type}</TableCell>
                        <TableCell className="text-gray-300">{request.reason}</TableCell>
                        <TableCell>
                          <Badge variant={request.status === 'pending' ? 'secondary' : 
                                        request.status === 'approved' ? 'default' : 'destructive'} 
                                 className={request.status === 'approved' ? 'bg-green-600' : 
                                           request.status === 'pending' ? 'bg-gray-600' : 'bg-red-600'}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => approveRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700 text-black"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => rejectRequest(request.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Send Message</CardTitle>
                  <CardDescription className="text-gray-400">
                    Send messages to platform users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="user-select" className="text-gray-300">Select User</Label>
                    <select
                      id="user-select"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    >
                      <option value="">Choose a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-gray-300">Subject</Label>
                    <Input
                      id="subject"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Message subject"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-gray-300">Message</Label>
                    <Textarea
                      id="content"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Your message content..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!selectedUser || !messageContent}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
                  >
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Messages</CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest platform messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-400">
                            From: {message.sender?.username || 'Unknown'} → To: {message.receiver?.username || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-white mb-1">{message.subject}</h4>
                        <p className="text-gray-300 text-sm">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}