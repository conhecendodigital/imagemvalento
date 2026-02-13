import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function StrategistPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Estrategista Digital</h1>
                <p className="text-[#a3a3a3] mt-1">Converse com um estrategista de marketing digital especializado.</p>
            </div>

            <Card className="bg-[#141414] border-[#262626] border-dashed">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4">
                        <Lightbulb className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Em breve</h3>
                    <p className="text-[#a3a3a3] text-sm max-w-md">
                        O estrategista digital com IA está sendo preparado.
                        Em breve você terá um consultor de marketing disponível 24/7! 💡
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
