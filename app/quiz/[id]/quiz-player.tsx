"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowRight,
    CheckCircle2,
    Mail,
    Sparkles,
} from "lucide-react";
import type { Quiz, QuizConfig, QuizSettings } from "@/lib/types";

type Step = "playing" | "lead" | "result";

interface Answers {
    [questionId: string]: {
        optionId: string;
        points: number;
    };
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -300 : 300,
        opacity: 0,
        scale: 0.95,
    }),
};

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
    const config = quiz.config as QuizConfig;
    const settings = quiz.settings as QuizSettings;
    const questions = config.questions || [];
    const results = config.results || [];

    const [step, setStep] = useState<Step>("playing");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [direction, setDirection] = useState(1);
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const primaryColor = settings.primaryColor || "#06b6d4";

    const totalScore = useMemo(() => {
        return Object.values(answers).reduce((sum, a) => sum + a.points, 0);
    }, [answers]);

    const matchedResult = useMemo(() => {
        if (results.length === 0) return null;
        const match = results.find(
            (r) => totalScore >= r.scoreMin && totalScore <= r.scoreMax
        );
        return match || results[results.length - 1];
    }, [totalScore, results]);

    function selectOption(questionId: string, optionId: string, points: number) {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: { optionId, points },
        }));

        // Auto-advance after short delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setDirection(1);
                setCurrentIndex(currentIndex + 1);
            } else {
                // Last question answered
                if (settings.collectLeadBeforeResult) {
                    setStep("lead");
                } else {
                    submitAndShowResult();
                }
            }
        }, 400);
    }

    async function submitAndShowResult(leadEmail?: string) {
        setSubmitting(true);
        const supabase = createClient();

        try {
            await supabase.from("quiz_leads").insert({
                quiz_id: quiz.id,
                answers,
                result_id: matchedResult?.id || null,
                result_title: matchedResult?.title || null,
                score: totalScore,
                lead_email: leadEmail || email || null,
                completed: true,
            });
        } catch (err) {
            console.error("Error saving quiz lead:", err);
        }

        setSubmitted(true);
        setSubmitting(false);
        setStep("result");
    }

    function handleLeadSubmit(e: React.FormEvent) {
        e.preventDefault();
        submitAndShowResult(email);
    }

    const currentQuestion = questions[currentIndex];
    const progress =
        step === "result"
            ? 100
            : Math.round((Object.keys(answers).length / questions.length) * 100);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4"
            style={{
                background: `linear-gradient(135deg, #0a0a0a 0%, #111 50%, ${primaryColor}10 100%)`,
            }}
        >
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                        {quiz.title}
                    </h1>
                    {quiz.description && step === "playing" && currentIndex === 0 && Object.keys(answers).length === 0 && (
                        <p className="text-[#a3a3a3] text-sm">{quiz.description}</p>
                    )}
                </div>

                {/* Progress bar */}
                {settings.showProgressBar && (
                    <div className="w-full h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden mb-8">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: primaryColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                )}

                {/* Content area */}
                <div className="relative min-h-[350px] flex items-center justify-center">
                    <AnimatePresence custom={direction} mode="wait">
                        {/* Question Step */}
                        {step === "playing" && currentQuestion && (
                            <motion.div
                                key={`q-${currentIndex}`}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                                className="w-full"
                            >
                                <div className="text-center mb-6">
                                    <span className="text-xs text-[#666] font-medium uppercase tracking-wide">
                                        Pergunta {currentIndex + 1} de{" "}
                                        {questions.length}
                                    </span>
                                    <h2 className="text-lg md:text-xl font-semibold text-white mt-2">
                                        {currentQuestion.text}
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, oIdx) => {
                                        const isSelected =
                                            answers[currentQuestion.id]?.optionId ===
                                            option.id;
                                        return (
                                            <motion.button
                                                key={option.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: oIdx * 0.08,
                                                    duration: 0.3,
                                                }}
                                                onClick={() =>
                                                    selectOption(
                                                        currentQuestion.id,
                                                        option.id,
                                                        option.points
                                                    )
                                                }
                                                className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-center gap-3 group ${isSelected
                                                        ? "border-opacity-100 bg-opacity-10"
                                                        : "border-[#262626] bg-[#141414] hover:border-[#444] hover:bg-[#1a1a1a]"
                                                    }`}
                                                style={
                                                    isSelected
                                                        ? {
                                                            borderColor: primaryColor,
                                                            backgroundColor: `${primaryColor}15`,
                                                        }
                                                        : undefined
                                                }
                                            >
                                                <span
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-colors ${isSelected
                                                            ? "text-white"
                                                            : "border border-[#333] text-[#666] group-hover:border-[#555] group-hover:text-[#999]"
                                                        }`}
                                                    style={
                                                        isSelected
                                                            ? { backgroundColor: primaryColor }
                                                            : undefined
                                                    }
                                                >
                                                    {isSelected ? (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    ) : (
                                                        String.fromCharCode(65 + oIdx)
                                                    )}
                                                </span>
                                                <span
                                                    className={`text-sm font-medium ${isSelected
                                                            ? "text-white"
                                                            : "text-[#ccc] group-hover:text-white"
                                                        }`}
                                                >
                                                    {option.text}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Lead Capture Step */}
                        {step === "lead" && (
                            <motion.div
                                key="lead"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: "easeInOut" }}
                                className="w-full"
                            >
                                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8">
                                    <div className="text-center mb-6">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                            style={{
                                                backgroundColor: `${primaryColor}15`,
                                            }}
                                        >
                                            <Mail
                                                className="w-7 h-7"
                                                style={{ color: primaryColor }}
                                            />
                                        </div>
                                        <h2 className="text-lg font-semibold text-white">
                                            {settings.leadFormTitle ||
                                                "Quase lá! Informe seu email"}
                                        </h2>
                                        <p className="text-[#a3a3a3] text-sm mt-1">
                                            Receba seu resultado personalizado
                                        </p>
                                    </div>
                                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#e5e5e5]">
                                                Email
                                            </Label>
                                            <Input
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                required
                                                className="bg-[#0a0a0a] border-[#262626] text-white placeholder:text-[#666] h-12"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-12 text-white font-semibold gap-2"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            {submitting ? (
                                                "Processando..."
                                            ) : (
                                                <>
                                                    Ver meu resultado
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* Result Step */}
                        {step === "result" && matchedResult && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="w-full"
                            >
                                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            delay: 0.2,
                                            type: "spring",
                                            stiffness: 200,
                                        }}
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                                        style={{
                                            backgroundColor: `${primaryColor}15`,
                                        }}
                                    >
                                        <Sparkles
                                            className="w-8 h-8"
                                            style={{ color: primaryColor }}
                                        />
                                    </motion.div>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 }}
                                        className="text-2xl font-bold text-white mb-3"
                                    >
                                        {matchedResult.title}
                                    </motion.h2>

                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.45 }}
                                        className="text-[#a3a3a3] leading-relaxed mb-6"
                                    >
                                        {matchedResult.description}
                                    </motion.p>

                                    {matchedResult.ctaUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.55 }}
                                        >
                                            <a
                                                href={matchedResult.ctaUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button
                                                    className="text-white font-semibold gap-2 px-8 h-12"
                                                    style={{
                                                        backgroundColor: primaryColor,
                                                    }}
                                                >
                                                    {matchedResult.ctaText ||
                                                        "Saiba Mais"}
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Fallback — no results configured */}
                        {step === "result" && !matchedResult && (
                            <motion.div
                                key="no-result"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full text-center"
                            >
                                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8">
                                    <CheckCircle2
                                        className="w-12 h-12 mx-auto mb-4"
                                        style={{ color: primaryColor }}
                                    />
                                    <h2 className="text-xl font-bold text-white mb-2">
                                        Quiz concluído!
                                    </h2>
                                    <p className="text-[#a3a3a3]">
                                        Obrigado por participar. Sua pontuação:{" "}
                                        <strong className="text-white">{totalScore}</strong>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-[#444] text-xs">
                        Feito com ✨ AI Marketing Studio
                    </p>
                </div>
            </div>
        </div>
    );
}
