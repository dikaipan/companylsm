"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Trophy, RefreshCw } from "lucide-react";

export default function QuizPage() {
    const { id, quizId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token, isAuthenticated } = useAuthStore();

    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchQuiz = async () => {
            try {
                const [quizRes, attemptsRes] = await Promise.all([
                    axios.get(`${API_URL}/quizzes/${quizId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/quizzes/${quizId}/attempts`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setQuiz(quizRes.data);
                setPreviousAttempts(attemptsRes.data);
            } catch (error) {
                console.error("Failed to fetch quiz", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId, token, isAuthenticated, router, API_URL]);

    const handleStartQuiz = async () => {
        try {
            const res = await axios.post(`${API_URL}/quizzes/${quizId}/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttempt(res.data);
        } catch (error) {
            console.error("Failed to start quiz", error);
        }
    };

    const handleSelectAnswer = (questionId: string, optionId: string) => {
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleSubmit = async () => {
        if (!attempt) return;

        setSubmitting(true);
        try {
            const answerList = Object.entries(answers).map(([questionId, optionId]) => ({
                questionId,
                optionId
            }));

            const res = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, {
                attemptId: attempt.id,
                answers: answerList
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setResult(res.data.result);
        } catch (error) {
            console.error("Failed to submit quiz", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setAttempt(null);
        setAnswers({});
        setResult(null);
        setCurrentQuestionIndex(0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="container mx-auto px-6 py-10 text-center">
                <h1 className="text-2xl font-bold">Quiz not found</h1>
                <Button asChild className="mt-4">
                    <Link href={`/courses/${id}/learn`}>Back to Course</Link>
                </Button>
            </div>
        );
    }

    // Show result screen
    if (result) {
        return (
            <div className="min-h-screen bg-muted/20 py-10">
                <div className="container mx-auto px-6 max-w-2xl">
                    <Card className="text-center">
                        <CardHeader>
                            <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${result.passed ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                {result.passed ? (
                                    <Trophy className="h-10 w-10 text-green-600" />
                                ) : (
                                    <XCircle className="h-10 w-10 text-red-600" />
                                )}
                            </div>
                            <CardTitle className="text-2xl mt-4">
                                {result.passed ? 'Congratulations!' : 'Almost there!'}
                            </CardTitle>
                            <CardDescription>
                                {result.passed
                                    ? 'You passed the quiz!'
                                    : `You need ${quiz.passingScore}% to pass. Try again!`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-5xl font-bold text-primary">{result.score}%</div>
                            <div className="flex justify-center gap-8 text-sm">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{result.correctCount}</div>
                                    <div className="text-muted-foreground">Correct</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-600">{result.totalQuestions - result.correctCount}</div>
                                    <div className="text-muted-foreground">Incorrect</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{result.totalQuestions}</div>
                                    <div className="text-muted-foreground">Total</div>
                                </div>
                            </div>
                            <Progress value={result.score} className="h-3" />
                        </CardContent>
                        <CardFooter className="flex gap-4 justify-center">
                            <Button variant="outline" asChild>
                                <Link href={`/courses/${id}/learn`}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                                </Link>
                            </Button>
                            {!result.passed && (
                                <Button onClick={handleRetry}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // Show quiz intro / start screen
    if (!attempt) {
        const bestAttempt = previousAttempts.length > 0
            ? previousAttempts.reduce((best, current) =>
                (current.score || 0) > (best.score || 0) ? current : best
                , previousAttempts[0])
            : null;

        return (
            <div className="min-h-screen bg-muted/20 py-10">
                <div className="container mx-auto px-6 max-w-2xl">
                    <Button variant="ghost" size="sm" asChild className="mb-6">
                        <Link href={`/courses/${id}/learn`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                        </Link>
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                            {quiz.description && (
                                <CardDescription>{quiz.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    <span>{quiz.questions?.length || 0} Questions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                    <span>Passing: {quiz.passingScore}%</span>
                                </div>
                                {quiz.timeLimit && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{quiz.timeLimit} minutes</span>
                                    </div>
                                )}
                            </div>

                            {bestAttempt && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-1">Your Best Score</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold">{Math.round(bestAttempt.score || 0)}%</span>
                                        {bestAttempt.passed ? (
                                            <Badge className="bg-green-500">Passed</Badge>
                                        ) : (
                                            <Badge variant="destructive">Not Passed</Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" size="lg" onClick={handleStartQuiz}>
                                {previousAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // Quiz taking screen
    const currentQuestion = quiz.questions?.[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / (quiz.questions?.length || 1)) * 100;

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6 max-w-3xl">
                {/* Progress Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>Question {currentQuestionIndex + 1} of {quiz.questions?.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Question Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{currentQuestion?.text}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentQuestion?.options?.map((option: any) => (
                            <button
                                key={option.id}
                                onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${answers[currentQuestion.id] === option.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option.id
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-muted-foreground'
                                        }`}>
                                        {answers[currentQuestion.id] === option.id && (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span>{option.text}</span>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQuestionIndex(i => i - 1)}
                            disabled={currentQuestionIndex === 0}
                        >
                            Previous
                        </Button>

                        {currentQuestionIndex < (quiz.questions?.length || 1) - 1 ? (
                            <Button
                                onClick={() => setCurrentQuestionIndex(i => i + 1)}
                                disabled={!answers[currentQuestion?.id]}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || Object.keys(answers).length !== quiz.questions?.length}
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Submit Quiz
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Question Navigation */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {quiz.questions?.map((q: any, index: number) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`h-10 w-10 rounded-lg text-sm font-medium transition-all ${index === currentQuestionIndex
                                    ? 'bg-primary text-white'
                                    : answers[q.id]
                                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                        : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
