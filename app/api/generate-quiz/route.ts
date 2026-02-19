import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.0-flash";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Você precisa estar logado." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, quantity } = body;

        if (!title || typeof title !== "string" || title.trim().length < 2) {
            return NextResponse.json(
                { error: "O título deve ter pelo menos 2 caracteres." },
                { status: 400 }
            );
        }

        const numQuestions = Math.min(Math.max(Number(quantity) || 5, 1), 20);

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: "Chave da API Gemini não configurada." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const systemPrompt = `Você é um especialista em Engajamento e Quizzes virais.
Crie um Quiz divertido e viral sobre o tema: "${title.trim()}".
${description ? `Contexto adicional: "${description.trim()}"` : ""}
Gere exatamente ${numQuestions} perguntas.
Para cada pergunta, crie 4 opções de resposta.
Atribua pontos para cada opção (ex: resposta mais forte = 10, intermediária = 5-7, fraca = 0-3).
As perguntas devem ser envolventes, divertidas e criativas.

SAÍDA OBRIGATÓRIA: Retorne APENAS um Array JSON puro, sem markdown, sem blocos de código, sem explicações, neste formato exato:
[
  {
    "title": "Texto da pergunta?",
    "options": [
      { "text": "Opção A", "points": 10 },
      { "text": "Opção B", "points": 5 },
      { "text": "Opção C", "points": 3 },
      { "text": "Opção D", "points": 0 }
    ]
  }
]`;

        console.log("[generate-quiz] Chamando Gemini para:", title);

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: systemPrompt,
        });

        const rawText = response.text;

        if (!rawText || rawText.trim().length < 10) {
            return NextResponse.json(
                { error: "A IA não conseguiu gerar o quiz. Tente novamente." },
                { status: 422 }
            );
        }

        // Clean up — remove markdown code fences if present
        let cleanJson = rawText.trim();
        if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }

        // Parse and validate the JSON
        let questions: Array<{ title: string; options: Array<{ text: string; points: number }> }>;
        try {
            questions = JSON.parse(cleanJson);
        } catch {
            console.error("[generate-quiz] Erro ao parsear JSON da IA:", cleanJson.substring(0, 200));
            return NextResponse.json(
                { error: "A IA retornou um formato inválido. Tente novamente." },
                { status: 422 }
            );
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { error: "A IA não gerou perguntas válidas. Tente novamente." },
                { status: 422 }
            );
        }

        // Validate structure of each question
        const validQuestions = questions
            .filter(
                (q) =>
                    q &&
                    typeof q.title === "string" &&
                    Array.isArray(q.options) &&
                    q.options.length >= 2
            )
            .map((q) => ({
                title: q.title,
                options: q.options
                    .filter((o) => o && typeof o.text === "string")
                    .map((o) => ({
                        text: o.text,
                        points: typeof o.points === "number" ? o.points : 0,
                    })),
            }));

        if (validQuestions.length === 0) {
            return NextResponse.json(
                { error: "Nenhuma pergunta válida foi gerada. Tente novamente." },
                { status: 422 }
            );
        }

        console.log(`[generate-quiz] ✅ ${validQuestions.length} perguntas geradas com sucesso`);

        return NextResponse.json({ questions: validQuestions });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[generate-quiz] ERRO:", err.message);
        return NextResponse.json(
            { error: `Erro interno: ${err.message}` },
            { status: 500 }
        );
    }
}
