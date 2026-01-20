"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Send,
    Reply,
    Trash2,
    Loader2,
    User
} from "lucide-react";

interface DiscussionUser {
    id: string;
    name: string;
    email: string;
}

interface Discussion {
    id: string;
    content: string;
    createdAt: string;
    user: DiscussionUser;
    replies: Discussion[];
    _count?: { replies: number };
}

export default function DiscussionPage() {
    const { id: courseId } = useParams();
    const { token, user, isAuthenticated } = useAuthStore();

    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [posting, setPosting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [replyPosting, setReplyPosting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        if (isAuthenticated) {
            fetchDiscussions();
        }
    }, [isAuthenticated, courseId]);

    const fetchDiscussions = async () => {
        try {
            const response = await axios.get(`${API_URL}/discussions/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDiscussions(response.data);
        } catch (error) {
            console.error("Failed to fetch discussions", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;

        setPosting(true);
        try {
            await axios.post(`${API_URL}/discussions`, {
                content: newPost,
                courseId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewPost("");
            fetchDiscussions();
        } catch (error) {
            console.error("Failed to post discussion", error);
        } finally {
            setPosting(false);
        }
    };

    const handleReply = async (discussionId: string) => {
        if (!replyContent.trim()) return;

        setReplyPosting(true);
        try {
            await axios.post(`${API_URL}/discussions/${discussionId}/reply`, {
                content: replyContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReplyContent("");
            setReplyingTo(null);
            fetchDiscussions();
        } catch (error) {
            console.error("Failed to reply", error);
        } finally {
            setReplyPosting(false);
        }
    };

    const handleDelete = async (discussionId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            await axios.delete(`${API_URL}/discussions/${discussionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDiscussions();
        } catch (error) {
            console.error("Failed to delete discussion", error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-10">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">Course Discussion</h2>
                </div>

                {/* New Post */}
                <Card className="mb-6">
                    <CardContent className="pt-4">
                        <Textarea
                            placeholder="Start a discussion..."
                            value={newPost}
                            onChange={e => setNewPost(e.target.value)}
                            rows={3}
                        />
                        <div className="flex justify-end mt-3">
                            <Button onClick={handlePost} disabled={posting || !newPost.trim()}>
                                {posting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Post
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Discussion List */}
                {discussions.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                            <p className="text-muted-foreground">
                                Be the first to start a discussion!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {discussions.map((discussion) => (
                            <Card key={discussion.id}>
                                <CardContent className="pt-4">
                                    {/* Post Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{discussion.user.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(discussion.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {(user?.id === discussion.user.id || user?.role === 'ADMIN') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-red-500"
                                                onClick={() => handleDelete(discussion.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Post Content */}
                                    <p className="mt-3 text-sm">{discussion.content}</p>

                                    {/* Reply Button */}
                                    <div className="mt-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                                        >
                                            <Reply className="mr-2 h-4 w-4" />
                                            Reply ({discussion.replies?.length || 0})
                                        </Button>
                                    </div>

                                    {/* Reply Form */}
                                    {replyingTo === discussion.id && (
                                        <div className="mt-4 pl-8 border-l-2">
                                            <Textarea
                                                placeholder="Write a reply..."
                                                value={replyContent}
                                                onChange={e => setReplyContent(e.target.value)}
                                                rows={2}
                                                className="text-sm"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <Button size="sm" onClick={() => handleReply(discussion.id)} disabled={replyPosting}>
                                                    {replyPosting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                    Send Reply
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replies */}
                                    {discussion.replies && discussion.replies.length > 0 && (
                                        <div className="mt-4 pl-8 border-l-2 space-y-4">
                                            {discussion.replies.map((reply) => (
                                                <div key={reply.id} className="pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                                            <User className="h-3 w-3" />
                                                        </div>
                                                        <span className="text-sm font-medium">{reply.user.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(reply.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm ml-8">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
