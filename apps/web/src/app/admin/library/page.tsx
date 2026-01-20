"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import {
    Plus,
    Trash2,
    Edit2,
    Loader2,
    Library,
    BookOpen,
    FileText,
    Video,
    Headphones,
    ExternalLink,
    Eye,
    Download,
} from "lucide-react";
import { toast } from "sonner";

interface Resource {
    id: string;
    title: string;
    description?: string;
    type: string;
    fileUrl?: string;
    externalUrl?: string;
    author?: string;
    tags?: string;
    views: number;
    downloads: number;
    featured: boolean;
    category?: { id: string; name: string };
}

interface Category {
    id: string;
    name: string;
    icon: string;
    _count: { resources: number };
}

interface Division {
    id: string;
    name: string;
    code: string;
}

const typeOptions = [
    { value: "EBOOK", label: "📖 E-Book", icon: BookOpen },
    { value: "ARTICLE", label: "📄 Article", icon: FileText },
    { value: "VIDEO", label: "🎬 Video", icon: Video },
    { value: "AUDIO", label: "🎧 Audio", icon: Headphones },
    { value: "LINK", label: "🔗 External Link", icon: ExternalLink },
];

export default function AdminLibraryPage() {
    const router = useRouter();
    const { token, user, isAuthenticated } = useAuthStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);

    // Resource Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "EBOOK",
        fileUrl: "",
        externalUrl: "",
        author: "",
        tags: "",
        categoryId: "",
        featured: false,
        pageCount: "",
        duration: "",
        accessType: "PUBLIC",
        divisionId: "",
    });
    const [sourceType, setSourceType] = useState<"upload" | "link">("upload");

    // Category Dialog
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", icon: "📁", description: "" });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (!isAuthenticated || user?.role !== "ADMIN") {
            router.push("/login");
            return;
        }
        fetchData();
    }, [isAuthenticated, user, token]);

    const fetchData = async () => {
        try {
            const [resourcesRes, categoriesRes, divisionsRes] = await Promise.all([
                axios.get(`${API_URL}/library/resources`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/library/categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/users/divisions`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
            ]);
            setResources(resourcesRes.data);
            setCategories(categoriesRes.data);
            setDivisions(divisionsRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingResource(null);
        setFormData({
            title: "", description: "", type: "EBOOK", fileUrl: "", externalUrl: "",
            author: "", tags: "", categoryId: "", featured: false, pageCount: "", duration: "",
            accessType: "PUBLIC", divisionId: ""
        });
        setSourceType("upload");
        setDialogOpen(true);
    };

    const openEditDialog = (resource: any) => {
        setEditingResource(resource);
        setFormData({
            title: resource.title,
            description: resource.description || "",
            type: resource.type,
            fileUrl: resource.fileUrl || "",
            externalUrl: resource.externalUrl || "",
            author: resource.author || "",
            tags: resource.tags || "",
            categoryId: resource.category?.id || "",
            featured: resource.featured,
            pageCount: "",
            duration: "",
            accessType: resource.accessType || "PUBLIC",
            divisionId: resource.divisionId || "",
        });
        setSourceType(resource.fileUrl ? "upload" : "link");
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error("Title is required");
            return;
        }

        const data = {
            ...formData,
            pageCount: formData.pageCount ? parseInt(formData.pageCount) : undefined,
            divisionId: formData.accessType === "DIVISION" ? formData.divisionId : null,
        };

        try {
            if (editingResource) {
                await axios.patch(`${API_URL}/library/resources/${editingResource.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Resource updated");
            } else {
                await axios.post(`${API_URL}/library/resources`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Resource created");
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to save resource");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this resource?")) return;
        try {
            await axios.delete(`${API_URL}/library/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Resource deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const handleCreateCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error("Category name is required");
            return;
        }
        try {
            await axios.post(`${API_URL}/library/categories`, categoryForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Category created");
            setCategoryDialogOpen(false);
            setCategoryForm({ name: "", icon: "📁", description: "" });
            fetchData();
        } catch (error) {
            toast.error("Failed to create category");
        }
    };

    if (!isAuthenticated || user?.role !== "ADMIN") return null;

    return (
        <div className="min-h-screen bg-muted/20">
            <main className="container mx-auto p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Library className="h-8 w-8" /> Library Management
                        </h1>
                        <p className="text-muted-foreground">Manage digital resources and categories</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Add Resource
                        </Button>
                    </div>
                </div>

                {/* Categories */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <Badge key={cat.id} variant="outline" className="px-3 py-1">
                                    {cat.icon} {cat.name} ({cat._count.resources})
                                </Badge>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-muted-foreground text-sm">No categories yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Resources Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Resources ({resources.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {resources.map(resource => (
                                    <div key={resource.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium truncate">{resource.title}</span>
                                                <Badge variant="secondary" className="text-xs">{resource.type}</Badge>
                                                {resource.featured && <Badge className="bg-yellow-500 text-xs">Featured</Badge>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>{resource.category?.name || "Uncategorized"}</span>
                                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {resource.views}</span>
                                                <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {resource.downloads}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(resource)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(resource.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {resources.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">No resources yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Resource Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <Label>Type</Label>
                            <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Select value={formData.categoryId} onValueChange={v => setFormData({ ...formData, categoryId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
                        </div>
                        <div>
                            <Label>Resource Content</Label>
                            <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "upload" | "link")} className="mt-2">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">File Upload</TabsTrigger>
                                    <TabsTrigger value="link">External Link</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="space-y-2 mt-4">
                                    <FileUpload
                                        value={formData.fileUrl}
                                        onChange={(url: string) => setFormData({ ...formData, fileUrl: url, externalUrl: "" })}
                                        type={formData.type === "VIDEO" ? "video" : "file"}
                                        accept={formData.type === "VIDEO" ? "video/*" : ".pdf,.epub,.doc,.docx"}
                                        label={`Upload ${formData.type === "VIDEO" ? "Video" : "Document"}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max size: 100MB. Supported: {formData.type === "VIDEO" ? "MP4, WebM" : "PDF, EPUB, DOC"}
                                    </p>
                                </TabsContent>
                                <TabsContent value="link" className="space-y-2 mt-4">
                                    <Label>External URL</Label>
                                    <Input
                                        value={formData.externalUrl}
                                        onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value, fileUrl: "" })}
                                        placeholder={formData.type === "VIDEO" ? "https://youtube.com/..." : "https://example.com/article"}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Paste a direct link to the resource (YouTube, Website, etc.)
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Author</Label>
                                <Input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                            </div>
                            <div>
                                <Label>Tags (comma separated)</Label>
                                <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="leadership, management" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={formData.featured} onCheckedChange={(v: boolean) => setFormData({ ...formData, featured: v })} />
                            <Label>Featured resource</Label>
                        </div>

                        {/* Access Control Section */}
                        <div className="border-t pt-4 space-y-4">
                            <Label className="font-semibold">🔒 Access Control</Label>
                            <div>
                                <Label>Who can access this resource?</Label>
                                <Select value={formData.accessType} onValueChange={v => setFormData({ ...formData, accessType: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PUBLIC">🌐 All Divisions (Public)</SelectItem>
                                        <SelectItem value="DIVISION">🏢 Specific Division Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.accessType === "DIVISION" && (
                                <div>
                                    <Label>Select Division *</Label>
                                    <Select value={formData.divisionId} onValueChange={v => setFormData({ ...formData, divisionId: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose division..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {divisions.map(div => (
                                                <SelectItem key={div.id} value={div.id}>{div.name} ({div.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingResource ? "Update" : "Create"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                        </div>
                        <div>
                            <Label>Icon (emoji)</Label>
                            <Input value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} placeholder="📚" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateCategory}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
