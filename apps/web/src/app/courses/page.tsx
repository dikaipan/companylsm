"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Clock, BarChart, XCircle, PlayCircle, CheckCircle, Award } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { useTranslations } from "next-intl";

interface Enrollment {
    courseId: string;
    progress: number;
}

export default function CoursesPage() {
    const { token, isAuthenticated } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const t = useTranslations('course');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // For authenticated users, fetch filtered courses by division
                if (isAuthenticated && token) {
                    const response = await axios.get(`${API_URL}/courses/for-me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setCourses(response.data);
                } else {
                    // For anonymous users, fetch all public courses
                    const response = await axios.get(`${API_URL}/courses`);
                    setCourses(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch courses", error);
                // Fallback to public courses
                try {
                    const response = await axios.get(`${API_URL}/courses`);
                    setCourses(response.data);
                } catch (e) {
                    console.error("Fallback failed", e);
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchEnrollments = async () => {
            if (isAuthenticated && token) {
                try {
                    const response = await axios.get(`${API_URL}/enrollments/my`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const progressMap = new Map<string, number>();
                    response.data.forEach((e: Enrollment) => {
                        progressMap.set(e.courseId, e.progress ?? 0);
                    });
                    setEnrollments(progressMap);
                } catch (error) {
                    console.error("Failed to fetch enrollments", error);
                }
            }
        };

        fetchCourses();
        fetchEnrollments();
    }, [API_URL, isAuthenticated, token]);

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? course.category?.name === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(courses.map(c => c.category?.name).filter(Boolean)));

    const getEnrollmentStatus = (courseId: string) => {
        if (!enrollments.has(courseId)) return 'not-enrolled';
        const progress = enrollments.get(courseId) ?? 0;
        return progress >= 100 ? 'completed' : 'in-progress';
    };

    const getProgress = (courseId: string) => enrollments.get(courseId) ?? 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Search Header */}
            <div className="bg-muted/30 border-b py-12">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t('catalogTitle')}</h1>
                    <p className="text-muted-foreground mb-8 text-lg">{t('catalogDescription')}</p>

                    <div className="mx-auto max-w-2xl relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder={t('searchCourses')}
                            className="pl-10 h-12 text-lg rounded-full shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <main className="container mx-auto p-6 md:p-8">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8 items-center">
                    <span className="text-sm font-medium mr-2">{t('categories')}:</span>
                    {categories.map((cat: any) => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className="rounded-full"
                        >
                            {cat}
                        </Button>
                    ))}
                    {selectedCategory && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="ml-2 text-muted-foreground">
                            {t('clear')} <XCircle className="ml-1 h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Course Grid */}
                {loading ? (
                    <p className="text-center text-muted-foreground">{t('loading')}</p>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredCourses.map((course: any) => {
                            const status = getEnrollmentStatus(course.id);
                            const progress = getProgress(course.id);

                            return (
                                <Card key={course.id} className={`flex flex-col overflow-hidden hover:shadow-lg transition-shadow h-full ${status === 'completed' ? 'ring-2 ring-green-500/50' : ''}`}>
                                    <div className={`h-40 w-full flex items-center justify-center text-5xl relative ${status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                                        {status === 'completed' ? '🏆' : '🎓'}
                                        {status === 'completed' && (
                                            <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                                                <CheckCircle className="h-3 w-3 mr-1" /> {t('completed')}
                                            </Badge>
                                        )}
                                        {status === 'in-progress' && (
                                            <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                                                <PlayCircle className="h-3 w-3 mr-1" /> {progress}% {t('done')}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <div className="flex gap-1 flex-wrap">
                                                {course.category?.name ? (
                                                    <Badge variant="outline">{course.category.name}</Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">{t('uncategorized')}</span>
                                                )}
                                                {course.isMandatory && (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5">
                                                        {t('mandatory')}
                                                    </Badge>
                                                )}
                                                {course.forAllDivisions && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5">
                                                        {t('allStaff')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">{course.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                                        <CardDescription className="line-clamp-3 min-h-[4.5rem]">{course.description || t('noDescription')}</CardDescription>

                                        {/* Progress Bar for enrolled courses */}
                                        {status === 'in-progress' && (
                                            <div className="mt-3">
                                                <Progress value={progress} className="h-2" />
                                                <p className="text-xs text-muted-foreground mt-1">{progress}% {t('complete')}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration || '2h'}</span>
                                            <span className="flex items-center gap-1"><BarChart className="h-3 w-3" /> {course.level || 'Beginner'}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 mt-auto">
                                        {status === 'completed' ? (
                                            <div className="w-full flex gap-2">
                                                <Button className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                                                    <Link href="/certificates">
                                                        <Award className="mr-2 h-4 w-4" />
                                                        {t('getCertificate')}
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" className="flex-1" asChild>
                                                    <Link href={`/courses/${course.id}/learn`}>
                                                        {t('review')}
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : status === 'in-progress' ? (
                                            <Button className="w-full" asChild>
                                                <Link href={`/courses/${course.id}/learn`}>
                                                    <PlayCircle className="mr-2 h-4 w-4" />
                                                    {t('continueLearning')}
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button className="w-full" variant="secondary" asChild>
                                                <Link href={`/courses/${course.id}`}>{t('enroll')}</Link>
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-muted/20 rounded-xl">
                        <h3 className="text-xl font-semibold mb-2">{t('noCourses')}</h3>
                        <p className="text-muted-foreground">{t('noCoursesDescription')}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
