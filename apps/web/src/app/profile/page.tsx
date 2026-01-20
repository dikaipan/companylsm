"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    User,
    Mail,
    Building2,
    Calendar,
    BookOpen,
    Award,
    Clock,
    Trophy,
    Target,
    TrendingUp,
    ChevronRight,
    Pencil,
    Check,
    X,
    Loader2
} from "lucide-react";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    role: string;
    division?: { id: string; name: string; code: string } | null;
    createdAt: string;
}

interface LearningStats {
    totalEnrolled: number;
    completed: number;
    inProgress: number;
    certificates: number;
    totalHours: number;
}

interface RecentCourse {
    id: string;
    title: string;
    progress: number;
    thumbnail?: string;
    category?: { name: string };
}

export default function ProfilePage() {
    const router = useRouter();
    const { token, user, isAuthenticated } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<LearningStats>({
        totalEnrolled: 0,
        completed: 0,
        inProgress: 0,
        certificates: 0,
        totalHours: 0
    });
    const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [saving, setSaving] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchProfileData();
    }, [isAuthenticated, router]);

    const fetchProfileData = async () => {
        try {
            const userRes = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(userRes.data);
            setEditName(userRes.data.name || "");
            setEditEmail(userRes.data.email || "");

            // Fetch enrollments for stats
            const enrollRes = await axios.get(`${API_URL}/enrollments/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const enrollments = enrollRes.data;

            // Fetch certificates
            const certRes = await axios.get(`${API_URL}/certificates/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch badges
            const badgesRes = await axios.get(`${API_URL}/badges/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBadges(badgesRes.data);

            // Calculate stats
            const completed = enrollments.filter((e: any) => e.progress >= 100).length;
            const inProgress = enrollments.filter((e: any) => e.progress > 0 && e.progress < 100).length;

            setStats({
                totalEnrolled: enrollments.length,
                completed,
                inProgress,
                certificates: certRes.data.length,
                totalHours: Math.round(enrollments.length * 2.5) // Estimate
            });

            // Get recent courses (last 3)
            const recent = enrollments
                .filter((e: any) => e.course)
                .slice(0, 3)
                .map((e: any) => ({
                    id: e.course.id,
                    title: e.course.title,
                    progress: e.progress || 0,
                    thumbnail: e.course.thumbnail,
                    category: e.course.category
                }));
            setRecentCourses(recent);

        } catch (error) {
            console.error("Failed to fetch profile data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    const completionRate = stats.totalEnrolled > 0
        ? Math.round((stats.completed / stats.totalEnrolled) * 100)
        : 0;

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await axios.patch(`${API_URL}/auth/profile`, {
                name: editName,
                email: editEmail
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setEditing(false);
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setEditName(profile?.name || "");
        setEditEmail(profile?.email || "");
        setEditing(false);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="container mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
                            {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        {/* User Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold mb-1">
                                {profile?.name || "User"}
                            </h1>
                            <p className="text-white/80 flex items-center justify-center md:justify-start gap-2">
                                <Mail className="h-4 w-4" />
                                {profile?.email}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                                <Badge className="bg-white/20 text-white border-white/30">
                                    {profile?.role}
                                </Badge>
                                {profile?.division && (
                                    <Badge className="bg-white/20 text-white border-white/30">
                                        <Building2 className="h-3 w-3 mr-1" />
                                        {profile.division.name}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-6 text-center">
                            <div>
                                <p className="text-3xl font-bold">{stats.completed}</p>
                                <p className="text-white/70 text-sm">Completed</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats.certificates}</p>
                                <p className="text-white/70 text-sm">Certificates</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{stats.totalHours}h</p>
                                <p className="text-white/70 text-sm">Learning</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Stats */}
                    <div className="space-y-6">
                        {/* Learning Progress */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Learning Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-primary">{completionRate}%</p>
                                    <p className="text-muted-foreground text-sm">Completion Rate</p>
                                </div>
                                <Progress value={completionRate} className="h-3" />

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <BookOpen className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                                        <p className="text-xl font-semibold">{stats.totalEnrolled}</p>
                                        <p className="text-xs text-muted-foreground">Enrolled</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                                        <p className="text-xl font-semibold">{stats.inProgress}</p>
                                        <p className="text-xs text-muted-foreground">In Progress</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <Target className="h-5 w-5 mx-auto text-green-500 mb-1" />
                                        <p className="text-xl font-semibold">{stats.completed}</p>
                                        <p className="text-xs text-muted-foreground">Completed</p>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <Award className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                                        <p className="text-xl font-semibold">{stats.certificates}</p>
                                        <p className="text-xs text-muted-foreground">Certificates</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Info */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-5 w-5 text-primary" />
                                    Account Info
                                </CardTitle>
                                {!editing ? (
                                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {editing ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{profile?.name || "Not set"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{profile?.email}</span>
                                        </div>
                                    </>
                                )}
                                {profile?.division && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{profile.division.name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        Member since {profile?.createdAt
                                            ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long'
                                            })
                                            : 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Recent Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Courses */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        Recent Courses
                                    </CardTitle>
                                    <CardDescription>Your current learning journey</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/my-learning">
                                        View All <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {recentCourses.length === 0 ? (
                                    <div className="text-center py-8">
                                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                        <p className="text-muted-foreground">No courses enrolled yet</p>
                                        <Button asChild className="mt-4">
                                            <Link href="/courses">Browse Courses</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recentCourses.map((course) => (
                                            <Link
                                                key={course.id}
                                                href={`/courses/${course.id}`}
                                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
                                                    📚
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{course.title}</p>
                                                    {course.category && (
                                                        <p className="text-xs text-muted-foreground">{course.category.name}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">{course.progress}%</p>
                                                    <Progress value={course.progress} className="h-1.5 w-20" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Certificates & Badges */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        Achievements
                                    </CardTitle>
                                    <CardDescription>Your earned certificates and badges</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/certificates">
                                        View All <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Certificates Stats */}
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Award className="h-8 w-8 text-purple-500" />
                                            <div>
                                                <p className="font-semibold">Certificates</p>
                                                <p className="text-sm text-muted-foreground">{stats.certificates} earned</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href="/certificates">View</Link>
                                        </Button>
                                    </div>

                                    {/* Badges List */}
                                    <div>
                                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                            <Award className="h-4 w-4 text-blue-500" />
                                            Earned Badges
                                        </h4>
                                        {badges.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">No badges earned yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                {badges.map((userBadge: any) => (
                                                    <div key={userBadge.id} className="flex items-center gap-3 p-2 border rounded-lg bg-card hover:bg-accent/5 transition-colors" title={userBadge.badge.description}>
                                                        <div className="text-2xl">{userBadge.badge.icon}</div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium text-sm truncate">{userBadge.badge.name}</p>
                                                            <p className="text-xs text-muted-foreground">{userBadge.badge.points} pts</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
