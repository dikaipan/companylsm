"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Plus, Loader2, Trash2, RefreshCw, Users, Medal } from "lucide-react";

interface BadgeType {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    criteria: string;
    points: number;
    _count?: { users: number };
}

interface LeaderboardEntry {
    id: string;
    name: string;
    email: string;
    totalPoints: number;
    badgeCount: number;
    completedCourses: number;
}

export default function BadgesAdminPage() {
    const { token } = useAuthStore();
    const [badges, setBadges] = useState<BadgeType[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newBadge, setNewBadge] = useState({
        name: "",
        description: "",
        icon: "🏆",
        criteria: "",
        points: 100
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const fetchData = async () => {
        setLoading(true);
        try {
            const [badgesRes, leaderboardRes] = await Promise.all([
                axios.get(`${API_URL}/badges`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/badges/leaderboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setBadges(badgesRes.data);
            setLeaderboard(leaderboardRes.data);
        } catch (error) {
            console.error("Failed to fetch badges", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleCreateBadge = async () => {
        if (!newBadge.name.trim() || !newBadge.criteria.trim()) {
            alert("Name and criteria are required");
            return;
        }
        try {
            await axios.post(`${API_URL}/badges`, newBadge, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDialogOpen(false);
            setNewBadge({ name: "", description: "", icon: "🏆", criteria: "", points: 100 });
            fetchData();
        } catch (error) {
            alert("Failed to create badge");
        }
    };

    const handleDeleteBadge = async (id: string) => {
        if (!confirm("Delete this badge?")) return;
        try {
            await axios.delete(`${API_URL}/badges/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert("Failed to delete badge");
        }
    };

    const EMOJI_OPTIONS = ["🏆", "🥇", "🥈", "🥉", "⭐", "🌟", "💎", "🎯", "🚀", "🔥", "💪", "📚", "🎓", "✨", "🏅"];

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Badge Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Create and manage achievement badges for gamification.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Badge
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Badge</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Badge Name</Label>
                                    <Input
                                        placeholder="e.g., First Course Completed"
                                        value={newBadge.name}
                                        onChange={e => setNewBadge({ ...newBadge, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="e.g., Complete your first course"
                                        value={newBadge.description}
                                        onChange={e => setNewBadge({ ...newBadge, description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {EMOJI_OPTIONS.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setNewBadge({ ...newBadge, icon: emoji })}
                                                className={`text-2xl p-2 rounded-lg border transition-colors ${newBadge.icon === emoji ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Criteria (internal code)</Label>
                                    <Input
                                        placeholder="e.g., complete_1_course"
                                        value={newBadge.criteria}
                                        onChange={e => setNewBadge({ ...newBadge, criteria: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Points</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={newBadge.points}
                                        onChange={e => setNewBadge({ ...newBadge, points: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleCreateBadge}>
                                    Create Badge
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Badges Grid */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Medal className="h-5 w-5" />
                                All Badges
                            </CardTitle>
                            <CardDescription>{badges.length} badges available</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {badges.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No badges created yet</p>
                                    <p className="text-sm">Create your first badge to get started</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {badges.map(badge => (
                                        <div key={badge.id} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <span className="text-3xl">{badge.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold">{badge.name}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary">{badge.points} pts</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        <Users className="h-3 w-3 inline mr-1" />
                                                        {badge._count?.users || 0} awarded
                                                    </span>
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="text-red-500 h-8 w-8" onClick={() => handleDeleteBadge(badge.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Leaderboard
                        </CardTitle>
                        <CardDescription>Top performers by points</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                <p className="text-sm">No data yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.slice(0, 10).map((user, index) => (
                                    <div key={user.id} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                    index === 2 ? 'bg-orange-600/20 text-orange-600' :
                                                        'bg-muted text-muted-foreground'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">{user.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {user.badgeCount} badges • {user.completedCourses} courses
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{user.totalPoints}</p>
                                            <p className="text-[10px] text-muted-foreground">pts</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
