"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ImageIcon,
    FileText,
    BrainCircuit,
    Search,
    Lightbulb,
    LayoutDashboard,
    Settings,
    Menu,
    LogOut,
    Sparkles,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
    { label: "Imagens", href: "/dashboard/images", icon: ImageIcon },
    { label: "Páginas", href: "/dashboard/pages", icon: FileText },
    { label: "Quiz", href: "/dashboard/quiz", icon: BrainCircuit },
    { label: "Analisador", href: "/dashboard/analyzer", icon: Search },
    { label: "Estrategista", href: "/dashboard/strategist", icon: Lightbulb },
];

const bottomNavItems: NavItem[] = [
    { label: "Painel", href: "/dashboard", icon: LayoutDashboard },
    { label: "Configurações", href: "/dashboard/settings", icon: Settings },
];

function SidebarContent({
    collapsed,
    onToggle,
    pathname,
}: {
    collapsed: boolean;
    onToggle: () => void;
    pathname: string;
}) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <span className="font-bold text-white text-sm whitespace-nowrap">
                        AI Marketing Studio
                    </span>
                )}
            </div>

            {/* Main nav */}
            <nav className="flex-1 px-3 space-y-1">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-purple-500/10 text-purple-400 border-l-2 border-purple-500"
                                    : "text-[#a3a3a3] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom nav */}
            <div className="px-3 space-y-1 pb-4">
                <Separator className="bg-[#262626] mb-3" />
                {bottomNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-purple-500/10 text-purple-400 border-l-2 border-purple-500"
                                    : "text-[#a3a3a3] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}

                {/* Collapse toggle */}
                <button
                    onClick={onToggle}
                    className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#666] hover:text-[#a3a3a3] hover:bg-white/5 w-full transition-all"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5 shrink-0" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5 shrink-0" />
                            <span>Recolher</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        toast.success("Até logo! 👋");
        router.push("/login");
        router.refresh();
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col bg-[#111111] border-r border-[#262626] transition-all duration-300",
                    collapsed ? "w-16" : "w-[260px]"
                )}
            >
                <SidebarContent
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                    pathname={pathname}
                />
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-14 border-b border-[#262626] bg-[#111111] flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden text-[#a3a3a3] hover:text-white"
                                >
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[260px] bg-[#111111] border-[#262626] p-0">
                                <SidebarContent
                                    collapsed={false}
                                    onToggle={() => { }}
                                    pathname={pathname}
                                />
                            </SheetContent>
                        </Sheet>

                        <span className="lg:hidden font-bold text-white text-sm">
                            AI Marketing Studio
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Credits */}
                        <div className="hidden sm:flex items-center gap-2">
                            <Badge variant="secondary" className="bg-[#1a1a1a] text-[#a3a3a3] border-[#262626] text-xs">
                                🖼️ 10
                            </Badge>
                            <Badge variant="secondary" className="bg-[#1a1a1a] text-[#a3a3a3] border-[#262626] text-xs">
                                📄 3
                            </Badge>
                        </div>

                        {/* Avatar dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xs font-bold">
                                            U
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 bg-[#141414] border-[#262626]"
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="text-[#e5e5e5]">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Configurações
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#262626]" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-400 focus:text-red-400"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
