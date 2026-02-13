import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Sparkles } from "lucide-react";

export default function ImagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Gerador de Imagens</h1>
                <p className="text-[#a3a3a3] mt-1">Crie imagens profissionais com IA para seu marketing.</p>
            </div>

            <Card className="bg-[#141414] border-[#262626] border-dashed">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Em breve</h3>
                    <p className="text-[#a3a3a3] text-sm max-w-md">
                        O gerador de imagens com IA está sendo preparado.
                        Em breve você poderá criar thumbnails, capas, posts e muito mais! ✨
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
