import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_TEXT_LENGTH = 15000;
const FETCH_TIMEOUT_MS = 20000;

/**
 * Sanitize a URL: trim, strip trailing slashes, ensure protocol.
 */
function sanitizeUrl(raw: string): string {
    let cleaned = raw.trim();

    // Auto-prepend https if missing
    if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
        cleaned = "https://" + cleaned;
    }

    // Remove trailing slashes (but keep the root "/" for bare domains)
    cleaned = cleaned.replace(/\/+$/, "");

    return cleaned;
}

/**
 * Strip scripts, styles, and HTML tags, returning only visible text.
 */
function extractVisibleText(html: string): string {
    let text = html;

    // Remove <script> blocks (incl. content)
    text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");

    // Remove <style> blocks (incl. content)
    text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");

    // Remove <noscript> blocks
    text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

    // Remove <svg> blocks (often huge)
    text = text.replace(/<svg[\s\S]*?<\/svg>/gi, " ");

    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, " ");

    // Replace <br>, <p>, <div>, <li>, <h*> tags with newlines for readability
    text = text.replace(/<\s*(br|p|div|li|h[1-6]|tr|section|article)[^>]*>/gi, "\n");

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, " ");

    // Decode common HTML entities
    text = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'");

    // Collapse whitespace: multiple spaces → one, multiple newlines → two
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n\s*\n+/g, "\n\n");
    text = text.trim();

    return text;
}

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

        if (!url || typeof url !== "string" || url.trim().length < 5) {
            return NextResponse.json(
                { error: "URL é obrigatória." },
                { status: 400 }
            );
        }

        // Sanitize URL
        const cleanedUrl = sanitizeUrl(url);

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(cleanedUrl);
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

        // Fetch the page HTML with browser-like headers
        let htmlContent: string;
        try {
            const pageResponse = await fetch(parsedUrl.href, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Accept-Encoding": "identity",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
                redirect: "follow",
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });

            if (!pageResponse.ok) {
                console.error("[analyze] Fetch status:", pageResponse.status);
                return NextResponse.json(
                    { error: `Não foi possível acessar este site (status ${pageResponse.status}). Verifique se a URL permite leitura pública.` },
                    { status: 400 }
                );
            }

            htmlContent = await pageResponse.text();
        } catch (fetchError) {
            console.error("[analyze] Erro ao buscar página:", fetchError);
            return NextResponse.json(
                { error: "Não foi possível acessar este site. Verifique se a URL está correta e permite leitura pública." },
                { status: 400 }
            );
        }

        // Extract visible text only (remove scripts, styles, tags)
        const visibleText = extractVisibleText(htmlContent);
        const truncatedText = visibleText.substring(0, MAX_TEXT_LENGTH);

        console.log("[analyze] HTML bruto:", htmlContent.length, "chars → Texto limpo:", visibleText.length, "chars → Truncado:", truncatedText.length, "chars");

        if (truncatedText.length < 50) {
            return NextResponse.json(
                { error: "A página não contém texto suficiente para análise. Verifique se a URL está correta." },
                { status: 400 }
            );
        }

        // Initialize Gemini SDK
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: "Chave da API Gemini não configurada." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const prompt = `Analise o conteúdo textual desta página web para CRO (Otimização de Conversão).

URL analisada: ${parsedUrl.href}

Conteúdo da página:
---
${truncatedText}
---

Faça uma análise profissional de CRO. Dê uma nota de 0 a 100. Liste exatamente 3 Pontos Fortes e 3 Pontos Fracos.
Cada ponto forte e fraco deve ser uma frase curta e objetiva em português.

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

            // Ensure exactly 3 items, pad if needed
            while (report.strengths.length < 3) report.strengths.push("Não identificado");
            while (report.weaknesses.length < 3) report.weaknesses.push("Não identificado");
            report.strengths = report.strengths.slice(0, 3);
            report.weaknesses = report.weaknesses.slice(0, 3);
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
                target_url: parsedUrl.href,
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
