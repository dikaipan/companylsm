import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number; // 0-5
    maxData?: number;
    editable?: boolean;
    onChange?: (rating: number) => void;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, maxData = 5, editable = false, onChange, className, size = "md" }: StarRatingProps) {
    const handleStarClick = (index: number) => {
        if (editable && onChange) {
            onChange(index + 1);
        }
    };

    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-6 w-6"
    };

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {Array.from({ length: maxData }).map((_, index) => {
                const filled = index < Math.floor(rating);
                const half = index === Math.floor(rating) && rating % 1 !== 0; // Simplified half star logic logic

                // For simple stars: 1, 2, 3, 4, 5. 
                // If rating is 3.5: 0<3(full), 1<3(full), 2<3(full), 3=3(half if logic matches)
                // Actually easier: just check index against rating.

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleStarClick(index)}
                        className={cn(
                            "text-yellow-400 transition-transform hover:scale-110",
                            { "cursor-pointer": editable, "cursor-default": !editable }
                        )}
                        disabled={!editable}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                filled ? "fill-current" : "text-muted-foreground/30"
                            )}
                            fill={filled ? "currentColor" : "none"}
                        />
                    </button>
                );
            })}
        </div>
    );
}
