"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Loader2, User, Trash2, Reply } from "lucide-react";

interface DiscussionUser {
    id: string;
    name: string | null;
    email: string;
}

interface Discussion {
    id: string;
    content: string;
    userId: string;
    user: DiscussionUser;
    createdAt: string;
    replies?: Discussion[];
    _count?: { replies: number };
}

interface CourseDiscussionsProps {
    courseId: string;
}

export default function CourseDiscussions({ courseId }: CourseDiscussionsProps) {
    const { token, user: currentUser } = useAuthStore();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/discussions/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDiscussions(res.data);
        } catch (error) {
            console.error("Failed to fetch discussions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && courseId) fetchDiscussions();
    }, [token, courseId]);

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/discussions`, {
                content: newPost,
                courseId
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNewPost("");
            fetchDiscussions();
        } catch (error) {
            alert("Failed to post discussion");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/discussions/${parentId}/reply`, {
                content: replyContent
            }, { headers: { Authorization: `Bearer ${token}` } });
            setReplyTo(null);
            setReplyContent("");
            fetchDiscussions();
        } catch (error) {
            alert("Failed to post reply");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this post?")) return;
        try {
            await axios.delete(`${API_URL}/discussions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDiscussions();
        } catch (error) {
            alert("Failed to delete");
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Discussion Forum
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* New Post Input */}
                <div className="space-y-2">
                    <Textarea
                        placeholder="Start a discussion or ask a question..."
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <div className="flex justify-end">
                        <Button onClick={handlePost} disabled={!newPost.trim() || submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Post
                        </Button>
                    </div>
                </div>

                {/* Discussion List */}
                {loading ? (
                    <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                ) : discussions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No discussions yet</p>
                        <p className="text-sm">Be the first to start a conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {discussions.map(discussion => (
                            <div key={discussion.id} className="border rounded-lg p-4 space-y-3">
                                {/* Main Post */}
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">{discussion.user.name || 'Anonymous'}</span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-muted-foreground text-xs">{formatDate(discussion.createdAt)}</span>
                                        </div>
                                        <p className="mt-1 text-sm">{discussion.content}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setReplyTo(replyTo === discussion.id ? null : discussion.id)}
                                            >
                                                <Reply className="h-3 w-3 mr-1" />
                                                Reply {discussion._count?.replies ? `(${discussion._count.replies})` : ''}
                                            </Button>
                                            {(discussion.userId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(discussion.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Reply Input */}
                                {replyTo === discussion.id && (
                                    <div className="ml-12 space-y-2">
                                        <Textarea
                                            placeholder="Write a reply..."
                                            value={replyContent}
                                            onChange={e => setReplyContent(e.target.value)}
                                            className="min-h-[60px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Cancel</Button>
                                            <Button size="sm" onClick={() => handleReply(discussion.id)} disabled={!replyContent.trim() || submitting}>
                                                {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Replies */}
                                {discussion.replies && discussion.replies.length > 0 && (
                                    <div className="ml-12 space-y-3 pt-2 border-t">
                                        {discussion.replies.map(reply => (
                                            <div key={reply.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-sm">{reply.user.name || 'Anonymous'}</span>
                                                        <span className="text-muted-foreground text-xs">{formatDate(reply.createdAt)}</span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-muted-foreground">{reply.content}</p>
                                                </div>
                                                {(reply.userId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500"
                                                        onClick={() => handleDelete(reply.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
