import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ API key not configured');
    }

    const { action, data } = await req.json();

    let response;
    switch (action) {
      case 'predict_trade':
        response = await predictTrade(groqApiKey, data);
        break;
      case 'analyze_mood':
        response = await analyzeMood(groqApiKey, data);
        break;
      case 'generate_strategy':
        response = await generateStrategy(groqApiKey, data);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in groq-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function predictTrade(apiKey: string, tradeData: any) {
  const prompt = `Analyze this forex trade and predict the probability of success:
  
  Pair: ${tradeData.pair}
  Type: ${tradeData.tradeType}
  Entry Price: ${tradeData.entryPrice}
  Stop Loss: ${tradeData.stopLoss}
  Take Profit: ${tradeData.takeProfit}
  Market Context: ${tradeData.marketContext || 'Not provided'}
  
  Provide a JSON response with:
  - winProbability (0-100)
  - confidence (low/medium/high)
  - factors (array of key factors affecting the prediction)
  - advice (brief trading advice)`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are an expert forex trading analyst. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      winProbability: 50,
      confidence: 'medium',
      factors: ['Market analysis needed'],
      advice: 'Consider market conditions before trading'
    };
  }
}

async function analyzeMood(apiKey: string, moodData: any) {
  const prompt = `Analyze trading mood patterns and provide insights:
  
  Recent Moods: ${moodData.recentMoods?.join(', ') || 'Not provided'}
  Current Mood: ${moodData.currentMood}
  Trading Performance: ${moodData.performance || 'Not provided'}
  
  Provide insights on how mood affects trading and recommendations.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are a trading psychology expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
    }),
  });

  const result = await response.json();
  return { analysis: result.choices[0].message.content };
}

async function generateStrategy(apiKey: string, strategyData: any) {
  const prompt = `Generate a forex trading strategy based on:
  
  Preferred Pairs: ${strategyData.pairs?.join(', ') || 'Major pairs'}
  Risk Tolerance: ${strategyData.riskTolerance || 'Medium'}
  Trading Style: ${strategyData.tradingStyle || 'Swing trading'}
  Experience Level: ${strategyData.experience || 'Intermediate'}
  
  Provide a detailed strategy with entry/exit rules, risk management, and timeframes.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are an expert forex strategy developer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
    }),
  });

  const result = await response.json();
  return { strategy: result.choices[0].message.content };
}