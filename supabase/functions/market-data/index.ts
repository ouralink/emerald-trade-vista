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

    // Fetch API keys from the database
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('key_type, api_key');

    if (apiKeyError) throw apiKeyError;

    const twelveDataKey = apiKeys.find(k => k.key_type === 'twelve_data')?.api_key;
    const fredApiKey = apiKeys.find(k => k.key_type === 'fred')?.api_key;
    const newsApiKey = apiKeys.find(k => k.key_type === 'news_api')?.api_key;

    const { action, data } = await req.json();

    let response;
    switch (action) {
      case 'update_trades_pnl':
        response = await updateTradesPnL(twelveDataKey, supabase);
        break;
      case 'get_economic_data':
        response = await getEconomicData(fredApiKey, data.indicators);
        break;
      case 'get_forex_news':
        response = await getForexNews(newsApiKey);
        break;
      case 'get_live_price':
        response = await getLivePrice(twelveDataKey, data.symbol);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateTradesPnL(apiKey: string | undefined, supabase: any) {
  if (!apiKey) throw new Error('TwelveData API key not configured');

  // Get all open trades
  const { data: openTrades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('status', 'open');

  if (error) throw error;

  const updates = [];
  
  for (const trade of openTrades) {
    try {
      const currentPrice = await getLivePrice(apiKey, trade.pair);
      const entryPrice = parseFloat(trade.entry_price);
      const lotSize = parseFloat(trade.lot_size);
      
      let pnl;
      if (trade.trade_type === 'buy') {
        pnl = (currentPrice.price - entryPrice) * lotSize * 100000; // Standard lot calculation
      } else {
        pnl = (entryPrice - currentPrice.price) * lotSize * 100000;
      }

      updates.push({
        id: trade.id,
        pnl: pnl.toFixed(2)
      });
    } catch (error) {
      console.error(`Error updating trade ${trade.id}:`, error);
    }
  }

  // Batch update trades
  for (const update of updates) {
    await supabase
      .from('trades')
      .update({ pnl: update.pnl })
      .eq('id', update.id);
  }

  return { updated: updates.length };
}

async function getLivePrice(apiKey: string, symbol: string) {
  const response = await fetch(
    `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch price data');
  }
  
  const data = await response.json();
  return { price: parseFloat(data.price), symbol };
}

async function getEconomicData(apiKey: string | undefined, indicators: string[]) {
  if (!apiKey) throw new Error('FRED API key not configured');

  const results = [];
  
  for (const indicator of indicators) {
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator}&api_key=${apiKey}&file_type=json&limit=10&sort_order=desc`
      );
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          indicator,
          data: data.observations
        });
      }
    } catch (error) {
      console.error(`Error fetching ${indicator}:`, error);
    }
  }

  return { economicData: results };
}

async function getForexNews(apiKey: string | undefined) {
  if (!apiKey) throw new Error('News API key not configured');

  const response = await fetch(
    `https://newsapi.org/v2/everything?q=forex+trading+economic&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch news data');
  }
  
  const data = await response.json();
  return { news: data.articles };
}
