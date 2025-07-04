-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add has_analytics_access column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_analytics_access BOOLEAN DEFAULT FALSE;

-- Add message_type column to messages if it doesn't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user';

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'approval', 'message', 'system'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Make trading_account_id NOT NULL and add archive functionality
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trading strategies table
CREATE TABLE IF NOT EXISTS public.trading_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_trades INTEGER DEFAULT 0,
  avg_pnl NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0
);

-- Enable RLS on trading strategies
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies for trading strategies
CREATE POLICY "Users can manage own strategies" 
ON public.trading_strategies 
FOR ALL 
USING (auth.uid() = user_id);

-- Update trades table to ensure trading_account_id is properly linked
UPDATE public.trades SET trading_account_id = (
  SELECT id FROM public.trading_accounts 
  WHERE user_id = trades.user_id 
  AND is_active = true 
  LIMIT 1
) WHERE trading_account_id IS NULL;

-- Create function to auto-archive unused accounts
CREATE OR REPLACE FUNCTION public.auto_archive_unused_accounts()
RETURNS void AS $$
BEGIN
  UPDATE public.trading_accounts 
  SET is_archived = true 
  WHERE last_used_at < (NOW() - INTERVAL '3 months')
  AND is_archived = false;
END;
$$ LANGUAGE plpgsql;