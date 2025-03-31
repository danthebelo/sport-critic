
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/lib/api-client";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const isLive = match.fixture.status.short === "LIVE";
  const isFinished = match.fixture.status.short === "FT";
  const matchDate = parseISO(match.fixture.date);
  
  const getStatusText = () => {
    if (isLive) return "AO VIVO";
    if (isFinished) return "Encerrado";
    return format(matchDate, "dd MMM, HH:mm", { locale: ptBR });
  };
  
  const getRelativeTime = () => {
    if (isLive) return "Acontecendo agora";
    if (isFinished) return `${formatDistanceToNow(matchDate, { locale: ptBR })} atrás`;
    return `Em ${formatDistanceToNow(matchDate, { locale: ptBR })}`;
  };
  
  return (
    <Link to={`/matches/${match.fixture.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="relative">
            {isLive && (
              <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-br-md flex items-center">
                <span className="animate-pulse w-2 h-2 bg-white rounded-full mr-1"></span>
                AO VIVO
              </div>
            )}
            <div className="p-4 bg-gradient-to-r from-sport-primary/10 to-sport-secondary/10">
              <div className="flex justify-between items-center mb-4">
                <Badge variant="outline" className="bg-white/80">
                  {match.league.name}
                </Badge>
                <span className="text-xs text-gray-500">
                  {getRelativeTime()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center text-center w-2/5">
                  <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-12 h-12 object-contain mb-2" />
                  <span className="text-sm font-semibold line-clamp-1">{match.teams.home.name}</span>
                </div>
                
                <div className="flex flex-col items-center w-1/5">
                  {isLive || isFinished ? (
                    <div className="flex items-center justify-center text-lg font-bold">
                      <span>{match.goals.home}</span>
                      <span className="mx-1">-</span>
                      <span>{match.goals.away}</span>
                    </div>
                  ) : (
                    <span className="text-sm">{getStatusText()}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-center text-center w-2/5">
                  <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-12 h-12 object-contain mb-2" />
                  <span className="text-sm font-semibold line-clamp-1">{match.teams.away.name}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 flex justify-between bg-white">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{match.fixture.venue.name}, {match.fixture.venue.city}</span>
          </div>
          <Badge variant="outline" className={isLive ? "bg-red-100 text-red-800" : ""}>
            {getStatusText()}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default MatchCard;
