"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Lightbulb,
    Send,
    Plus,
    MessageSquare,
    Trash2,
    Loader2,
    Sparkles,
    Bot,
    User,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

/* ---------- types ---------- */
interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

interface ChatMessage {
    id: string;
    session_id: string;
    role: "user" | "model";
    content: string;
    created_at: string;
}

/* ---------- Quick-start suggestions ---------- */
const SUGGESTIONS = [
    "Como melhorar meu funil de vendas?",
    "Qual a melhor estratégia para reduzir CAC?",
    "Me ajude a criar uma copy para Instagram",
    "Como calcular o ROI das minhas campanhas?",
];

export default function StrategistPage() {
    const supabase = createClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    /* state */
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    /* ---------- Load sessions ---------- */
    const loadSessions = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        setSessions(data || []);
        setLoadingSessions(false);
    }, [supabase]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    /* ---------- Load messages for active session ---------- */
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }

        async function loadMessages() {
            setLoadingMessages(true);
            const { data } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("session_id", activeSessionId)
                .order("created_at", { ascending: true });

            setMessages(data || []);
            setLoadingMessages(false);
        }

        loadMessages();
    }, [activeSessionId, supabase]);

    /* ---------- Auto-scroll ---------- */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ---------- Send message ---------- */
    async function sendMessage(text?: string) {
        const messageText = (text || input).trim();
        if (!messageText || isStreaming) return;

        setInput("");
        setIsStreaming(true);

        // Optimistic: add user bubble
        const tempUserMsg: ChatMessage = {
            id: `temp-user-${Date.now()}`,
            session_id: activeSessionId || "",
            role: "user",
            content: messageText,
            created_at: new Date().toISOString(),
        };

        // Optimistic: add empty assistant bubble
        const tempAssistantMsg: ChatMessage = {
            id: `temp-assistant-${Date.now()}`,
            session_id: activeSessionId || "",
            role: "model",
            content: "",
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    sessionId: activeSessionId,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao enviar mensagem.");
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n\n").filter(Boolean);

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.error) {
                                toast.error(data.error);
                                break;
                            }

                            if (data.text) {
                                fullResponse += data.text;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const lastIdx = updated.length - 1;
                                    updated[lastIdx] = {
                                        ...updated[lastIdx],
                                        content: fullResponse,
                                    };
                                    return updated;
                                });
                            }

                            if (data.done && data.sessionId) {
                                // If this was a new session, set it active
                                if (!activeSessionId) {
                                    setActiveSessionId(data.sessionId);
                                }
                                // Refresh sessions list (to get new title etc.)
                                loadSessions();
                            }
                        } catch {
                            // skip malformed SSE chunks
                        }
                    }
                }
            }
        } catch (error) {
            const msg =
                error instanceof Error
                    ? error.message
                    : "Erro ao enviar mensagem.";
            toast.error(msg);
            // Remove the optimistic messages on error
            setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    }

    /* ---------- New conversation ---------- */
    function startNewConversation() {
        setActiveSessionId(null);
        setMessages([]);
        inputRef.current?.focus();
    }

    /* ---------- Delete session ---------- */
    async function deleteSession(sessionId: string) {
        const { error } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("id", sessionId);

        if (error) {
            toast.error("Erro ao deletar conversa.");
            return;
        }

        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
            setMessages([]);
        }
        loadSessions();
        toast.success("Conversa deletada.");
    }

    /* ---------- Key handler ---------- */
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    /* ---------- RENDER ---------- */
    return (
        <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6 lg:-m-8">
            {/* ========== SIDEBAR ========== */}
            <aside
                className={cn(
                    "bg-[#111111] border-r border-[#262626] flex flex-col transition-all duration-300 shrink-0",
                    sidebarOpen ? "w-72" : "w-0 overflow-hidden"
                )}
            >
                {/* Sidebar Header */}
                <div className="p-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white truncate">
                        Conversas
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#a3a3a3] hover:text-white"
                        onClick={startNewConversation}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                <Separator className="bg-[#262626]" />

                {/* Session list */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 text-[#666] animate-spin" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <p className="text-xs text-[#666] text-center py-8 px-2">
                                Nenhuma conversa ainda.
                                <br />
                                Comece uma nova!
                            </p>
                        ) : (
                            sessions.map((s) => (
                                <div
                                    key={s.id}
                                    className={cn(
                                        "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm",
                                        s.id === activeSessionId
                                            ? "bg-purple-500/10 text-purple-300"
                                            : "text-[#a3a3a3] hover:bg-white/5 hover:text-white"
                                    )}
                                    onClick={() => setActiveSessionId(s.id)}
                                >
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    <span className="truncate flex-1">
                                        {s.title}
                                    </span>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(s.id);
                                        }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </aside>

            {/* ========== MAIN CHAT AREA ========== */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Chat header */}
                <div className="h-12 border-b border-[#262626] bg-[#0e0e0e] flex items-center px-4 gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#a3a3a3] hover:text-white"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? (
                            <PanelLeftClose className="w-4 h-4" />
                        ) : (
                            <PanelLeftOpen className="w-4 h-4" />
                        )}
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white">
                            Estrategista Digital
                        </span>
                    </div>
                </div>

                {/* Messages area */}
                <ScrollArea className="flex-1">
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        {/* Empty state */}
                        {messages.length === 0 && !loadingMessages && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mb-6">
                                    <Sparkles className="w-10 h-10 text-yellow-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">
                                    Estrategista de Marketing Digital
                                </h2>
                                <p className="text-[#a3a3a3] text-sm max-w-md mb-8">
                                    Converse com um especialista em marketing
                                    digital. Tire dúvidas sobre funil, copy,
                                    tráfego pago, métricas e muito mais.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(s)}
                                            disabled={isStreaming}
                                            className="text-left px-4 py-3 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#1a1a1a] hover:border-purple-500/30 text-sm text-[#a3a3a3] hover:text-white transition-all"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loading messages */}
                        {loadingMessages && (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            </div>
                        )}

                        {/* Message list */}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3 mb-6",
                                    msg.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                )}
                            >
                                {/* AI avatar */}
                                {msg.role === "model" && (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                {/* Bubble */}
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                        msg.role === "user"
                                            ? "bg-purple-600 text-white rounded-tr-md"
                                            : "bg-[#1a1a1a] text-[#e5e5e5] border border-[#262626] rounded-tl-md"
                                    )}
                                >
                                    {msg.role === "model" ? (
                                        msg.content ? (
                                            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-[#d4d4d4] prose-strong:text-white prose-code:text-purple-300 prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[#262626]">
                                                <ReactMarkdown
                                                    remarkPlugins={[
                                                        remarkGfm,
                                                    ]}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        )
                                    ) : (
                                        <p className="whitespace-pre-wrap">
                                            {msg.content}
                                        </p>
                                    )}
                                </div>

                                {/* User avatar */}
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                                        <User className="w-4 h-4 text-purple-400" />
                                    </div>
                                )}
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* ========== INPUT BAR ========== */}
                <div className="border-t border-[#262626] bg-[#0e0e0e] p-4 shrink-0">
                    <div className="max-w-3xl mx-auto flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pergunte ao estrategista..."
                                disabled={isStreaming}
                                rows={1}
                                className="w-full resize-none rounded-xl border border-[#262626] bg-[#141414] text-white text-sm placeholder:text-[#666] px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all disabled:opacity-50 max-h-32"
                                style={{
                                    height: "auto",
                                    minHeight: "44px",
                                }}
                                onInput={(e) => {
                                    const target =
                                        e.target as HTMLTextAreaElement;
                                    target.style.height = "auto";
                                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                }}
                            />
                        </div>
                        <Button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isStreaming}
                            size="icon"
                            className="h-11 w-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-30 shrink-0 transition-all"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-center text-[10px] text-[#4a4a4a] mt-2">
                        Powered by Gemini AI · As respostas podem conter erros
                    </p>
                </div>
            </div>
        </div>
    );
}
