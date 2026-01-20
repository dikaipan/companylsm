"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, Loader2, Link as IconLink, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Learner {
    id: string;
    name: string;
    avatar?: string;
    points: number;
}

export function LeaderboardWidget() {
    const { token } = useAuthStore();
    const [learners, setLearners] = useState<Learner[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!token) return;
            try {
                const res = await axios.get(`${API_URL}/gamification/leaderboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Take only top 5 for widget
                setLearners(res.data.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch leaderboard widget", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [token, API_URL]);

    if (loading) {
        return (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">Top Learners</CardTitle>
                    </div>
                    <Link href="/leaderboard" className="text-xs text-primary hover:underline flex items-center gap-1">
                        View All <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
                <CardDescription>Leaders on the scoreboard this week</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-4">
                    {learners.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No leaders yet. Be the first!</p>
                    ) : (
                        learners.map((learner, index) => (
                            <div key={learner.id} className="flex items-center gap-3">
                                <div className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                    index === 0 ? "bg-yellow-100 text-yellow-700" :
                                        index === 1 ? "bg-gray-100 text-gray-700" :
                                            index === 2 ? "bg-orange-100 text-orange-700" :
                                                "bg-muted text-muted-foreground"
                                )}>
                                    {index + 1}
                                </div>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={learner.avatar} />
                                    <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate leading-none mb-1">{learner.name}</p>
                                    <p className="text-xs text-muted-foreground">{learner.points} pts</p>
                                </div>
                                {index === 0 && <Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
