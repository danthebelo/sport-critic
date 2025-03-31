
import { useQuery } from "@tanstack/react-query";
import { ApiFootball, Match } from "@/lib/api-client";
import MatchCard from "./MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilterIcon, SearchIcon, TrophyIcon, ShirtIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";

interface MatchListProps {
  type: "live" | "upcoming" | "recent";
  limit?: number;
  searchQuery?: string;
  leagueFilter?: string;
  teamFilter?: string;
  seasonFilter?: string;
  date?: Date;
  sport?: "football" | "basketball";
}

const MatchList = ({ 
  type, 
  limit = 6, 
  searchQuery = "", 
  leagueFilter = "all",
  teamFilter = "all",
  seasonFilter = "2023",
  date,
  sport = "football"
}: MatchListProps) => {
  const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matches", type, formattedDate, leagueFilter, teamFilter, seasonFilter, sport],
    queryFn: async () => {
      if (sport === "basketball") {
        return ApiFootball.getNBAMatches(seasonFilter, teamFilter !== "all" ? teamFilter : undefined);
      }
      
      if (type === "live") {
        return ApiFootball.getLiveMatches(leagueFilter !== "all" ? leagueFilter : undefined);
      }
      
      if (type === "upcoming") {
        return ApiFootball.getMatchesByDate(
          formattedDate, 
          leagueFilter !== "all" ? leagueFilter : undefined,
          teamFilter !== "all" ? teamFilter : undefined,
          seasonFilter
        );
      }
      
      // Para partidas recentes, usamos a data de ontem como exemplo
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = format(yesterday, "yyyy-MM-dd");
      return ApiFootball.getMatchesByDate(
        yesterdayFormatted, 
        leagueFilter !== "all" ? leagueFilter : undefined,
        teamFilter !== "all" ? teamFilter : undefined,
        seasonFilter
      );
    },
  });

  // Filtrar as partidas com base na consulta de pesquisa e nos filtros
  const filteredMatches = matches?.filter(match => {
    // Aplicar filtro de pesquisa
    const matchesSearch = searchQuery 
      ? match.teams.home.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.teams.away.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.league.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    // Filtro de liga já é aplicado na API, mas vamos verificar novamente para segurança
    const matchesLeague = leagueFilter === "all" 
      ? true 
      : match.league.id.toString() === leagueFilter;
    
    // Filtro de time já é aplicado na API, mas vamos verificar novamente
    const matchesTeam = teamFilter === "all"
      ? true
      : match.teams.home.id.toString() === teamFilter || 
        match.teams.away.id.toString() === teamFilter;
    
    return matchesSearch && matchesLeague && matchesTeam;
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
          <div className="flex gap-2 flex-wrap">
            {leagueFilter !== "all" && (
              <Badge variant="outline" className="bg-muted">
                <TrophyIcon className="h-3 w-3 mr-1" />
                Competição: {leagueFilter}
              </Badge>
            )}
            {teamFilter !== "all" && (
              <Badge variant="outline" className="bg-muted">
                <ShirtIcon className="h-3 w-3 mr-1" />
                Time: {teamFilter}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="bg-muted">
                <SearchIcon className="h-3 w-3 mr-1" />
                Pesquisa: {searchQuery}
              </Badge>
            )}
            <Badge variant="outline" className="bg-muted">
              <FilterIcon className="h-3 w-3 mr-1" />
              Temporada: {seasonFilter}
            </Badge>
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
          <div className="flex gap-2 flex-wrap">
            {leagueFilter !== "all" && (
              <Badge variant="outline" className="bg-muted">
                <TrophyIcon className="h-3 w-3 mr-1" />
                Competição: {leagueFilter}
              </Badge>
            )}
            {teamFilter !== "all" && (
              <Badge variant="outline" className="bg-muted">
                <ShirtIcon className="h-3 w-3 mr-1" />
                Time: {teamFilter}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="bg-muted">
                <SearchIcon className="h-3 w-3 mr-1" />
                Pesquisa: {searchQuery}
              </Badge>
            )}
            <Badge variant="outline" className="bg-muted">
              <FilterIcon className="h-3 w-3 mr-1" />
              Temporada: {seasonFilter}
            </Badge>
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {leagueFilter !== "all" && (
            <Badge variant="outline" className="bg-muted">
              <TrophyIcon className="h-3 w-3 mr-1" />
              Competição: {leagueFilter}
            </Badge>
          )}
          {teamFilter !== "all" && (
            <Badge variant="outline" className="bg-muted">
              <ShirtIcon className="h-3 w-3 mr-1" />
              Time: {teamFilter}
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="outline" className="bg-muted">
              <SearchIcon className="h-3 w-3 mr-1" />
              Pesquisa: {searchQuery}
            </Badge>
          )}
          <Badge variant="outline" className="bg-muted">
            <FilterIcon className="h-3 w-3 mr-1" />
            Temporada: {seasonFilter}
          </Badge>
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
