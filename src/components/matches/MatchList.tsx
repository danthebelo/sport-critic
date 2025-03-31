
import { useQuery } from "@tanstack/react-query";
import { ApiFootball, Match } from "@/lib/api-client";
import MatchCard from "./MatchCard";
import { Skeleton } from "@/components/ui/skeleton";

interface MatchListProps {
  type: "live" | "upcoming" | "recent";
  limit?: number;
}

const MatchList = ({ type, limit = 6 }: MatchListProps) => {
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matches", type],
    queryFn: async () => {
      if (type === "live") {
        return ApiFootball.getLiveMatches();
      }
      
      // For demo purposes, we're using the same mock data for all types
      // In a real app, we would use different API calls based on the type
      const today = new Date().toISOString().split("T")[0];
      return ApiFootball.getMatchesByDate(today);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-100">
        <p className="text-red-600">Failed to load matches. Please try again later.</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No matches available at the moment.</p>
      </div>
    );
  }

  const displayedMatches = matches.slice(0, limit);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedMatches.map((match) => (
        <MatchCard key={match.fixture.id} match={match} />
      ))}
    </div>
  );
};

export default MatchList;
