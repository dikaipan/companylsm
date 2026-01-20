"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Award, Calendar, User, BookOpen, Loader2 } from "lucide-react";

export default function CertificatePage() {
    const { id } = useParams();
    const router = useRouter();
    const { token, user, isAuthenticated } = useAuthStore();
    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchCertificate = async () => {
            try {
                const res = await axios.get(`${API_URL}/certificates/course/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCertificate(res.data);
            } catch (error) {
                console.error("Failed to fetch certificate", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [id, token, isAuthenticated, router, API_URL]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/certificates/generate/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.error) {
                setError(res.data.error);
            } else {
                setCertificate(res.data.certificate);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to generate certificate");
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="container mx-auto px-6 py-10">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href={`/courses/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                    </Link>
                </Button>

                <Card className="max-w-lg mx-auto text-center">
                    <CardContent className="py-12">
                        <Award className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
                        <h2 className="text-2xl font-bold mb-2">Certificate Not Available</h2>
                        <p className="text-muted-foreground mb-6">
                            Complete all lessons in this course to receive your certificate.
                        </p>
                        {error && (
                            <p className="text-red-500 mb-4">{error}</p>
                        )}
                        <Button onClick={handleGenerate} disabled={generating}>
                            {generating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Award className="mr-2 h-4 w-4" />
                            )}
                            Generate Certificate
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                        </Link>
                    </Button>
                    <Button onClick={handlePrint}>
                        <Download className="mr-2 h-4 w-4" /> Download / Print
                    </Button>
                </div>

                {/* Certificate */}
                <div className="max-w-4xl mx-auto">
                    <Card className="overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-1 print:bg-blue-600">
                            <div className="bg-white p-8 md:p-12">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl print:border-2 print:border-blue-600">
                                            Hi
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">
                                            HiLearn
                                        </span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                                        Certificate of Completion
                                    </h1>
                                    <p className="text-gray-500">This certifies that</p>
                                </div>

                                {/* Recipient Name */}
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 border-b-2 border-gray-300 pb-2 inline-block px-8">
                                        {certificate.user?.name || user?.name || 'Student'}
                                    </h2>
                                </div>

                                {/* Course Info */}
                                <div className="text-center mb-8">
                                    <p className="text-gray-600 mb-2">has successfully completed the course</p>
                                    <h3 className="text-2xl md:text-3xl font-semibold text-indigo-600 mb-4">
                                        {certificate.course?.title}
                                    </h3>
                                    <p className="text-gray-500 flex items-center justify-center gap-2">
                                        <User className="h-4 w-4" />
                                        Instructor: {certificate.course?.instructor?.name || 'HiLearn Team'}
                                    </p>
                                </div>

                                {/* Decorative Element */}
                                <div className="flex justify-center mb-8">
                                    <Award className="h-20 w-20 text-yellow-500" />
                                </div>

                                {/* Footer */}
                                <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 border-t pt-6">
                                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                                        <Calendar className="h-4 w-4" />
                                        Issued: {formatDate(certificate.issuedAt)}
                                    </div>
                                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                                        <BookOpen className="h-4 w-4" />
                                        Certificate ID: {certificate.url}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .max-w-4xl, .max-w-4xl * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .max-w-4xl {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .bg-blue-600 {
                        background-color: #2563eb !important;
                    }
                    .text-blue-600 {
                        color: #2563eb !important;
                    }
                    .text-white {
                        color: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
