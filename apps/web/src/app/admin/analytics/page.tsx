"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    Users, BookOpen, Award, GraduationCap, TrendingUp,
    BarChart3, Building2, Loader2, Download
} from "lucide-react";

interface OverviewStats {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalCertificates: number;
    activeStudents: number;
    publishedCourses: number;
}

interface CourseCompletion {
    courseId: string;
    courseTitle: string;
    totalEnrollments: number;
    completedCount: number;
    completionRate: number;
}

interface DivisionStats {
    id: string;
    name: string;
    userCount: number;
    courseCount: number;
}

interface TopCourse {
    id: string;
    title: string;
    category: string;
    enrollments: number;
}

interface TopLearner {
    id: string;
    name: string;
    email: string;
    completedCourses: number;
    resourcesRead: number;
    badgesEarned: number;
    totalPoints: number;
    pointsLabel: string;
}

interface QuizAnalytics {
    id: string;
    title: string;
    courseTitle: string;
    avgScore: number;
    passRate: number;
    totalAttempts: number;
}

interface DivisionCompliance {
    id: string;
    name: string;
    complianceRate: number;
    pendingTasks: number;
}

interface DropoutUser {
    userId: string;
    userName: string;
    userEmail: string;
    courseTitle: string;
    progress: number;
    daysStuck: number;
}

interface TimeMetric {
    courseTitle: string;
    avgDays: number;
}

interface LibraryStats {
    totalResources: number;
    totalViews: number;
    totalDownloads: number;
    mostViewed: { id: string; title: string; views: number; type: string }[];
    mostDownloaded: { id: string; title: string; downloads: number; type: string }[];
}

interface LibraryUserActivity {
    recentActivities: {
        id: string;
        userName: string;
        userEmail: string;
        division: string;
        resourceTitle: string;
        resourceType: string;
        activityType: string;
        createdAt: string;
    }[];
    topActiveUsers: {
        userId: string;
        userName: string;
        userEmail: string;
        division: string;
        totalActivities: number;
    }[];
    activityByType: { type: string; count: number }[];
}

