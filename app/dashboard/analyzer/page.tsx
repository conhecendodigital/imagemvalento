"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Search,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Globe,
    Clock,
    Trash2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { PageAnalysis } from "@/lib/types";

// --- Score Ring Component ---
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    // Color based on score
    const getColor = (s: number) => {
        if (s >= 75) return { stroke: "#22c55e", bg: "rgba(34,197,94,0.1)", text: "text-green-400", label: "Excelente" };
        if (s >= 50) return { stroke: "#eab308", bg: "rgba(234,179,8,0.1)", text: "text-yellow-400", label: "Regular" };
        if (s >= 25) return { stroke: "#f97316", bg: "rgba(249,115,22,0.1)", text: "text-orange-400", label: "Precisa Melhorar" };
        return { stroke: "#ef4444", bg: "rgba(239,68,68,0.1)", text: "text-red-400", label: "Crítico" };
    };

    const color = getColor(score);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#262626"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color.stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                {/* Score text in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${color.text}`}>{score}</span>
                    <span className="text-xs text-[#666]">/100</span>
                </div>
            </div>
            <span className={`text-sm font-medium ${color.text}`}>{color.label}</span>
        </div>
    );
}

// --- Mini Score Ring for History ---
function MiniScoreRing({ score, size = 40 }: { score: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 75) return "#22c55e";
        if (s >= 50) return "#eab308";
        if (s >= 25) return "#f97316";
        return "#ef4444";
    };

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#262626" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={getColor(score)} strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{score}</span>
            </div>
        </div>
    );
}

export default function AnalyzerPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentResult, setCurrentResult] = useState<PageAnalysis | null>(null);
    const [history, setHistory] = useState<PageAnalysis[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const supabase = createClient();

    // Load history on mount
    useEffect(() => {
        async function loadHistory() {
            const { data, error } = await supabase
                .from("page_analyses")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (!error && data) {
                setHistory(data as PageAnalysis[]);
            }
            setLoadingHistory(false);
        }
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleAnalyze(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = url.trim();
        if (!trimmed) {
            toast.error("Cole uma URL para analisar.");
            return;
        }

        // Auto-prepend https if missing
        let finalUrl = trimmed;
        if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
            finalUrl = "https://" + finalUrl;
        }

        setLoading(true);
        setCurrentResult(null);

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: finalUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erro ao analisar página.");
                return;
            }

            toast.success("Análise concluída! 🎯");
            setCurrentResult(data.analysis as PageAnalysis);

            // Reload history
            const { data: updated } = await supabase
                .from("page_analyses")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (updated) {
                setHistory(updated as PageAnalysis[]);
            }

            setUrl("");
        } catch {
            toast.error("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(analysisId: string) {
        const { error } = await supabase
            .from("page_analyses")
            .delete()
            .eq("id", analysisId);

        if (error) {
            toast.error("Erro ao excluir análise.");
            return;
        }

        setHistory((prev) => prev.filter((a) => a.id !== analysisId));
        if (currentResult?.id === analysisId) setCurrentResult(null);
        toast.success("Análise excluída.");
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function truncateUrl(u: string, max = 50) {
        try {
            const parsed = new URL(u);
            const display = parsed.hostname + parsed.pathname;
            return display.length > max ? display.substring(0, max) + "…" : display;
        } catch {
            return u.length > max ? u.substring(0, max) + "…" : u;
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Search className="w-7 h-7 text-orange-400" />
                    Analisador de Páginas
                </h1>
                <p className="text-[#a3a3a3] mt-1">
                    Cole uma URL e receba uma análise CRO completa com IA.
                </p>
            </div>

            {/* URL Input Form */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardContent className="p-6">
                    <form onSubmit={handleAnalyze} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="url" className="text-[#a3a3a3] text-sm font-medium">
                                URL da página para análise
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <Input
                                        id="url"
                                        type="text"
                                        placeholder="https://exemplo.com/pagina-de-vendas"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="bg-[#1a1a1a] border-[#262626] text-white placeholder:text-[#555] pl-10 h-12 text-base"
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading || !url.trim()}
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 h-12 shrink-0"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Analisando...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 mr-2" />
                                            Analisar Página
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
                <Card className="bg-[#141414] border-[#262626] border-dashed animate-pulse">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                            <p className="text-sm text-orange-400 font-medium">
                                A IA está analisando a página... Isso pode levar alguns segundos.
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <Skeleton className="w-40 h-40 rounded-full bg-[#1a1a1a] mx-auto" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-6 w-48 bg-[#1a1a1a]" />
                                <Skeleton className="h-4 w-full bg-[#1a1a1a]" />
                                <Skeleton className="h-4 w-3/4 bg-[#1a1a1a]" />
                                <Skeleton className="h-4 w-5/6 bg-[#1a1a1a]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Result */}
            {currentResult && (
                <Card className="bg-[#141414] border-[#262626] overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                    <CardContent className="p-6 space-y-6">
                        {/* Score + URL */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <ScoreRing score={currentResult.cro_score} />
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Análise CRO Completa
                                </h3>
                                <a
                                    href={currentResult.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:underline break-all"
                                >
                                    {currentResult.url}
                                </a>
                            </div>
                        </div>

                        {/* Strengths & Weaknesses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Pontos Fortes
                                </h4>
                                {currentResult.report_data.strengths.map((s, i) => (
                                    <Card key={i} className="bg-green-500/5 border-green-500/20">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                            </div>
                                            <p className="text-sm text-[#d4d4d4]">{s}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Weaknesses */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Pontos Fracos
                                </h4>
                                {currentResult.report_data.weaknesses.map((w, i) => (
                                    <Card key={i} className="bg-red-500/5 border-red-500/20">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                            </div>
                                            <p className="text-sm text-[#d4d4d4]">{w}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    Análises Anteriores
                    {history.length > 0 && (
                        <span className="text-sm font-normal text-[#666]">
                            ({history.length})
                        </span>
                    )}
                </h2>

                {loadingHistory ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl bg-[#1a1a1a]" />
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <Card className="bg-[#141414] border-[#262626] border-dashed">
                        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3">
                                <Search className="w-7 h-7 text-orange-400" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">
                                Nenhuma análise ainda
                            </h3>
                            <p className="text-[#a3a3a3] text-sm max-w-sm">
                                Cole uma URL acima para fazer sua primeira análise CRO com IA! 🔍
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {history.map((item) => {
                            const isExpanded = expandedId === item.id;
                            return (
                                <Card key={item.id} className="bg-[#141414] border-[#262626] overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Row header */}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                            className="flex items-center gap-4 w-full p-4 hover:bg-white/[0.02] transition-colors text-left"
                                        >
                                            <MiniScoreRing score={item.cro_score} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">
                                                    {truncateUrl(item.url)}
                                                </p>
                                                <p className="text-xs text-[#666] mt-0.5">
                                                    {formatDate(item.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(item.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-[#666]" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-[#666]" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded detail */}
                                        {isExpanded && item.report_data && (
                                            <div className="border-t border-[#262626] p-4 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Strengths */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Pontos Fortes
                                                        </h4>
                                                        {item.report_data.strengths.map((s, i) => (
                                                            <p key={i} className="text-xs text-[#a3a3a3] pl-5">
                                                                • {s}
                                                            </p>
                                                        ))}
                                                    </div>
                                                    {/* Weaknesses */}
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            Pontos Fracos
                                                        </h4>
                                                        {item.report_data.weaknesses.map((w, i) => (
                                                            <p key={i} className="text-xs text-[#a3a3a3] pl-5">
                                                                • {w}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-400 hover:underline break-all"
                                                >
                                                    {item.url}
                                                </a>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
