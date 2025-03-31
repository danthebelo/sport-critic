
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiFootball } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import MatchList from "@/components/matches/MatchList";
import { Search, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const { 
    data: leagues,
    isLoading: isLoadingLeagues 
  } = useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      try {
        // Primeiro, verifique se já temos ligas armazenadas no Supabase
        const { data: storedLeagues, error } = await supabase
          .from("competitions")
          .select("*")
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
            country: league.country || ""
          }));
        }
        
        // Se não tivermos dados no Supabase, busque da Edge Function
        try {
          const data = await fetch('/api/get-leagues');
          if (!data.ok) {
            throw new Error('Falha ao buscar ligas da Edge Function');
          }
          const jsonData = await data.json();
          
          if (jsonData.data && jsonData.data.length > 0) {
            return jsonData.data.map(league => ({
              id: parseInt(league.short_name),
              name: league.name,
              logo: league.logo_url || "",
              country: league.country || ""
            }));
          }
        } catch (edgeFunctionError) {
          console.error("Erro ao buscar ligas da Edge Function:", edgeFunctionError);
          toast.error("Falha ao carregar ligas. Utilizando dados de demonstração.");
        }
        
        // Fallback para dados mock caso tudo falhe
        return [
          { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: "Inglaterra" },
          { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Espanha" },
          { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png", country: "Itália" },
          { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png", country: "Alemanha" },
          { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png", country: "França" },
          { id: 71, name: "Brasileirão", logo: "https://media.api-sports.io/football/leagues/71.png", country: "Brasil" },
          { id: 1000, name: "NBA", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png", country: "EUA" }
        ];
      } catch (error) {
        console.error("Erro ao buscar ligas:", error);
        toast.error("Não foi possível carregar as ligas. Tente novamente mais tarde.");
        return [];
      }
    },
  });

  const handleCommandSelect = (league: string) => {
    setLeagueFilter(league);
    setOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    setDate(date);
    setCalendarOpen(false);
  };
  
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Descobrir Competições</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar times, ligas ou competições..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {leagueFilter === "all" ? "Todas as Ligas" : 
                    leagues?.find(l => l.id.toString() === leagueFilter)?.name || "Selecione"}
                  <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar liga..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma liga encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => handleCommandSelect("all")}>
                        Todas as Ligas
                      </CommandItem>
                      {!isLoadingLeagues && leagues?.map((league) => (
                        <CommandItem
                          key={league.id}
                          onSelect={() => handleCommandSelect(league.id.toString())}
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
        
        <Tabs defaultValue="football">
          <TabsList className="mb-6">
            <TabsTrigger value="football">Futebol</TabsTrigger>
            <TabsTrigger value="basketball">Basquete</TabsTrigger>
            <TabsTrigger value="tennis">Tênis</TabsTrigger>
            <TabsTrigger value="other">Outros Esportes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="football">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Partidas ao Vivo</h2>
                <MatchList type="live" limit={3} searchQuery={searchQuery} leagueFilter={leagueFilter} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Partidas de Hoje</h2>
                <MatchList 
                  type="upcoming" 
                  limit={6} 
                  searchQuery={searchQuery} 
                  leagueFilter={leagueFilter} 
                  date={date} 
                />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Partidas Recentes</h2>
                <MatchList 
                  type="recent" 
                  limit={6} 
                  searchQuery={searchQuery} 
                  leagueFilter={leagueFilter} 
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="basketball">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">NBA - Partidas ao Vivo</h2>
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Partidas de basquete disponíveis em breve</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tennis">
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Partidas de tênis disponíveis em breve</p>
            </div>
          </TabsContent>
          
          <TabsContent value="other">
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Outros esportes disponíveis em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Discover;
