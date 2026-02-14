import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(request: Request) {
    try {
        console.log("[analyze] Iniciando análise...");

        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Você precisa estar logado." },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { url } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "URL é obrigatória." },
                { status: 400 }
            );
        }

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new Error("Protocolo inválido");
            }
        } catch {
            return NextResponse.json(
                { error: "URL inválida. Use uma URL completa (ex: https://exemplo.com)." },
                { status: 400 }
            );
        }

        console.log("[analyze] Buscando HTML de:", parsedUrl.href);

        // Fetch the page HTML
        let htmlContent: string;
        try {
            const pageResponse = await fetch(parsedUrl.href, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; CROAnalyzer/1.0)",
                    "Accept": "text/html",
                },
                signal: AbortSignal.timeout(15000),
            });

            if (!pageResponse.ok) {
                return NextResponse.json(
                    { error: `Não foi possível acessar a página (status ${pageResponse.status}).` },
                    { status: 422 }
                );
            }

            htmlContent = await pageResponse.text();
        } catch (fetchError) {
            console.error("[analyze] Erro ao buscar página:", fetchError);
            return NextResponse.json(
                { error: "Não foi possível acessar essa URL. Verifique se ela está acessível." },
                { status: 422 }
            );
        }

        // Truncate HTML to avoid exceeding Gemini context limits
        const truncatedHtml = htmlContent.substring(0, 15000);
        console.log("[analyze] HTML capturado:", truncatedHtml.length, "caracteres");

        // Initialize Gemini SDK
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: "Chave da API Gemini não configurada." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const prompt = `Analise o HTML desta página web para CRO (Otimização de Conversão).

URL analisada: ${parsedUrl.href}

HTML da página:
\`\`\`html
${truncatedHtml}
\`\`\`

Faça uma análise profissional de CRO. Dê uma nota de 0 a 100. Liste exatamente 3 Pontos Fortes e 3 Pontos Fracos.

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem explicação extra. O formato deve ser exatamente:
{"score": <número 0-100>, "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"], "weaknesses": ["ponto fraco 1", "ponto fraco 2", "ponto fraco 3"]}`;

        console.log("[analyze] Enviando para Gemini...");

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const responseText = response.text || "";
        console.log("[analyze] Resposta Gemini:", responseText.substring(0, 500));

        // Parse the JSON response
        let report: { score: number; strengths: string[]; weaknesses: string[] };
        try {
            report = JSON.parse(responseText);

            // Validate structure
            if (
                typeof report.score !== "number" ||
                !Array.isArray(report.strengths) ||
                !Array.isArray(report.weaknesses)
            ) {
                throw new Error("Estrutura JSON inválida");
            }

            // Clamp score
            report.score = Math.max(0, Math.min(100, Math.round(report.score)));
        } catch (parseError) {
            console.error("[analyze] Erro ao parsear resposta:", parseError, responseText);
            return NextResponse.json(
                { error: "A IA retornou uma resposta inválida. Tente novamente." },
                { status: 422 }
            );
        }

        console.log("[analyze] Score:", report.score, "| Strengths:", report.strengths.length, "| Weaknesses:", report.weaknesses.length);

        // Save to database
        const { data: analysis, error: dbError } = await supabase
            .from("page_analyses")
            .insert({
                user_id: user.id,
                url: parsedUrl.href,
                cro_score: report.score,
                report_data: report,
            })
            .select()
            .single();

        if (dbError) {
            console.error("[analyze] Erro ao salvar no banco:", dbError);
            return NextResponse.json(
                { error: "Análise gerada mas houve erro ao salvar. Tente novamente." },
                { status: 500 }
            );
        }

        console.log("[analyze] ✅ Análise salva! ID:", analysis.id);

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[analyze] ERRO:", err.message);
        return NextResponse.json(
            { error: `Erro interno: ${err.message}` },
            { status: 500 }
        );
    }
}
