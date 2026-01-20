"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogOut, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function SiteHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const t = useTranslations('nav');

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isAdminPage = pathname?.startsWith("/admin");

    if (isAdminPage) return null;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    {/* Mobile Menu Toggle */}
                    {!isAuthPage && (
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">Hi</div>
                        <span className="text-lg font-bold tracking-tight">HiLearn</span>
                    </Link>
                </div>

                {/* Navigation Links - Hide on Auth pages */}
                {!isAuthPage && (
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link
                            href="/courses"
                            className={cn("transition-colors hover:text-primary", pathname === "/courses" && "text-foreground font-semibold")}
                        >
                            {t('catalog')}
                        </Link>
                        {mounted && isAuthenticated && user?.role === 'ADMIN' && (
                            <Link
                                href="/admin"
                                className={cn("transition-colors hover:text-primary", pathname === "/admin" && "text-foreground font-semibold")}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        {mounted && isAuthenticated && (
                            <Link
                                href="/my-learning"
                                className={cn("transition-colors hover:text-primary", pathname === "/my-learning" && "text-foreground font-semibold")}
                            >
                                My Learning
                            </Link>
                        )}
                        {mounted && isAuthenticated && (
                            <Link
                                href="/certificates"
                                className={cn("transition-colors hover:text-primary", pathname === "/certificates" && "text-foreground font-semibold")}
                            >
                                Certificates
                            </Link>
                        )}
                        {mounted && isAuthenticated && (
                            <Link
                                href="/library"
                                className={cn("transition-colors hover:text-primary", pathname?.startsWith("/library") && "text-foreground font-semibold")}
                            >
                                Library
                            </Link>
                        )}
                        {mounted && isAuthenticated && (
                            <Link
                                href="/leaderboard"
                                className={cn("transition-colors hover:text-primary", pathname === "/leaderboard" && "text-foreground font-semibold")}
                            >
                                Leaderboard
                            </Link>
                        )}
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    {mounted && isAuthenticated ? (
                        <>
                            <NotificationBell />
                            <Link href="/profile" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
                                Hi, {user?.name?.split(' ')[0] || "Employee"}
                            </Link>
                            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => {
                                logout();
                                router.push("/");
                            }}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </Button>
                        </>
                    ) : (
                        !isAuthPage && (
                            <>
                                <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary hidden sm:block">
                                    Log in
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {t('employeePortal')}
                                </Link>
                            </>
                        )
                    )}
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mounted && mobileMenuOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex md:hidden">
                    <div className="fixed inset-0 bg-black/80" onClick={() => setMobileMenuOpen(false)} />
                    <div
                        className="relative flex w-64 flex-col border-r h-full bg-background"
                        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                    >
                        <div className="p-4 flex items-center justify-between border-b h-16">
                            <span className="font-bold">Menu</span>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <nav className="flex-1 flex flex-col p-4 space-y-4">
                            <Link
                                href="/courses"
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/courses" && "text-primary")}
                            >
                                Learning Catalog
                            </Link>
                            {mounted && isAuthenticated && user?.role === 'ADMIN' && (
                                <Link
                                    href="/admin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/admin" && "text-primary")}
                                >
                                    {t('admin')}
                                </Link>
                            )}
                            {mounted && isAuthenticated && (
                                <Link
                                    href="/my-learning"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/my-learning" && "text-primary")}
                                >
                                    {t('myLearning')}
                                </Link>
                            )}
                            {mounted && isAuthenticated && (
                                <Link
                                    href="/certificates"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === "/certificates" && "text-primary")}
                                >
                                    {t('certificates')}
                                </Link>
                            )}


                            <hr className="my-4" />

                            {mounted && isAuthenticated ? (
                                <>
                                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium transition-colors hover:text-primary">
                                        Hi, {user?.name?.split(' ')[0] || "Employee"}
                                    </Link>
                                    <Button variant="ghost" className="justify-start px-0 hover:bg-transparent hover:text-primary" onClick={() => {
                                        logout();
                                        router.push("/");
                                        setMobileMenuOpen(false);
                                    }}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium transition-colors hover:text-primary">
                                        Log in
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
}
