
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, Heart, Zap } from "lucide-react";

const moodOptions = [
  { value: 'confident', label: 'Confident', icon: Smile, color: 'text-green-400' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-400' },
  { value: 'anxious', label: 'Anxious', icon: Frown, color: 'text-yellow-400' },
  { value: 'excited', label: 'Excited', icon: Zap, color: 'text-blue-400' },
  { value: 'frustrated', label: 'Frustrated', icon: Heart, color: 'text-red-400' },
];

interface MoodEntry {
  id: string;
  mood: string;
  confidence_level: number;
  notes: string;
  created_at: string;
  trade_id?: string;
}

export default function MoodTracker() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  const fetchMoodEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMoodEntries(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading mood entries",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood: selectedMood,
        confidence_level: confidenceLevel,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Mood entry added!",
        description: "Your mood has been tracked successfully.",
      });

      // Reset form
      setSelectedMood('');
      setConfidenceLevel(5);
      setNotes('');
      
      // Refresh entries
      fetchMoodEntries();
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

  return (
    <div className="space-y-6">
      {/* Add Mood Entry */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Track Your Mood</CardTitle>
          <CardDescription className="text-gray-400">
            Record how you're feeling about your trading performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Mood</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {moodOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selectedMood === option.value ? "default" : "outline"}
                      className={`flex flex-col items-center p-4 h-auto ${
                        selectedMood === option.value 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedMood(option.value)}
                    >
                      <Icon className={`w-6 h-6 mb-1 ${option.color}`} />
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confidence Level (1-10)</Label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white font-semibold w-8 text-center">
                  {confidenceLevel}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood-notes">Notes (Optional)</Label>
              <Textarea
                id="mood-notes"
                placeholder="What's influencing your current mood?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!selectedMood || loading}
              className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
            >
              {loading ? "Saving..." : "Save Mood Entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Mood Entries */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Mood Entries</CardTitle>
          <CardDescription className="text-gray-400">
            Your recent trading mood history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moodEntries.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Smile className="w-12 h-12 mx-auto mb-4" />
              <p>No mood entries yet. Start tracking your trading psychology!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moodEntries.map((entry) => {
                const moodOption = moodOptions.find(m => m.value === entry.mood);
                const Icon = moodOption?.icon || Meh;
                
                return (
                  <div key={entry.id} className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-lg">
                    <Icon className={`w-6 h-6 mt-1 ${moodOption?.color || 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium capitalize">
                          {entry.mood}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        Confidence: {entry.confidence_level}/10
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-300">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
