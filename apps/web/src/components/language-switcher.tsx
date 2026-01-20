"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

const locales = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
];

// Helper function to get cookie value
function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
}

// Helper function to set cookie
function setCookie(name: string, value: string, days: number = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function LanguageSwitcher() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [currentLocale, setCurrentLocale] = useState("en");

    useEffect(() => {
        setMounted(true);
        // Get saved locale from cookie
        const saved = getCookie("locale");
        if (saved) {
            setCurrentLocale(saved);
        }
    }, []);

    const handleLocaleChange = (locale: string) => {
        setCurrentLocale(locale);
        setCookie("locale", locale);
        // Use router.refresh() to refresh server components without losing client state
        router.refresh();
    };

    if (!mounted) return null;

    const current = locales.find(l => l.code === currentLocale) || locales[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">{current.flag} {current.name}</span>
                    <span className="sm:hidden">{current.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.code}
                        onClick={() => handleLocaleChange(locale.code)}
                        className={currentLocale === locale.code ? "bg-muted" : ""}
                    >
                        {locale.flag} {locale.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

