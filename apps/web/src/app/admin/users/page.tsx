"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, RefreshCw, Building2, UploadCloud } from "lucide-react";

interface Division {
    id: string;
    name: string;
    code: string;
}

export default function UsersPage() {
    const { token } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    // ... (fetchUsers, fetchDivisions existing code - keep them if possible, but replace needs context)
    // Wait, I am replacing the block imports down to component start.

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDivisions = async () => {
        try {
            const res = await axios.get(`${API_URL}/divisions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDivisions(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
            fetchDivisions();
        }
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.delete(`${API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            alert("Failed to delete user");
        }
    };

    const handleRoleUpdate = async (id: string, newRole: string) => {
        try {
            await axios.patch(`${API_URL}/users/${id}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            alert("Failed to update role");
        }
    };

    const handleDivisionUpdate = async (id: string, divisionId: string) => {
        try {
            await axios.patch(`${API_URL}/users/${id}/division`, {
                divisionId: divisionId === "none" ? null : divisionId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            alert("Failed to update division");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/users/import`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(`Imported ${res.data.created} users successfully.`);
            if (res.data.errors.length > 0) {
                alert(`Errors:\n${res.data.errors.join('\n')}`);
            }
            fetchUsers();
        } catch (error: any) {
            alert("Import failed: " + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ["Name,Email,Password,Role"];
        const rows = ["John Doe,john@example.com,Welcome123!,STUDENT", "Jane Admin,jane@example.com,SecurePass!,ADMIN"];
        const csvContent = [...headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const getDivisionName = (divisionId: string | null) => {
        if (!divisionId) return null;
        return divisions.find(d => d.id === divisionId)?.name || null;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-2">Manage users, roles, and divisions.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="text-muted-foreground">
                        Download Template
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImport}
                            disabled={uploading}
                        />
                        <Button variant="default" size="sm" disabled={uploading}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {uploading ? 'Importing...' : 'Import CSV'}
                        </Button>
                    </div>
                    <Button onClick={() => { fetchUsers(); fetchDivisions(); }} variant="outline" size="sm">
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
                                <th className="py-4 px-6">Name</th>
                                <th className="py-4 px-6">Email</th>
                                <th className="py-4 px-6">Role</th>
                                <th className="py-4 px-6">Division</th>
                                <th className="py-4 px-6">Joined</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-muted/5 transition-colors">
                                        <td className="py-4 px-6 font-medium text-foreground">{user.name || "No Name"}</td>
                                        <td className="py-4 px-6 text-muted-foreground">{user.email}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'INSTRUCTOR' ? 'default' : 'secondary'}
                                                    className="uppercase text-[10px]"
                                                >
                                                    {user.role}
                                                </Badge>
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) => handleRoleUpdate(user.id, value)}
                                                >
                                                    <SelectTrigger className="h-7 w-[100px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="STUDENT">Student</SelectItem>
                                                        <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {getDivisionName(user.divisionId) && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        <Building2 className="h-3 w-3 mr-1" />
                                                        {getDivisionName(user.divisionId)}
                                                    </Badge>
                                                )}
                                                <Select
                                                    value={user.divisionId || "none"}
                                                    onValueChange={(value) => handleDivisionUpdate(user.id, value)}
                                                >
                                                    <SelectTrigger className="h-7 w-[140px] text-xs">
                                                        <SelectValue placeholder="No Division" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Division</SelectItem>
                                                        {divisions.map(div => (
                                                            <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(user.id)}
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
