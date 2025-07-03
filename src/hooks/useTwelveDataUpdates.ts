import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTwelveDataUpdates = () => {
  const { toast } = useToast();

  useEffect(() => {
    const updateTrades = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-data', {
          body: { action: 'update_trades_pnl' }
        });

        if (error) throw error;

        console.log(`Updated ${data.updated} trades with latest prices`);
      } catch (error: any) {
        console.error('Error updating trades:', error);
        // Only show error if it's not an API key issue
        if (!error.message?.includes('API key')) {
          toast({
            title: "Update Error",
            description: "Unable to update trade prices. Check your internet connection.",
            variant: "destructive",
          });
        }
      }
    };

    // Update immediately on mount
    updateTrades();

    // Set up interval to update every hour (3600000 ms)
    const interval = setInterval(updateTrades, 3600000);

    return () => clearInterval(interval);
  }, [toast]);
};