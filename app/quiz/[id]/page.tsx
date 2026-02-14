import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuizPlayer from "./quiz-player";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function QuizPublicPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !quiz) {
        return notFound();
    }

    return <QuizPlayer quiz={quiz} />;
}
