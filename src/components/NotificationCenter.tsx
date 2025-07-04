import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading notifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
    } catch (error: any) {
      toast({
        title: "Error updating notification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));

      toast({
        title: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error updating notifications",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== id));

      toast({
        title: "Notification deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting notification",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);

      toast({
        title: "All notifications cleared",
      });
    } catch (error: any) {
      toast({
        title: "Error clearing notifications",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return '✅';
      case 'message':
        return '💬';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-green-400 text-lg">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bell className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-red-600 text-white">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-black"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              onClick={clearAllNotifications}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No notifications</p>
              <p className="text-gray-500">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`bg-gray-900/50 border-gray-800 transition-colors ${
                !notification.is_read ? 'border-green-500/30 bg-green-900/10' : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl mt-1">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg flex items-center">
                        {notification.title}
                        {!notification.is_read && (
                          <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-gray-300 mt-2">{notification.content}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}