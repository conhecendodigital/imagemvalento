export interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    plan: "free" | "starter" | "pro" | "agency";
    credits_images: number;
    credits_pages: number;
    credits_quiz: number;
    created_at: string;
    updated_at: string;
}

export interface GeneratedImage {
    id: string;
    user_id: string;
    prompt: string;
    preset: string | null;
    style: string | null;
    image_url: string | null;
    dimensions: string | null;
    model: string;
    created_at: string;
}

export interface Page {
    id: string;
    user_id: string;
    title: string;
    slug: string | null;
    html_content: string | null;
    css_content: string | null;
    grapes_data: Record<string, unknown> | null;
    page_type: "sales" | "bio_link" | "lead_capture";
    status: "draft" | "published";
    product_data: Record<string, unknown> | null;
    published_url: string | null;
    views: number;
    created_at: string;
    updated_at: string;
}

export interface Quiz {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    slug: string | null;
    config: QuizConfig;
    settings: QuizSettings;
    status: "draft" | "published";
    page_id: string | null;
    total_responses: number;
    created_at: string;
    updated_at: string;
}

export interface QuizConfig {
    questions: {
        id: string;
        text: string;
        type: "single" | "multiple" | "image_choice";
        options: {
            id: string;
            text: string;
            imageUrl?: string;
            points: number;
            nextQuestionId?: string;
        }[];
    }[];
    results: {
        id: string;
        title: string;
        description: string;
        imageUrl?: string;
        scoreMin: number;
        scoreMax: number;
        ctaText: string;
        ctaUrl: string;
    }[];
}

export interface QuizSettings {
    collectLeadBeforeResult: boolean;
    leadFields: { name: boolean; email: boolean; phone: boolean };
    leadFormTitle: string;
    showProgressBar: boolean;
    timerPerQuestion: number | null;
    webhookUrl: string | null;
    primaryColor: string;
    backgroundImage: string | null;
}

export interface QuizResponse {
    id: string;
    quiz_id: string;
    answers: Record<string, unknown>;
    result_id: string | null;
    result_title: string | null;
    score: number;
    lead_name: string | null;
    lead_email: string | null;
    lead_phone: string | null;
    completed: boolean;
    created_at: string;
}

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export interface DashboardStats {
    totalImages: number;
    activePages: number;
    quizResponses: number;
    conversations: number;
}

export interface PageAnalysisReport {
    score: number;
    strengths: string[];
    weaknesses: string[];
}

export interface PageAnalysis {
    id: string;
    user_id: string;
    url: string;
    cro_score: number;
    report_data: PageAnalysisReport;
    created_at: string;
}