export default function AnalyticsPage() {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [completions, setCompletions] = useState<CourseCompletion[]>([]);
    const [divisionStats, setDivisionStats] = useState<DivisionStats[]>([]);
    const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
    const [topLearners, setTopLearners] = useState<TopLearner[]>([]);
    const [quizStats, setQuizStats] = useState<QuizAnalytics[]>([]);
    const [complianceStats, setComplianceStats] = useState<DivisionCompliance[]>([]);
    const [dropouts, setDropouts] = useState<DropoutUser[]>([]);
    const [timeMetrics, setTimeMetrics] = useState<TimeMetric[]>([]);
    const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
    const [libraryUserActivity, setLibraryUserActivity] = useState<LibraryUserActivity | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [
                    overviewRes, completionsRes, divisionsRes, topRes, learnersRes,
                    quizRes, complianceRes, dropoutRes, timeRes, libraryRes, libraryActivityRes
                ] = await Promise.all([
                    axios.get(`${API_URL}/analytics/overview`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/course-completions`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/division-stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/top-courses`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/top-learners`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/quiz-analytics`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/division-compliance`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/dropout-analysis`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/time-to-complete`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/library-stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/analytics/library-user-activity`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setOverview(overviewRes.data);
                setCompletions(completionsRes.data);
                setDivisionStats(divisionsRes.data);
                setTopCourses(topRes.data);
                setTopLearners(learnersRes.data);
                setQuizStats(quizRes.data);
                setComplianceStats(complianceRes.data);
                setDropouts(dropoutRes.data);
                setTimeMetrics(timeRes.data);
                setLibraryStats(libraryRes.data);
                setLibraryUserActivity(libraryActivityRes.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchAnalytics();
    }, [token]);

    const handleExport = () => {
        const date = new Date().toISOString().split('T')[0];
        let csvContent = "data:text/csv;charset=utf-8,";

        // Section 1: Overview
        csvContent += "OVERVIEW\n";
        csvContent += `Total Users,${overview?.totalUsers || 0}\n`;
        csvContent += `Active Students,${overview?.activeStudents || 0}\n`;
        csvContent += `Published Courses,${overview?.publishedCourses || 0}\n`;
        csvContent += `Total Enrollments,${overview?.totalEnrollments || 0}\n`;
        csvContent += `Total Certificates,${overview?.totalCertificates || 0}\n\n`;

        // Section 2: Top Learners
        csvContent += "TOP LEARNERS\n";
        csvContent += "Name,Email,Courses Completed,Badges,Total Points\n";
        topLearners.forEach(l => {
            csvContent += `"${l.name}","${l.email}",${l.completedCourses},${l.badgesEarned},${l.totalPoints}\n`;
        });
        csvContent += "\n";

        // Section 3: Course Completion
        csvContent += "COURSE COMPLETION\n";
        csvContent += "Course,Enrolled,Completed,Rate(%)\n";
        completions.forEach(c => {
            csvContent += `"${c.courseTitle}",${c.totalEnrollments},${c.completedCount},${c.completionRate}\n`;
        });
        csvContent += "\n";

        // Section 4: Quiz Performance
        csvContent += "QUIZ PERFORMANCE\n";
        csvContent += "Quiz,Course,Avg Score,Pass Rate(%),Attempts\n";
        quizStats.forEach(q => {
            csvContent += `"${q.title}","${q.courseTitle}",${q.avgScore},${q.passRate},${q.totalAttempts}\n`;
        });
        csvContent += "\n";

        // Section 5: At Risk Users
        csvContent += "AT RISK LEARNERS (>30 Days Stuck)\n";
        csvContent += "Name,Course,Progress(%),Days Stuck\n";
        dropouts.forEach(d => {
            csvContent += `"${d.userName}","${d.courseTitle}",${d.progress},${d.daysStuck}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `lms_analytics_report_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-8 w-8" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Monitor learning progress and platform performance.
                    </p>
                </div>
                <Button onClick={handleExport} className="shrink-0 gap-2">
                    <Download className="h-4 w-4" />
                    Download Report
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{overview?.totalUsers || 0}</p>
                                <p className="text-xs text-muted-foreground">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <GraduationCap className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{overview?.activeStudents || 0}</p>
                                <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <BookOpen className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{overview?.publishedCourses || 0}</p>
                                <p className="text-xs text-muted-foreground">Courses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{overview?.totalEnrollments || 0}</p>
                                <p className="text-xs text-muted-foreground">Enrollments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                                <Award className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{overview?.totalCertificates || 0}</p>
                                <p className="text-xs text-muted-foreground">Certificates</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                                <Building2 className="h-5 w-5 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{divisionStats.length}</p>
                                <p className="text-xs text-muted-foreground">Divisions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Completion Rates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Course Completion Rates
                        </CardTitle>
                        <CardDescription>Progress tracking by course</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {completions.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No data available</p>
                        ) : (
                            completions.slice(0, 6).map(course => (
                                <div key={course.courseId} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium truncate max-w-[200px]">
                                            {course.courseTitle}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {course.completedCount}/{course.totalEnrollments}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Progress value={course.completionRate} className="h-2 flex-1" />
                                        <span className="text-xs font-medium w-10 text-right">
                                            {course.completionRate}%
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Top Courses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top Courses
                        </CardTitle>
                        <CardDescription>Most popular courses by enrollment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topCourses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No data available</p>
                        ) : (
                            <div className="space-y-3">
                                {topCourses.slice(0, 5).map((course, index) => (
                                    <div key={course.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                index === 2 ? 'bg-orange-600/20 text-orange-600' :
                                                    'bg-muted text-muted-foreground'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{course.title}</p>
                                            <p className="text-xs text-muted-foreground">{course.category}</p>
                                        </div>
                                        <Badge variant="secondary">{course.enrollments} enrolled</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Learners (Employees) - NEW */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Top Learner
                        </CardTitle>
                        <CardDescription>Leaders by courses & badges earned</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topLearners.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No data available</p>
                        ) : (
                            <div className="space-y-3">
                                {topLearners.slice(0, 5).map((learner, index) => (
                                    <div key={learner.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                            index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                index === 2 ? 'bg-orange-600/20 text-orange-600' :
                                                    'bg-muted text-muted-foreground'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{learner.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {learner.completedCourses} Courses • {learner.resourcesRead || 0} Reads • {learner.badgesEarned} Badges
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-sm block">{learner.totalPoints} pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                </Card>

                {/* Risk Analysis (Stuck Users) - Moved here to fill space */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">📉 At-Risk Learners</CardTitle>
                        <CardDescription>Enrolled {">"}30 days, {"<"}10% progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {dropouts.length === 0 ? <p className="text-sm text-center py-2">No users at risk.</p> :
                                dropouts.slice(0, 5).map((u, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded dark:bg-red-900/20">
                                        <div>
                                            <p className="font-semibold">{u.userName}</p>
                                            <p className="text-xs text-muted-foreground">{u.courseTitle}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="destructive">{u.daysStuck} days</Badge>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Division Stats (Full Width) */}
                <Card className="lg:col-span-2 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Division Overview
                        </CardTitle>
                        <CardDescription>Users and courses by division</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {divisionStats.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No divisions created</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {divisionStats.map(div => (
                                    <div key={div.id} className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <h4 className="font-semibold">{div.name}</h4>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-muted-foreground">
                                                <Users className="h-3 w-3 inline mr-1" />
                                                {div.userCount} users
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                <BookOpen className="h-3 w-3 inline mr-1" />
                                                {div.courseCount} courses
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>


                {/* New Analytics Section: Advanced Insights */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    <h2 className="lg:col-span-2 text-2xl font-bold tracking-tight">Advanced Metrics</h2>

                    {/* Quiz Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">📊 Quiz Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quizStats.slice(0, 5).map(q => (
                                <div key={q.id} className="space-y-1">
                                    <div className="flex justify-between font-medium text-sm">
                                        <span>{q.title}</span>
                                        <span className={q.passRate > 70 ? "text-green-600" : "text-red-500"}>
                                            {q.passRate}% Pass Rate
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Avg Score: {q.avgScore}%</span>
                                        <span>{q.totalAttempts} attempts</span>
                                    </div>
                                    <Progress value={q.passRate} className="h-1.5" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Division Compliance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">🏢 Compliance Tracking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {complianceStats.map(div => (
                                <div key={div.id} className="space-y-1">
                                    <div className="flex justify-between font-medium text-sm">
                                        <span>{div.name}</span>
                                        <span>{div.complianceRate}%</span>
                                    </div>
                                    <Progress value={div.complianceRate} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-right">{div.pendingTasks} pending tasks</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>



                    {/* Time to Complete */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">⏱️ Training Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {timeMetrics.slice(0, 5).map((t, i) => (
                                    <div key={i} className="flex justify-between p-2 border-b last:border-0 hover:bg-muted/50">
                                        <span className="text-sm font-medium">{t.courseTitle}</span>
                                        <span className="text-sm font-bold">{t.avgDays} days avg</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Library Analytics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">📚 Library Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{libraryStats?.totalViews || 0}</p>
                                    <p className="text-xs text-muted-foreground">Total Views</p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{libraryStats?.totalDownloads || 0}</p>
                                    <p className="text-xs text-muted-foreground">Downloads</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Most Viewed</h4>
                                    {libraryStats?.mostViewed.length === 0 ? <p className="text-xs text-muted-foreground">No data</p> :
                                        libraryStats?.mostViewed.map(r => (
                                            <div key={r.id} className="flex justify-between text-xs py-1">
                                                <span className="truncate max-w-[70%]">{r.title}</span>
                                                <span className="font-semibold">{r.views}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Library Activity - NEW */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">👤 User Library Activity</CardTitle>
                            <CardDescription>Who is viewing/downloading resources</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Activity by Type Summary */}
                            <div className="flex gap-4 mb-4">
                                {libraryUserActivity?.activityByType.map(t => (
                                    <div key={t.type} className="px-3 py-2 bg-muted/50 rounded-lg text-center">
                                        <p className="font-bold">{t.count}</p>
                                        <p className="text-xs text-muted-foreground">{t.type}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Top Active Users */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium mb-2">Top Active Users</h4>
                                <div className="space-y-2">
                                    {libraryUserActivity?.topActiveUsers.slice(0, 5).map((u, i) => (
                                        <div key={u.userId} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-600' : 'bg-muted'}`}>{i + 1}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{u.userName}</p>
                                                <p className="text-xs text-muted-foreground">{u.division}</p>
                                            </div>
                                            <Badge variant="secondary">{u.totalActivities} activities</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity Log */}
                            <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {libraryUserActivity?.recentActivities.slice(0, 15).map(a => (
                                    <div key={a.id} className="flex justify-between items-center text-xs p-2 border-b last:border-0 hover:bg-muted/50">
                                        <div>
                                            <span className="font-medium">{a.userName}</span>
                                            <span className="text-muted-foreground"> {a.activityType.toLowerCase()} </span>
                                            <span className="font-medium">{a.resourceTitle}</span>
                                        </div>
                                        <span className="text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                                {(!libraryUserActivity?.recentActivities || libraryUserActivity.recentActivities.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
