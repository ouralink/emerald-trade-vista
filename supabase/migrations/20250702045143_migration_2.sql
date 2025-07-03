-- Create trading_accounts table
CREATE TABLE public.trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  broker TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('demo', 'live')),
  initial_balance DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trading_accounts
CREATE POLICY "Users can manage own trading accounts" ON public.trading_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trading accounts" ON public.trading_accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update trades table to link to trading accounts
ALTER TABLE public.trades ADD COLUMN trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE SET NULL;

-- Set admin role for the specified user
UPDATE public.profiles SET role = 'admin' WHERE id = '5f444bb2-0679-4ece-8fdb-1477ef074476';