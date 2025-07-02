import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Heart, Zap } from "lucide-react";

const moodTypes = [
  { value: 'confident', label: 'Confident', icon: '💪', color: 'text-green-400' },
  { value: 'neutral', label: 'Neutral', icon: '😐', color: 'text-gray-400' },
  { value: 'anxious', label: 'Anxious', icon: '😰', color: 'text-yellow-400' },
  { value: 'excited', label: 'Excited', icon: '🚀', color: 'text-blue-400' },
  { value: 'frustrated', label: 'Frustrated', icon: '😤', color: 'text-red-400' }
];

interface MoodPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoodPrompt({ isOpen, onClose }: MoodPromptProps) {
  const [mood, setMood] = useState('');
  const [confidence, setConfidence] = useState([5]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Auto-prompt every 2 hours
  useEffect(() => {
    const interval = setInterval(() => {
      // Only show if not already open and user is logged in
      if (!isOpen) {
        checkAndShowPrompt();
      }
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearInterval(interval);
  }, [isOpen]);

  const checkAndShowPrompt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has logged mood in last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentMood } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', twoHoursAgo)
        .limit(1);

      if (!recentMood || recentMood.length === 0) {
        // Show prompt - this would need to be handled by parent component
        console.log('Time to log mood!');
      }
    } catch (error) {
      console.error('Error checking mood:', error);
    }
  };

  const handleSubmit = async () => {
    if (!mood) {
      toast({
        title: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood: mood as any,
        confidence_level: confidence[0],
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Mood logged successfully!",
        description: "Your trading mood has been recorded.",
      });

      // Reset form
      setMood('');
      setConfidence([5]);
      setNotes('');
      onClose();
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

  const selectedMoodData = moodTypes.find(m => m.value === mood);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-400 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            How are you feeling?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center text-gray-400">
            <Brain className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p>Tracking your trading mood helps improve performance</p>
          </div>

          <div className="space-y-3">
            <Label>Current Mood</Label>
            <div className="grid grid-cols-1 gap-2">
              {moodTypes.map((moodType) => (
                <Button
                  key={moodType.value}
                  type="button"
                  variant={mood === moodType.value ? "default" : "outline"}
                  className={`justify-start h-12 ${
                    mood === moodType.value 
                      ? 'bg-green-600 text-black border-green-500' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                  onClick={() => setMood(moodType.value)}
                >
                  <span className="text-lg mr-3">{moodType.icon}</span>
                  <span className={mood === moodType.value ? 'text-black' : moodType.color}>
                    {moodType.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {mood && (
            <div className="space-y-3">
              <Label>Confidence Level: {confidence[0]}/10</Label>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="What's affecting your mood today?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-800 border-gray-700"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-gray-700"
            >
              Skip
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !mood}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
            >
              {loading ? "Saving..." : "Log Mood"}
              <Zap className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}