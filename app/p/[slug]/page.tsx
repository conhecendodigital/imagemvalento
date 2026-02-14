import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: page } = await supabase
        .from("pages")
        .select("title")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    return {
        title: page?.title || "Página não encontrada",
    };
}

export default async function PublicPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: page, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

    if (error || !page || !page.html_content) {
        notFound();
    }

    return (
        <div
            className="w-full min-h-screen"
            dangerouslySetInnerHTML={{ __html: page.html_content }}
        />
    );
}
