"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, X, File, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/auth-store";

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    type?: "video" | "file";
    accept?: string;
    label?: string;
}

export function FileUpload({ value, onChange, type = "video", accept, label = "Upload File" }: FileUploadProps) {
    const { token } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (type === "video" && !file.type.startsWith("video/")) {
            setError("Please upload a valid video file.");
            return;
        }

        setError("");
        setUploading(true);
        setProgress(0);
        setFileName(file.name);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const endpoint = type === "video" ? "/uploads/video" : "/uploads/file";
            const res = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setProgress(percentCompleted);
                },
            });

            // On success
            const fileUrl = res.data.url;
            onChange(fileUrl);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Upload failed. Please try again.");
            setFileName("");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
        setFileName("");
        setProgress(0);
    };

    return (
        <div className="w-full">
            {value ? (
                <div className="relative border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            {type === "video" ? <CheckCircle className="h-5 w-5" /> : <File className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{value.split('/').pop()}</p>
                            <p className="text-xs text-muted-foreground text-green-600">Upload Complete</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={handleRemove}
                            aria-label="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors text-center relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                        accept={accept || (type === "video" ? "video/*" : "*")}
                        disabled={uploading}
                        aria-label={label}
                    />
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                            {uploading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <UploadCloud className="h-5 w-5" />
                            )}
                        </div>
                        <div className="text-sm font-medium">{uploading ? "Uploading..." : label}</div>
                        <div className="text-xs text-muted-foreground">
                            {uploading ? `${progress}%` : "Click or drag file to upload"}
                        </div>
                    </div>
                    {uploading && (
                        <Progress value={progress} className="mt-4 h-2 w-full max-w-xs mx-auto" />
                    )}
                </div>
            )}
            {error && <p className="text-xs text-destructive mt-2" role="alert">{error}</p>}
        </div>
    );
}
