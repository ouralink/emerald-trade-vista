
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Smile, Meh, Frown, Heart, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type MoodType = 'confident' | 'neutral' | 'anxious' | 'excited' | 'frustrated';

interface MoodEntry {
  id: string;
  mood: MoodType;
  confidence_level: number;
  notes?: string;
  created_at: string;
  trade_id?: string;
}

export default function MoodTracker() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const [confidenceLevel, setConfidenceLevel] = useState([7]);
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

  const addMoodEntry = async () => {
    if (!selectedMood) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood: selectedMood,
          confidence_level: confidenceLevel[0],
          notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Mood entry added successfully!",
        description: `Feeling ${selectedMood} with ${confidenceLevel[0]}/10 confidence`,
      });

      setNotes('');
      setConfidenceLevel([7]);
      setSelectedMood('neutral');
      fetchMoodEntries();
    } catch (error: any) {
      toast({
        title: "Error adding mood entry",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case 'confident': return <Smile className="w-4 h-4" />;
      case 'excited': return <Heart className="w-4 h-4" />;
      case 'neutral': return <Meh className="w-4 h-4" />;
      case 'anxious': return <AlertTriangle className="w-4 h-4" />;
      case 'frustrated': return <Frown className="w-4 h-4" />;
      default: return <Meh className="w-4 h-4" />;
    }
  };

  const getMoodColor = (mood: MoodType) => {
    switch (mood) {
      case 'confident': return 'bg-green-600';
      case 'excited': return 'bg-purple-600';
      case 'neutral': return 'bg-gray-600';
      case 'anxious': return 'bg-yellow-600';
      case 'frustrated': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Mood Entry */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Track Your Trading Mood</CardTitle>
          <CardDescription className="text-gray-400">
            Record how you're feeling about your trading performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Current Mood
            </label>
            <Select value={selectedMood} onValueChange={(value) => setSelectedMood(value as MoodType)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select your mood" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="confident" className="text-white hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <Smile className="w-4 h-4" />
                    <span>Confident</span>
                  </div>
                </SelectItem>
                <SelectItem value="excited" className="text-white hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Excited</span>
                  </div>
                </SelectItem>
                <SelectItem value="neutral" className="text-white hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <Meh className="w-4 h-4" />
                    <span>Neutral</span>
                  </div>
                </SelectItem>
                <SelectItem value="anxious" className="text-white hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Anxious</span>
                  </div>
                </SelectItem>
                <SelectItem value="frustrated" className="text-white hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <Frown className="w-4 h-4" />
                    <span>Frustrated</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Confidence Level: {confidenceLevel[0]}/10
            </label>
            <Slider
              value={confidenceLevel}
              onValueChange={setConfidenceLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's affecting your trading mindset today?"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              rows={3}
            />
          </div>

          <Button
            onClick={addMoodEntry}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
          >
            {loading ? 'Saving...' : 'Record Mood'}
          </Button>
        </CardContent>
      </Card>

      {/* Mood History */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Mood Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {moodEntries.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No mood entries yet. Start tracking your trading psychology!</p>
          ) : (
            <div className="space-y-4">
              {moodEntries.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge className={`${getMoodColor(entry.mood)} text-white`}>
                      <div className="flex items-center space-x-1">
                        {getMoodIcon(entry.mood)}
                        <span className="capitalize">{entry.mood}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300">
                        Confidence: {entry.confidence_level}/10
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-400 mt-1">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
