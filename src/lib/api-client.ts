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

interface ApiResponse<T> {
  response: T;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  errors: string[];
}

// This is a placeholder API key - in production, this would be stored securely
// For demo purposes, we'll use a mock implementation
const API_KEY = "YOUR_API_FOOTBALL_KEY";
const API_HOST = "api-football-v1.p.rapidapi.com";
const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

// Helper function to make API requests
const fetchFromApi = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  try {
    // In a real implementation, this would use the actual API
    // For demo, we'll use mock data if API_KEY is not set
    if (API_KEY === "YOUR_API_FOOTBALL_KEY") {
      return getMockData<T>(endpoint);
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
    toast.error("Failed to fetch data. Please try again later.");
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
    toast.error("Failed to fetch data. Please try again later.");
    throw error;
  }
};

// Mock data for development without API key
const getMockData = <T>(endpoint: string): T => {
  // Mock live matches
  if (endpoint === "/fixtures") {
    return {
      response: MOCK_MATCHES,
      results: MOCK_MATCHES.length,
      paging: { current: 1, total: 1 },
      errors: []
    } as unknown as T;
  }
  
  // Mock leagues
  if (endpoint === "/leagues") {
    return {
      response: MOCK_LEAGUES,
      results: MOCK_LEAGUES.length,
      paging: { current: 1, total: 1 },
      errors: []
    } as unknown as T;
  }
  
  // Mock match details
  if (endpoint.startsWith("/fixtures/") && endpoint.includes("statistics")) {
    const matchId = parseInt(endpoint.split("/")[2]);
    const match = MOCK_MATCHES.find(m => m.fixture.id === matchId);
    
    if (match) {
      return {
        response: [{ ...match, statistics: MOCK_STATISTICS }],
        results: 1,
        paging: { current: 1, total: 1 },
        errors: []
      } as unknown as T;
    }
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
  
  getLiveMatches: async (): Promise<Match[]> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", { live: "all" });
    return data.response;
  },
  
  getMatchesByDate: async (date: string): Promise<Match[]> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", { date });
    return data.response;
  },
  
  getMatchesByLeague: async (leagueId: number, season: number): Promise<Match[]> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", { 
      league: leagueId.toString(), 
      season: season.toString() 
    });
    return data.response;
  },
  
  getMatchesByTeam: async (teamId: number): Promise<Match[]> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>("/fixtures", { team: teamId.toString() });
    return data.response;
  },
  
  getMatchStatistics: async (fixtureId: number): Promise<Match> => {
    const data = await fetchFromApi<ApiResponse<Match[]>>(`/fixtures/${fixtureId}/statistics`);
    return data.response[0];
  },
  
  // Métodos específicos para a NBA e outros esportes podem ser adicionados aqui
  getNBAMatches: async (): Promise<Match[]> => {
    // Em uma implementação real, chamaríamos uma API diferente para a NBA
    // Por enquanto, apenas retornamos partidas fictícias
    return MOCK_NBA_MATCHES;
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
  { id: 1000, name: "NBA", logo: "https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png", country: "EUA", type: "basketball" }
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
  }
];
