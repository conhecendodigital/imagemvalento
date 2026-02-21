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
Gere exatamente ${numQuestions} perguntas com 4 opções de resposta cada.
Atribua pontos para cada opção (ex: resposta mais forte = 10, intermediária = 5-7, fraca = 0-3).
As perguntas devem ser envolventes, divertidas e criativas.

ALÉM DISSO, gere 3 a 4 "Resultados Possíveis" baseados na soma total de pontos.
Cada resultado deve ter um título criativo, uma descrição engajadora de 1-2 frases, e a faixa de pontuação (scoreMin e scoreMax).
As faixas de pontuação devem cobrir todas as pontuações possíveis sem lacunas e sem sobreposição.

SAÍDA OBRIGATÓRIA: Retorne APENAS um objeto JSON puro, sem markdown, sem blocos de código, sem explicações, neste formato exato:
{
  "questions": [
    {
      "title": "Texto da pergunta?",
      "options": [
        { "text": "Opção A", "points": 10 },
        { "text": "Opção B", "points": 5 },
        { "text": "Opção C", "points": 3 },
        { "text": "Opção D", "points": 0 }
      ]
    }
  ],
  "results": [
    {
      "title": "Iniciante Curioso",
      "description": "Você está apenas começando sua jornada...",
      "scoreMin": 0,
      "scoreMax": 20
    },
    {
      "title": "Mestre Supremo",
      "description": "Você domina este assunto!",
      "scoreMin": 21,
      "scoreMax": 50
    }
  ]
}`;

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
        let parsed: {
            questions?: Array<{ title: string; options: Array<{ text: string; points: number }> }>;
            results?: Array<{ title: string; description: string; scoreMin: number; scoreMax: number }>;
        };
        try {
            const raw = JSON.parse(cleanJson);
            // Handle both old array format (backward compat) and new object format
            if (Array.isArray(raw)) {
                parsed = { questions: raw, results: [] };
            } else {
                parsed = raw;
            }
        } catch {
            console.error("[generate-quiz] Erro ao parsear JSON da IA:", cleanJson.substring(0, 200));
            return NextResponse.json(
                { error: "A IA retornou um formato inválido. Tente novamente." },
                { status: 422 }
            );
        }

        const questions = parsed.questions;
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

        // Validate results
        const rawResults = parsed.results || [];
        const validResults = rawResults
            .filter(
                (r) =>
                    r &&
                    typeof r.title === "string" &&
                    typeof r.description === "string"
            )
            .map((r) => ({
                title: r.title,
                description: r.description,
                scoreMin: typeof r.scoreMin === "number" ? r.scoreMin : 0,
                scoreMax: typeof r.scoreMax === "number" ? r.scoreMax : 0,
            }));

        console.log(`[generate-quiz] ✅ ${validQuestions.length} perguntas + ${validResults.length} resultados gerados`);

        return NextResponse.json({ questions: validQuestions, results: validResults });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[generate-quiz] ERRO:", err.message);
        return NextResponse.json(
            { error: `Erro interno: ${err.message}` },
            { status: 500 }
        );
    }
}
