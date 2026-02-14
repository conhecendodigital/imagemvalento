import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";

const OBJECTIVE_LABELS: Record<string, string> = {
    sales: "página de vendas com foco em conversão, com seções de headline, benefícios, depoimentos, preço e CTA",
    lead_capture: "página de captura de leads com formulário de email, headline persuasiva e prova social",
    bio_link: "página de bio link moderna com links para redes sociais, breve apresentação e CTA principal",
};

function generateSlug(title: string): string {
    const base = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
        .trim()
        .replace(/\s+/g, "-")           // spaces -> hyphens
        .replace(/-+/g, "-")            // collapse hyphens
        .substring(0, 40);

    const random = Math.random().toString(36).substring(2, 6);
    return `${base}-${random}`;
}

export async function POST(request: Request) {
    try {
        console.log("[generate-page] Iniciando requisição...");

        const supabase = await createClient();

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            console.log("[generate-page] Usuário não autenticado:", authError?.message);
            return NextResponse.json(
                { error: "Você precisa estar logado." },
                { status: 401 }
            );
        }
        console.log("[generate-page] Usuário autenticado:", user.id);

        // Check credits_pages
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("credits_pages")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("[generate-page] Erro ao buscar perfil:", profileError);
            return NextResponse.json(
                { error: "Erro ao verificar créditos." },
                { status: 500 }
            );
        }

        if (!profile || profile.credits_pages <= 0) {
            console.log("[generate-page] Sem créditos de página:", profile?.credits_pages);
            return NextResponse.json(
                { error: "Você não tem créditos de página suficientes." },
                { status: 403 }
            );
        }
        console.log("[generate-page] Créditos disponíveis:", profile.credits_pages);

        // Parse request body
        const body = await request.json();
        const { title, niche, objective } = body;
        console.log("[generate-page] Title:", title, "| Niche:", niche, "| Objective:", objective);

        if (!title || typeof title !== "string" || title.trim().length < 2) {
            return NextResponse.json(
                { error: "O nome da página deve ter pelo menos 2 caracteres." },
                { status: 400 }
            );
        }

        if (!niche || typeof niche !== "string" || niche.trim().length < 2) {
            return NextResponse.json(
                { error: "O nicho deve ter pelo menos 2 caracteres." },
                { status: 400 }
            );
        }

        const validObjectives = ["sales", "lead_capture", "bio_link"];
        if (!objective || !validObjectives.includes(objective)) {
            return NextResponse.json(
                { error: "Objetivo inválido." },
                { status: 400 }
            );
        }

        // Initialize Gemini SDK
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.error("[generate-page] GEMINI_API_KEY não configurada!");
            return NextResponse.json(
                { error: "Chave da API Gemini não configurada." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        const objectiveDescription = OBJECTIVE_LABELS[objective] || "página web moderna";

        const systemPrompt = `Você é um expert em web design e marketing digital. Gere um arquivo HTML único, moderno, responsivo, dark mode, usando Tailwind CSS via CDN (inclua <script src="https://cdn.tailwindcss.com"></script> no head). Crie uma ${objectiveDescription}, focado em conversão para o nicho "${niche}". O título/produto é "${title}". Use cores vibrantes que combinem com o tema dark. Inclua seções bem definidas com ícones unicode. Retorne APENAS o HTML cru, sem markdown, sem blocos de código, sem explicações.`;

        console.log("[generate-page] Chamando Gemini...");

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: systemPrompt,
        });

        const htmlContent = response.text;

        if (!htmlContent || htmlContent.trim().length < 50) {
            console.error("[generate-page] HTML gerado muito curto ou vazio");
            return NextResponse.json(
                { error: "A IA não conseguiu gerar a página. Tente novamente." },
                { status: 422 }
            );
        }

        console.log("[generate-page] HTML gerado com sucesso! Tamanho:", htmlContent.length);

        // Clean up the HTML — remove markdown code fences if present
        let cleanHtml = htmlContent.trim();
        if (cleanHtml.startsWith("```html")) {
            cleanHtml = cleanHtml.replace(/^```html\n?/, "").replace(/\n?```$/, "");
        } else if (cleanHtml.startsWith("```")) {
            cleanHtml = cleanHtml.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }

        // Generate unique slug
        const slug = generateSlug(title);
        console.log("[generate-page] Slug gerado:", slug);

        // Save to database
        const { data: pageRecord, error: dbError } = await supabase
            .from("pages")
            .insert({
                user_id: user.id,
                title: title.trim(),
                slug,
                html_content: cleanHtml,
                page_type: objective,
                status: "published",
            })
            .select()
            .single();

        if (dbError) {
            console.error("[generate-page] Erro ao salvar no banco:", dbError);
            return NextResponse.json(
                { error: "Página gerada mas houve erro ao salvar." },
                { status: 500 }
            );
        }

        console.log("[generate-page] Página salva! ID:", pageRecord.id);

        // Deduct credit
        const { error: creditError } = await supabase
            .from("profiles")
            .update({ credits_pages: profile.credits_pages - 1 })
            .eq("id", user.id);

        if (creditError) {
            console.error("[generate-page] Erro ao descontar crédito:", creditError);
        } else {
            console.log("[generate-page] Crédito descontado. Restante:", profile.credits_pages - 1);
        }

        console.log("[generate-page] ✅ Sucesso!");

        return NextResponse.json({
            success: true,
            slug,
            pageId: pageRecord.id,
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[generate-page] ERRO DETALHADO:", err.message);
        console.error("[generate-page] Stack:", err.stack);
        return NextResponse.json(
            { error: `Erro interno: ${err.message}` },
            { status: 500 }
        );
    }
}
