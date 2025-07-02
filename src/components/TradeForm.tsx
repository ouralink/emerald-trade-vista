
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Link2, X } from "lucide-react";

const forexPairs = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD', 'EURCHF', 'AUDNZD',
  'NZDJPY', 'GBPAUD', 'GBPCAD', 'EURNZD', 'AUDCAD', 'GBPCHF', 'EURJPY',
  'CADCHF', 'CADJPY', 'AUDCHF', 'NZDCAD', 'NZDCHF'
];

interface TradeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TradeForm({ isOpen, onClose }: TradeFormProps) {
  const [formData, setFormData] = useState({
    pair: '',
    trade_type: '',
    entry_price: '',
    lot_size: '',
    stop_loss: '',
    take_profit: '',
    notes: '',
    tags: '',
  });
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        pair: formData.pair,
        trade_type: formData.trade_type as 'buy' | 'sell',
        entry_price: parseFloat(formData.entry_price),
        lot_size: parseFloat(formData.lot_size),
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        notes: formData.notes || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        screenshot_urls: screenshots.length > 0 ? screenshots : null,
      });

      if (error) throw error;

      toast({
        title: "Trade added successfully!",
        description: "Your trade has been logged in the journal.",
      });

      onClose();
      // Reset form
      setFormData({
        pair: '', trade_type: '', entry_price: '', lot_size: '',
        stop_loss: '', take_profit: '', notes: '', tags: ''
      });
      setScreenshots([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(fileName);

      setScreenshots([...screenshots, data.publicUrl]);
      toast({
        title: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addImageUrl = () => {
    if (imageUrl.trim()) {
      setScreenshots([...screenshots, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-400">Add New Trade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pair">Currency Pair</Label>
              <Select value={formData.pair} onValueChange={(value) => setFormData({...formData, pair: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select pair" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {forexPairs.map((pair) => (
                    <SelectItem key={pair} value={pair} className="text-white">
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_type">Trade Type</Label>
              <Select value={formData.trade_type} onValueChange={(value) => setFormData({...formData, trade_type: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Buy or Sell" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="buy" className="text-white">Buy</SelectItem>
                  <SelectItem value="sell" className="text-white">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_price">Entry Price</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.00001"
                placeholder="1.23456"
                value={formData.entry_price}
                onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_size">Lot Size</Label>
              <Input
                id="lot_size"
                type="number"
                step="0.01"
                placeholder="0.10"
                value={formData.lot_size}
                onChange={(e) => setFormData({...formData, lot_size: e.target.value})}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stop_loss">Stop Loss (Optional)</Label>
              <Input
                id="stop_loss"
                type="number"
                step="0.00001"
                placeholder="1.20000"
                value={formData.stop_loss}
                onChange={(e) => setFormData({...formData, stop_loss: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="take_profit">Take Profit (Optional)</Label>
              <Input
                id="take_profit"
                type="number"
                step="0.00001"
                placeholder="1.25000"
                value={formData.take_profit}
                onChange={(e) => setFormData({...formData, take_profit: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="scalp, news, breakout"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="bg-gray-800 border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Trade analysis, setup, etc."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-gray-800 border-gray-700"
              rows={3}
            />
          </div>

          {/* Screenshots Section */}
          <div className="space-y-4">
            <Label>Screenshots</Label>
            
            {/* Upload Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="border-gray-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </label>

              {/* Image URL Input */}
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Or paste image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <Button type="button" onClick={addImageUrl} variant="outline" className="border-gray-700">
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Screenshots Preview */}
            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {screenshots.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-gray-700"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeScreenshot(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-700">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
            >
              {loading ? "Adding..." : "Add Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
