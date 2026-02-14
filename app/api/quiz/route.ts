import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, config, settings } = body;

        if (!title || !config) {
            return NextResponse.json(
                { error: "Título e configuração são obrigatórios" },
                { status: 400 }
            );
        }

        // Generate slug from title
        const slug =
            title
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") +
            "-" +
            Math.random().toString(36).substring(2, 7);

        const { data, error } = await supabase
            .from("quizzes")
            .insert({
                user_id: user.id,
                title,
                description: description || null,
                slug,
                config,
                settings: settings || {},
                status: "draft",
            })
            .select()
            .single();

        if (error) {
            console.error("Quiz create error:", error);
            return NextResponse.json(
                { error: "Erro ao criar quiz" },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Quiz API error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
