
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiFootball } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import MatchList from "@/components/matches/MatchList";
import { Search, Calendar, Filter, TrophyIcon, ShirtIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";

interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
  type?: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Season {
  year: string;
  current: boolean;
}

const seasons = [
  { year: "2023", current: true },
  { year: "2022", current: false },
  { year: "2021", current: false },
  { year: "2020", current: false },
];

const nbaSeasonsMap = {
  "2023": "2023-2024",
  "2022": "2022-2023",
  "2021": "2021-2022",
  "2020": "2020-2021",
};

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("2023");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openLeague, setOpenLeague] = useState(false);
  const [openTeam, setOpenTeam] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeSport, setActiveSport] = useState<"football" | "basketball">("football");
  
  // Consulta para obter as ligas
  const { 
    data: leagues,
    isLoading: isLoadingLeagues 
  } = useQuery({
    queryKey: ["leagues", activeSport],
    queryFn: async () => {
      try {
        // Primeiro, verifique se já temos ligas armazenadas no Supabase
        const { data: storedLeagues, error } = await supabase
          .from("competitions")
          .select("*")
          .eq("type", activeSport)
          .order("importance");
        
        if (error) {
          console.error("Erro ao buscar ligas do Supabase:", error);
          throw error;
        }
        
        if (storedLeagues && storedLeagues.length > 0) {
          // Transforme os dados do Supabase para o formato esperado pela interface
          return storedLeagues.map(league => ({
            id: parseInt(league.short_name),
            name: league.name,
            logo: league.logo_url || "",
            country: league.country || "",
            type: league.type
          }));
        }
        
        // Fallback para dados mock caso tudo falhe
        if (activeSport === "basketball") {
          return [
            { id: 1000, name: "NBA", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png", country: "EUA", type: "basketball" }
          ];
        }
        
        return [
          { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: "Inglaterra", type: "football" },
          { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Espanha", type: "football" },
          { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png", country: "Itália", type: "football" },
          { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png", country: "Alemanha", type: "football" },
          { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png", country: "França", type: "football" },
          { id: 71, name: "Brasileirão", logo: "https://media.api-sports.io/football/leagues/71.png", country: "Brasil", type: "football" },
          { id: 2, name: "Champions League", logo: "https://media.api-sports.io/football/leagues/2.png", country: "Europa", type: "football" }
        ];
      } catch (error) {
        console.error("Erro ao buscar ligas:", error);
        toast.error("Não foi possível carregar as ligas. Tente novamente mais tarde.");
        return [];
      }
    },
  });

  // Consulta para obter os times com base na liga selecionada
  const {
    data: teams,
    isLoading: isLoadingTeams
  } = useQuery({
    queryKey: ["teams", leagueFilter, activeSport, seasonFilter],
    enabled: leagueFilter !== "all",
    queryFn: async () => {
      try {
        if (activeSport === "basketball") {
          return ApiFootball.getNBATeams();
        }
        
        return ApiFootball.getTeamsByLeague(parseInt(leagueFilter), parseInt(seasonFilter));
      } catch (error) {
        console.error("Erro ao buscar times:", error);
        toast.error("Não foi possível carregar os times. Tente novamente mais tarde.");
        return [];
      }
    }
  });

  // Limpar o filtro de time quando a liga muda
  useEffect(() => {
    setTeamFilter("all");
  }, [leagueFilter]);

  // Limpar o filtro de liga quando o esporte muda
  useEffect(() => {
    setLeagueFilter("all");
    setTeamFilter("all");
  }, [activeSport]);

  const handleLeagueSelect = (league: string) => {
    setLeagueFilter(league);
    setOpenLeague(false);
  };

  const handleTeamSelect = (team: string) => {
    setTeamFilter(team);
    setOpenTeam(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    setDate(date);
    setCalendarOpen(false);
  };

  const handleSportChange = (value: string) => {
    setActiveSport(value as "football" | "basketball");
  };
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Descobrir Competições</h1>
        
        <div className="flex flex-col space-y-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar times ou competições..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Filtro de Esporte */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Esporte</label>
              <div className="flex">
                <Toggle 
                  pressed={activeSport === "football"}
                  onPressedChange={() => setActiveSport("football")}
                  className="flex-1 rounded-r-none border-r-0"
                >
                  Futebol
                </Toggle>
                <Toggle 
                  pressed={activeSport === "basketball"}
                  onPressedChange={() => setActiveSport("basketball")}
                  className="flex-1 rounded-l-none"
                >
                  Basquete
                </Toggle>
              </div>
            </div>
            
            {/* Filtro de Liga */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Competição</label>
              <Popover open={openLeague} onOpenChange={setOpenLeague}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center">
                      {leagueFilter !== "all" && leagues ? (
                        <>
                          <img 
                            src={leagues.find(l => l.id.toString() === leagueFilter)?.logo} 
                            alt="Liga" 
                            className="w-5 h-5 mr-2"
                          />
                          {leagues.find(l => l.id.toString() === leagueFilter)?.name}
                        </>
                      ) : (
                        "Todas as Competições"
                      )}
                    </div>
                    <TrophyIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[250px]" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar competição..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma competição encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => handleLeagueSelect("all")}>
                          Todas as Competições
                        </CommandItem>
                        {!isLoadingLeagues && leagues?.map((league) => (
                          <CommandItem
                            key={league.id}
                            onSelect={() => handleLeagueSelect(league.id.toString())}
                            className="flex items-center gap-2"
                          >
                            <img src={league.logo} alt={league.name} className="w-5 h-5 object-contain" />
                            {league.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Filtro de Temporada */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Temporada</label>
              <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {activeSport === "basketball" ? nbaSeasonsMap[seasonFilter as keyof typeof nbaSeasonsMap] : seasonFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.year} value={season.year}>
                      {activeSport === "basketball" 
                        ? nbaSeasonsMap[season.year as keyof typeof nbaSeasonsMap] 
                        : season.year}
                      {season.current && " (Atual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro de Time */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Time</label>
              <Popover open={openTeam} onOpenChange={setOpenTeam}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    disabled={leagueFilter === "all"}
                  >
                    <div className="flex items-center">
                      {teamFilter !== "all" && teams ? (
                        <>
                          <img 
                            src={teams.find(t => t.id.toString() === teamFilter)?.logo} 
                            alt="Time" 
                            className="w-5 h-5 mr-2"
                          />
                          {teams.find(t => t.id.toString() === teamFilter)?.name}
                        </>
                      ) : (
                        "Todos os Times"
                      )}
                    </div>
                    <ShirtIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[250px]" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar time..." />
                    <CommandList>
                      <CommandEmpty>Nenhum time encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => handleTeamSelect("all")}>
                          Todos os Times
                        </CommandItem>
                        {!isLoadingTeams && teams?.map((team) => (
                          <CommandItem
                            key={team.id}
                            onSelect={() => handleTeamSelect(team.id.toString())}
                            className="flex items-center gap-2"
                          >
                            <img src={team.logo} alt={team.name} className="w-5 h-5 object-contain" />
                            {team.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Partidas</SelectItem>
                <SelectItem value="live">Ao Vivo</SelectItem>
                <SelectItem value="upcoming">Em Breve</SelectItem>
                <SelectItem value="finished">Encerradas</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione data"}
                  <Calendar className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={handleCalendarSelect}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Tabs defaultValue="football" value={activeSport} onValueChange={handleSportChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="football">Futebol</TabsTrigger>
            <TabsTrigger value="basketball">Basquete</TabsTrigger>
          </TabsList>
          
          <TabsContent value="football">
            <div className="space-y-8">
              {statusFilter === "all" || statusFilter === "live" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Partidas ao Vivo</h2>
                  <MatchList 
                    type="live" 
                    limit={6} 
                    searchQuery={searchQuery} 
                    leagueFilter={leagueFilter}
                    teamFilter={teamFilter}
                    seasonFilter={seasonFilter}
                    date={date}
                    sport="football"
                  />
                </div>
              ) : null}
              
              {statusFilter === "all" || statusFilter === "upcoming" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Próximas Partidas</h2>
                  <MatchList 
                    type="upcoming" 
                    limit={9} 
                    searchQuery={searchQuery} 
                    leagueFilter={leagueFilter}
                    teamFilter={teamFilter}
                    seasonFilter={seasonFilter}
                    date={date}
                    sport="football"
                  />
                </div>
              ) : null}
              
              {statusFilter === "all" || statusFilter === "finished" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Partidas Recentes</h2>
                  <MatchList 
                    type="recent" 
                    limit={6} 
                    searchQuery={searchQuery} 
                    leagueFilter={leagueFilter}
                    teamFilter={teamFilter}
                    seasonFilter={seasonFilter}
                    date={date}
                    sport="football"
                  />
                </div>
              ) : null}
            </div>
          </TabsContent>
          
          <TabsContent value="basketball">
            <div className="space-y-8">
              {statusFilter === "all" || statusFilter === "live" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">NBA - Partidas ao Vivo</h2>
                  <MatchList 
                    type="live" 
                    limit={6} 
                    searchQuery={searchQuery} 
                    leagueFilter="1000" // ID fixo para NBA
                    teamFilter={teamFilter}
                    seasonFilter={seasonFilter}
                    date={date}
                    sport="basketball"
                  />
                </div>
              ) : null}
              
              {statusFilter === "all" || statusFilter === "upcoming" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">NBA - Próximas Partidas</h2>
                  <MatchList 
                    type="upcoming" 
                    limit={9} 
                    searchQuery={searchQuery} 
                    leagueFilter="1000" // ID fixo para NBA
                    teamFilter={teamFilter}
                    seasonFilter={seasonFilter}
                    date={date}
                    sport="basketball"
                  />
                </div>
              ) : null}
              
              {statusFilter === "all" || statusFilter === "finished" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">NBA - Partidas Recentes</h2>
                  <MatchList 
                    type="recent" 
                    limit={6} 
                    searchQuery={searchQuery} 
                    leagueFilter="1000" // ID fixo para NBA
                    teamFilter={teamFilter}
                    seasonFilter={seasonFilter}
                    date={date}
                    sport="basketball"
                  />
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Discover;
