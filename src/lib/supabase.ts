
import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project details or use environment variables
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database models
export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  favorite_teams?: number[];
  created_at: string;
}

export interface MatchReview {
  id: string;
  user_id: string;
  match_id: number;
  rating: number;
  review_text?: string;
  tags?: string[];
  highlights_url?: string;
  created_at: string;
}

// Authentication services
export const authService = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },
  
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  
  // Sign in with OAuth (Google, GitHub)
  signInWithOAuth: async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    return { data, error };
  },
  
  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  
  // Get the current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  // Get the current session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};

// User profile services
export const userService = {
  // Get a user profile by ID
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },
  
  // Create or update a user profile
  upsertProfile: async (profile: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select();
    
    return { data, error };
  },
  
  // Update avatar
  updateAvatar: async (userId: string, file: File) => {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    
    if (uploadError) {
      return { error: uploadError };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    // Update profile with avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select();
    
    return { data, error };
  },
};

// Match review services
export const reviewService = {
  // Create a new review
  createReview: async (review: Omit<MatchReview, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('match_reviews')
      .insert(review)
      .select();
    
    return { data, error };
  },
  
  // Get reviews for a match
  getMatchReviews: async (matchId: number) => {
    const { data, error } = await supabase
      .from('match_reviews')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },
  
  // Get reviews by a user
  getUserReviews: async (userId: string) => {
    const { data, error } = await supabase
      .from('match_reviews')
      .select(`*`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },
  
  // Upload highlight video
  uploadHighlight: async (userId: string, matchId: number, file: File) => {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${matchId}-${Math.random()}.${fileExt}`;
    const filePath = `highlights/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('highlights')
      .upload(filePath, file);
    
    if (uploadError) {
      return { error: uploadError };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('highlights')
      .getPublicUrl(filePath);
    
    return { data: publicUrl, error: null };
  },
};
