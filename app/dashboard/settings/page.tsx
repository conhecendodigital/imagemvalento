import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, User, CreditCard, ImageIcon, FileText, BrainCircuit } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-7 h-7 text-purple-400" />
                    Configurações
                </h1>
                <p className="text-[#a3a3a3] mt-1">Gerencie seu perfil, plano e créditos.</p>
            </div>

            {/* Profile */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" />
                        Perfil
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-purple-400">U</span>
                        </div>
                        <div>
                            <p className="font-medium text-white">Usuário</p>
                            <p className="text-sm text-[#a3a3a3]">usuario@email.com</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plan */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        Plano atual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 text-sm px-3 py-1">
                            Free
                        </Badge>
                        <span className="text-sm text-[#a3a3a3]">Plano gratuito com créditos limitados</span>
                    </div>
                </CardContent>
            </Card>

            {/* Credits */}
            <Card className="bg-[#141414] border-[#262626]">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Créditos disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a]">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">10</p>
                                <p className="text-xs text-[#a3a3a3]">Imagens</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a]">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">3</p>
                                <p className="text-xs text-[#a3a3a3]">Páginas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a]">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">2</p>
                                <p className="text-xs text-[#a3a3a3]">Quizzes</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
