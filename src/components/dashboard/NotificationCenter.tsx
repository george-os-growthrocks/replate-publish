import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCircle, AlertTriangle, Info, TrendingUp, TrendingDown, Eye, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFilters } from '@/contexts/FilterContext';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'ranking_up' | 'ranking_down';
  created_at: string;
  read: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedProperty } = useFilters();

  useEffect(() => {
    if (selectedProperty) {
      loadNotifications();
    }
  }, [selectedProperty]);

  const loadNotifications = async () => {
    if (!selectedProperty) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch GSC data for last 7 days and previous 7 days for comparison
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);

      const { data: currentData } = await supabase.functions.invoke('gsc-query', {
        body: {
          siteUrl: selectedProperty,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
        },
      });

      const { data: prevData } = await supabase.functions.invoke('gsc-query', {
        body: {
          siteUrl: selectedProperty,
          startDate: prevStartDate.toISOString().split('T')[0],
          endDate: startDate.toISOString().split('T')[0],
          dimensions: ['query'],
        },
      });

      const generatedNotifications: Notification[] = [];

      if (currentData?.rows && prevData?.rows) {
        // Detect ranking improvements
        currentData.rows.slice(0, 20).forEach((current: any) => {
          const prev = prevData.rows.find((p: any) => p.keys[0] === current.keys[0]);
          if (prev && prev.position - current.position >= 3) {
            generatedNotifications.push({
              id: `rank_up_${current.keys[0]}`,
              title: 'Ranking Improved! 📈',
              message: `"${current.keys[0]}" moved from position ${Math.round(prev.position)} to ${Math.round(current.position)}`,
              type: 'ranking_up',
              created_at: new Date().toISOString(),
              read: false,
            });
          }
        });

        // Detect ranking drops
        currentData.rows.slice(0, 20).forEach((current: any) => {
          const prev = prevData.rows.find((p: any) => p.keys[0] === current.keys[0]);
          if (prev && current.position - prev.position >= 3) {
            generatedNotifications.push({
              id: `rank_down_${current.keys[0]}`,
              title: 'Position Drop Alert',
              message: `"${current.keys[0]}" dropped from position ${Math.round(prev.position)} to ${Math.round(current.position)}`,
              type: 'ranking_down',
              created_at: new Date().toISOString(),
              read: false,
            });
          }
        });

        // Detect high CTR opportunities
        currentData.rows.slice(0, 10).forEach((row: any) => {
          const avgCtr = currentData.rows.reduce((sum: number, r: any) => sum + r.ctr, 0) / currentData.rows.length;
          if (row.impressions > 100 && row.ctr < avgCtr * 0.5) {
            generatedNotifications.push({
              id: `ctr_opp_${row.keys[0]}`,
              title: 'CTR Opportunity',
              message: `"${row.keys[0]}" has ${row.impressions.toLocaleString()} impressions but low CTR (${(row.ctr * 100).toFixed(1)}%)`,
              type: 'info',
              created_at: new Date().toISOString(),
              read: false,
            });
          }
        });
      }

      // Sort by created_at
      generatedNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(generatedNotifications.slice(0, 10));
      setUnreadCount(generatedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'ranking_up':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'ranking_down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
      case 'ranking_up':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'ranking_down':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-80 md:w-96 max-h-[500px] shadow-xl z-50 bg-popover/95 backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                      Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="h-[400px]">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                    <p className="text-xs text-muted-foreground mt-1">We'll notify you of important changes</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-accent/50 transition-colors ${
                          !notification.read ? 'bg-accent/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>

                            <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold truncate text-foreground">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(notification.created_at)}
                              </span>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </>
      )}
    </div>
  );
}

