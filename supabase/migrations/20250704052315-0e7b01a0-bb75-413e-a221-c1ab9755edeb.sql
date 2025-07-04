-- Create storage bucket for avatars (only if not exists)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- Create storage policies for avatars
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible' AND tablename = 'objects') THEN
        CREATE POLICY "Avatar images are publicly accessible" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'avatars');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar' AND tablename = 'objects') THEN
        CREATE POLICY "Users can upload their own avatar" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar' AND tablename = 'objects') THEN
        CREATE POLICY "Users can update their own avatar" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatar' AND tablename = 'objects') THEN
        CREATE POLICY "Users can delete their own avatar" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

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

-- Enable RLS on notifications if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'notifications' AND c.relrowsecurity = true) THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can view their own notifications" 
        ON public.notifications 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can update their own notifications" 
        ON public.notifications 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can create notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "System can create notifications" 
        ON public.notifications 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- Add archive functionality to trading accounts
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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