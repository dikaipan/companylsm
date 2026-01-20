"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Save, Plus, Trash2, Edit2, ArrowLeft, FileQuestion, CheckCircle, Building2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Division {
    id: string;
    name: string;
    code: string;
}

interface CourseDivision {
    divisionId: string;
    isMandatory: boolean;
    division: Division;
}

export default function EditCoursePage() {
    const { id } = useParams();
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [courseDivisions, setCourseDivisions] = useState<CourseDivision[]>([]);

    // Dialog states for themed prompts
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [lessonDialogModuleId, setLessonDialogModuleId] = useState<string | null>(null);
    const [lessonDialogTitle, setLessonDialogTitle] = useState("");

    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [moduleDialogTitle, setModuleDialogTitle] = useState("");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'lesson' | 'module' | 'quiz', id: string, name: string } | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (token && id) fetchCourseDetails();
    }, [token, id]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const [courseRes, quizzesRes, divisionsRes] = await Promise.all([
                axios.get(`${API_URL}/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/quizzes/course/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/divisions`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setCourse(courseRes.data);
            setModules(courseRes.data.modules || []);
            setQuizzes(quizzesRes.data || []);
            setDivisions(divisionsRes.data || []);
            setCourseDivisions(courseRes.data.divisions || []);
        } catch (error) {
            console.error("Failed to fetch course", error);
            toast.error("Failed to load course details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.patch(`${API_URL}/courses/${id}`, {
                title: course.title,
                description: course.description,
                price: parseFloat(course.price),
                status: course.status,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Course updated successfully");
        } catch (error) {
            console.error("Failed to update course", error);
            toast.error("Failed to update course");
        } finally {
            setSaving(false);
        }
    };

    // --- Module Management ---
    const openAddModuleDialog = () => {
        setModuleDialogTitle("");
        setModuleDialogOpen(true);
    };

    const handleAddModuleSubmit = async () => {
        if (!moduleDialogTitle.trim()) return;

        try {
            await axios.post(`${API_URL}/modules`, {
                title: moduleDialogTitle,
                courseId: id,
                order: modules.length + 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModuleDialogOpen(false);
            setModuleDialogTitle("");
            fetchCourseDetails();
        } catch (error) {
            console.error("Failed to add module", error);
        }
    };

    // Generic delete confirmation opener
    const openDeleteDialog = (type: 'module' | 'lesson' | 'quiz', id: string, name: string) => {
        setDeleteTarget({ type, id, name });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const { type, id } = deleteTarget;

        try {
            if (type === 'module') {
                await axios.delete(`${API_URL}/modules/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Module deleted successfully");
            } else if (type === 'lesson') {
                await axios.delete(`${API_URL}/lessons/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Lesson deleted successfully");
            } else if (type === 'quiz') {
                await axios.delete(`${API_URL}/quizzes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Quiz deleted successfully");
            }
            fetchCourseDetails();
        } catch (error) {
            toast.error(`Failed to delete ${type}`);
        } finally {
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleEditModule = async (moduleId: string, currentTitle: string) => {
        const title = prompt("Edit Module Title:", currentTitle);
        if (!title || title === currentTitle) return;

        try {
            await axios.patch(`${API_URL}/modules/${moduleId}`, {
                title,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourseDetails();
        } catch (error) {
            toast.error("Failed to update module");
        }
    };


    // --- Lesson Management ---
    const openAddLessonDialog = (moduleId: string) => {
        setLessonDialogModuleId(moduleId);
        setLessonDialogTitle("");
        setLessonDialogOpen(true);
    };

    const handleAddLessonSubmit = async () => {
        if (!lessonDialogTitle.trim() || !lessonDialogModuleId) return;

        try {
            await axios.post(`${API_URL}/lessons`, {
                title: lessonDialogTitle,
                moduleId: lessonDialogModuleId,
                order: 99
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLessonDialogOpen(false);
            setLessonDialogTitle("");
            fetchCourseDetails();
        } catch (error) {
            console.error("Failed to add lesson", error);
        }
    };

    // Removed - now handled by confirmDelete()


    // Removed - now handled by confirmDelete()


    // --- Division Assignment ---
    const handleAssignDivision = async (divisionId: string, isMandatory: boolean = false) => {
        try {
            await axios.post(`${API_URL}/divisions/${divisionId}/courses/${id}`, { isMandatory }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourseDetails();
        } catch (error) {
            toast.error("Failed to assign division");
        }
    };

    const handleRemoveDivision = async (divisionId: string) => {
        try {
            await axios.delete(`${API_URL}/divisions/${divisionId}/courses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourseDetails();
        } catch (error) {
            toast.error("Failed to remove division");
        }
    };

    const handleToggleMandatory = async (divisionId: string, isMandatory: boolean) => {
        // Remove and re-add with new mandatory flag
        try {
            await axios.delete(`${API_URL}/divisions/${divisionId}/courses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await axios.post(`${API_URL}/divisions/${divisionId}/courses/${id}`, { isMandatory }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourseDetails();
        } catch (error) {
            toast.error("Failed to update mandatory status");
        }
    };

    const isAssigned = (divisionId: string) => courseDivisions.some(cd => cd.divisionId === divisionId);


    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
    if (!course) return <div className="p-8 text-center text-red-500">Course not found</div>;

    return (
        <div className="p-6 w-full mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/courses"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
                    <p className="text-muted-foreground">{course.title}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Course Details */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Course Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateCourse} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={course.title}
                                    onChange={e => setCourse({ ...course, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input
                                    type="number"
                                    value={course.price}
                                    onChange={e => setCourse({ ...course, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={course.status}
                                    onValueChange={val => setCourse({ ...course, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="PUBLISHED">Published</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    className="min-h-[150px]"
                                    value={course.description || ''}
                                    onChange={e => setCourse({ ...course, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: Curriculum & Quizzes */}
                <div className="md:col-span-2 space-y-6">
                    {/* Curriculum */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Curriculum</CardTitle>
                            <Button onClick={openAddModuleDialog} size="sm"><Plus className="mr-2 h-4 w-4" /> Add Module</Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {modules.length === 0 && <p className="text-center text-muted-foreground py-8">No modules yet.</p>}

                            {modules.map((module: any) => (
                                <div key={module.id} className="border rounded-lg p-4 bg-muted/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            {module.title}
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditModule(module.id, module.title)}><Edit2 className="h-3 w-3" /></Button>
                                        </h3>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8" onClick={() => openDeleteDialog('module', module.id, module.title)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                                        {module.lessons && module.lessons.map((lesson: any) => (
                                            <div key={lesson.id} className="flex items-center justify-between p-2 rounded hover:bg-background bg-card border text-sm group">
                                                <span>{lesson.title}</span>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/courses/${id}/lessons/${lesson.id}`}>Edit Content</Link>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('lesson', lesson.id, lesson.title)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        <Button variant="ghost" size="sm" className="w-full mt-2 border border-dashed" onClick={() => openAddLessonDialog(module.id)}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Lesson
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Quizzes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileQuestion className="h-5 w-5" /> Quizzes
                                </CardTitle>
                                <CardDescription>Assess student understanding</CardDescription>
                            </div>
                            <Button size="sm" asChild>
                                <Link href={`/admin/courses/${id}/quiz/new`}>
                                    <Plus className="mr-2 h-4 w-4" /> Create Quiz
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {quizzes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>No quizzes yet. Create your first quiz!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {quizzes.map((quiz: any) => (
                                        <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                            <div>
                                                <h4 className="font-medium">{quiz.title}</h4>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span>{quiz._count?.questions || 0} questions</span>
                                                    <span>Pass: {quiz.passingScore}%</span>
                                                    {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{quiz._count?.attempts || 0} attempts</Badge>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('quiz', quiz.id, quiz.title)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Division Assignment */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" /> Division Assignment
                                </CardTitle>
                                <CardDescription>Assign this course to divisions</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Currently Assigned */}
                            {courseDivisions.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Assigned Divisions</h4>
                                    <div className="space-y-2">
                                        {courseDivisions.map((cd) => (
                                            <div key={cd.divisionId} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">
                                                        <Building2 className="h-3 w-3 mr-1" />
                                                        {cd.division.name}
                                                    </Badge>
                                                    {cd.isMandatory && (
                                                        <Badge variant="destructive" className="text-[10px]">MANDATORY</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-2 text-xs">
                                                        <input
                                                            type="checkbox"
                                                            checked={cd.isMandatory}
                                                            onChange={(e) => handleToggleMandatory(cd.divisionId, e.target.checked)}
                                                            className="rounded"
                                                        />
                                                        Mandatory
                                                    </label>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleRemoveDivision(cd.divisionId)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Divisions */}
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Available Divisions</h4>
                                {divisions.filter(d => !isAssigned(d.id)).length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">All divisions are assigned</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {divisions.filter(d => !isAssigned(d.id)).map((div) => (
                                            <Button
                                                key={div.id}
                                                variant="outline"
                                                className="justify-start"
                                                onClick={() => handleAssignDivision(div.id, false)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                {div.name}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Themed Dialog for Adding Lesson */}
            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Lesson</DialogTitle>
                        <DialogDescription>
                            Enter a title for the new lesson.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="lessonTitle">Lesson Title</Label>
                        <Input
                            id="lessonTitle"
                            value={lessonDialogTitle}
                            onChange={(e) => setLessonDialogTitle(e.target.value)}
                            placeholder="e.g., Introduction to React"
                            className="mt-2"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLessonSubmit()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddLessonSubmit} disabled={!lessonDialogTitle.trim()}>
                            Add Lesson
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Themed Dialog for Adding Module */}
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Module</DialogTitle>
                        <DialogDescription>
                            Enter a title for the new module/section.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="moduleTitle">Module Title</Label>
                        <Input
                            id="moduleTitle"
                            value={moduleDialogTitle}
                            onChange={(e) => setModuleDialogTitle(e.target.value)}
                            placeholder="e.g., Getting Started"
                            className="mt-2"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddModuleSubmit()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddModuleSubmit} disabled={!moduleDialogTitle.trim()}>
                            Add Module
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.type === 'module'
                                ? `This will permanently delete the module "${deleteTarget?.name}" and all its lessons.`
                                : deleteTarget?.type === 'lesson'
                                    ? `This will permanently delete the lesson "${deleteTarget?.name}".`
                                    : `This will permanently delete the quiz "${deleteTarget?.name}" and all attempts.`
                            }
                            <br />This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
