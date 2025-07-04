import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Upload, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export default function ProfileManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        username: data.username || '',
        email: data.email || ''
      });
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully!",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Avatar updated successfully!",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Avatar removed successfully!",
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error removing avatar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-green-400 text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-400 text-lg">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-green-400" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-700 text-white text-xl">
                {profile.username?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <label htmlFor="avatar-upload">
                  <Button 
                    disabled={uploading}
                    className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Avatar'}
                    </span>
                  </Button>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                  disabled={uploading}
                />
                {profile.avatar_url && (
                  <Button
                    onClick={removeAvatar}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Upload a profile picture (JPG, PNG, GIF up to 5MB)
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={updateProfile}
              className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500"
            >
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}