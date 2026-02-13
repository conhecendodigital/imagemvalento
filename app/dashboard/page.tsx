import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ImageIcon, FileText, BrainCircuit, MessageSquare, Plus, Sparkles } from "lucide-react";

const stats = [
    { label: "Imagens geradas", value: "0", icon: ImageIcon, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Páginas ativas", value: "0", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Respostas de quiz", value: "0", icon: BrainCircuit, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Conversas", value: "0", icon: MessageSquare, color: "text-green-400", bg: "bg-green-500/10" },
];

const quickActions = [
    { label: "Gerar Imagem", href: "/dashboard/images", icon: ImageIcon, gradient: "from-purple-600 to-purple-800" },
    { label: "Criar Página", href: "/dashboard/pages", icon: FileText, gradient: "from-blue-600 to-blue-800" },
    { label: "Novo Quiz", href: "/dashboard/quiz", icon: BrainCircuit, gradient: "from-cyan-600 to-cyan-800" },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Bem-vindo de volta! 👋</h1>
                <p className="text-[#a3a3a3] mt-1">
                    Aqui está um resumo do seu marketing com IA.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-[#141414] border-[#262626]">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#a3a3a3]">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick actions */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Ações rápidas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <Card className="bg-[#141414] border-[#262626] hover:border-[#333] transition-all cursor-pointer group">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                        <action.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{action.label}</p>
                                        <p className="text-xs text-[#666]">Começar agora</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-[#444] group-hover:text-[#888] transition-colors" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
