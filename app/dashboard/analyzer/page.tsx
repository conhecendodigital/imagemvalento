import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function AnalyzerPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Analisador de Páginas</h1>
                <p className="text-[#a3a3a3] mt-1">Analise qualquer página e receba sugestões de melhoria com IA.</p>
            </div>

            <Card className="bg-[#141414] border-[#262626] border-dashed">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Em breve</h3>
                    <p className="text-[#a3a3a3] text-sm max-w-md">
                        O analisador de páginas com IA está sendo preparado.
                        Em breve você poderá fazer audit CRO completo de qualquer URL! 🔍
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
