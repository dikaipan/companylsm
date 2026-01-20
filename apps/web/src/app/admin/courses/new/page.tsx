"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Save, Building2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Division {
    id: string;
    name: string;
    code: string;
}

interface SelectedDivision {
    divisionId: string;
    isMandatory: boolean;
}

export default function CreateCoursePage() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [selectedDivisions, setSelectedDivisions] = useState<SelectedDivision[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [addingCategory, setAddingCategory] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: 0,
        duration: "",
        level: "Beginner",
        categoryId: "",
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, divRes] = await Promise.all([
                    axios.get(`${API_URL}/categories`),
                    axios.get(`${API_URL}/divisions`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setCategories(catRes.data);
                setDivisions(divRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        if (token) fetchData();
    }, [API_URL, token]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        setAddingCategory(true);
        try {
            const res = await axios.post(`${API_URL}/categories`,
                { name: newCategoryName.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCategories([...categories, res.data]);
            setFormData({ ...formData, categoryId: res.data.id });
            setNewCategoryName("");
        } catch (error) {
            console.error("Failed to add category", error);
            alert("Failed to add category");
        } finally {
            setAddingCategory(false);
        }
    };

    const handleAddDivision = (divisionId: string) => {
        if (selectedDivisions.some(sd => sd.divisionId === divisionId)) return;
        setSelectedDivisions([...selectedDivisions, { divisionId, isMandatory: false }]);
    };

    const handleRemoveDivision = (divisionId: string) => {
        setSelectedDivisions(selectedDivisions.filter(sd => sd.divisionId !== divisionId));
    };

    const handleToggleMandatory = (divisionId: string) => {
        setSelectedDivisions(selectedDivisions.map(sd =>
            sd.divisionId === divisionId ? { ...sd, isMandatory: !sd.isMandatory } : sd
        ));
    };

    const getDivisionName = (divisionId: string) => {
        return divisions.find(d => d.id === divisionId)?.name || "Unknown";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert("Title is required");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                categoryId: formData.categoryId || undefined,
            };
            const res = await axios.post(`${API_URL}/courses`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const courseId = res.data.id;

            // Assign divisions to course
            for (const sd of selectedDivisions) {
                await axios.post(`${API_URL}/divisions/${sd.divisionId}/courses/${courseId}`,
                    { isMandatory: sd.isMandatory },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            alert("Course created successfully!");
            router.push(`/admin/courses/${courseId}/edit`);
        } catch (error) {
            console.error("Failed to create course", error);
            alert("Failed to create course");
        } finally {
            setSaving(false);
        }
    };

    const availableDivisions = divisions.filter(d => !selectedDivisions.some(sd => sd.divisionId === d.id));

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/courses"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
                    <p className="text-muted-foreground">Fill in the details to create a new training course.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>Basic information about the course.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Introduction to Safety Standards"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this course covers..."
                                className="min-h-[100px]"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={value => setFormData({ ...formData, categoryId: value })}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    id="newCategory"
                                    placeholder="Or add new category..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddCategory}
                                    disabled={!newCategoryName.trim() || addingCategory}
                                >
                                    {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                </Button>
                            </div>
                        </div>

                        {/* Division Assignment */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Division Assignment
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Assign this course to specific divisions. Leave empty for all users.
                            </p>

                            {/* Selected Divisions */}
                            {selectedDivisions.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                                    {selectedDivisions.map(sd => (
                                        <div key={sd.divisionId} className="flex items-center gap-1 bg-background border rounded-full pl-3 pr-1 py-1">
                                            <span className="text-sm">{getDivisionName(sd.divisionId)}</span>
                                            {sd.isMandatory && (
                                                <Badge variant="destructive" className="text-[9px] px-1">WAJIB</Badge>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleMandatory(sd.divisionId)}
                                                className="text-xs text-muted-foreground hover:text-foreground px-1"
                                            >
                                                {sd.isMandatory ? "Optional?" : "Wajib?"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDivision(sd.divisionId)}
                                                className="p-1 hover:bg-destructive/10 rounded-full"
                                            >
                                                <X className="h-3 w-3 text-destructive" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Available Divisions */}
                            {availableDivisions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {availableDivisions.map(div => (
                                        <Button
                                            key={div.id}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => handleAddDivision(div.id)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {div.name}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min={0}
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration</Label>
                                <Input
                                    id="duration"
                                    placeholder="e.g., 2h, 3 hours"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="level">Level</Label>
                                <Select
                                    value={formData.level}
                                    onValueChange={value => setFormData({ ...formData, level: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Create Course
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
