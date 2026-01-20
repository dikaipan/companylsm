"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, BookOpen, PlusCircle, Settings } from "lucide-react";
import axios from "axios";

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        totalCertificates: 0,
        activeStudents: 0,
        publishedCourses: 0,
        draftCourses: 0,
        percentComplete: 0
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated) router.push("/login");
        if (isAuthenticated && user?.role !== 'ADMIN') router.push("/my-learning");

        const fetchStats = async () => {
            if (isAuthenticated && user?.role === 'ADMIN') {
                try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
                    const { token } = useAuthStore.getState();
                    // Use the new comprehensive analytics endpoint
                    const res = await axios.get(`${API_URL}/analytics/overview`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setStats(res.data);
                } catch (error) {
                    console.error("Failed to fetch stats");
                }
            }
        };

        fetchStats();
    }, [isAuthenticated, user, router]);

    if (!mounted || !isAuthenticated || user?.role !== 'ADMIN') return null;

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage users, content, and platform settings.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/admin/courses">
                            <PlusCircle className="mr-2 h-4 w-4" /> Manage Courses
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4" /> Manage Users
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Total Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">{stats.activeStudents} active students</p>
                    </CardContent>
                </Card>

                {/* Course Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCourses}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.publishedCourses} published, {stats.draftCourses} draft
                        </p>
                    </CardContent>
                </Card>

                {/* Enrollments & Completion */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                        <BarChart className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground">{stats.totalCertificates} certificates earned</p>
                    </CardContent>
                </Card>

                {/* Completion Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <BarChart className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.percentComplete}%</div>
                        <p className="text-xs text-muted-foreground">Average across all courses</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Quick Links & Overview</CardTitle>
                        <CardDescription>
                            Jump to key management areas or view detailed reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/admin/analytics" className="p-4 border rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <BarChart className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                                <div className="font-semibold">Analytics Dashboard</div>
                                <div className="text-sm text-muted-foreground">View detailed reports</div>
                            </div>
                        </Link>
                        <Link href="/admin/badges" className="p-4 border rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                                <Settings className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                            </div>
                            <div>
                                <div className="font-semibold">Badge Management</div>
                                <div className="text-sm text-muted-foreground">Gamification settings</div>
                            </div>
                        </Link>
                        <Link href="/admin/divisions" className="p-4 border rounded-lg hover:bg-muted transition-colors flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                                <Users className="h-6 w-6 text-green-600 dark:text-green-300" />
                            </div>
                            <div>
                                <div className="font-semibold">Division Management</div>
                                <div className="text-sm text-muted-foreground">Manage organizational units</div>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
