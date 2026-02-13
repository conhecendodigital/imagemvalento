"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    ImageIcon,
    Sparkles,
    Loader2,
    Download,
    Trash2,
    Wand2,
} from "lucide-react";
import type { GeneratedImage } from "@/lib/types";

const STYLES = [
    { value: "default", label: "Padrão" },
    { value: "realistic", label: "Realista" },
    { value: "3d-render", label: "3D Render" },
    { value: "anime", label: "Anime" },
    { value: "cyberpunk", label: "Cyberpunk" },
    { value: "watercolor", label: "Aquarela" },
    { value: "oil-painting", label: "Pintura a Óleo" },
    { value: "pixel-art", label: "Pixel Art" },
];

const FORMATS = [
    { value: "general", label: "Quadrado (1024x1024)" },
    { value: "youtube-thumbnail", label: "YouTube Thumbnail (1280x720)" },
    { value: "instagram-story", label: "Instagram Story (1080x1920)" },
    { value: "instagram-post", label: "Instagram Post (1080x1080)" },
    { value: "facebook-cover", label: "Facebook Cover (1200x630)" },
];

export default function ImagesPage() {
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("default");
    const [format, setFormat] = useState("general");
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(true);

    const supabase = createClient();

    // Load existing images on mount
    useEffect(() => {
        async function loadImages() {
            const { data, error } = await supabase
                .from("generated_images")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (!error && data) {
                setImages(data);
            }
            setLoadingGallery(false);
        }
        loadImages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();

        if (!prompt.trim() || prompt.trim().length < 3) {
            toast.error("O prompt deve ter pelo menos 3 caracteres.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.trim(), style, format }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Erro ao gerar imagem.");
                return;
            }

            toast.success("Imagem gerada com sucesso! ✨");

            // Reload gallery to include new image
            const { data: updatedImages } = await supabase
                .from("generated_images")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (updatedImages) {
                setImages(updatedImages);
            }

            setPrompt("");
        } catch {
            toast.error("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(imageId: string) {
        const { error } = await supabase
            .from("generated_images")
            .delete()
            .eq("id", imageId);

        if (error) {
            toast.error("Erro ao excluir imagem.");
            return;
        }

        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Imagem excluída.");
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Wand2 className="w-7 h-7 text-purple-400" />
                    Gerador de Imagens
                </h1>
                <p className="text-[#a3a3a3] mt-1">
                    Crie imagens profissionais com IA para seu marketing.
                </p>
            </div>

            {/* Generator Form */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardContent className="p-6">
                    <form onSubmit={handleGenerate} className="space-y-5">
                        {/* Prompt */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt" className="text-[#a3a3a3] text-sm">
                                Descreva a imagem que deseja criar
                            </Label>
                            <Textarea
                                id="prompt"
                                placeholder="Ex: Uma paisagem futurista com neon, estilo cyberpunk, para thumbnail de YouTube..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="bg-[#1a1a1a] border-[#262626] text-white placeholder:text-[#555] min-h-[100px] resize-none"
                                disabled={loading}
                            />
                        </div>

                        {/* Style + Format row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#a3a3a3] text-sm">Estilo</Label>
                                <Select value={style} onValueChange={setStyle} disabled={loading}>
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                                        <SelectValue placeholder="Escolha o estilo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                                        {STYLES.map((s) => (
                                            <SelectItem key={s.value} value={s.value} className="text-white focus:bg-[#262626] focus:text-white">
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#a3a3a3] text-sm">Formato</Label>
                                <Select value={format} onValueChange={setFormat} disabled={loading}>
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#262626] text-white">
                                        <SelectValue placeholder="Escolha o formato" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-[#262626]">
                                        {FORMATS.map((f) => (
                                            <SelectItem key={f.value} value={f.value} className="text-white focus:bg-[#262626] focus:text-white">
                                                {f.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading || !prompt.trim()}
                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gerando imagem...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Gerar Imagem
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Loading skeleton while generating */}
            {loading && (
                <Card className="bg-[#141414] border-[#262626] border-dashed animate-pulse">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                            <p className="text-sm text-purple-400 font-medium">
                                A IA está criando sua imagem... Isso pode levar alguns segundos.
                            </p>
                        </div>
                        <Skeleton className="w-full aspect-square max-w-md rounded-xl bg-[#1a1a1a]" />
                    </CardContent>
                </Card>
            )}

            {/* Gallery */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    Suas Imagens
                    {images.length > 0 && (
                        <span className="text-sm font-normal text-[#666]">
                            ({images.length})
                        </span>
                    )}
                </h2>

                {loadingGallery ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="aspect-square rounded-xl bg-[#1a1a1a]" />
                        ))}
                    </div>
                ) : images.length === 0 ? (
                    <Card className="bg-[#141414] border-[#262626] border-dashed">
                        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                                <ImageIcon className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                Nenhuma imagem ainda
                            </h3>
                            <p className="text-[#a3a3a3] text-sm max-w-md">
                                Use o formulário acima para criar sua primeira imagem com IA! ✨
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((image) => (
                            <Card key={image.id} className="bg-[#141414] border-[#262626] overflow-hidden group">
                                <div className="relative aspect-square">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image.image_url || ""}
                                        alt={image.prompt}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Overlay with actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <div className="flex gap-2 w-full">
                                            <a
                                                href={image.image_url || ""}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                            >
                                                <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Baixar
                                                </Button>
                                            </a>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-0 ml-auto"
                                                onClick={() => handleDelete(image.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-3">
                                    <p className="text-xs text-[#a3a3a3] line-clamp-2">{image.prompt}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {image.style && image.style !== "default" && (
                                            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                                                {STYLES.find((s) => s.value === image.style)?.label || image.style}
                                            </span>
                                        )}
                                        {image.dimensions && (
                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                                                {image.dimensions}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
