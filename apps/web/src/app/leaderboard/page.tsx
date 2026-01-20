"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Star, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Learner {
    id: string;
    name: string;
    avatar?: string;
    completedCourses: number;
    badgesCount: number;
    points: number;
    rank?: number;
}

interface MyRank {
    rank: number | null;
    stats: Learner | null;
}

export default function LeaderboardPage() {
    const { token, user } = useAuthStore();
    const [leaderboard, setLeaderboard] = useState<Learner[]>([]);
    const [myRank, setMyRank] = useState<MyRank | null>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [lbRes, rankRes] = await Promise.all([
                    axios.get(`${API_URL}/gamification/leaderboard`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/gamification/my-rank`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setLeaderboard(lbRes.data);
                setMyRank(rankRes.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, API_URL]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-muted/20 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground">Top learners across the organization</p>
                </div>

                {/* My Rank Card */}
                {myRank?.stats && (
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-primary/20 shadow-sm">
                                    <span className="text-xl font-bold text-primary">#{myRank.rank || "-"}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">Rank</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">You ({myRank.stats.name})</h3>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {myRank.stats.points} pts</span>
                                        <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {myRank.stats.badgesCount} badges</span>
                                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {myRank.stats.completedCourses} courses</span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant="default" className="text-lg px-4 py-1">
                                {myRank.stats.points} PTS
                            </Badge>
                        </CardContent>
                    </Card>
                )}

                {/* Podium */}
                {topThree.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 items-end justify-center mb-12 min-h-[280px]">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <div className="flex flex-col items-center order-1">
                                <div className="relative mb-4">
                                    <Avatar className="h-20 w-20 border-4 border-gray-300 shadow-lg">
                                        <AvatarImage src={topThree[1].avatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-bold">
                                            {topThree[1].name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                        <span className="font-bold px-2 text-sm">2</span>
                                    </div>
                                </div>
                                <div className="bg-card w-full p-6 pb-0 rounded-t-xl border-t border-x shadow-sm flex flex-col items-center h-48 justify-end">
                                    <p className="font-bold text-center truncate w-full">{topThree[1].name}</p>
                                    <p className="text-sm text-gray-500 font-semibold mb-2">{topThree[1].points} pts</p>
                                    <div className="w-full h-32 bg-gray-200/50 rounded-t-lg bg-gradient-to-t from-gray-300/30 to-transparent" />
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <div className="flex flex-col items-center order-2 -mt-8 z-10">
                                <Crown className="h-10 w-10 text-yellow-500 fill-yellow-500 mb-2 animate-bounce" />
                                <div className="relative mb-4">
                                    <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-xl ring-4 ring-yellow-400/20">
                                        <AvatarImage src={topThree[0].avatar} />
                                        <AvatarFallback className="bg-yellow-100 text-yellow-700 text-2xl font-bold">
                                            {topThree[0].name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                        <span className="font-bold px-2.5">1</span>
                                    </div>
                                </div>
                                <div className="bg-card w-full p-6 pb-0 rounded-t-xl border-t border-x border-yellow-400/30 shadow-md flex flex-col items-center h-60 justify-end relative overflow-hidden">
                                    <div className="absolute inset-0 bg-yellow-400/5" />
                                    <p className="font-bold text-lg text-center truncate w-full z-10">{topThree[0].name}</p>
                                    <p className="text-yellow-600 font-bold mb-2 z-10">{topThree[0].points} pts</p>
                                    <div className="w-full h-44 bg-yellow-400/20 rounded-t-lg bg-gradient-to-t from-yellow-400/30 to-transparent" />
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <div className="flex flex-col items-center order-3">
                                <div className="relative mb-4">
                                    <Avatar className="h-20 w-20 border-4 border-orange-300 shadow-lg">
                                        <AvatarImage src={topThree[2].avatar} />
                                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">
                                            {topThree[2].name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                        <span className="font-bold px-2 text-sm">3</span>
                                    </div>
                                </div>
                                <div className="bg-card w-full p-6 pb-0 rounded-t-xl border-t border-x shadow-sm flex flex-col items-center h-40 justify-end">
                                    <p className="font-bold text-center truncate w-full">{topThree[2].name}</p>
                                    <p className="text-sm text-orange-600/80 font-bold mb-2">{topThree[2].points} pts</p>
                                    <div className="w-full h-24 bg-orange-200/50 rounded-t-lg bg-gradient-to-t from-orange-300/30 to-transparent" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* List View */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Learners</CardTitle>
                        <CardDescription>See who's leading the pack</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {rest.map((learner, index) => (
                                <div key={learner.id} className={cn(
                                    "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                                    learner.id === user?.userId && "bg-primary/5"
                                )}>
                                    <div className="w-8 font-bold text-muted-foreground text-center">
                                        {index + 4}
                                    </div>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={learner.avatar} />
                                        <AvatarFallback>{learner.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">
                                            {learner.name}
                                            {learner.id === user?.userId && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                                        </p>
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center"><Trophy className="h-3 w-3 mr-1" /> {learner.badgesCount} badges</span>
                                            <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {learner.completedCourses} courses</span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-primary">
                                        {learner.points} pts
                                    </div>
                                </div>
                            ))}
                            {rest.length === 0 && topThree.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No data available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
