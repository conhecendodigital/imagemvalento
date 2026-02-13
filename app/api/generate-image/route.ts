import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash-image";

// Aspect ratio presets (supported by Gemini image generation)
const FORMAT_CONFIG: Record<string, { aspectRatio: string; label: string }> = {
    "youtube-thumbnail": { aspectRatio: "16:9", label: "1280x720" },
    "instagram-story": { aspectRatio: "9:16", label: "1080x1920" },
    "instagram-post": { aspectRatio: "1:1", label: "1080x1080" },
    "facebook-cover": { aspectRatio: "16:9", label: "1200x630" },
    "general": { aspectRatio: "1:1", label: "1024x1024" },
};

export async function POST(request: Request) {
    try {
        console.log("[generate-image] Iniciando requisição...");

        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.log("[generate-image] Usuário não autenticado:", authError?.message);
            return NextResponse.json(
                { error: "Você precisa estar logado." },
                { status: 401 }
            );
        }
        console.log("[generate-image] Usuário autenticado:", user.id);

        // Check credits
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("credits_images")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("[generate-image] Erro ao buscar perfil:", profileError);
            return NextResponse.json(
                { error: "Erro ao verificar créditos." },
                { status: 500 }
            );
        }

        if (!profile || profile.credits_images <= 0) {
            console.log("[generate-image] Sem créditos:", profile?.credits_images);
            return NextResponse.json(
                { error: "Você não tem créditos de imagem suficientes." },
                { status: 403 }
            );
        }
        console.log("[generate-image] Créditos disponíveis:", profile.credits_images);

        // Parse request body
        const body = await request.json();
        const { prompt, style, format } = body;
        console.log("[generate-image] Prompt:", prompt, "| Style:", style, "| Format:", format);

        if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
            return NextResponse.json(
                { error: "O prompt deve ter pelo menos 3 caracteres." },
                { status: 400 }
            );
        }

        // Build enhanced prompt with style
        const formatCfg = FORMAT_CONFIG[format] || FORMAT_CONFIG["general"];
        let enhancedPrompt = prompt.trim();
        if (style && style !== "default") {
            enhancedPrompt = `${enhancedPrompt}, in ${style} style`;
        }
        enhancedPrompt = `${enhancedPrompt}. High quality, professional.`;

        // Initialize Gemini SDK
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.error("[generate-image] GEMINI_API_KEY não configurada!");
            return NextResponse.json(
                { error: "Chave da API Gemini não configurada." },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });

        console.log("[generate-image] Chamando Gemini SDK...");
        console.log("[generate-image] Model:", GEMINI_MODEL);
        console.log("[generate-image] Aspect ratio:", formatCfg.aspectRatio);
        console.log("[generate-image] Enhanced prompt:", enhancedPrompt);

        // Generate image using SDK
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: enhancedPrompt,
            config: {
                responseModalities: ["IMAGE", "TEXT"],
                imageConfig: {
                    aspectRatio: formatCfg.aspectRatio,
                },
            },
        });

        console.log("[generate-image] Resposta recebida do Gemini SDK");

        // Extract image from response
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            console.error("[generate-image] Sem candidates na resposta");
            return NextResponse.json(
                { error: "A IA não conseguiu gerar uma imagem. Tente um prompt diferente." },
                { status: 422 }
            );
        }

        console.log("[generate-image] Candidates:", candidates.length);

        let imageBase64: string | null = null;
        let imageMimeType = "image/png";

        for (const part of candidates[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageBase64 = part.inlineData.data || null;
                imageMimeType = part.inlineData.mimeType || "image/png";
                console.log("[generate-image] Imagem encontrada! MimeType:", imageMimeType, "| Tamanho base64:", imageBase64?.length);
                break;
            }
            if (part.text) {
                console.log("[generate-image] Texto retornado:", part.text.substring(0, 200));
            }
        }

        if (!imageBase64) {
            console.error("[generate-image] Nenhuma imagem na resposta");
            return NextResponse.json(
                { error: "A IA não retornou uma imagem. Tente um prompt diferente." },
                { status: 422 }
            );
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageBase64, "base64");
        const extension = imageMimeType.includes("png") ? "png" : "jpg";
        const fileName = `${user.id}/${Date.now()}.${extension}`;

        console.log("[generate-image] Tentando upload para o bucket... Arquivo:", fileName, "| Tamanho:", imageBuffer.length, "bytes");

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(fileName, imageBuffer, {
                contentType: imageMimeType,
                upsert: false,
            });

        if (uploadError) {
            console.error("[generate-image] ERRO upload:", uploadError);
            return NextResponse.json(
                { error: "Erro ao salvar a imagem no storage. Tente novamente." },
                { status: 500 }
            );
        }

        console.log("[generate-image] Upload concluído!");

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("generated-images")
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;
        console.log("[generate-image] URL pública:", publicUrl);

        // Save metadata to database
        const { data: imageRecord, error: dbError } = await supabase
            .from("generated_images")
            .insert({
                user_id: user.id,
                prompt: prompt.trim(),
                preset: format || "general",
                style: style || "default",
                image_url: publicUrl,
                dimensions: formatCfg.label,
                model: GEMINI_MODEL,
            })
            .select()
            .single();

        if (dbError) {
            console.error("[generate-image] ERRO database:", dbError);
            return NextResponse.json(
                { error: "Imagem gerada mas houve erro ao salvar os dados." },
                { status: 500 }
            );
        }

        console.log("[generate-image] Metadados salvos! ID:", imageRecord.id);

        // Deduct credit
        const { error: creditError } = await supabase
            .from("profiles")
            .update({ credits_images: profile.credits_images - 1 })
            .eq("id", user.id);

        if (creditError) {
            console.error("[generate-image] Erro ao descontar crédito:", creditError);
        } else {
            console.log("[generate-image] Crédito descontado. Restante:", profile.credits_images - 1);
        }

        console.log("[generate-image] ✅ Sucesso!");

        return NextResponse.json({
            success: true,
            image: {
                id: imageRecord.id,
                url: publicUrl,
                prompt: prompt.trim(),
                style: style || "default",
                format: format || "general",
                dimensions: formatCfg.label,
            },
        });
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[generate-image] ERRO DETALHADO:", err.message);
        console.error("[generate-image] Stack:", err.stack);
        return NextResponse.json(
            { error: `Erro interno: ${err.message}` },
            { status: 500 }
        );
    }
}
