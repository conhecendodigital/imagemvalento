"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BrainCircuit,
    Plus,
    ExternalLink,
    Copy,
    Users,
    Calendar,
    Pencil,
    Play,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Quiz } from "@/lib/types";

export default function QuizPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchQuizzes() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("quizzes")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data) setQuizzes(data);
            setLoading(false);
        }
        fetchQuizzes();
    }, []);

    function copyLink(quiz: Quiz) {
        const url = `${window.location.origin}/quiz/${quiz.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
    }

    async function deleteQuiz(quiz: Quiz) {
        if (!window.confirm(`Tem certeza que deseja excluir o quiz "${quiz.title}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/quiz/${quiz.id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao excluir");
            }
            setQuizzes(quizzes.filter((q) => q.id !== quiz.id));
            toast.success("Quiz excluído com sucesso!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao excluir quiz");
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quiz Builder</h1>
                    <p className="text-[#a3a3a3] mt-1">
                        Crie quizzes interativos para qualificar e engajar seu público.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-[#141414] border-[#262626]">
                            <CardContent className="p-6">
                                <div className="h-5 w-3/4 bg-[#1a1a1a] rounded animate-pulse mb-3" />
                                <div className="h-4 w-1/2 bg-[#1a1a1a] rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quiz Builder</h1>
                    <p className="text-[#a3a3a3] mt-1">
                        Crie quizzes interativos para qualificar e engajar seu público.
                    </p>
                </div>
                <Link href="/dashboard/quiz/new">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Quiz
                    </Button>
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <Card className="bg-[#141414] border-[#262626] border-dashed">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                            <BrainCircuit className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Nenhum quiz ainda
                        </h3>
                        <p className="text-[#a3a3a3] text-sm max-w-md mb-6">
                            Crie seu primeiro quiz interativo para capturar leads e
                            engajar sua audiência 🧠
                        </p>
                        <Link href="/dashboard/quiz/new">
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2">
                                <Plus className="w-4 h-4" />
                                Criar Quiz
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((quiz) => (
                        <Card
                            key={quiz.id}
                            className="bg-[#141414] border-[#262626] hover:border-[#333] transition-colors group"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold truncate">
                                            {quiz.title}
                                        </h3>
                                        {quiz.description && (
                                            <p className="text-[#a3a3a3] text-sm mt-0.5 truncate">
                                                {quiz.description}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className={
                                            quiz.status === "published"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                        }
                                    >
                                        {quiz.status === "published" ? "Ativo" : "Rascunho"}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-[#666] mb-4">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        {quiz.total_responses} respostas
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(quiz.created_at).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/quiz/${quiz.id}`}
                                        target="_blank"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#a3a3a3] hover:text-white h-8 px-2 gap-1"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            Jogar
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/quiz/${quiz.id}/edit`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#a3a3a3] hover:text-white h-8 px-2 gap-1"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Editar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[#a3a3a3] hover:text-white h-8 px-2 gap-1 ml-auto"
                                        onClick={() => copyLink(quiz)}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Link
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#666] hover:text-red-400 h-8 w-8 shrink-0"
                                        onClick={() => deleteQuiz(quiz)}
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
