
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiFootball } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import MatchList from "@/components/matches/MatchList";
import { Search, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        
        // Se não tivermos dados no Supabase, busque da API
        // Em um caso real, você provavelmente iria chamar sua Edge Function
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
          
          <div className="flex gap-2">
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Liga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ligas</SelectItem>
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
                <SelectItem value="all">Todas as Partidas</SelectItem>
                <SelectItem value="live">Ao Vivo</SelectItem>
                <SelectItem value="upcoming">Em Breve</SelectItem>
                <SelectItem value="finished">Encerradas</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
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
                <MatchList type="live" limit={3} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Partidas de Hoje</h2>
                <MatchList type="upcoming" limit={6} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Partidas Recentes</h2>
                <MatchList type="recent" limit={6} />
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
