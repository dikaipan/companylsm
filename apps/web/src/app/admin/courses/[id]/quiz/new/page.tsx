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
import { ArrowLeft, Plus, Trash2, GripVertical, CheckCircle, Loader2, Save } from "lucide-react";

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
}

export default function CreateQuizPage() {
    const { id: courseId } = useParams();
    const router = useRouter();
    const { token, user, isAuthenticated } = useAuthStore();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [passingScore, setPassingScore] = useState(70);
    const [timeLimit, setTimeLimit] = useState<number | undefined>();
    const [questions, setQuestions] = useState<Question[]>([
        { text: "", points: 1, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }
    ]);
    const [saving, setSaving] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { text: "", points: 1, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }
        ]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
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

        // If setting isCorrect to true, set others to false
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
        if (questions.some(q => !q.text.trim())) {
            alert("Please fill in all question texts");
            return;
        }
        if (questions.some(q => q.options.some(o => !o.text.trim()))) {
            alert("Please fill in all option texts");
            return;
        }
        if (questions.some(q => !q.options.some(o => o.isCorrect))) {
            alert("Each question must have a correct answer");
            return;
        }

        setSaving(true);
        try {
            await axios.post(`${API_URL}/quizzes`, {
                title,
                description,
                passingScore,
                timeLimit,
                courseId,
                questions: questions.map(q => ({
                    text: q.text,
                    points: q.points,
                    options: q.options
                }))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push(`/admin/courses/${courseId}/edit`);
        } catch (error: any) {
            console.error("Failed to create quiz", error);
            alert(error.response?.data?.message || "Failed to create quiz");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6 max-w-4xl">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href={`/admin/courses/${courseId}/edit`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                    </Link>
                </Button>

                <h1 className="text-3xl font-bold mb-8">Create Quiz</h1>

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

                        {questions.map((question, qIndex) => (
                            <Card key={qIndex}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
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
                                                />
                                            </div>
                                            {questions.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeQuestion(qIndex)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
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
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Answer Options</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => addOption(qIndex)}
                                            >
                                                <Plus className="mr-1 h-3 w-3" /> Add Option
                                            </Button>
                                        </div>

                                        {question.options.map((option, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                                                    className={`p-2 rounded-full transition-colors ${option.isCorrect
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-muted text-muted-foreground hover:bg-green-50'
                                                        }`}
                                                    title={option.isCorrect ? "Correct answer" : "Click to mark as correct"}
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                                <Input
                                                    value={option.text}
                                                    onChange={e => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className="flex-1"
                                                    required
                                                />
                                                {question.options.length > 2 && (
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
                                        <p className="text-xs text-muted-foreground">
                                            Click the checkmark to mark the correct answer
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/admin/courses/${courseId}/edit`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Create Quiz
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
