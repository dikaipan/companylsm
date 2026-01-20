"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    FileText,
    Calendar,
    Clock,
    Send,
    CheckCircle,
    AlertCircle,
    Loader2,
    Upload
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/file-upload";

interface Assignment {
    id: string;
    title: string;
    dueDate?: string;
    lesson: {
        id: string;
        title: string;
        module?: { courseId: string };
    };
}

interface Submission {
    id: string;
    content?: string;
    fileUrl?: string;
    score?: number;
    feedback?: string;
    submittedAt: string;
}

export default function AssignmentSubmitPage() {
    const { id: courseId, lessonId, assignmentId } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [content, setContent] = useState("");
    const [fileUrl, setFileUrl] = useState("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchData();
    }, [isAuthenticated, assignmentId]);

    const fetchData = async () => {
        try {
            const [assignmentRes, submissionRes] = await Promise.all([
                axios.get(`${API_URL}/assignments/${assignmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/assignments/${assignmentId}/my-submission`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: null }))
            ]);

            setAssignment(assignmentRes.data);
            if (submissionRes.data) {
                setSubmission(submissionRes.data);
                setContent(submissionRes.data.content || "");
                setFileUrl(submissionRes.data.fileUrl || "");
            }
        } catch (error) {
            console.error("Failed to fetch assignment", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !fileUrl.trim()) {
            toast.error("Please provide your answer or upload a file");
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(`${API_URL}/assignments/${assignmentId}/submit`, {
                content: content.trim() || undefined,
                fileUrl: fileUrl.trim() || undefined
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmission(response.data);
            toast.success("Assignment submitted successfully!");
        } catch (error) {
            console.error("Failed to submit assignment", error);
            toast.error("Failed to submit assignment");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    const isOverdue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();
    const isGraded = submission?.score !== null && submission?.score !== undefined;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Assignment not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6 max-w-3xl">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href={`/courses/${courseId}/learn`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                    </Link>
                </Button>

                {/* Assignment Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <Badge variant="outline" className="mb-2">
                                    <FileText className="mr-1 h-3 w-3" /> Assignment
                                </Badge>
                                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                                <CardDescription className="mt-1">
                                    {assignment.lesson.title}
                                </CardDescription>
                            </div>
                            {assignment.dueDate && (
                                <Badge variant={isOverdue ? "destructive" : "secondary"}>
                                    <Calendar className="mr-1 h-3 w-3" />
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Submission Status / Grade */}
                {submission && isGraded && (
                    <Card className="mb-6 border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-500 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-800">Assignment Graded</h3>
                                    <div className="mt-2 flex items-center gap-4">
                                        <div className="text-3xl font-bold text-green-700">
                                            {submission.score}/100
                                        </div>
                                        <div className="text-sm text-green-600">
                                            Submitted: {formatDate(submission.submittedAt)}
                                        </div>
                                    </div>
                                    {submission.feedback && (
                                        <div className="mt-4 p-3 bg-white rounded-md border border-green-200">
                                            <p className="text-sm font-medium text-green-800">Instructor Feedback:</p>
                                            <p className="mt-1 text-sm text-green-700">{submission.feedback}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {submission && !isGraded && (
                    <Card className="mb-6 border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500 rounded-full">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-800">Submitted - Awaiting Grade</h3>
                                    <p className="text-sm text-blue-600">
                                        Submitted: {formatDate(submission.submittedAt)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Submission Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {submission ? "Update Your Submission" : "Submit Your Work"}
                        </CardTitle>
                        <CardDescription>
                            {isGraded
                                ? "Your assignment has been graded. You can view your score and feedback above."
                                : "Provide your answer below. You can submit text, a file URL, or both."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="content">Your Answer</Label>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Write your answer here..."
                                    rows={8}
                                    disabled={isGraded}
                                    className="resize-none"
                                />
                            </div>


                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" /> Upload File (optional)
                                </Label>
                                {!isGraded && (
                                    <FileUpload
                                        value={fileUrl}
                                        onChange={(url: string) => setFileUrl(url)}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.ppt,.pptx,.xls,.xlsx"
                                        label="Upload Assignment File"
                                    />
                                )}
                                {isGraded && fileUrl && (
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="truncate flex-1">Submitted file: {fileUrl.split('/').pop()}</span>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Supported: PDF, Word, TXT, ZIP, PowerPoint, Excel (max 50MB)
                                </p>
                            </div>

                            {!isGraded && (
                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="mr-2 h-4 w-4" />
                                        )}
                                        {submission ? "Update Submission" : "Submit Assignment"}
                                    </Button>
                                    {isOverdue && (
                                        <div className="flex items-center text-sm text-red-500">
                                            <AlertCircle className="mr-1 h-4 w-4" />
                                            Past due date
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
