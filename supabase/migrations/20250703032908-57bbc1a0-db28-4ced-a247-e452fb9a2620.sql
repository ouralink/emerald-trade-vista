-- Handle existing tables gracefully and ensure all functionality is working

-- Update trades table to add trading_account_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'trading_account_id') THEN
        ALTER TABLE public.trades ADD COLUMN trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure admin role is set for the specified user
UPDATE public.profiles SET role = 'admin' WHERE id = '5f444bb2-0679-4ece-8fdb-1477ef074476';

-- Ensure RLS policies exist for trading_accounts (recreate if missing)
DROP POLICY IF EXISTS "Users can manage own trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Admins can view all trading accounts" ON public.trading_accounts;

CREATE POLICY "Users can manage own trading accounts" ON public.trading_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trading accounts" ON public.trading_accounts
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Ensure RLS policies exist for dashboard_access (recreate if missing)
DROP POLICY IF EXISTS "Users can view own access status" ON public.dashboard_access;
DROP POLICY IF EXISTS "Users can request access" ON public.dashboard_access;
DROP POLICY IF EXISTS "Admins can manage all access" ON public.dashboard_access;

CREATE POLICY "Users can view own access status" ON public.dashboard_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request access" ON public.dashboard_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all access" ON public.dashboard_access
  FOR ALL USING (public.get_current_user_role() = 'admin');