import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

export default function QuizPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Quiz Builder</h1>
                <p className="text-[#a3a3a3] mt-1">Crie quizzes interativos para qualificar e engajar seu público.</p>
            </div>

            <Card className="bg-[#141414] border-[#262626] border-dashed">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                        <BrainCircuit className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Em breve</h3>
                    <p className="text-[#a3a3a3] text-sm max-w-md">
                        O quiz builder está sendo preparado.
                        Em breve você poderá criar quizzes incríveis com lógica condicional! 🧠
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
