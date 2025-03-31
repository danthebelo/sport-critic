
import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const StarRating = ({
  value,
  max = 5,
  onChange,
  readonly = false,
  size = "md"
}: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const getSize = () => {
    switch (size) {
      case "sm": return "w-4 h-4";
      case "lg": return "w-6 h-6";
      default: return "w-5 h-5";
    }
  };
  
  const handleMouseOver = (index: number) => {
    if (readonly) return;
    setHoverValue(index);
  };
  
  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverValue(null);
  };
  
  const handleClick = (index: number) => {
    if (readonly || !onChange) return;
    onChange(index);
  };
  
  const starSize = getSize();
  
  return (
    <div className="flex">
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        const isActive = (hoverValue !== null ? starValue <= hoverValue : starValue <= value);
        
        return (
          <Star
            key={index}
            className={`${starSize} ${
              isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } ${!readonly ? "cursor-pointer" : ""}`}
            onMouseOver={() => handleMouseOver(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
