
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { UserProfile } from "@/lib/supabase";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  user_id: string;
  match_id: number;
  rating: number;
  review_text?: string;
  tags?: string[];
  created_at: string;
  profiles: UserProfile;
  likes_count: number;
  comments_count: number;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const timeAgo = formatDistanceToNow(parseISO(review.created_at), { addSuffix: true });
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.profiles.avatar_url} alt={review.profiles.username} />
              <AvatarFallback>
                {review.profiles.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                to={`/users/${review.user_id}`}
                className="text-sm font-medium hover:underline"
              >
                {review.profiles.username}
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <StarRating value={review.rating} readonly size="sm" />
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {review.review_text && (
          <p className="text-sm line-clamp-4 mb-3">{review.review_text}</p>
        )}
        
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {review.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 border-t flex justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{review.likes_count}</span>
          </button>
          
          <button className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{review.comments_count}</span>
          </button>
        </div>
        
        <Link
          to={`/matches/${review.match_id}`}
          className="text-xs text-primary hover:underline"
        >
          View match
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ReviewCard;
