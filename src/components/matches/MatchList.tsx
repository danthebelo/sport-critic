
import { useQuery } from "@tanstack/react-query";
import { ApiFootball, Match } from "@/lib/api-client";
import MatchCard from "./MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilterIcon, SearchIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";

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

  // Ordenar partidas: ao vivo primeiro, depois as próximas ordenadas por data/hora
  const sortedMatches = filteredMatches?.sort((a, b) => {
    // Partidas ao vivo primeiro
    if (a.fixture.status.short === "LIVE" && b.fixture.status.short !== "LIVE") return -1;
    if (a.fixture.status.short !== "LIVE" && b.fixture.status.short === "LIVE") return 1;
    
    // Em seguida, ordenar por data/hora
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-muted">
              <FilterIcon className="h-3 w-3 mr-1" />
              {leagueFilter === "all" ? "Todas as Ligas" : "Liga Filtrada"}
            </Badge>
            {searchQuery && (
              <Badge variant="outline" className="bg-muted">
                <SearchIcon className="h-3 w-3 mr-1" />
                Pesquisa: {searchQuery}
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="bg-muted">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {format(date || new Date(), "dd/MM/yyyy", { locale: ptBR })}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
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

  if (!sortedMatches || sortedMatches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-muted">
              <FilterIcon className="h-3 w-3 mr-1" />
              {leagueFilter === "all" ? "Todas as Ligas" : "Liga Filtrada"}
            </Badge>
            {searchQuery && (
              <Badge variant="outline" className="bg-muted">
                <SearchIcon className="h-3 w-3 mr-1" />
                Pesquisa: {searchQuery}
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="bg-muted">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {format(date || new Date(), "dd/MM/yyyy", { locale: ptBR })}
          </Badge>
        </div>
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">Nenhuma partida disponível no momento para os filtros selecionados.</p>
        </div>
      </div>
    );
  }

  const displayedMatches = sortedMatches.slice(0, limit);
  const liveMatchesCount = displayedMatches.filter(match => match.fixture.status.short === "LIVE").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="bg-muted">
            <FilterIcon className="h-3 w-3 mr-1" />
            {leagueFilter === "all" ? "Todas as Ligas" : "Liga Filtrada"}
          </Badge>
          {searchQuery && (
            <Badge variant="outline" className="bg-muted">
              <SearchIcon className="h-3 w-3 mr-1" />
              Pesquisa: {searchQuery}
            </Badge>
          )}
          {liveMatchesCount > 0 && (
            <Badge variant="default" className="bg-red-500">
              {liveMatchesCount} {liveMatchesCount === 1 ? 'partida ao vivo' : 'partidas ao vivo'}
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="bg-muted">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {format(date || new Date(), "dd/MM/yyyy", { locale: ptBR })}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedMatches.map((match) => (
          <MatchCard key={match.fixture.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default MatchList;
