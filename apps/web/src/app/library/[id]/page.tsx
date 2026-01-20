"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PdfViewer } from "@/components/pdf-viewer";
import {
    ArrowLeft,
    BookOpen,
    FileText,
    Video,
    Headphones,
    ExternalLink,
    Bookmark,
    BookmarkCheck,
    Eye,
    Download,
    Loader2,
    Clock,
    FileStack,
    User,
    Tag,
} from "lucide-react";
import { toast } from "sonner";

interface Resource {
    id: string;
    title: string;
    description?: string;
    type: string;
    fileUrl?: string;
    externalUrl?: string;
    thumbnail?: string;
    author?: string;
    tags?: string;
    duration?: string;
    pageCount?: number;
    views: number;
    downloads: number;
    featured: boolean;
    createdAt: string;
    category?: { id: string; name: string; icon: string };
    _count: { bookmarks: number };
}

const typeLabels: Record<string, string> = {
    EBOOK: "E-Book",
    ARTICLE: "Article",
    VIDEO: "Video",
    AUDIO: "Audio",
    LINK: "External Link",
};

export default function ResourceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const resourceId = params.id as string;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated || !resourceId || !token) return;

        // Start timer to record view after 5 seconds of reading
        const viewTimer = setTimeout(async () => {
            try {
                await axios.post(`${API_URL}/library/resources/${resourceId}/view`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("View recorded");
            } catch (error) {
                console.error("Failed to record view", error);
            }
        }, 5000); // 5 seconds threshold

        return () => clearTimeout(viewTimer);
    }, [isAuthenticated, resourceId, token]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchResource();
    }, [isAuthenticated, token, resourceId]);

    const fetchResource = async () => {
        try {
            const [resourceRes, bookmarkRes] = await Promise.all([
                axios.get(`${API_URL}/library/resources/${resourceId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/library/resources/${resourceId}/bookmark`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
            ]);
            setResource(resourceRes.data);
            setIsBookmarked(bookmarkRes.data.bookmarked);
        } catch (error) {
            console.error("Failed to fetch resource", error);
            toast.error("Resource not found");
        } finally {
            setLoading(false);
        }
    };

    const toggleBookmark = async () => {
        try {
            const res = await axios.post(`${API_URL}/library/resources/${resourceId}/bookmark`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsBookmarked(res.data.bookmarked);
            toast.success(res.data.bookmarked ? "Added to bookmarks" : "Removed from bookmarks");
        } catch (error) {
            toast.error("Failed to update bookmark");
        }
    };

    // Get Backend Base URL (remove /api suffix)
    const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");
    console.log("DEBUG: API_URL", API_URL);
    console.log("DEBUG: BACKEND_URL", BACKEND_URL);

    const getFullFileUrl = (path?: string) => {
        if (!path) return "";
        console.log("DEBUG: Original Path", path);

        let finalUrl = "";

        if (path.startsWith("http")) {
            finalUrl = path;
        } else if (path.startsWith("/api/")) {
            // Fix for legacy data: if path incorrectly starts with /api/, strip it
            finalUrl = `${BACKEND_URL}${path.replace(/^\/api/, "")}`;
        } else {
            finalUrl = `${BACKEND_URL}${path}`;
        }

        // FAILSAFE: If URL ends up containing /api/uploads, strip the /api part
        if (finalUrl.includes("/api/uploads/")) {
            console.log("DEBUG: Detected invalid /api/uploads, cleaning up...");
            finalUrl = finalUrl.replace("/api/uploads/", "/uploads/");
        }

        console.log("DEBUG: Final URL", finalUrl);
        return finalUrl;
    };

    const handleDownload = async () => {
        try {
            await axios.post(`${API_URL}/library/resources/${resourceId}/download`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fileUrl = getFullFileUrl(resource?.fileUrl);
            const externalUrl = resource?.externalUrl;

            // Open the file
            if (fileUrl) {
                window.open(fileUrl, '_blank');
            } else if (externalUrl) {
                window.open(externalUrl, '_blank');
            }
        } catch (error) {
            toast.error("Failed to download");
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Resource not found</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const tags = resource.tags?.split(",").map(t => t.trim()).filter(Boolean) || [];
    const fullFileUrl = getFullFileUrl(resource.fileUrl);

    // Check if it is a PDF
    const isPdf = fullFileUrl.toLowerCase().endsWith(".pdf") || (resource.fileUrl?.toLowerCase().endsWith(".pdf"));

    return (
        <div className="min-h-screen bg-muted/20">
            <main className="container mx-auto p-6 md:p-8 max-w-4xl">
                {/* Back Button */}
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                </Button>

                {/* Thumbnail */}
                {resource.thumbnail && (
                    <div className="h-64 w-full rounded-lg overflow-hidden mb-6">
                        <img src={resource.thumbnail} alt={resource.title} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Header Info */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                                {resource.category?.icon} {resource.category?.name || "Uncategorized"}
                            </Badge>
                            <Badge variant="secondary">{typeLabels[resource.type]}</Badge>
                            {resource.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">{resource.title}</h1>
                        {resource.author && (
                            <p className="text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> by {resource.author}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={toggleBookmark}>
                            {isBookmarked ? (
                                <BookmarkCheck className="h-5 w-5 text-primary" />
                            ) : (
                                <Bookmark className="h-5 w-5" />
                            )}
                        </Button>
                        <Button onClick={handleDownload}>
                            {resource.type === "LINK" ? (
                                <>
                                    <ExternalLink className="mr-2 h-4 w-4" /> Open Link
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* PDF Viewer - Article Style */}
                {isPdf && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Document Viewer</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-hidden bg-slate-50">
                            <PdfViewer url={fullFileUrl} />
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" /> Views
                        </div>
                        <p className="text-2xl font-bold">{resource.views}</p>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Download className="h-4 w-4" /> Downloads
                        </div>
                        <p className="text-2xl font-bold">{resource.downloads}</p>
                    </Card>
                    {resource.pageCount && (
                        <Card className="p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileStack className="h-4 w-4" /> Pages
                            </div>
                            <p className="text-2xl font-bold">{resource.pageCount}</p>
                        </Card>
                    )}
                    {resource.duration && (
                        <Card className="p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" /> Duration
                            </div>
                            <p className="text-2xl font-bold">{resource.duration}</p>
                        </Card>
                    )}
                </div>

                {/* Description */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{resource.description || "No description available."}</p>
                    </CardContent>
                </Card>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {tags.map((tag, i) => (
                            <Badge key={i} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                )}

                {/* Video Preview */}
                {resource.type === "VIDEO" && resource.externalUrl && resource.externalUrl.includes("youtube") && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Video Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video">
                                <iframe
                                    src={resource.externalUrl.replace("watch?v=", "embed/")}
                                    className="w-full h-full rounded-lg"
                                    allowFullScreen
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Local Video Preview */}
                {resource.type === "VIDEO" && resource.fileUrl && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Video Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video">
                                <video controls className="w-full h-full rounded-lg">
                                    <source src={getFullFileUrl(resource.fileUrl)} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </main>
        </div>
    );
}
