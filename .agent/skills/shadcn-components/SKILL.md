---
name: shadcn-components
description: Padrões de uso do shadcn/ui com tema dark customizado purple/blue
---

# shadcn/ui Components

## Setup Inicial

```bash
npx shadcn@latest init
```

Selecionar:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

### Instalar Componentes Comuns
```bash
npx shadcn@latest add button card dialog dropdown-menu input label select separator sheet skeleton tabs textarea toast badge avatar scroll-area
```

## Padrão: Tema Dark Purple/Blue

Customizar `globals.css` com as variáveis do tema:

```css
@layer base {
  :root {
    /* Light (fallback) */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 262.1 83.3% 57.8%;        /* Purple */
    --primary-foreground: 210 40% 98%;
  }

  .dark {
    --background: 240 10% 3.9%;           /* Near black */
    --foreground: 0 0% 95%;
    --card: 240 10% 5.9%;
    --card-foreground: 0 0% 95%;
    --popover: 240 10% 5.9%;
    --primary: 262.1 83.3% 57.8%;        /* #8B5CF6 */
    --primary-foreground: 0 0% 98%;
    --secondary: 217.2 91.2% 59.8%;      /* #3B82F6 */
    --secondary-foreground: 0 0% 98%;
    --muted: 240 5% 15%;
    --muted-foreground: 240 5% 65%;
    --accent: 262.1 83.3% 57.8%;
    --accent-foreground: 0 0% 98%;
    --border: 240 5% 15%;
    --input: 240 5% 15%;
    --ring: 262.1 83.3% 57.8%;
  }
}
```

## Padrão: Composição de Componentes

### Cards com Glassmorphism
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card className="bg-white/5 backdrop-blur-xl border-white/10">
  <CardHeader>
    <CardTitle className="text-lg">Título</CardTitle>
  </CardHeader>
  <CardContent>
    {/* conteúdo */}
  </CardContent>
</Card>
```

### Botões com Gradiente
```tsx
import { Button } from "@/components/ui/button";

// Primário (gradiente)
<Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
  Criar Novo
</Button>

// Outline (ghost)
<Button variant="outline" className="border-white/10 hover:bg-white/5">
  Cancelar
</Button>
```

### Dialog/Modal
```tsx
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent className="bg-zinc-900 border-white/10">
    <DialogHeader>
      <DialogTitle>Título do Modal</DialogTitle>
    </DialogHeader>
    {/* conteúdo */}
  </DialogContent>
</Dialog>
```

### Loading Skeletons
```tsx
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <Skeleton className="h-5 w-32 bg-white/10" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full bg-white/10 mb-2" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
      </CardContent>
    </Card>
  );
}
```

## Padrão: cn() Utility

Sempre usar `cn()` para merge condicional de classes:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Uso:
```tsx
<div className={cn(
  "rounded-lg p-4 transition-all",
  isActive && "ring-2 ring-purple-500 bg-purple-500/10",
  !isActive && "bg-white/5 hover:bg-white/10"
)}>
```

## Padrão: Toast Notifications

```typescript
import { toast } from "sonner";

// Sucesso
toast.success("Imagem gerada com sucesso!");

// Erro
toast.error("Erro ao salvar página. Tente novamente.");

// Loading
const id = toast.loading("Gerando imagem...");
// ... after completion
toast.success("Pronto!", { id });
```

## Regras Importantes
- SEMPRE usar `forceMount` quando necessário dentro de `AnimatePresence`
- Preferir composição de componentes shadcn ao invés de criar do zero
- Texto de UI em PT-BR (labels, placeholders, toasts)
- Adicionar componentes com `npx shadcn@latest add <nome>` — nunca copiar manualmente
