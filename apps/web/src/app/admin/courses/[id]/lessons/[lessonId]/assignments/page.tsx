"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Plus,
    FileText,
    Users,
    Calendar,
    Loader2,
    Save,
    Eye,
    CheckCircle
} from "lucide-react";

interface Assignment {
    id: string;
    title: string;
    dueDate?: string;
    _count: { submissions: number };
}

interface Submission {
    id: string;
    content?: string;
    fileUrl?: string;
    score?: number;
    feedback?: string;
    submittedAt: string;
    user: { id: string; name: string; email: string };
}

export default function AssignmentsPage() {
    const { id: courseId, lessonId } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [saving, setSaving] = useState(false);

    // Submissions view
    const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Grading
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [score, setScore] = useState("");
    const [feedback, setFeedback] = useState("");
    const [gradingSaving, setGradingSaving] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchAssignments();
    }, [isAuthenticated, lessonId]);

    const fetchAssignments = async () => {
        try {
            const response = await axios.get(`${API_URL}/assignments/lesson/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(response.data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSaving(true);
        try {
            await axios.post(`${API_URL}/assignments`, {
                title,
                dueDate: dueDate || undefined,
                lessonId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTitle("");
            setDueDate("");
            setShowCreate(false);
            fetchAssignments();
        } catch (error) {
            console.error("Failed to create assignment", error);
        } finally {
            setSaving(false);
        }
    };

    const viewSubmissions = async (assignmentId: string) => {
        setSelectedAssignment(assignmentId);
        setLoadingSubmissions(true);
        try {
            const response = await axios.get(`${API_URL}/assignments/${assignmentId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(response.data);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleGrade = async (submissionId: string) => {
        if (!score) return;

        setGradingSaving(true);
        try {
            await axios.patch(`${API_URL}/assignments/submissions/${submissionId}/grade`, {
                score: parseFloat(score),
                feedback
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGradingId(null);
            setScore("");
            setFeedback("");
            viewSubmissions(selectedAssignment!);
        } catch (error) {
            console.error("Failed to grade submission", error);
        } finally {
            setGradingSaving(false);
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
                    <Link href={`/admin/courses/${courseId}/lessons/${lessonId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lesson
                    </Link>
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Lesson Assignments</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage assignments and grade submissions
                        </p>
                    </div>
                    <Button onClick={() => setShowCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Assignment
                    </Button>
                </div>

                {/* Create Form */}
                {showCreate && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>New Assignment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Assignment title"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dueDate">Due Date (optional)</Label>
                                    <Input
                                        id="dueDate"
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" /> Save
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Assignments List */}
                {assignments.length === 0 && !showCreate ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first assignment for this lesson
                            </p>
                            <Button onClick={() => setShowCreate(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Create Assignment
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{assignment.title}</CardTitle>
                                        <Button variant="outline" size="sm" onClick={() => viewSubmissions(assignment.id)}>
                                            <Eye className="mr-2 h-4 w-4" /> View Submissions
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4" />
                                            <span>{assignment._count.submissions} Submissions</span>
                                        </div>
                                        {assignment.dueDate && (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-4 w-4" />
                                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Submissions Modal */}
                {selectedAssignment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Submissions</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedAssignment(null)}>
                                        Close
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingSubmissions ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No submissions yet</p>
                                ) : (
                                    <div className="space-y-4">
                                        {submissions.map((sub) => (
                                            <Card key={sub.id}>
                                                <CardContent className="pt-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{sub.user.name}</p>
                                                            <p className="text-sm text-muted-foreground">{sub.user.email}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        {sub.score !== null && sub.score !== undefined ? (
                                                            <Badge className="bg-green-500">
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Score: {sub.score}
                                                            </Badge>
                                                        ) : (
                                                            <Button size="sm" onClick={() => {
                                                                setGradingId(sub.id);
                                                                setScore("");
                                                                setFeedback("");
                                                            }}>
                                                                Grade
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {sub.content && (
                                                        <div className="mt-3 p-3 bg-muted rounded-md">
                                                            <p className="text-sm">{sub.content}</p>
                                                        </div>
                                                    )}
                                                    {sub.fileUrl && (
                                                        <a href={sub.fileUrl} target="_blank" className="text-sm text-blue-500 mt-2 block">
                                                            View Attachment
                                                        </a>
                                                    )}
                                                    {sub.feedback && (
                                                        <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                                                            <p className="text-sm font-medium">Feedback:</p>
                                                            <p className="text-sm">{sub.feedback}</p>
                                                        </div>
                                                    )}

                                                    {/* Grading form */}
                                                    {gradingId === sub.id && (
                                                        <div className="mt-4 p-4 border rounded-md space-y-3">
                                                            <div>
                                                                <Label>Score *</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={score}
                                                                    onChange={e => setScore(e.target.value)}
                                                                    placeholder="Enter score"
                                                                    min={0}
                                                                    max={100}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Feedback</Label>
                                                                <Textarea
                                                                    value={feedback}
                                                                    onChange={e => setFeedback(e.target.value)}
                                                                    placeholder="Enter feedback (optional)"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleGrade(sub.id)} disabled={gradingSaving}>
                                                                    {gradingSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                                    Submit Grade
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
