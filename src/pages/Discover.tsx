
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiFootball } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import MatchList from "@/components/matches/MatchList";
import { Search, Calendar } from "lucide-react";

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { 
    data: leagues,
    isLoading: isLoadingLeagues 
  } = useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      // In a real app, we would fetch leagues from the API
      return [
        { id: 39, name: "Premier League" },
        { id: 140, name: "La Liga" },
        { id: 135, name: "Serie A" },
        { id: 78, name: "Bundesliga" },
        { id: 61, name: "Ligue 1" },
      ];
    },
  });
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Discover Matches</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams, leagues or competitions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {!isLoadingLeagues && leagues?.map((league) => (
                  <SelectItem key={league.id} value={league.id.toString()}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="football">
          <TabsList className="mb-6">
            <TabsTrigger value="football">Football</TabsTrigger>
            <TabsTrigger value="basketball">Basketball</TabsTrigger>
            <TabsTrigger value="tennis">Tennis</TabsTrigger>
            <TabsTrigger value="other">Other Sports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="football">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Live Matches</h2>
                <MatchList type="live" limit={3} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Today's Matches</h2>
                <MatchList type="upcoming" limit={6} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Matches</h2>
                <MatchList type="recent" limit={6} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="basketball">
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Basketball matches coming soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="tennis">
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Tennis matches coming soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="other">
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Other sports coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Discover;
