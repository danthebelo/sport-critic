import { useQuery } from "@tanstack/react-query";
import { ApiFootball } from "@/lib/api-client";
import MainLayout from "@/components/layout/MainLayout";
import MatchList from "@/components/matches/MatchList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, TrendingUp, Flame, Star } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  
  const { data: liveMatchesCount } = useQuery({
    queryKey: ["liveMatchesCount"],
    queryFn: async () => {
      const matches = await ApiFootball.getLiveMatches();
      return matches.length;
    },
  });
  
  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-sport-primary to-sport-secondary py-12 md:py-20">
        <div className="container text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Rate, Review, Relive
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Track, rate, and share your opinions on sports matches with a community of passionate fans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="default" className="bg-white text-sport-primary hover:bg-white/90">
              <Link to="/discover">Explore Matches</Link>
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                <Link to="/register">Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Matches</h2>
            <Link to="/discover" className="text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <Tabs defaultValue="live">
            <TabsList className="mb-6">
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                <span>Live</span>
                {liveMatchesCount && liveMatchesCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {liveMatchesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Upcoming</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Trending</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="live">
              <MatchList type="live" />
            </TabsContent>
            
            <TabsContent value="upcoming">
              <MatchList type="upcoming" />
            </TabsContent>
            
            <TabsContent value="trending">
              <MatchList type="recent" />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <section className="py-12 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">Latest Reviews</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/reviews">View all reviews</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-sport-primary/10 text-sport-primary mb-4">
                <Flame className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Follow Live Matches</h3>
              <p className="text-muted-foreground">
                Get real-time updates, scores, and stats for matches happening right now.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-sport-secondary/10 text-sport-secondary mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rate & Review</h3>
              <p className="text-muted-foreground">
                Share your opinions, rate performances, and tag key moments from matches.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-sport-accent/10 text-sport-accent mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Your Activity</h3>
              <p className="text-muted-foreground">
                Build your profile, follow friends, and keep track of all your sports watching history.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
