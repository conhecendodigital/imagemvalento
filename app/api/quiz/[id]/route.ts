import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Verify ownership
        const { data: existing, error: fetchError } = await supabase
            .from("quizzes")
            .select("user_id")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json(
                { error: "Quiz não encontrado" },
                { status: 404 }
            );
        }

        if (existing.user_id !== user.id) {
            return NextResponse.json(
                { error: "Você não tem permissão para editar este quiz" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, description, config, settings } = body;

        if (!title || !config) {
            return NextResponse.json(
                { error: "Título e configuração são obrigatórios" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("quizzes")
            .update({
                title,
                description: description || null,
                config,
                settings: settings || {},
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Quiz update error:", error);
            return NextResponse.json(
                { error: "Erro ao atualizar quiz" },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Quiz PUT API error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Verify ownership
        const { data: existing, error: fetchError } = await supabase
            .from("quizzes")
            .select("user_id")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json(
                { error: "Quiz não encontrado" },
                { status: 404 }
            );
        }

        if (existing.user_id !== user.id) {
            return NextResponse.json(
                { error: "Você não tem permissão para excluir este quiz" },
                { status: 403 }
            );
        }

        // Step 1: Delete associated leads (foreign key integrity)
        const { error: leadsError } = await supabase
            .from("quiz_leads")
            .delete()
            .eq("quiz_id", id);

        if (leadsError) {
            console.error("Error deleting quiz_leads:", leadsError);
            return NextResponse.json(
                { error: "Erro ao excluir respostas do quiz" },
                { status: 500 }
            );
        }

        // Step 2: Delete the quiz
        const { error: deleteError } = await supabase
            .from("quizzes")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Error deleting quiz:", deleteError);
            return NextResponse.json(
                { error: "Erro ao excluir quiz" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Quiz DELETE API error:", err);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
