"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, PlayCircle, FileText, CheckCircle, Circle,
    Loader2, Award, FileQuestion, ChevronRight, Menu, X, Download, MessageSquare, Star, PartyPopper
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CourseDiscussions from "@/components/course-discussions";

export default function LearnPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [markingComplete, setMarkingComplete] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Rating modal state
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchData = async () => {
            try {
                const [courseRes, progressRes] = await Promise.all([
                    axios.get(`${API_URL}/courses/${id}`),
                    axios.get(`${API_URL}/lessons/progress/course/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setCourse(courseRes.data);

                // Select first lesson by default if not set
                if (courseRes.data.modules?.[0]?.lessons?.[0]) {
                    setSelectedLesson(courseRes.data.modules[0].lessons[0]);
                }

                const completed = new Set(progressRes.data.filter((p: any) => p.completed).map((p: any) => p.lessonId));
                setCompletedLessons(completed as Set<string>);
            } catch (error) {
                console.error("Failed to fetch course", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token, isAuthenticated, router, API_URL]);

    const handleMarkComplete = async () => {
        if (!selectedLesson) return;

        setMarkingComplete(true);
        try {
            await axios.post(`${API_URL}/lessons/${selectedLesson.id}/progress`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newCompleted = new Set([...completedLessons, selectedLesson.id]);
            setCompletedLessons(newCompleted);

            // Check if course is now complete (show rating modal)
            const newProgressPercent = totalLessons > 0 ? (newCompleted.size / totalLessons) * 100 : 0;
            if (newProgressPercent >= 100 && !hasReviewed) {
                setTimeout(() => setShowRatingModal(true), 500); // Delay for smooth UX
            }
        } catch (error) {
            console.error("Failed to mark complete", error);
        } finally {
            setMarkingComplete(false);
        }
    };

    const handleSubmitRating = async () => {
        if (rating === 0) return;

        setSubmittingRating(true);
        try {
            await axios.post(`${API_URL}/reviews`, {
                courseId: id,
                rating,
                comment: ratingComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasReviewed(true);
            setShowRatingModal(false);
        } catch (error) {
            console.error("Failed to submit rating", error);
        } finally {
            setSubmittingRating(false);
        }
    };

    const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
    const progressPercent = totalLessons > 0 ? (completedLessons.size / totalLessons) * 100 : 0;
    const isCompleted = progressPercent >= 100;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                        <Link href={`/courses/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                            {course.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-2">
                        <Progress value={progressPercent} className="w-24 h-2" />
                        <span>{Math.round(progressPercent)}% Complete</span>
                    </div>
                    {isCompleted && (
                        <Button size="sm" variant="outline" asChild className="text-xs h-8">
                            <Link href="/certificates"><Award className="mr-1 h-3 w-3" /> Certificate</Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content Area (Player) */}
                <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">

                        {/* Video Player - Only show for video lessons */}
                        {selectedLesson?.videoUrl && (
                            <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video relative group">
                                {selectedLesson.videoUrl.includes("youtube") || selectedLesson.videoUrl.includes("youtu.be") ? (
                                    <iframe
                                        src={selectedLesson.videoUrl.replace("watch?v=", "embed/")}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                ) : (
                                    <video
                                        src={selectedLesson.videoUrl.includes("/uploads")
                                            ? `${process.env.NEXT_PUBLIC_API_URL}${selectedLesson.videoUrl}`.replace('/api/uploads', '/uploads')
                                            : selectedLesson.videoUrl
                                        }
                                        controls
                                        className="w-full h-full"
                                    />
                                )}
                            </div>
                        )}

                        {/* Lesson Header & Actions */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedLesson?.title}</h2>
                                <p className="text-muted-foreground text-sm">
                                    Lesson {selectedLesson?.order || 1} • {selectedLesson?.videoUrl ? "Video" : "Article"}
                                </p>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    onClick={handleMarkComplete}
                                    disabled={markingComplete || completedLessons.has(selectedLesson?.id)}
                                    variant={completedLessons.has(selectedLesson?.id) ? "secondary" : "default"}
                                    className="flex-1 md:flex-none min-w-[140px]"
                                >
                                    {markingComplete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                                        completedLessons.has(selectedLesson?.id) ? <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> :
                                            <Circle className="mr-2 h-4 w-4" />}
                                    {completedLessons.has(selectedLesson?.id) ? "Completed" : "Mark Complete"}
                                </Button>

                                {completedLessons.has(selectedLesson?.id) && (
                                    <Button
                                        onClick={() => {
                                            // Find next lesson
                                            let foundCurrent = false;
                                            let nextLesson = null;
                                            // Flatten lessons
                                            const allLessons = course.modules.flatMap((m: any) => m.lessons);
                                            for (const l of allLessons) {
                                                if (foundCurrent) {
                                                    nextLesson = l;
                                                    break;
                                                }
                                                if (l.id === selectedLesson.id) foundCurrent = true;
                                            }

                                            if (nextLesson) {
                                                setSelectedLesson(nextLesson);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            } else {
                                                // Course complete? Show modal
                                                setShowRatingModal(true);
                                            }
                                        }}
                                        className="flex-1 md:flex-none"
                                    >
                                        Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Tabs: Overview, Resources, Q&A */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="mb-6">
                                <TabsTrigger value="overview">Lesson Content</TabsTrigger>
                                <TabsTrigger value="resources">Resources</TabsTrigger>
                                <TabsTrigger value="discussion">Discussion</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab (Content) */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
                                    {selectedLesson?.content ? (
                                        // Check if content is HTML (starts with < tag) or plain Markdown
                                        selectedLesson.content.trim().startsWith('<') ? (
                                            <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {selectedLesson.content}
                                            </ReactMarkdown>
                                        )
                                    ) : (
                                        <p className="text-muted-foreground italic">No additional text content.</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Resources Tab (Stub for now) */}
                            <TabsContent value="resources">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Attached Files</CardTitle>
                                        <CardDescription>Downloadable resources for this lesson.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Download className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>No resources attached yet.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Discussion Tab */}
                            <TabsContent value="discussion">
                                {/* We can embed the CourseDiscussions component here if it supports lessonId filtering, or just course-wide for now */}
                                {/* For simplicity, we just link to the main discussion page or placeholder */}
                                <div className="text-center py-8">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                                    <h3 className="font-semibold mb-2">Join the Conversation</h3>
                                    <p className="text-muted-foreground mb-4">Have questions? Discuss this course with other students and instructors.</p>
                                    <Button asChild variant="outline">
                                        <Link href={`/courses/${id}/discussions`}>Open Discussion Forum</Link>
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>

                    </div>
                </main>

                {/* Right Sidebar (Playlist) */}
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Right Sidebar (Playlist) */}
                <aside className={`
                    fixed inset-y-0 right-0 z-30 w-80 bg-card border-l transform transition-transform duration-300 ease-in-out
                    md:relative md:transform-none md:w-80 md:block
                    ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
                `}>
                    <div className="flex flex-col h-full bg-card">
                        <div className="p-4 border-b font-semibold bg-muted/10 flex items-center justify-between">
                            <span>Course Content</span>
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-4">
                            {course.modules?.map((module: any, mIndex: number) => (
                                <div key={module.id} className="space-y-1">
                                    <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Section {mIndex + 1}: {module.title}
                                    </h3>
                                    {module.lessons?.map((lesson: any, lIndex: number) => {
                                        const isActive = selectedLesson?.id === lesson.id;
                                        const isCompleted = completedLessons.has(lesson.id);
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    setSelectedLesson(lesson);
                                                    setSidebarOpen(false); // Close on selection (mobile)
                                                }}
                                                className={`
                                                    w-full flex items-start gap-3 p-3 text-left text-sm rounded-lg transition-colors group
                                                    ${isActive ? "bg-primary/10 text-primary border-primary/20 border" : "hover:bg-muted"}
                                                `}
                                            >
                                                <div className={`mt-0.5 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                                                    {isCompleted ? <CheckCircle className="h-4 w-4" /> :
                                                        isActive ? <PlayCircle className="h-4 w-4" /> :
                                                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                                                        {lIndex + 1}. {lesson.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        {lesson.videoUrl ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                                        {lesson.videoUrl ? "Video" : "Reading"}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div >

            {/* Course Completion Rating Modal */}
            <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <PartyPopper className="h-8 w-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl">🎉 Selamat!</DialogTitle>
                        <DialogDescription className="text-base">
                            Anda telah menyelesaikan course <strong>{course?.title}</strong>!
                            <br />Bagaimana pengalaman belajar Anda?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Star Rating */}
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setRatingHover(star)}
                                    onMouseLeave={() => setRatingHover(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-10 w-10 ${star <= (ratingHover || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground/30"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            {rating === 0 ? "Klik bintang untuk memberi rating" :
                                rating === 1 ? "Sangat Buruk 😞" :
                                    rating === 2 ? "Buruk 😕" :
                                        rating === 3 ? "Cukup 😐" :
                                            rating === 4 ? "Bagus 😊" : "Sangat Bagus! 🤩"}
                        </p>

                        {/* Comment */}
                        <Textarea
                            placeholder="Tulis ulasan Anda (opsional)..."
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            className="min-h-[100px]"
                        />

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowRatingModal(false)}
                            >
                                Nanti Saja
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={rating === 0 || submittingRating}
                                onClick={handleSubmitRating}
                            >
                                {submittingRating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kirim Rating
                            </Button>
                        </div>

                        {/* Certificate Link */}
                        <div className="text-center border-t pt-4">
                            <Link href="/certificates" className="text-sm text-primary hover:underline flex items-center justify-center gap-2">
                                <Award className="h-4 w-4" />
                                Lihat Sertifikat Anda
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
