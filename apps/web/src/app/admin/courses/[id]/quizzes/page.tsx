"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    FileQuestion,
    Users,
    Clock,
    Target,
    Loader2,
    MoreVertical
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quiz {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number;
    createdAt: string;
    _count: {
        questions: number;
        attempts: number;
    };
}

export default function QuizListPage() {
    const { id: courseId } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchQuizzes();
    }, [isAuthenticated, courseId]);

    const fetchQuizzes = async () => {
        try {
            const response = await axios.get(`${API_URL}/quizzes/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizzes(response.data);
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            await axios.delete(`${API_URL}/quizzes/${deleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizzes(quizzes.filter(q => q.id !== deleteId));
        } catch (error) {
            console.error("Failed to delete quiz", error);
            alert("Failed to delete quiz");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6 max-w-5xl">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href={`/admin/courses/${courseId}/edit`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                    </Link>
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Course Quizzes</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage quizzes for this course
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={`/admin/courses/${courseId}/quiz/new`}>
                            <Plus className="mr-2 h-4 w-4" /> Create Quiz
                        </Link>
                    </Button>
                </div>

                {quizzes.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first quiz to test your students' knowledge
                            </p>
                            <Button asChild>
                                <Link href={`/admin/courses/${courseId}/quiz/new`}>
                                    <Plus className="mr-2 h-4 w-4" /> Create Quiz
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl">{quiz.title}</CardTitle>
                                            {quiz.description && (
                                                <CardDescription className="mt-1">
                                                    {quiz.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/courses/${courseId}/quiz/${quiz.id}/edit`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit Quiz
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteId(quiz.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Quiz
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <FileQuestion className="h-4 w-4" />
                                            <span>{quiz._count.questions} Questions</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>{quiz._count.attempts} Attempts</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Target className="h-4 w-4" />
                                            <span>Pass: {quiz.passingScore}%</span>
                                        </div>
                                        {quiz.timeLimit && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>{quiz.timeLimit} min</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the quiz and all associated questions and attempts.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
