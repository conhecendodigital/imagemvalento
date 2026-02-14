"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Trash2,
    ExternalLink,
    FileText,
    Copy,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Page } from "@/lib/types";

const PAGE_TYPE_LABELS: Record<string, string> = {
    sales: "Venda",
    lead_capture: "Captura",
    bio_link: "Bio Link",
};

const PAGE_TYPE_COLORS: Record<string, string> = {
    sales: "bg-green-500/10 text-green-400 border-green-500/20",
    lead_capture: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    bio_link: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function PagesPage() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchPages();
    }, []);

    async function fetchPages() {
        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("pages")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Erro ao carregar páginas.");
            console.error(error);
        } else {
            setPages(data || []);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        setDeleting(id);
        const { error } = await supabase.from("pages").delete().eq("id", id);
        if (error) {
            toast.error("Erro ao deletar página.");
            console.error(error);
        } else {
            toast.success("Página deletada com sucesso!");
            setPages((prev) => prev.filter((p) => p.id !== id));
        }
        setDeleting(null);
    }

    function copyLink(slug: string) {
        const url = `${window.location.origin}/p/${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedSlug(slug);
        toast.success("Link copiado!");
        setTimeout(() => setCopiedSlug(null), 2000);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Criador de Páginas
                    </h1>
                    <p className="text-[#a3a3a3] mt-1">
                        Gere páginas de vendas, links da bio e capturas com IA.
                    </p>
                </div>
                <Button
                    asChild
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20"
                >
                    <Link href="/dashboard/pages/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Nova Página
                    </Link>
                </Button>
            </div>

            {/* Loading skeletons */}
            {loading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card
                            key={i}
                            className="bg-[#141414] border-[#262626]"
                        >
                            <CardContent className="p-5 space-y-4">
                                <Skeleton className="h-5 w-3/4 bg-[#262626]" />
                                <Skeleton className="h-4 w-1/3 bg-[#262626]" />
                                <Skeleton className="h-8 w-full bg-[#262626]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && pages.length === 0 && (
                <Card className="bg-[#141414] border-[#262626] border-dashed">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Nenhuma página criada
                        </h3>
                        <p className="text-[#a3a3a3] text-sm max-w-md mb-6">
                            Crie sua primeira página de vendas, captura ou bio
                            link usando inteligência artificial. 🚀
                        </p>
                        <Button
                            asChild
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                            <Link href="/dashboard/pages/new">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Primeira Página
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Pages grid */}
            {!loading && pages.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pages.map((page) => (
                        <Card
                            key={page.id}
                            className="bg-[#141414] border-[#262626] hover:border-[#333] transition-colors group"
                        >
                            <CardContent className="p-5 space-y-4">
                                {/* Title + Badge */}
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">
                                        {page.title}
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className={`shrink-0 text-xs ${PAGE_TYPE_COLORS[page.page_type] || "bg-[#262626] text-[#a3a3a3]"}`}
                                    >
                                        {PAGE_TYPE_LABELS[page.page_type] ||
                                            page.page_type}
                                    </Badge>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full ${page.status === "published" ? "bg-green-400" : "bg-yellow-400"}`}
                                    />
                                    <span className="text-xs text-[#a3a3a3]">
                                        {page.status === "published"
                                            ? "Publicada"
                                            : "Rascunho"}
                                    </span>
                                    <span className="text-xs text-[#666]">
                                        •
                                    </span>
                                    <span className="text-xs text-[#666]">
                                        {new Date(
                                            page.created_at
                                        ).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                    {page.slug && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-transparent border-[#262626] text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] text-xs"
                                                asChild
                                            >
                                                <a
                                                    href={`/p/${page.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                    Ver Página
                                                </a>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-transparent border-[#262626] text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a]"
                                                onClick={() =>
                                                    copyLink(page.slug!)
                                                }
                                            >
                                                {copiedSlug === page.slug ? (
                                                    <Check className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-transparent border-[#262626] text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                                        disabled={deleting === page.id}
                                        onClick={() => handleDelete(page.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
