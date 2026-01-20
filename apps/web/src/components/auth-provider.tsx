"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { token, logout, isAuthenticated, _hasHydrated } = useAuthStore();
    const [isValidating, setIsValidating] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    useEffect(() => {
        // Wait for hydration to complete before validating
        if (!_hasHydrated) return;

        const validateToken = async () => {
            // If no token, nothing to validate
            if (!token) {
                setIsValidating(false);
                return;
            }

            try {
                // Validate token by calling /auth/me
                await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Token is valid, set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setIsValidating(false);
            } catch (error: any) {
                // Only logout if 401 (Unauthorized) or 403 (Forbidden)
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.log("Token invalid, logging out...");
                    logout();
                } else {
                    console.warn("Token validation skipped due to network/server error:", error.message);
                    // Treat as valid for now to avoid UX disruption on transient errors
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token, logout, API_URL, _hasHydrated]);

    // Show loading while validating or waiting for hydration
    if (!_hasHydrated || (isValidating && isAuthenticated)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                        {!_hasHydrated ? "Loading session..." : "Validating session..."}
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
