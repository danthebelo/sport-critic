
import { useQuery } from "@tanstack/react-query";
import { ApiFootball, Match } from "@/lib/api-client";
import MatchCard from "./MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface MatchListProps {
  type: "live" | "upcoming" | "recent";
  limit?: number;
  searchQuery?: string;
  leagueFilter?: string;
  date?: Date;
}

const MatchList = ({ 
  type, 
  limit = 6, 
  searchQuery = "", 
  leagueFilter = "all",
  date
}: MatchListProps) => {
  const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matches", type, formattedDate, leagueFilter],
    queryFn: async () => {
      if (type === "live") {
        return ApiFootball.getLiveMatches();
      }
      
      if (type === "upcoming") {
        return ApiFootball.getMatchesByDate(formattedDate);
      }
      
      // Para partidas recentes, usamos a data de ontem como exemplo
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = format(yesterday, "yyyy-MM-dd");
      return ApiFootball.getMatchesByDate(yesterdayFormatted);
    },
  });

  // Filtrar as partidas com base na consulta de pesquisa e no filtro da liga
  const filteredMatches = matches?.filter(match => {
    // Aplicar filtro de pesquisa
    const matchesSearch = searchQuery 
      ? match.teams.home.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.teams.away.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.league.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    // Aplicar filtro de liga
    const matchesLeague = leagueFilter === "all" 
      ? true 
      : match.league.id.toString() === leagueFilter;
    
    return matchesSearch && matchesLeague;
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
        <p className="text-red-600">Falha ao carregar partidas. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  if (!filteredMatches || filteredMatches.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">Nenhuma partida disponível no momento para os filtros selecionados.</p>
      </div>
    );
  }

  const displayedMatches = filteredMatches.slice(0, limit);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedMatches.map((match) => (
        <MatchCard key={match.fixture.id} match={match} />
      ))}
    </div>
  );
};

export default MatchList;
