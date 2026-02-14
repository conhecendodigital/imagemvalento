"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    GripVertical,
    BrainCircuit,
    Trophy,
} from "lucide-react";
import { toast } from "sonner";
import type { QuizConfig, QuizSettings } from "@/lib/types";

interface QuestionDraft {
    id: string;
    text: string;
    type: "single";
    options: OptionDraft[];
}

interface OptionDraft {
    id: string;
    text: string;
    points: number;
}

interface ResultDraft {
    id: string;
    title: string;
    description: string;
    scoreMin: number;
    scoreMax: number;
    ctaText: string;
    ctaUrl: string;
}

function generateId() {
    return crypto.randomUUID();
}

function createEmptyOption(): OptionDraft {
    return { id: generateId(), text: "", points: 0 };
}

function createEmptyQuestion(): QuestionDraft {
    return {
        id: generateId(),
        text: "",
        type: "single",
        options: [createEmptyOption(), createEmptyOption()],
    };
}

function createEmptyResult(): ResultDraft {
    return {
        id: generateId(),
        title: "",
        description: "",
        scoreMin: 0,
        scoreMax: 10,
        ctaText: "Saiba Mais",
        ctaUrl: "",
    };
}

export default function NewQuizPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        createEmptyQuestion(),
    ]);
    const [results, setResults] = useState<ResultDraft[]>([createEmptyResult()]);
    const [settings, setSettings] = useState<QuizSettings>({
        collectLeadBeforeResult: true,
        leadFields: { name: false, email: true, phone: false },
        leadFormTitle: "Quase lá! Informe seu email para ver o resultado",
        showProgressBar: true,
        timerPerQuestion: null,
        webhookUrl: null,
        primaryColor: "#06b6d4",
        backgroundImage: null,
    });

    // --- Question handlers ---
    function addQuestion() {
        setQuestions([...questions, createEmptyQuestion()]);
    }

    function removeQuestion(qIdx: number) {
        if (questions.length <= 1) {
            toast.error("O quiz precisa ter pelo menos 1 pergunta");
            return;
        }
        setQuestions(questions.filter((_, i) => i !== qIdx));
    }

    function updateQuestionText(qIdx: number, text: string) {
        const updated = [...questions];
        updated[qIdx].text = text;
        setQuestions(updated);
    }

    function addOption(qIdx: number) {
        const updated = [...questions];
        updated[qIdx].options.push(createEmptyOption());
        setQuestions(updated);
    }

    function removeOption(qIdx: number, oIdx: number) {
        const updated = [...questions];
        if (updated[qIdx].options.length <= 2) {
            toast.error("Cada pergunta precisa ter pelo menos 2 opções");
            return;
        }
        updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
        setQuestions(updated);
    }

    function updateOptionText(qIdx: number, oIdx: number, text: string) {
        const updated = [...questions];
        updated[qIdx].options[oIdx].text = text;
        setQuestions(updated);
    }

    function updateOptionPoints(qIdx: number, oIdx: number, points: number) {
        const updated = [...questions];
        updated[qIdx].options[oIdx].points = points;
        setQuestions(updated);
    }

    // --- Result handlers ---
    function addResult() {
        setResults([...results, createEmptyResult()]);
    }

    function removeResult(rIdx: number) {
        if (results.length <= 1) {
            toast.error("É necessário ao menos 1 resultado");
            return;
        }
        setResults(results.filter((_, i) => i !== rIdx));
    }

    function updateResult(rIdx: number, field: keyof ResultDraft, value: string | number) {
        const updated = [...results];
        updated[rIdx] = { ...updated[rIdx], [field]: value };
        setResults(updated);
    }

    // --- Save ---
    async function handleSave() {
        if (!title.trim()) {
            toast.error("Informe o título do quiz");
            return;
        }

        const emptyQ = questions.find((q) => !q.text.trim());
        if (emptyQ) {
            toast.error("Todas as perguntas precisam ter um título");
            return;
        }

        const emptyOpt = questions.find((q) =>
            q.options.some((o) => !o.text.trim())
        );
        if (emptyOpt) {
            toast.error("Todas as opções precisam ter um texto");
            return;
        }

        const emptyResult = results.find((r) => !r.title.trim());
        if (emptyResult) {
            toast.error("Todos os resultados precisam ter um título");
            return;
        }

        setSaving(true);

        const config: QuizConfig = {
            questions: questions.map((q) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.options.map((o) => ({
                    id: o.id,
                    text: o.text,
                    points: o.points,
                })),
            })),
            results: results.map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description,
                scoreMin: r.scoreMin,
                scoreMax: r.scoreMax,
                ctaText: r.ctaText,
                ctaUrl: r.ctaUrl,
            })),
        };

        try {
            const res = await fetch("/api/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, config, settings }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao salvar");
            }

            toast.success("Quiz criado com sucesso! 🎉");
            router.push("/dashboard/quiz");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao salvar quiz");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#a3a3a3] hover:text-white"
                        onClick={() => router.push("/dashboard/quiz")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Novo Quiz</h1>
                        <p className="text-[#a3a3a3] text-sm">
                            Monte suas perguntas e configure o quiz
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Quiz"}
                </Button>
            </div>

            {/* Title & Description */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[#e5e5e5]">Título do Quiz</Label>
                        <Input
                            placeholder="Ex: Qual é o seu perfil de marketing?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[#e5e5e5]">Descrição (opcional)</Label>
                        <Textarea
                            placeholder="Uma breve descrição sobre o quiz..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666] resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-cyan-400" />
                        Perguntas
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                        className="border-[#333] text-[#a3a3a3] hover:text-white hover:border-[#555] gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Pergunta
                    </Button>
                </div>

                {questions.map((question, qIdx) => (
                    <Card
                        key={question.id}
                        className="bg-[#141414] border-[#262626] overflow-hidden"
                    >
                        <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#111] border-b border-[#1e1e1e]">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-[#444]" />
                                <Badge
                                    variant="secondary"
                                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"
                                >
                                    Pergunta {qIdx + 1}
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#666] hover:text-red-400 h-8 w-8"
                                onClick={() => removeQuestion(qIdx)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <Input
                                placeholder="Título da pergunta..."
                                value={question.text}
                                onChange={(e) =>
                                    updateQuestionText(qIdx, e.target.value)
                                }
                                className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666]"
                            />

                            <div className="space-y-2">
                                <Label className="text-[#a3a3a3] text-xs">
                                    Opções de resposta
                                </Label>
                                {question.options.map((option, oIdx) => (
                                    <div
                                        key={option.id}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center text-xs text-[#666] shrink-0">
                                            {String.fromCharCode(65 + oIdx)}
                                        </div>
                                        <Input
                                            placeholder={`Opção ${String.fromCharCode(65 + oIdx)}`}
                                            value={option.text}
                                            onChange={(e) =>
                                                updateOptionText(
                                                    qIdx,
                                                    oIdx,
                                                    e.target.value
                                                )
                                            }
                                            className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666] flex-1"
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Label className="text-[#666] text-xs">
                                                Pts
                                            </Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={option.points}
                                                onChange={(e) =>
                                                    updateOptionPoints(
                                                        qIdx,
                                                        oIdx,
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                className="bg-[#0a0a0a] border-[#262626] text-white w-16 text-center"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-[#666] hover:text-red-400 h-8 w-8 shrink-0"
                                            onClick={() =>
                                                removeOption(qIdx, oIdx)
                                            }
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addOption(qIdx)}
                                    className="text-[#666] hover:text-[#a3a3a3] text-xs gap-1 mt-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Nova opção
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Resultados
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addResult}
                        className="border-[#333] text-[#a3a3a3] hover:text-white hover:border-[#555] gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Resultado
                    </Button>
                </div>

                {results.map((result, rIdx) => (
                    <Card
                        key={result.id}
                        className="bg-[#141414] border-[#262626]"
                    >
                        <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#111] border-b border-[#1e1e1e]">
                            <Badge
                                variant="secondary"
                                className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs"
                            >
                                Resultado {rIdx + 1}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#666] hover:text-red-400 h-8 w-8"
                                onClick={() => removeResult(rIdx)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#e5e5e5]">Título</Label>
                                    <Input
                                        placeholder="Ex: Perfil Estratégico"
                                        value={result.title}
                                        onChange={(e) =>
                                            updateResult(rIdx, "title", e.target.value)
                                        }
                                        className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666]"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="space-y-2 flex-1">
                                        <Label className="text-[#e5e5e5]">
                                            Score Mín
                                        </Label>
                                        <Input
                                            type="number"
                                            value={result.scoreMin}
                                            onChange={(e) =>
                                                updateResult(
                                                    rIdx,
                                                    "scoreMin",
                                                    parseInt(e.target.value) || 0
                                                )
                                            }
                                            className="bg-[#0a0a0a] border-[#262626] text-white"
                                        />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <Label className="text-[#e5e5e5]">
                                            Score Máx
                                        </Label>
                                        <Input
                                            type="number"
                                            value={result.scoreMax}
                                            onChange={(e) =>
                                                updateResult(
                                                    rIdx,
                                                    "scoreMax",
                                                    parseInt(e.target.value) || 0
                                                )
                                            }
                                            className="bg-[#0a0a0a] border-[#262626] text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#e5e5e5]">Descrição</Label>
                                <Textarea
                                    placeholder="Descrição do resultado..."
                                    value={result.description}
                                    onChange={(e) =>
                                        updateResult(rIdx, "description", e.target.value)
                                    }
                                    rows={2}
                                    className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666] resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[#e5e5e5]">
                                        Texto do CTA
                                    </Label>
                                    <Input
                                        placeholder="Ex: Saiba Mais"
                                        value={result.ctaText}
                                        onChange={(e) =>
                                            updateResult(rIdx, "ctaText", e.target.value)
                                        }
                                        className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#e5e5e5]">
                                        URL do CTA
                                    </Label>
                                    <Input
                                        placeholder="https://..."
                                        value={result.ctaUrl}
                                        onChange={(e) =>
                                            updateResult(rIdx, "ctaUrl", e.target.value)
                                        }
                                        className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Settings */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardHeader>
                    <CardTitle className="text-white text-base">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-[#e5e5e5]">
                                Pedir email antes do resultado
                            </Label>
                            <p className="text-[#666] text-xs mt-0.5">
                                Captura o email do lead antes de exibir o resultado
                            </p>
                        </div>
                        <Switch
                            checked={settings.collectLeadBeforeResult}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    collectLeadBeforeResult: checked,
                                })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-[#e5e5e5]">
                                Barra de progresso
                            </Label>
                            <p className="text-[#666] text-xs mt-0.5">
                                Mostra o progresso do quiz para o usuário
                            </p>
                        </div>
                        <Switch
                            checked={settings.showProgressBar}
                            onCheckedChange={(checked) =>
                                setSettings({
                                    ...settings,
                                    showProgressBar: checked,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[#e5e5e5]">Cor principal</Label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.primaryColor}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        primaryColor: e.target.value,
                                    })
                                }
                                className="w-10 h-10 rounded border border-[#262626] cursor-pointer bg-transparent"
                            />
                            <Input
                                value={settings.primaryColor}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        primaryColor: e.target.value,
                                    })
                                }
                                className="bg-[#0a0a0a] border-[#262626] text-white w-32 font-mono text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom save */}
            <div className="flex justify-end pb-8">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2 px-8"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Quiz"}
                </Button>
            </div>
        </div>
    );
}
