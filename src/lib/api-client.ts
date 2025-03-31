import { toast } from "sonner";

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
