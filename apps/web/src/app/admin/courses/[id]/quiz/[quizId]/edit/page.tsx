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
import { ArrowLeft, Plus, Trash2, CheckCircle, Loader2, Save, AlertCircle } from "lucide-react";
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

interface QuestionOption {
    id?: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: string;
    text: string;
    points: number;
    options: QuestionOption[];
    isNew?: boolean;
    isDeleted?: boolean;
}

interface Quiz {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number;
    questions: Question[];
}

export default function EditQuizPage() {
    const { id: courseId, quizId } = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [passingScore, setPassingScore] = useState(70);
    const [timeLimit, setTimeLimit] = useState<number | undefined>();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchQuiz();
    }, [isAuthenticated, quizId]);

    const fetchQuiz = async () => {
        try {
            const response = await axios.get(`${API_URL}/quizzes/${quizId}/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setQuiz(data);
            setTitle(data.title);
            setDescription(data.description || "");
            setPassingScore(data.passingScore);
            setTimeLimit(data.timeLimit || undefined);
            setQuestions(data.questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                points: q.points,
                options: q.options.map((o: any) => ({
                    id: o.id,
                    text: o.text,
                    isCorrect: o.isCorrect
                }))
            })));
        } catch (error) {
            console.error("Failed to fetch quiz", error);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: "",
                points: 1,
                options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }],
                isNew: true
            }
        ]);
    };

    const removeQuestion = (index: number) => {
        const question = questions[index];
        if (question.id) {
            // Mark existing question for deletion
            setDeleteQuestionId(question.id);
        } else {
            // Remove new question directly
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const confirmDeleteQuestion = async () => {
        if (!deleteQuestionId) return;

        try {
            await axios.delete(`${API_URL}/quizzes/questions/${deleteQuestionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(questions.filter(q => q.id !== deleteQuestionId));
        } catch (error) {
            console.error("Failed to delete question", error);
            alert("Failed to delete question");
        } finally {
            setDeleteQuestionId(null);
        }
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const addOption = (questionIndex: number) => {
        const updated = [...questions];
        updated[questionIndex].options.push({ text: "", isCorrect: false });
        setQuestions(updated);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        if (questions[questionIndex].options.length > 2) {
            const updated = [...questions];
            updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
            setQuestions(updated);
        }
    };

    const updateOption = (questionIndex: number, optionIndex: number, field: keyof QuestionOption, value: any) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex] = {
            ...updated[questionIndex].options[optionIndex],
            [field]: value
        };

        if (field === 'isCorrect' && value === true) {
            updated[questionIndex].options.forEach((opt, i) => {
                if (i !== optionIndex) opt.isCorrect = false;
            });
        }

        setQuestions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!title.trim()) {
            alert("Please enter a quiz title");
            return;
        }

        const activeQuestions = questions.filter(q => !q.isDeleted);
        if (activeQuestions.some(q => !q.text.trim())) {
            alert("Please fill in all question texts");
            return;
        }
        if (activeQuestions.some(q => q.options.some(o => !o.text.trim()))) {
            alert("Please fill in all option texts");
            return;
        }
        if (activeQuestions.some(q => !q.options.some(o => o.isCorrect))) {
            alert("Each question must have a correct answer");
            return;
        }

        setSaving(true);
        try {
            // Update quiz settings
            await axios.patch(`${API_URL}/quizzes/${quizId}`, {
                title,
                description,
                passingScore,
                timeLimit
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Add new questions
            const newQuestions = questions.filter(q => q.isNew && !q.isDeleted);
            for (const q of newQuestions) {
                await axios.post(`${API_URL}/quizzes/${quizId}/questions`, {
                    text: q.text,
                    points: q.points,
                    options: q.options
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            router.push(`/admin/courses/${courseId}/quizzes`);
        } catch (error: any) {
            console.error("Failed to update quiz", error);
            alert(error.response?.data?.message || "Failed to update quiz");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-lg font-semibold">Quiz not found</h2>
                    <Button asChild className="mt-4">
                        <Link href={`/admin/courses/${courseId}/quizzes`}>Back to Quizzes</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6 max-w-4xl">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href={`/admin/courses/${courseId}/quizzes`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
                    </Link>
                </Button>

                <h1 className="text-3xl font-bold mb-8">Edit Quiz</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quiz Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Settings</CardTitle>
                            <CardDescription>Configure your quiz settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Quiz Title *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter quiz title"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Enter quiz description (optional)"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                                    <Input
                                        id="passingScore"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={passingScore}
                                        onChange={e => setPassingScore(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
                                    <Input
                                        id="timeLimit"
                                        type="number"
                                        min={1}
                                        value={timeLimit || ""}
                                        onChange={e => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="No limit"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Questions</h2>
                            <Button type="button" variant="outline" onClick={addQuestion}>
                                <Plus className="mr-2 h-4 w-4" /> Add Question
                            </Button>
                        </div>

                        {questions.filter(q => !q.isDeleted).map((question, qIndex) => (
                            <Card key={question.id || `new-${qIndex}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Question {qIndex + 1}
                                            {question.isNew && (
                                                <span className="ml-2 text-xs text-green-600 font-normal">(new)</span>
                                            )}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Label htmlFor={`points-${qIndex}`}>Points:</Label>
                                                <Input
                                                    id={`points-${qIndex}`}
                                                    type="number"
                                                    min={1}
                                                    value={question.points}
                                                    onChange={e => updateQuestion(qIndex, 'points', Number(e.target.value))}
                                                    className="w-16 h-8"
                                                    disabled={!question.isNew}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeQuestion(qIndex)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Question Text *</Label>
                                        <Textarea
                                            value={question.text}
                                            onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                                            placeholder="Enter your question"
                                            rows={2}
                                            required
                                            disabled={!question.isNew}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Answer Options</Label>
                                            {question.isNew && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addOption(qIndex)}
                                                >
                                                    <Plus className="mr-1 h-3 w-3" /> Add Option
                                                </Button>
                                            )}
                                        </div>

                                        {question.options.map((option, oIndex) => (
                                            <div key={option.id || `new-opt-${oIndex}`} className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => question.isNew && updateOption(qIndex, oIndex, 'isCorrect', true)}
                                                    className={`p-2 rounded-full transition-colors ${option.isCorrect
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-muted text-muted-foreground hover:bg-green-50'
                                                        } ${!question.isNew && 'cursor-default'}`}
                                                    title={option.isCorrect ? "Correct answer" : "Click to mark as correct"}
                                                    disabled={!question.isNew}
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                                <Input
                                                    value={option.text}
                                                    onChange={e => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className="flex-1"
                                                    required
                                                    disabled={!question.isNew}
                                                />
                                                {question.isNew && question.options.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        className="text-muted-foreground hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {question.isNew && (
                                            <p className="text-xs text-muted-foreground">
                                                Click the checkmark to mark the correct answer
                                            </p>
                                        )}
                                        {!question.isNew && (
                                            <p className="text-xs text-muted-foreground">
                                                Existing questions cannot be edited. Delete and recreate if needed.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {questions.filter(q => !q.isDeleted).length === 0 && (
                            <Card className="text-center py-8">
                                <CardContent>
                                    <p className="text-muted-foreground">No questions yet. Add your first question!</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/admin/courses/${courseId}/quizzes`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>

            {/* Delete Question Confirmation */}
            <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this question and all its options.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteQuestion}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
