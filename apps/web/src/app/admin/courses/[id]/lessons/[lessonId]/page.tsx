"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft, Video, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import { RichTextEditor } from "@/components/rich-text-editor";

export default function EditLessonPage() {
    const { id: courseId, lessonId } = useParams();
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lesson, setLesson] = useState<any>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (token && lessonId) fetchLessonDetails();
    }, [token, lessonId]);

    const fetchLessonDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLesson(res.data);
        } catch (error) {
            console.error("Failed to fetch lesson", error);
            alert("Failed to load lesson details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.patch(`${API_URL}/lessons/${lessonId}`, {
                title: lesson.title,
                videoUrl: lesson.videoUrl,
                content: lesson.content,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Lesson updated successfully");
            router.push(`/admin/courses/${courseId}/edit`);
        } catch (error) {
            console.error("Failed to update lesson", error);
            alert("Failed to update lesson");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
    if (!lesson) return <div className="p-8 text-center text-red-500">Lesson not found</div>;

    return (
        <div className="p-6 w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/courses/${courseId}/edit`}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Lesson</h1>
                        <p className="text-muted-foreground">{lesson.title}</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/assignments`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Manage Assignments
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lesson Content</CardTitle>
                    <CardDescription>Update the video content or article text.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateLesson} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Lesson Title</Label>
                            <Input
                                value={lesson.title}
                                onChange={e => setLesson({ ...lesson, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-card">
                            <Label className="flex items-center gap-2 mb-2"><Video className="h-4 w-4" /> Video Content</Label>

                            <Tabs defaultValue="upload" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="upload">Upload Video</TabsTrigger>
                                    <TabsTrigger value="url">External URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload">
                                    <div className="space-y-2">
                                        <FileUpload
                                            type="video"
                                            label="Upload Course Video"
                                            value={lesson.videoUrl?.includes("/uploads/") ? lesson.videoUrl : ""}
                                            onChange={(url) => setLesson({ ...lesson, videoUrl: url })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Supported formats: MP4, WebM. Max size: 500MB.
                                        </p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="url">
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="https://youtube.com/..."
                                            value={lesson.videoUrl || ''}
                                            onChange={e => setLesson({ ...lesson, videoUrl: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">Link to a YouTube, Vimeo, or other external resource.</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="space-y-4">
                            <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Article Content</Label>
                            <RichTextEditor
                                value={lesson.content || ''}
                                onChange={(html) => setLesson({ ...lesson, content: html })}
                                placeholder="Start writing your lesson content here..."
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
