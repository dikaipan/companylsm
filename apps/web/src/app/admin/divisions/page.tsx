"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Pencil, Trash2, Users, BookOpen, ArrowLeft } from "lucide-react";

interface Division {
    id: string;
    name: string;
    code: string | null;
    _count: {
        users: number;
        courses: number;
    };
}

export default function AdminDivisionsPage() {
    const router = useRouter();
    const { token, user } = useAuthStore();
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDivision, setEditingDivision] = useState<Division | null>(null);
    const [formData, setFormData] = useState({ name: "", code: "" });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (user?.role !== "ADMIN") {
            router.push("/");
            return;
        }
        fetchDivisions();
    }, [user, router]);

    const fetchDivisions = async () => {
        try {
            const response = await axios.get(`${API_URL}/divisions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDivisions(response.data);
        } catch (error) {
            console.error("Failed to fetch divisions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingDivision) {
                await axios.patch(`${API_URL}/divisions/${editingDivision.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/divisions`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setDialogOpen(false);
            setEditingDivision(null);
            setFormData({ name: "", code: "" });
            fetchDivisions();
        } catch (error) {
            console.error("Failed to save division", error);
        }
    };

    const handleEdit = (division: Division) => {
        setEditingDivision(division);
        setFormData({ name: division.name, code: division.code || "" });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this division?")) return;
        try {
            await axios.delete(`${API_URL}/divisions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDivisions();
        } catch (error) {
            console.error("Failed to delete division", error);
        }
    };

    const openCreateDialog = () => {
        setEditingDivision(null);
        setFormData({ name: "", code: "" });
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading divisions...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Building2 className="h-8 w-8" />
                            Division Management
                        </h1>
                        <p className="text-muted-foreground">Manage company divisions and assign users</p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>All Divisions</CardTitle>
                            <CardDescription>{divisions.length} divisions total</CardDescription>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openCreateDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Division
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingDivision ? "Edit Division" : "Create Division"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {editingDivision ? "Update division details" : "Add a new division to organize employees"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Division Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Information Technology"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Division Code</Label>
                                        <Input
                                            id="code"
                                            placeholder="e.g., DIV-IT"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSubmit} disabled={!formData.name}>
                                        {editingDivision ? "Update" : "Create"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Division Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-center">Users</TableHead>
                                    <TableHead className="text-center">Courses</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {divisions.map((division) => (
                                    <TableRow key={division.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                {division.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {division.code ? (
                                                <Badge variant="outline">{division.code}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {division._count.users}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                {division._count.courses}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(division)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(division.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {divisions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No divisions yet. Click "Add Division" to create one.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
