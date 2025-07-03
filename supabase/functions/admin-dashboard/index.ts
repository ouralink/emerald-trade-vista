import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error('Unauthorized');
    }

    const { action, data } = await req.json();

    let response;
    switch (action) {
      case 'get_all_users':
        response = await getAllUsers(supabase);
        break;
      case 'get_trading_stats':
        response = await getTradingStats(supabase);
        break;
      case 'get_pair_analytics':
        response = await getPairAnalytics(supabase, data.pair);
        break;
      case 'send_message':
        response = await sendMessage(supabase, data);
        break;
      case 'approve_request':
        response = await approveRequest(supabase, data.requestId, data.adminId);
        break;
      case 'reject_request':
        response = await rejectRequest(supabase, data.requestId, data.adminId);
        break;
      case 'save_api_keys':
        response = await saveApiKeys(supabase, data.keys);
        break;
      case 'save_api_key':
        response = await saveApiKey(supabase, data.key_type, data.api_key);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-dashboard function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAllUsers(supabase: any) {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get user stats
  const usersWithStats = await Promise.all(
    users.map(async (user: any) => {
      const { data: trades } = await supabase
        .from('trades')
        .select('pnl, status')
        .eq('user_id', user.id);

      const totalTrades = trades?.length || 0;
      const totalPnL = trades?.reduce((sum: number, trade: any) => sum + (parseFloat(trade.pnl) || 0), 0) || 0;
      const winningTrades = trades?.filter((trade: any) => parseFloat(trade.pnl) > 0).length || 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      return {
        ...user,
        stats: {
          totalTrades,
          totalPnL: totalPnL.toFixed(2),
          winRate: winRate.toFixed(1)
        }
      };
    })
  );

  return { users: usersWithStats };
}

async function getTradingStats(supabase: any) {
  // Most traded pairs by volume
  const { data: pairVolume } = await supabase
    .from('trades')
    .select('pair, lot_size')
    .eq('status', 'closed');

  const pairStats = pairVolume?.reduce((acc: any, trade: any) => {
    const pair = trade.pair;
    const volume = parseFloat(trade.lot_size) || 0;
    
    if (!acc[pair]) {
      acc[pair] = { count: 0, volume: 0 };
    }
    acc[pair].count += 1;
    acc[pair].volume += volume;
    
    return acc;
  }, {}) || {};

  const mostTradedByCount = Object.entries(pairStats)
    .sort(([,a]: any, [,b]: any) => b.count - a.count)
    .slice(0, 10);

  const mostTradedByVolume = Object.entries(pairStats)
    .sort(([,a]: any, [,b]: any) => b.volume - a.volume)
    .slice(0, 10);

  // Largest wins (anonymous)
  const { data: largestWins } = await supabase
    .from('trades')
    .select('pnl, pair, created_at')
    .gt('pnl', 0)
    .order('pnl', { ascending: false })
    .limit(10);

  return {
    mostTradedByCount,
    mostTradedByVolume,
    largestWins: largestWins?.map((trade: any) => ({
      pnl: trade.pnl,
      pair: trade.pair,
      date: trade.created_at
    })) || []
  };
}

async function getPairAnalytics(supabase: any, pair: string) {
  const { data: trades } = await supabase
    .from('trades')
    .select('trade_type, pnl, status')
    .eq('pair', pair)
    .eq('status', 'closed');

  if (!trades || trades.length === 0) {
    return { 
      pair,
      buyPercentage: 0,
      sellPercentage: 0,
      totalTrades: 0,
      avgPnL: 0
    };
  }

  const buyTrades = trades.filter((trade: any) => trade.trade_type === 'buy').length;
  const sellTrades = trades.filter((trade: any) => trade.trade_type === 'sell').length;
  const totalTrades = trades.length;
  
  const buyPercentage = totalTrades > 0 ? (buyTrades / totalTrades) * 100 : 0;
  const sellPercentage = totalTrades > 0 ? (sellTrades / totalTrades) * 100 : 0;
  
  const avgPnL = trades.reduce((sum: number, trade: any) => sum + (parseFloat(trade.pnl) || 0), 0) / totalTrades;

  return {
    pair,
    buyPercentage: buyPercentage.toFixed(1),
    sellPercentage: sellPercentage.toFixed(1),
    totalTrades,
    avgPnL: avgPnL.toFixed(2)
  };
}

async function sendMessage(supabase: any, messageData: any) {
  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: messageData.senderId,
      receiver_id: messageData.receiverId,
      subject: messageData.subject,
      content: messageData.content
    });

  if (error) throw error;
  return { success: true };
}

async function rejectRequest(supabase: any, requestId: string, adminId: string) {
  // Get the request to find the user_id
  const { data: request, error: requestError } = await supabase
    .from('dashboard_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  if (requestError) throw requestError;

  // Update the request status
  const { error } = await supabase
    .from('dashboard_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (error) throw error;

  // Send notification to user
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      sender_id: adminId,
      receiver_id: request.user_id,
      subject: 'Analytics Dashboard Access Rejected',
      content: 'Your request for analytics dashboard access has been rejected. Please contact support for more information.',
      message_type: 'system'
    });

  if (messageError) throw messageError;

  return { success: true };
}

async function saveApiKeys(supabase: any, keys: any[]) {
  console.log('Saving API keys:', keys);
  // Save API keys to a secure table or update environment variables
  const { error } = await supabase
    .from('api_keys')
    .upsert(keys.map(key => ({
      key_type: key.key_type,
      api_key: key.api_key,
      updated_at: new Date().toISOString()
    })), { onConflict: 'key_type' });

  if (error) {
    console.error('Error saving API keys:', error);
    throw error;
  }
  return { success: true };
}

async function saveApiKey(supabase: any, keyType: string, apiKey: string) {
  console.log('Saving API key:', { keyType, apiKey });
  // Save API key to a secure table or update environment variables
  const { error } = await supabase
    .from('api_keys')
    .upsert({
      key_type: keyType,
      api_key: apiKey,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key_type' });

  if (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
  return { success: true };
}

async function approveRequest(supabase: any, requestId: string, adminId: string) {
  // Get the request to find the user_id
  const { data: request, error: requestError } = await supabase
    .from('dashboard_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  if (requestError) throw requestError;

  // Update the request status
  const { error } = await supabase
    .from('dashboard_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (error) throw error;

  // Grant analytics dashboard access to the user
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ has_analytics_access: true })
    .eq('id', request.user_id);

  if (profileError) throw profileError;

  // Send notification to user
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      sender_id: adminId,
      receiver_id: request.user_id,
      subject: 'Analytics Dashboard Access Approved',
      content: 'Your request for analytics dashboard access has been approved. You can now access advanced analytics features.',
      message_type: 'system'
    });

  if (messageError) throw messageError;

  return { success: true };
}
