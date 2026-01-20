"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseReviews } from "@/components/course-reviews";
import { ArrowLeft, Clock, BarChart, User, BookOpen, PlayCircle, FileText, Loader2, CheckCircle, Star, StarHalf } from "lucide-react";

export default function CourseDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [rating, setRating] = useState({ average: 0, count: 0 });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`${API_URL}/courses/${id}`);
                setCourse(res.data);
            } catch (error) {
                console.error("Failed to fetch course", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchRating = async () => {
            try {
                const res = await axios.get(`${API_URL}/reviews/course/${id}`);
                setRating({ average: res.data.average, count: res.data.count });
            } catch (error) {
                console.error("Failed to fetch rating", error);
            }
        };

        const checkEnrollment = async () => {
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/enrollments/course/${id}/status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setEnrolled(res.data.enrolled);
                    if (res.data.enrollment?.progress) {
                        setProgress(res.data.enrollment.progress);
                        setIsCompleted(res.data.enrollment.progress >= 100);
                    }
                } catch (error) {
                    console.error("Failed to check enrollment", error);
                }
            }
        };

        fetchCourse();
        fetchRating();
        checkEnrollment();
    }, [id, token, API_URL]);

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        setEnrolling(true);
        try {
            await axios.post(`${API_URL}/enrollments/course/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrolled(true);
            alert("Enrolled successfully!");
        } catch (error) {
            console.error("Failed to enroll", error);
            alert("Failed to enroll");
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold">Course not found</h1>
                <Button asChild className="mt-4">
                    <Link href="/courses">Back to Catalog</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-muted/30 border-b">
                <div className="container mx-auto px-6 py-10">
                    <Button variant="ghost" size="sm" asChild className="mb-6">
                        <Link href="/courses">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
                        </Link>
                    </Button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {course.category?.name && (
                                <Badge variant="outline">{course.category.name}</Badge>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{course.title}</h1>
                            <p className="text-muted-foreground text-lg">{course.description || "No description available."}</p>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {course.instructor?.name || "Unknown Instructor"}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {course.duration || "2h"}
                                </span>
                                <span className="flex items-center gap-2">
                                    <BarChart className="h-4 w-4" />
                                    {course.level || "Beginner"}
                                </span>
                                <span className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    {course.modules?.length || 0} Modules
                                </span>
                                <span className="flex items-center gap-2 text-yellow-500 font-medium">
                                    <Star className="h-4 w-4 fill-current" />
                                    {rating.average} ({rating.count} reviews)
                                </span>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardContent className="p-6 space-y-4">
                                    <div className="h-40 bg-blue-100 rounded-lg flex items-center justify-center text-6xl">
                                        🎓
                                    </div>

                                    {enrolled ? (
                                        isCompleted ? (
                                            <div className="space-y-2">
                                                <Badge className="w-full justify-center py-2 bg-green-500 hover:bg-green-600">
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Course Completed
                                                </Badge>
                                                <Button className="w-full" variant="outline" size="lg" asChild>
                                                    <Link href={`/courses/${id}/learn`}>
                                                        <PlayCircle className="mr-2 h-5 w-5" />
                                                        Review Course
                                                    </Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button className="w-full" size="lg" asChild>
                                                <Link href={`/courses/${id}/learn`}>
                                                    <PlayCircle className="mr-2 h-5 w-5" />
                                                    Continue Learning
                                                </Link>
                                            </Button>
                                        )
                                    ) : (
                                        <Button
                                            className="w-full"
                                            size="lg"
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                        >
                                            {enrolling ? (
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            ) : (
                                                <CheckCircle className="mr-2 h-5 w-5" />
                                            )}
                                            {enrolling ? "Enrolling..." : "Enroll Now"}
                                        </Button>
                                    )}

                                    <p className="text-xs text-center text-muted-foreground">
                                        Free for all employees
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="container mx-auto px-6 py-10">
                <Tabs defaultValue="content" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="content">Course Content</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content">
                        <h2 className="text-2xl font-bold mb-6">Modules & Lessons</h2>
                        {course.modules && course.modules.length > 0 ? (
                            <div className="space-y-4">
                                {course.modules.map((module: any, index: number) => (
                                    <Card key={module.id}>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-lg flex items-center gap-3">
                                                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                {module.title}
                                                <Badge variant="secondary" className="ml-auto">
                                                    {module.lessons?.length || 0} lessons
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        {module.lessons && module.lessons.length > 0 && (
                                            <CardContent className="pt-0">
                                                <ul className="space-y-2">
                                                    {module.lessons.map((lesson: any) => (
                                                        <li key={lesson.id} className="flex items-center gap-3 text-sm text-muted-foreground py-2 border-t">
                                                            {lesson.videoUrl ? (
                                                                <PlayCircle className="h-4 w-4 text-blue-500" />
                                                            ) : (
                                                                <FileText className="h-4 w-4 text-green-500" />
                                                            )}
                                                            {lesson.title}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-50" />
                                    <p>No content available yet. Check back soon!</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="reviews">
                        <CourseReviews courseId={id as string} isEnrolled={enrolled} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
