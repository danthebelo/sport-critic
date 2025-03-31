
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface League {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
    country: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

serve(async (req: Request) => {
  try {
    const { method } = req;
    
    // Permitir apenas solicitações GET
    if (method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obter a chave da API das variáveis de ambiente
    const apiKey = Deno.env.get('FOOTBALL_API_KEY');
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key não configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Configurar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Primeiro, verifique se já temos ligas no banco de dados
    const { data: existingLeagues, error: queryError } = await supabase
      .from('competitions')
      .select('*')
      .order('importance');
    
    if (queryError) {
      console.error('Erro ao buscar ligas existentes:', queryError);
      return new Response(JSON.stringify({ error: 'Erro ao buscar ligas existentes', details: queryError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Se já temos ligas, retorne-as
    if (existingLeagues && existingLeagues.length > 0) {
      return new Response(JSON.stringify({ data: existingLeagues }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Se não temos, busque as principais ligas de futebol da API
    const footballLeaguesIds = [39, 140, 135, 78, 61, 71]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Brasileirão
    const leaguesData = [];
    
    // Busque dados para cada liga da API Football
    for (const leagueId of footballLeaguesIds) {
      const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/leagues?id=${leagueId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        }
      });
      
      if (!response.ok) {
        console.error(`Erro ao buscar liga ${leagueId}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.response && data.response.length > 0) {
        const league = data.response[0] as League;
        
        let leagueName = league.league.name;
        let leagueCountry = league.country.name;
        
        // Traduzir nomes de ligas e países para português
        if (leagueId === 39) {
          leagueName = "Premier League";
          leagueCountry = "Inglaterra";
        } else if (leagueId === 140) {
          leagueName = "La Liga";
          leagueCountry = "Espanha";
        } else if (leagueId === 135) {
          leagueName = "Serie A";
          leagueCountry = "Itália";
        } else if (leagueId === 78) {
          leagueName = "Bundesliga";
          leagueCountry = "Alemanha";
        } else if (leagueId === 61) {
          leagueName = "Ligue 1";
          leagueCountry = "França";
        } else if (leagueId === 71) {
          leagueName = "Brasileirão";
          leagueCountry = "Brasil";
        }
        
        leaguesData.push({
          id: crypto.randomUUID(),
          name: leagueName,
          short_name: league.league.id.toString(),
          type: 'football',
          country: leagueCountry,
          logo_url: league.league.logo,
          importance: footballLeaguesIds.indexOf(leagueId) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Adicione a NBA manualmente
    leaguesData.push({
      id: crypto.randomUUID(),
      name: 'NBA',
      short_name: '1000',
      type: 'basketball',
      country: 'EUA',
      logo_url: 'https://cdn.ssref.net/req/202403151/tlogo/bbr/NBA-2024.png',
      importance: footballLeaguesIds.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Salve as ligas no banco de dados
    const { error: insertError } = await supabase
      .from('competitions')
      .insert(leaguesData);
    
    if (insertError) {
      console.error('Erro ao inserir ligas:', insertError);
      return new Response(JSON.stringify({ error: 'Erro ao inserir ligas', details: insertError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ data: leaguesData }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Erro não tratado:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
