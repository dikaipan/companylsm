"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import axios from "axios";
import io, { Socket } from "socket.io-client";
import { Loader2, Search, Send, User } from "lucide-react";

interface UserContact {
    id: string;
    name: string;
    avatar?: string;
    role: string;
}

interface Message {
    id: string;
    message: string;
    senderId: string;
    createdAt: string;
    sender: {
        id: string;
        name?: string;
        avatar?: string;
    };
}

export default function AdminMessagesPage() {
    const { token, user } = useAuthStore();
    const [contacts, setContacts] = useState<UserContact[]>([]);
    const [activeContact, setActiveContact] = useState<UserContact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const WS_URL = API_URL.replace("/api", "");

    // Connect Socket
    useEffect(() => {
        if (token && !socketRef.current) {
            socketRef.current = io(WS_URL, {
                auth: { token: `Bearer ${token}` },
            });

            socketRef.current.on("newMessage", (data: Message) => {
                // If message is for/from active contact, append
                setMessages((prev) => {
                    const isActive = data.senderId === activeContact?.id || data.senderId === user?.id; // user?.id might be sender in optimistic case
                    // Actually, if I send a message, I might get it back or I push it optimistically.
                    // The server emits 'newMessage' to receiver. So as ADMIN (receiver), I get it.
                    // If I am sender, I don't get 'newMessage' unless backend emits to sender too.
                    // My backend: `this.server.to(payload.receiverId).emit(...)`. Only receiver gets it.
                    // So I need to handle my own sent messages optimistically or via confirmation.
                    // BUT, if the USER sends me a message (I am receiver), I get it.
                    // If the active contact sent it, append.
                    if (data.senderId === activeContact?.id) {
                        return [...prev, data];
                    }
                    return prev;
                });

                // Also update contacts list if new user? 
                // For simplified MVP, we just refresh contacts? Or assume contacts list is static.
            });
        }

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [token, activeContact, WS_URL]); // careful with activeContact dependency in useEffect if socket re-connects

    // Fetch Contacts
    useEffect(() => {
        if (token) {
            fetchContacts();
        }
    }, [token]);

    // Fetch Messages when active contact changes
    useEffect(() => {
        if (activeContact && token) {
            fetchMessages(activeContact.id);
        }
    }, [activeContact, token]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            const res = await axios.get(`${API_URL}/chat/contacts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContacts(res.data);
            if (res.data.length > 0 && !activeContact) {
                // setActiveContact(res.data[0]); // Optional: auto-select first
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        setLoadingMessages(true);
        try {
            const res = await axios.get(`${API_URL}/chat/messages/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);

            // Mark as Read
            await axios.get(`${API_URL}/chat/read/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSend = () => {
        if (!newMessage.trim() || !activeContact || !socketRef.current) return;

        const payload = {
            receiverId: activeContact.id,
            message: newMessage
        };

        // Emit
        socketRef.current.emit("sendMessage", payload);

        // Optimistic Append
        const optimisticMsg: Message = {
            id: Date.now().toString(),
            message: newMessage,
            senderId: user?.id || "me",
            createdAt: new Date().toISOString(),
            sender: {
                id: user?.id || "me",
                name: user?.name,
                avatar: undefined // assuming store doesn't have avatar
            }
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage("");
    };

    return (
        <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border bg-background shadow-sm">
            {/* Sidebar (Contacts) */}
            <div className="w-80 border-r flex flex-col bg-muted/10">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search messages..."
                            className="pl-8 bg-background"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : contacts.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</p>
                    ) : (
                        contacts.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => setActiveContact(contact)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b",
                                    activeContact?.id === contact.id && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={contact.avatar} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium truncate">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground truncate capitalize">{contact.role.toLowerCase()}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {activeContact ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex items-center gap-3 bg-muted/5">
                            <Avatar>
                                <AvatarImage src={activeContact.avatar} />
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold">{activeContact.name}</h2>
                                <p className="text-xs text-muted-foreground capitalize">{activeContact.role.toLowerCase()}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50" ref={scrollRef}>
                            {loadingMessages ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">Start a conversation with {activeContact.name}</p>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                                isMe
                                                    ? "ml-auto bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            {msg.message}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t flex gap-2 bg-background">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-2">
                            <User className="h-12 w-12 mx-auto opacity-20" />
                            <p>Select a contact to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
