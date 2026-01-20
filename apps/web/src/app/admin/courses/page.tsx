"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, Archive, RefreshCw, Loader2, FileEdit, PlusCircle } from "lucide-react";

export default function CoursesAdminPage() {
    const { token } = useAuthStore();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/courses/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(res.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCourses();
    }, [token]);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await axios.patch(`${API_URL}/courses/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourses();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
                    <p className="text-muted-foreground mt-2">Oversee internal training content and approvals.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/admin/courses/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Course
                        </Link>
                    </Button>
                    <Button onClick={fetchCourses} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/40 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="py-4 px-6">Title</th>
                                <th className="py-4 px-6">Instructor</th>
                                <th className="py-4 px-6">Category</th>
                                <th className="py-4 px-6">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" /> Loading...</td></tr>
                            ) : courses.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No courses found.</td></tr>
                            ) : (
                                courses.map(course => (
                                    <tr key={course.id} className="hover:bg-muted/5 transition-colors">
                                        <td className="py-4 px-6 font-medium max-w-xs truncate" title={course.title}>
                                            {course.title}
                                        </td>
                                        <td className="py-4 px-6 text-muted-foreground">
                                            {course.instructor?.name || "Unknown"}
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge variant="outline">{course.category?.name || "Uncategorized"}</Badge>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge variant={course.status === 'PUBLISHED' ? 'default' : course.status === 'ARCHIVED' ? 'secondary' : 'outline'}>
                                                {course.status}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6 text-right flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" asChild title="View Course">
                                                <Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" /></Link>
                                            </Button>
                                            <Button size="icon" variant="ghost" asChild title="Edit Course">
                                                <Link href={`/admin/courses/${course.id}/edit`}><FileEdit className="h-4 w-4" /></Link>
                                            </Button>

                                            {course.status === 'DRAFT' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(course.id, 'PUBLISHED')}>
                                                    <CheckCircle className="h-4 w-4 mr-1" /> Publish
                                                </Button>
                                            )}
                                            {course.status === 'PUBLISHED' && (
                                                <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(course.id, 'ARCHIVED')}>
                                                    <Archive className="h-4 w-4 mr-1" /> Archive
                                                </Button>
                                            )}
                                            {course.status === 'ARCHIVED' && (
                                                <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(course.id, 'DRAFT')}>
                                                    <FileEdit className="h-4 w-4 mr-1" /> Draft
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
