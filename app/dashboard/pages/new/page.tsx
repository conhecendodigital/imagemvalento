"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewPagePage() {
    const [title, setTitle] = useState("");
    const [niche, setNiche] = useState("");
    const [objective, setObjective] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Informe o nome da página.");
            return;
        }
        if (!niche.trim()) {
            toast.error("Informe o nicho.");
            return;
        }
        if (!objective) {
            toast.error("Selecione o objetivo.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/generate-page", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), niche: niche.trim(), objective }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erro ao gerar página.");
                setLoading(false);
                return;
            }

            toast.success("Página criada com sucesso! 🎉");
            router.push("/dashboard/pages");
        } catch (err) {
            console.error(err);
            toast.error("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-[#a3a3a3] hover:text-white"
                >
                    <Link href="/dashboard/pages">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Nova Página com IA
                    </h1>
                    <p className="text-[#a3a3a3] text-sm mt-0.5">
                        Preencha os dados e a IA gerará sua página automaticamente.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nome */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="title"
                                className="text-[#e5e5e5] text-sm font-medium"
                            >
                                Nome da Página
                            </Label>
                            <Input
                                id="title"
                                placeholder="Ex: Lançamento Método Fitness Pro"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666] focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50"
                                disabled={loading}
                            />
                        </div>

                        {/* Nicho */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="niche"
                                className="text-[#e5e5e5] text-sm font-medium"
                            >
                                Nicho
                            </Label>
                            <Input
                                id="niche"
                                placeholder="Ex: Fitness, Marketing Digital, Culinária"
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666] focus-visible:ring-purple-500/30 focus-visible:border-purple-500/50"
                                disabled={loading}
                            />
                        </div>

                        {/* Objetivo */}
                        <div className="space-y-2">
                            <Label className="text-[#e5e5e5] text-sm font-medium">
                                Objetivo
                            </Label>
                            <Select
                                value={objective}
                                onValueChange={setObjective}
                                disabled={loading}
                            >
                                <SelectTrigger className="bg-[#0a0a0a] border-[#262626] text-white focus:ring-purple-500/30 focus:border-purple-500/50">
                                    <SelectValue placeholder="Selecione o tipo da página" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141414] border-[#262626]">
                                    <SelectItem
                                        value="sales"
                                        className="text-[#e5e5e5] focus:bg-purple-500/10 focus:text-white"
                                    >
                                        🛒 Página de Venda
                                    </SelectItem>
                                    <SelectItem
                                        value="lead_capture"
                                        className="text-[#e5e5e5] focus:bg-purple-500/10 focus:text-white"
                                    >
                                        📧 Captura de Leads
                                    </SelectItem>
                                    <SelectItem
                                        value="bio_link"
                                        className="text-[#e5e5e5] focus:bg-purple-500/10 focus:text-white"
                                    >
                                        🔗 Bio Link
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hint */}
                        <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-4">
                            <p className="text-xs text-purple-300/80 leading-relaxed">
                                <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                                A IA irá gerar uma página HTML completa, moderna,
                                responsiva e com dark mode, otimizada para conversão
                                no seu nicho. O processo leva de 10 a 30 segundos.
                            </p>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 h-11"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando com IA...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Gerar Página com IA
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
