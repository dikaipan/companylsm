"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BookOpen,
    FileText,
    Video,
    Headphones,
    ExternalLink,
    Search,
    Bookmark,
    BookmarkCheck,
    Eye,
    Download,
    Loader2,
    Library,
    Filter,
    Star,
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
    views: number;
    downloads: number;
    featured: boolean;
    category?: { id: string; name: string; icon: string };
    _count: { bookmarks: number };
}

interface Category {
    id: string;
    name: string;
    icon: string;
    _count: { resources: number };
}

const typeIcons: Record<string, any> = {
    EBOOK: BookOpen,
    ARTICLE: FileText,
    VIDEO: Video,
    AUDIO: Headphones,
    LINK: ExternalLink,
};

const typeLabels: Record<string, string> = {
    EBOOK: "E-Book",
    ARTICLE: "Article",
    VIDEO: "Video",
    AUDIO: "Audio",
    LINK: "Link",
};

export default function LibraryPage() {
    const router = useRouter();
    const { token, isAuthenticated } = useAuthStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchData();
    }, [isAuthenticated, token]);

    const fetchData = async () => {
        try {
            const [resourcesRes, categoriesRes, bookmarksRes] = await Promise.all([
                axios.get(`${API_URL}/library/resources`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/library/categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/library/bookmarks`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
            ]);
            setResources(resourcesRes.data);
            setCategories(categoriesRes.data);
            setBookmarkedIds(new Set(bookmarksRes.data.map((b: any) => b.resourceId)));
        } catch (error) {
            console.error("Failed to fetch library data", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBookmark = async (resourceId: string) => {
        try {
            const res = await axios.post(`${API_URL}/library/resources/${resourceId}/bookmark`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.bookmarked) {
                setBookmarkedIds(new Set([...bookmarkedIds, resourceId]));
                toast.success("Added to bookmarks");
            } else {
                const newSet = new Set(bookmarkedIds);
                newSet.delete(resourceId);
                setBookmarkedIds(newSet);
                toast.success("Removed from bookmarks");
            }
        } catch (error) {
            toast.error("Failed to update bookmark");
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = !search ||
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase()) ||
            r.author?.toLowerCase().includes(search.toLowerCase()) ||
            r.tags?.toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedType === "all" || r.type === selectedType;
        const matchesCategory = selectedCategory === "all" || r.category?.id === selectedCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    const featuredResources = filteredResources.filter(r => r.featured);
    const regularResources = filteredResources.filter(r => !r.featured);

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-muted/20">
            <main className="container mx-auto p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Library className="h-8 w-8" /> Digital Library
                        </h1>
                        <p className="text-muted-foreground">Browse e-books, articles, videos, and more resources</p>
                    </div>
                    <Link href="/library/bookmarks">
                        <Button variant="outline">
                            <Bookmark className="mr-2 h-4 w-4" /> My Bookmarks
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search resources..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="EBOOK">📖 E-Books</SelectItem>
                            <SelectItem value="ARTICLE">📄 Articles</SelectItem>
                            <SelectItem value="VIDEO">🎬 Videos</SelectItem>
                            <SelectItem value="AUDIO">🎧 Audio</SelectItem>
                            <SelectItem value="LINK">🔗 Links</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name} ({cat._count.resources})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Featured Section */}
                        {featuredResources.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" /> Featured Resources
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {featuredResources.map(resource => (
                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                            isBookmarked={bookmarkedIds.has(resource.id)}
                                            onToggleBookmark={() => toggleBookmark(resource.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Resources */}
                        <h2 className="text-xl font-semibold mb-4">
                            {search || selectedType !== "all" || selectedCategory !== "all"
                                ? `Search Results (${regularResources.length})`
                                : `All Resources (${regularResources.length})`
                            }
                        </h2>
                        {regularResources.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-lg">
                                <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No resources found</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {regularResources.map(resource => (
                                    <ResourceCard
                                        key={resource.id}
                                        resource={resource}
                                        isBookmarked={bookmarkedIds.has(resource.id)}
                                        onToggleBookmark={() => toggleBookmark(resource.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function ResourceCard({
    resource,
    isBookmarked,
    onToggleBookmark
}: {
    resource: Resource;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
}) {
    const TypeIcon = typeIcons[resource.type] || FileText;

    return (
        <Card className="overflow-hidden hover:shadow-md transition-all group">
            {resource.thumbnail ? (
                <div className="h-32 w-full bg-muted overflow-hidden">
                    <img src={resource.thumbnail} alt={resource.title} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <TypeIcon className="h-12 w-12 text-primary/50" />
                </div>
            )}
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-2 text-xs">
                            {resource.category?.icon} {resource.category?.name || "Uncategorized"}
                        </Badge>
                        <CardTitle className="line-clamp-1 text-base">{resource.title}</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={(e) => { e.preventDefault(); onToggleBookmark(); }}
                    >
                        {isBookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                            <Bookmark className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                {resource.author && (
                    <CardDescription className="text-xs">by {resource.author}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="pb-2">
                <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {resource.views}
                    </span>
                    <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> {resource.downloads}
                    </span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                        {typeLabels[resource.type]}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Link href={`/library/${resource.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                        View Resource
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
