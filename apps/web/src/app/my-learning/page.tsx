"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, PlayCircle, Trophy, BarChart, FileText, CheckCircle, Loader2, Star, Target, Medal } from "lucide-react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { LeaderboardWidget } from "@/components/leaderboard-widget";
import { useTranslations } from "next-intl";


export default function DashboardPage() {
    const router = useRouter();
    const { user, token, isAuthenticated } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [badges, setBadges] = useState<any[]>([]);
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const t = useTranslations('dashboard');
    const tc = useTranslations('common');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchEnrollments = async () => {
            try {
                const response = await axios.get(`${API_URL}/enrollments/my`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Fetch real progress for each enrollment
                const enrichedEnrollments = await Promise.all(
                    response.data.map(async (enrollment: any) => {
                        try {
                            const progressRes = await axios.get(
                                `${API_URL}/enrollments/course/${enrollment.courseId}/status`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            return {
                                ...enrollment,
                                progress: progressRes.data.enrollment?.progress || 0
                            };
                        } catch {
                            return { ...enrollment, progress: 0 };
                        }
                    })
                );

                setEnrollments(enrichedEnrollments);
            } catch (error) {
                console.error("Failed to fetch enrollments", error);
            } finally {
                setLoading(false);
            }
        };

        // Fetch additional stats
        const fetchStats = async () => {
            try {
                const [badgesRes, quizRes, certsRes] = await Promise.all([
                    axios.get(`${API_URL}/badges/my`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/quizzes/my-attempts`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/certificates/my`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
                ]);
                setBadges(badgesRes.data || []);
                setQuizAttempts(quizRes.data || []);
                setCertificates(certsRes.data || []);
            } catch (e) {
                console.error("Failed to fetch additional stats", e);
            }
        };

        if (isAuthenticated && token) {
            fetchEnrollments();
            fetchStats();
        }
    }, [isAuthenticated, token, router, API_URL]);

    const inProgressCount = enrollments.filter(e => e.progress < 100).length;
    const completedCount = enrollments.filter(e => e.progress >= 100).length;

    if (!mounted || !isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-muted/20">
            <main className="container mx-auto p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('coursesInProgress')}</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inProgressCount}</div>
                            <p className="text-xs text-muted-foreground">{t('activeEnrollments')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedCount}</div>
                            <p className="text-xs text-muted-foreground">{t('finishedCourses')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalCourses')}</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{enrollments.length}</div>
                            <p className="text-xs text-muted-foreground">{t('enrolledCourses')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('badgesEarned')}</CardTitle>
                            <Medal className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{badges.length}</div>
                            <p className="text-xs text-muted-foreground">{t('achievementBadges')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('avgQuizScore')}</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {quizAttempts.length > 0
                                    ? Math.round(quizAttempts.reduce((acc, q) => acc + (q.score || 0), 0) / quizAttempts.length)
                                    : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">{quizAttempts.length} {t('quizAttempts')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('certificates')}</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{certificates.length}</div>
                            <p className="text-xs text-muted-foreground">{t('earnedCertificates')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Course List */}
                <h2 className="text-xl font-semibold mb-4">{t('myCourses')}</h2>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : enrollments.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {enrollments.map((enrollment: any) => (
                            <Card key={enrollment.id} className="overflow-hidden transition-all hover:shadow-md">
                                <div className={`h-32 w-full bg-blue-100 flex items-center justify-center text-4xl`}>
                                    🎓
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="text-xs">
                                            {enrollment.course?.category?.name || "Uncategorized"}
                                        </Badge>
                                        {enrollment.progress >= 100 && (
                                            <Badge className="bg-green-500">
                                                <CheckCircle className="mr-1 h-3 w-3" /> Complete
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="line-clamp-1 text-lg">{enrollment.course?.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-xs">
                                        <Clock className="h-3 w-3" /> {enrollment.course?.duration || '2h'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <div className="mb-2 flex items-center justify-between text-xs font-medium">
                                        <span>{t('progress')}</span>
                                        <span>{enrollment.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div
                                            className={`h-2 rounded-full transition-all ${enrollment.progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                                            style={{ width: `${enrollment.progress}%` }}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 flex gap-2">
                                    {enrollment.progress >= 100 ? (
                                        <>
                                            <Button className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" asChild>
                                                <Link href="/certificates">
                                                    <Award className="mr-2 h-4 w-4" /> {t('viewCertificate')}
                                                </Link>
                                            </Button>
                                            <Button variant="outline" className="flex-1" asChild>
                                                <Link href={`/courses/${enrollment.courseId}/learn`}>
                                                    {t('review')}
                                                </Link>
                                            </Button>
                                        </>
                                    ) : (
                                        <Button className="w-full" asChild>
                                            <Link href={`/courses/${enrollment.courseId}/learn`}>
                                                <PlayCircle className="mr-2 h-4 w-4" /> {t('continueLearning')}
                                            </Link>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-4">{t('noCourses')}</p>
                        <Button asChild>
                            <Link href="/courses">{t('browseCatalog')}</Link>
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
