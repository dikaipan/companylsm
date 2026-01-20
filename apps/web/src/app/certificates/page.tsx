"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, BookOpen, Loader2, ArrowRight, Trophy, Download } from "lucide-react";
import { useTranslations } from "next-intl";

interface Certificate {
    id: string;
    url: string;
    issuedAt: string;
    course: {
        id: string;
        title: string;
        thumbnail?: string;
        category?: { name: string };
        instructor?: { name: string };
    };
}

export default function MyCertificatesPage() {
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const t = useTranslations('certificates');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchCertificates();
    }, [isAuthenticated]);

    const fetchCertificates = async () => {
        try {
            const response = await axios.get(`${API_URL}/certificates/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCertificates(response.data);
        } catch (error) {
            console.error("Failed to fetch certificates", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDownload = async (certId: string, courseTitle: string) => {
        setDownloading(certId);
        try {
            const response = await axios.get(`${API_URL}/certificates/download/${certId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Certificate_${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download certificate", error);
            alert(t('downloadFailed'));
        } finally {
            setDownloading(null);
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
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                        <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{t('title')}</h1>
                        <p className="text-muted-foreground">
                            {t('subtitle')}
                        </p>
                    </div>
                </div>

                {certificates.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                            <h3 className="text-xl font-semibold mb-2">{t('noCertificates')}</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                {t('noCertificatesDesc')}
                            </p>
                            <Button asChild>
                                <Link href="/courses">
                                    <BookOpen className="mr-2 h-4 w-4" /> {t('browseCourses')}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {certificates.map((cert) => (
                            <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                                {/* Certificate Preview Header */}
                                <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Award className="h-16 w-16 text-white/30" />
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-white/20 text-white border-white/30">
                                            {t('certificate')}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="pt-4">
                                    <h3 className="text-lg font-semibold line-clamp-2 mb-2">
                                        {cert.course.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                                        {cert.course.category && (
                                            <Badge variant="outline">{cert.course.category.name}</Badge>
                                        )}
                                        {cert.course.instructor && (
                                            <span>{t('by')} {cert.course.instructor.name}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Calendar className="h-4 w-4" />
                                        <span>{t('issuedOn')}: {formatDate(cert.issuedAt)}</span>
                                    </div>

                                    <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded mb-4">
                                        ID: {cert.url}
                                    </div>

                                    <Button
                                        className="w-full group-hover:bg-primary/90"
                                        onClick={() => handleDownload(cert.id, cert.course.title)}
                                        disabled={downloading === cert.id}
                                    >
                                        {downloading === cert.id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t('downloading')}
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-4 w-4" />
                                                {t('downloadPdf')}
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
