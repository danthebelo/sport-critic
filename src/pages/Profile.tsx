
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PencilIcon, User2, Star, HeartIcon, Calendar, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.username || user.email || ""} />
                    <AvatarFallback className="text-2xl">
                      {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold mt-4">{profile?.username || "User"}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h2 className="font-semibold mb-2">Bio</h2>
                  <p className="text-sm text-muted-foreground">
                    {profile?.bio || "No bio yet. Click Edit Profile to add one."}
                  </p>
                  
                  <h2 className="font-semibold mt-4 mb-2">Favorite Teams</h2>
                  {profile?.favorite_teams && profile.favorite_teams.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {/* In a real app, we would fetch and display actual team info */}
                      <div className="bg-muted px-3 py-1 rounded-full text-xs">
                        Manchester United
                      </div>
                      <div className="bg-muted px-3 py-1 rounded-full text-xs">
                        LA Lakers
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No favorite teams yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
                <CardDescription>Your activity on SportCritic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-sport-accent" />
                      <span className="text-sm">Reviews</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sport-primary" />
                      <span className="text-sm">Matches watched</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <HeartIcon className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Favorites</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <User2 className="h-4 w-4 text-sport-secondary" />
                      <span className="text-sm">Following</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-2/3">
            <Tabs defaultValue="reviews">
              <TabsList className="mb-6">
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>
              
              <TabsContent value="reviews">
                <div className="space-y-4">
                  <div className="text-center p-8 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">No reviews yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start reviewing matches to see them here
                    </p>
                    <Button asChild>
                      <Link to="/discover">Find Matches to Review</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="watchlist">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="favorites">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="following">
                <div className="space-y-4">
                  <div className="text-center p-8 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Not following anyone yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Follow other users to see their activity in your feed
                    </p>
                    <Button asChild>
                      <Link to="/discover">Discover Users</Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
