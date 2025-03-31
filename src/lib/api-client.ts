
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Types for Football API responses
export interface Match {
  id: number;
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
    venue: {
      name: string;
      city: string;
    };
    referee: string | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
  statistics?: Array<{
    type: string;
    value: number | string | null;
  }>;
}

export interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
  type?: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  country?: string;
}

interface ApiResponse<T> {
  response: T;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  errors: string[];
}

// This is the API key from the user input
const API_KEY = "21b008a667b7fa2f451b79837a66758d";
const API_HOST = "api-football-v1.p.rapidapi.com";
const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

// Helper function to make API requests
const fetchFromApi = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  try {
    // For development without actual API KEY
    if (!API_KEY || API_KEY === "YOUR_API_FOOTBALL_KEY") {
      return getMockData<T>(endpoint, params);
    }
    
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API fetch error:", error);
    toast.error("Falha ao buscar dados. Por favor, tente novamente mais tarde.");
    throw error;
  }
};

// Fetch from Supabase Edge Function
const fetchFromEdgeFunction = async <T>(functionName: string, params: Record<string, string> = {}): Promise<T> => {
  try {
    const url = new URL(`${window.location.origin}/api/${functionName}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Edge function fetch error:", error);
    toast.error("Falha ao buscar dados. Por favor, tente novamente mais tarde.");
    throw error;
  }
};

// Mock data for development without API key
const getMockData = <T>(endpoint: string, params: Record<string, string> = {}): T => {
  // Gerar partidas baseadas nos parâmetros
  const leagueId = params.league ? parseInt(params.league) : null;
  const teamId = params.team ? parseInt(params.team) : null;
  const date = params.date || null;
  const season = params.season || "2023";
  
  if (endpoint === "/fixtures") {
    let matches = [...MOCK_MATCHES];
    
    // Filtragem por liga
    if (leagueId) {
      matches = matches.filter(m => m.league.id === leagueId);
    }
    
    // Filtragem por time
    if (teamId) {
      matches = matches.filter(m => 
        m.teams.home.id === teamId || m.teams.away.id === teamId
      );
    }
    
    // Filtragem por partidas ao vivo
    if (params.live === "all") {
      matches = matches.filter(m => m.fixture.status.short === "LIVE");
    }
    
    return {
      response: matches,
      results: matches.length,
      paging: { current: 1, total: 1 },
      errors: []
    } as unknown as T;
  }
  
  // Mock para times da liga
  if (endpoint === "/teams" && params.league) {
    if (leagueId === 1000) { // NBA
      return {
        response: MOCK_NBA_TEAMS.map(team => ({ team })),
        results: MOCK_NBA_TEAMS.length,
        paging: { current: 1, total: 1 },
        errors: []
      } as unknown as T;
    }
    
    // Times de futebol com base na liga
    const filteredTeams = MOCK_FOOTBALL_TEAMS.filter(team => {
      // Mapear ligas a times (simplificado)
      if (leagueId === 39) return [33, 34, 40, 42, 47, 49].includes(team.id); // Premier League
      if (leagueId === 140) return [529, 530, 541, 548].includes(team.id); // La Liga
      if (leagueId === 135) return [489, 496, 497, 505].includes(team.id); // Serie A
      if (leagueId === 78) return [157, 159, 160, 165].includes(team.id); // Bundesliga
      if (leagueId === 61) return [77, 79, 80, 84].includes(team.id); // Ligue 1
      if (leagueId === 71) return [118, 119, 121, 126].includes(team.id); // Brasileirão
      if (leagueId === 2) return [33, 40, 529, 541, 489, 496].includes(team.id); // Champions
      return false;
    });
    
    return {
      response: filteredTeams.map(team => ({ team })),
      results: filteredTeams.length,
      paging: { current: 1, total: 1 },
      errors: []
    } as unknown as T;
  }
  
  // Default empty response
  return {
    response: [],
    results: 0,
    paging: { current: 1, total: 1 },
    errors: []
  } as unknown as T;
};

// API Methods
export const ApiFootball = {
  getLeagues: async (): Promise<League[]> => {
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
          country: league.country || "",
          type: league.type
        }));
      }
      
      // Se não tivermos dados no Supabase, tente buscar da Edge Function
      try {
        const data = await fetchFromEdgeFunction<{ data: any[] }>('get-leagues');
        if (data.data && data.data.length > 0) {
          return data.data.map(league => ({
            id: parseInt(league.short_name),
            name: league.name,
            logo: league.logo_url || "",
            country: league.country || "",
            type: league.type
          }));
        }
      } catch (edgeFunctionError) {
        console.error("Erro ao buscar ligas da Edge Function:", edgeFunctionError);
      }
      
      // Se ainda não tivermos dados, use os dados mock locais
      return MOCK_LEAGUES;
    } catch (error) {
      console.error("Erro ao buscar ligas:", error);
      return MOCK_LEAGUES;
    }
  },
  
  getLiveMatches: async (leagueId?: string): Promise<Match[]> => {
    const params: Record<string, string> = { live: "all" };
    if (leagueId) params.league = leagueId;
    
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", params);
    return data.response;
  },
  
  getMatchesByDate: async (date: string, leagueId?: string, teamId?: string, season?: string): Promise<Match[]> => {
    const params: Record<string, string> = { date };
    if (leagueId) params.league = leagueId;
    if (teamId) params.team = teamId;
    if (season) params.season = season;
    
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", params);
    return data.response;
  },
  
  getMatchesByLeague: async (leagueId: number, season: number): Promise<Match[]> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", { 
      league: leagueId.toString(), 
      season: season.toString() 
    });
    return data.response;
  },
  
  getMatchesByTeam: async (teamId: number, season?: string): Promise<Match[]> => {
    const params: Record<string, string> = { team: teamId.toString() };
    if (season) params.season = season;
    
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", params);
    return data.response;
  },
  
  getTeamsByLeague: async (leagueId: number, season: number): Promise<Team[]> => {
    const data = await fetchFromApi<ApiResponse<{team: Team}[]>>("/teams", {
      league: leagueId.toString(),
      season: season.toString()
    });
    
    return data.response.map(item => item.team);
  },
  
  getMatchStatistics: async (fixtureId: number): Promise<Match> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>(`/fixtures/${fixtureId}/statistics`);
    return data.response[0];
  },
  
  // Métodos específicos para a NBA
  getNBAMatches: async (season?: string, teamId?: string): Promise<Match[]> => {
    // Em uma implementação real, usaríamos uma API diferente para a NBA
    const params: Record<string, string> = { league: "1000" };
    if (season) params.season = season;
    if (teamId) params.team = teamId;
    
    // Por enquanto, retornamos partidas fictícias da NBA
    let matches = [...MOCK_NBA_MATCHES];
    
    // Filtrar por time se fornecido
    if (teamId) {
      const teamIdNum = parseInt(teamId);
      matches = matches.filter(match => 
        match.teams.home.id === teamIdNum || match.teams.away.id === teamIdNum
      );
    }
    
    return matches;
  },
  
  getNBATeams: async (): Promise<Team[]> => {
    // Em uma implementação real, chamaríamos uma API específica para times da NBA
    return MOCK_NBA_TEAMS;
  }
};

// Mock data for development
const MOCK_MATCHES: Match[] = [
  {
    id: 1,
    league: {
      id: 39,
      name: "Premier League",
      logo: "https://media.api-sports.io/football/leagues/39.png",
      country: "England"
    },
    teams: {
      home: {
        id: 33,
        name: "Manchester United",
        logo: "https://media.api-sports.io/football/teams/33.png"
      },
      away: {
        id: 40,
        name: "Liverpool",
        logo: "https://media.api-sports.io/football/teams/40.png"
      }
    },
    goals: {
      home: 2,
      away: 1
    },
    fixture: {
      id: 1001,
      date: "2023-05-15T14:00:00+00:00",
      status: {
        short: "FT",
        long: "Match Finished"
      },
      venue: {
        name: "Old Trafford",
        city: "Manchester"
      },
      referee: "Michael Oliver"
    },
    score: {
      halftime: {
        home: 1,
        away: 0
      },
      fulltime: {
        home: 2,
        away: 1
      }
    }
  },
  {
    id: 2,
    league: {
      id: 140,
      name: "La Liga",
      logo: "https://media.api-sports.io/football/leagues/140.png",
      country: "Spain"
    },
    teams: {
      home: {
        id: 529,
        name: "Barcelona",
        logo: "https://media.api-sports.io/football/teams/529.png"
      },
      away: {
        id: 541,
        name: "Real Madrid",
        logo: "https://media.api-sports.io/football/teams/541.png"
      }
    },
    goals: {
      home: 3,
      away: 2
    },
    fixture: {
      id: 1002,
      date: "2023-05-15T19:00:00+00:00",
      status: {
        short: "FT",
        long: "Match Finished"
      },
      venue: {
        name: "Camp Nou",
        city: "Barcelona"
      },
      referee: "Alejandro Hernández"
    },
    score: {
      halftime: {
        home: 2,
        away: 1
      },
      fulltime: {
        home: 3,
        away: 2
      }
    }
  },
  {
    id: 3,
    league: {
      id: 135,
      name: "Serie A",
      logo: "https://media.api-sports.io/football/leagues/135.png",
      country: "Italy"
    },
    teams: {
      home: {
        id: 489,
        name: "AC Milan",
        logo: "https://media.api-sports.io/football/teams/489.png"
      },
      away: {
        id: 496,
        name: "Juventus",
        logo: "https://media.api-sports.io/football/teams/496.png"
      }
    },
    goals: {
      home: 1,
      away: 1
    },
    fixture: {
      id: 1003,
      date: "2023-05-16T18:45:00+00:00",
      status: {
        short: "LIVE",
        long: "In Progress"
      },
      venue: {
        name: "San Siro",
        city: "Milan"
      },
      referee: "Daniele Orsato"
    },
    score: {
      halftime: {
        home: 0,
        away: 1
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  },
  {
    id: 4,
    league: {
      id: 2,
      name: "Champions League",
      logo: "https://media.api-sports.io/football/leagues/2.png",
      country: "Europe"
    },
    teams: {
      home: {
        id: 33,
        name: "Manchester United",
        logo: "https://media.api-sports.io/football/teams/33.png"
      },
      away: {
        id: 529,
        name: "Barcelona",
        logo: "https://media.api-sports.io/football/teams/529.png"
      }
    },
    goals: {
      home: 0,
      away: 2
    },
    fixture: {
      id: 1004,
      date: "2023-05-17T19:00:00+00:00",
      status: {
        short: "LIVE",
        long: "In Progress"
      },
      venue: {
        name: "Old Trafford",
        city: "Manchester"
      },
      referee: "Felix Brych"
    },
    score: {
      halftime: {
        home: 0,
        away: 1
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  },
  {
    id: 5,
    league: {
      id: 71,
      name: "Brasileirão",
      logo: "https://media.api-sports.io/football/leagues/71.png",
      country: "Brasil"
    },
    teams: {
      home: {
        id: 118,
        name: "Flamengo",
        logo: "https://media.api-sports.io/football/teams/118.png"
      },
      away: {
        id: 119,
        name: "Palmeiras",
        logo: "https://media.api-sports.io/football/teams/119.png"
      }
    },
    goals: {
      home: 3,
      away: 2
    },
    fixture: {
      id: 1005,
      date: "2023-05-18T20:00:00+00:00",
      status: {
        short: "NS",
        long: "Not Started"
      },
      venue: {
        name: "Maracanã",
        city: "Rio de Janeiro"
      },
      referee: "Anderson Daronco"
    },
    score: {
      halftime: {
        home: null,
        away: null
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  }
];

const MOCK_STATISTICS = [
  { type: "Possession", value: "60%" },
  { type: "Total Shots", value: 15 },
  { type: "Shots on Goal", value: 7 },
  { type: "Corners", value: 8 },
  { type: "Fouls", value: 10 }
];

// Mock leagues data
const MOCK_LEAGUES: League[] = [
  { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: "Inglaterra", type: "football" },
  { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Espanha", type: "football" },
  { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png", country: "Itália", type: "football" },
  { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png", country: "Alemanha", type: "football" },
  { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png", country: "França", type: "football" },
  { id: 71, name: "Brasileirão", logo: "https://media.api-sports.io/football/leagues/71.png", country: "Brasil", type: "football" },
  { id: 2, name: "Champions League", logo: "https://media.api-sports.io/football/leagues/2.png", country: "Europa", type: "football" },
  { id: 1000, name: "NBA", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png", country: "EUA", type: "basketball" }
];

// Times de futebol
const MOCK_FOOTBALL_TEAMS: Team[] = [
  // Premier League
  { id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png", country: "England" },
  { id: 34, name: "Newcastle", logo: "https://media.api-sports.io/football/teams/34.png", country: "England" },
  { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", country: "England" },
  { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", country: "England" },
  { id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png", country: "England" },
  { id: 49, name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png", country: "England" },
  
  // La Liga
  { id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", country: "Spain" },
  { id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png", country: "Spain" },
  { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", country: "Spain" },
  { id: 548, name: "Valencia", logo: "https://media.api-sports.io/football/teams/548.png", country: "Spain" },
  
  // Serie A
  { id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png", country: "Italy" },
  { id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png", country: "Italy" },
  { id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png", country: "Italy" },
  { id: 505, name: "Inter", logo: "https://media.api-sports.io/football/teams/505.png", country: "Italy" },
  
  // Bundesliga
  { id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png", country: "Germany" },
  { id: 159, name: "Hertha Berlin", logo: "https://media.api-sports.io/football/teams/159.png", country: "Germany" },
  { id: 160, name: "Freiburg", logo: "https://media.api-sports.io/football/teams/160.png", country: "Germany" },
  { id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png", country: "Germany" },
  
  // Ligue 1
  { id: 77, name: "PSG", logo: "https://media.api-sports.io/football/teams/77.png", country: "France" },
  { id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png", country: "France" },
  { id: 80, name: "Lyon", logo: "https://media.api-sports.io/football/teams/80.png", country: "France" },
  { id: 84, name: "Monaco", logo: "https://media.api-sports.io/football/teams/84.png", country: "France" },
  
  // Brasileirão
  { id: 118, name: "Flamengo", logo: "https://media.api-sports.io/football/teams/118.png", country: "Brazil" },
  { id: 119, name: "Palmeiras", logo: "https://media.api-sports.io/football/teams/119.png", country: "Brazil" },
  { id: 121, name: "Corinthians", logo: "https://media.api-sports.io/football/teams/121.png", country: "Brazil" },
  { id: 126, name: "São Paulo", logo: "https://media.api-sports.io/football/teams/126.png", country: "Brazil" }
];

// Times da NBA
const MOCK_NBA_TEAMS: Team[] = [
  { id: 2001, name: "Los Angeles Lakers", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/LAL.png" },
  { id: 2002, name: "Golden State Warriors", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/GSW.png" },
  { id: 2003, name: "Boston Celtics", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/BOS.png" },
  { id: 2004, name: "Miami Heat", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/MIA.png" },
  { id: 2005, name: "Chicago Bulls", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/CHI.png" },
  { id: 2006, name: "Brooklyn Nets", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/BRK.png" },
  { id: 2007, name: "Dallas Mavericks", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/DAL.png" },
  { id: 2008, name: "Denver Nuggets", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/DEN.png" }
];

// Mock NBA matches
const MOCK_NBA_MATCHES: Match[] = [
  {
    id: 1001,
    league: {
      id: 1000,
      name: "NBA",
      logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png",
      country: "EUA"
    },
    teams: {
      home: {
        id: 2001,
        name: "Los Angeles Lakers",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/LAL.png"
      },
      away: {
        id: 2002,
        name: "Golden State Warriors",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/GSW.png"
      }
    },
    goals: {
      home: 110,
      away: 105
    },
    fixture: {
      id: 3001,
      date: "2023-05-15T19:00:00+00:00",
      status: {
        short: "FT",
        long: "Match Finished"
      },
      venue: {
        name: "Crypto.com Arena",
        city: "Los Angeles"
      },
      referee: "Scott Foster"
    },
    score: {
      halftime: {
        home: 52,
        away: 48
      },
      fulltime: {
        home: 110,
        away: 105
      }
    }
  },
  {
    id: 1002,
    league: {
      id: 1000,
      name: "NBA",
      logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png",
      country: "EUA"
    },
    teams: {
      home: {
        id: 2003,
        name: "Boston Celtics",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/BOS.png"
      },
      away: {
        id: 2004,
        name: "Miami Heat",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/MIA.png"
      }
    },
    goals: {
      home: 98,
      away: 92
    },
    fixture: {
      id: 3002,
      date: "2023-05-16T18:45:00+00:00",
      status: {
        short: "LIVE",
        long: "In Progress"
      },
      venue: {
        name: "TD Garden",
        city: "Boston"
      },
      referee: "Tony Brothers"
    },
    score: {
      halftime: {
        home: 46,
        away: 44
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  },
  {
    id: 1003,
    league: {
      id: 1000,
      name: "NBA",
      logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png",
      country: "EUA"
    },
    teams: {
      home: {
        id: 2005,
        name: "Chicago Bulls",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/CHI.png"
      },
      away: {
        id: 2006,
        name: "Brooklyn Nets",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/BRK.png"
      }
    },
    goals: {
      home: 115,
      away: 108
    },
    fixture: {
      id: 3003,
      date: "2023-05-18T20:00:00+00:00",
      status: {
        short: "NS",
        long: "Not Started"
      },
      venue: {
        name: "United Center",
        city: "Chicago"
      },
      referee: "James Capers"
    },
    score: {
      halftime: {
        home: null,
        away: null
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  },
  {
    id: 1004,
    league: {
      id: 1000,
      name: "NBA",
      logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png",
      country: "EUA"
    },
    teams: {
      home: {
        id: 2007,
        name: "Dallas Mavericks",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/DAL.png"
      },
      away: {
        id: 2008,
        name: "Denver Nuggets",
        logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/DEN.png"
      }
    },
    goals: {
      home: 112,
      away: 107
    },
    fixture: {
      id: 3004,
      date: "2023-05-19T19:30:00+00:00",
      status: {
        short: "NS",
        long: "Not Started"
      },
      venue: {
        name: "American Airlines Center",
        city: "Dallas"
      },
      referee: "Marc Davis"
    },
    score: {
      halftime: {
        home: null,
        away: null
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  }
];
