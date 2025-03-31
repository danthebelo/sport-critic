
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Activity = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Join the Community</h1>
            <p className="text-muted-foreground">
              Sign in to see activity from users you follow and share your own match reviews.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Activity Feed</h1>
        
        <Tabs defaultValue="following">
          <TabsList className="mb-6">
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="following">
            <div className="space-y-4">
              {/* In a real app, we would fetch and display actual activity here */}
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
              
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-4">
                  Follow more users to see their activity in your feed
                </p>
                <Button asChild variant="outline">
                  <Link to="/discover">Discover Users</Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trending">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Activity;
