import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT =
    "Você é o maior especialista de Marketing Digital do Brasil. " +
    "Seja direto, estratégico e use gírias do mercado (LTV, CAC, ROI, ROAS, CPC, CPA, funil, lead, persona, copy, CRO, etc). " +
    "Responda sempre em português do Brasil. Use markdown para formatar suas respostas quando apropriado.";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return Response.json(
                { error: "Não autenticado." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { message, sessionId } = body as {
            message: string;
            sessionId?: string;
        };

        if (!message || typeof message !== "string" || message.trim().length < 1) {
            return Response.json(
                { error: "Mensagem inválida." },
                { status: 400 }
            );
        }

        // --- Session management ---
        let activeSessionId = sessionId;

        if (!activeSessionId) {
            // Create a new session
            const { data: session, error: sessionError } = await supabase
                .from("chat_sessions")
                .insert({ user_id: user.id, title: "Nova conversa" })
                .select("id")
                .single();

            if (sessionError || !session) {
                console.error("[chat] Error creating session:", sessionError);
                return Response.json(
                    { error: "Erro ao criar sessão." },
                    { status: 500 }
                );
            }
            activeSessionId = session.id;
        }

        // --- Save user message ---
        const { error: userMsgError } = await supabase
            .from("chat_messages")
            .insert({
                session_id: activeSessionId,
                role: "user",
                content: message.trim(),
            });

        if (userMsgError) {
            console.error("[chat] Error saving user message:", userMsgError);
        }

        // --- Load conversation history ---
        const { data: history } = await supabase
            .from("chat_messages")
            .select("role, content")
            .eq("session_id", activeSessionId)
            .order("created_at", { ascending: true })
            .limit(50);

        const chatHistory = (history || []).map((msg) => ({
            role: msg.role === "user" ? ("user" as const) : ("model" as const),
            parts: [{ text: msg.content }],
        }));

        // --- Gemini streaming ---
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: "GEMINI_API_KEY não configurada." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        // Remove last user message from history since we pass it as the new message
        const previousHistory = chatHistory.slice(0, -1);

        const stream = new ReadableStream({
            async start(controller) {
                let fullResponse = "";

                try {
                    const response = await ai.models.generateContentStream({
                        model: "gemini-2.5-flash",
                        contents: [
                            ...previousHistory,
                            {
                                role: "user" as const,
                                parts: [{ text: message.trim() }],
                            },
                        ],
                        config: {
                            systemInstruction: SYSTEM_PROMPT,
                        },
                    });

                    for await (const chunk of response) {
                        const text = chunk.text || "";
                        if (text) {
                            fullResponse += text;
                            controller.enqueue(
                                new TextEncoder().encode(
                                    `data: ${JSON.stringify({ text, sessionId: activeSessionId })}\n\n`
                                )
                            );
                        }
                    }

                    // Save assistant response
                    if (fullResponse.trim()) {
                        await supabase.from("chat_messages").insert({
                            session_id: activeSessionId,
                            role: "model",
                            content: fullResponse.trim(),
                        });

                        // Auto-title on first message (when no prior history)
                        if (previousHistory.length === 0) {
                            try {
                                const titleResponse =
                                    await ai.models.generateContent({
                                        model: "gemini-2.5-flash",
                                        contents: `Resuma esta pergunta em no máximo 5 palavras para usar como título de conversa. Retorne APENAS o título, sem aspas nem pontuação final. Pergunta: "${message.trim()}"`,
                                    });

                                const title =
                                    titleResponse.text?.trim().slice(0, 80) ||
                                    "Nova conversa";

                                await supabase
                                    .from("chat_sessions")
                                    .update({
                                        title,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq("id", activeSessionId);
                            } catch {
                                // Title generation is non-critical
                            }
                        } else {
                            // Update session timestamp
                            await supabase
                                .from("chat_sessions")
                                .update({
                                    updated_at: new Date().toISOString(),
                                })
                                .eq("id", activeSessionId);
                        }
                    }

                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({ done: true, sessionId: activeSessionId })}\n\n`
                        )
                    );
                } catch (err) {
                    const errorMessage =
                        err instanceof Error ? err.message : "Erro desconhecido";
                    console.error("[chat] Gemini stream error:", errorMessage);
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
                        )
                    );
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[chat] Error:", err.message);
        return Response.json(
            { error: `Erro interno: ${err.message}` },
            { status: 500 }
        );
    }
}
