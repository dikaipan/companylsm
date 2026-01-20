"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Loader2, User } from "lucide-react";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    message: string;
    senderId: string;
    createAt: string;
    sender: {
        id: string;
        name?: string;
        avatar?: string;
    };
}

export function ChatWidget() {
    const { token, user, isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [agent, setAgent] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    // WebSocket URL (usually base URL without /api)
    const WS_URL = API_URL.replace("/api", "");

    useEffect(() => {
        if (isOpen && isAuthenticated && token) {
            // 1. Fetch Support Agent
            fetchSupportAgent();
        }
    }, [isOpen, isAuthenticated, token]);

    useEffect(() => {
        // Connect Socket
        if (isAuthenticated && token && !socketRef.current) {
            socketRef.current = io(WS_URL, {
                auth: { token: `Bearer ${token}` },
            });

            socketRef.current.on("newMessage", (data: Message) => {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
            });

            return () => {
                socketRef.current?.disconnect();
                socketRef.current = null;
            };
        }
    }, [isAuthenticated, token, WS_URL]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const fetchSupportAgent = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/chat/support-agent`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const agentData = res.data;
            if (agentData) {
                setAgent(agentData);
                // Fetch History with this agent
                fetchHistory(agentData.id);
            }
        } catch (error) {
            console.error("Failed to fetch support agent", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (otherUserId: string) => {
        try {
            const res = await axios.get(`${API_URL}/chat/messages/${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSend = () => {
        if (!newMessage.trim() || !agent || !socketRef.current) return;

        const payload = {
            receiverId: agent.id,
            message: newMessage
        };

        // Optimistic update
        const tempMsg: Message = {
            id: Date.now().toString(),
            message: newMessage,
            senderId: user?.id || 'me',
            createAt: new Date().toISOString(),
            sender: {
                id: user?.id || 'me',
                name: user?.name || 'Me',
                avatar: user?.avatar || undefined
            }
        };
        setMessages(prev => [...prev, tempMsg]);

        socketRef.current.emit("sendMessage", payload);
        setNewMessage("");
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <Card className="w-80 md:w-96 shadow-2xl border-primary/20">
                    <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Live Support
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col h-[400px]">
                        {/* Messages Area */}
                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : !agent ? (
                                <div className="text-center text-muted-foreground py-10 px-4 text-sm">
                                    <p>Connecting to support...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10 px-4 text-sm">
                                    <p>Start a conversation with <strong>{agent.name}</strong></p>
                                    <p className="text-xs mt-1">Usually replies within minutes.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    // Handle optimistic messages that might lack sender info
                                    const isMe = msg.senderId === user?.id || msg.senderId === 'me';
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-full",
                                                isMe ? "justify-start" : "justify-end"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex gap-2 max-w-[85%]",
                                                !isMe ? "flex-row-reverse" : "flex-row"
                                            )}>
                                                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                                                    <AvatarImage src={isMe ? user?.avatar : msg.sender?.avatar} />
                                                    <AvatarFallback>{isMe ? 'ME' : msg.sender?.name?.charAt(0) || 'A'}</AvatarFallback>
                                                </Avatar>

                                                <div className={cn(
                                                    "flex flex-col gap-1",
                                                    isMe ? "items-start" : "items-end"
                                                )}>
                                                    <div
                                                        className={cn(
                                                            "p-3 rounded-2xl text-sm shadow-sm",
                                                            // Me (Left) = Gray/White
                                                            // Support (Right) = Blue
                                                            isMe
                                                                ? "bg-white dark:bg-zinc-800 text-foreground border rounded-tl-none"
                                                                : "bg-blue-600 text-white rounded-tr-none"
                                                        )}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground px-1">
                                                        {new Date(msg.createAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                disabled={!agent}
                            />
                            <Button size="icon" onClick={handleSend} disabled={!agent || !newMessage.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            )}
        </div>
    );
}
