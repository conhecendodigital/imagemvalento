---
description: Workflow sequencial para construir cada fase do AI Marketing Studio
---

# Build Phase Workflow

Seguir estes passos para implementar cada fase do projeto:

## 1. Instalar Dependências
```bash
npm install <pacotes-da-fase>
```
Consultar o `implementation_plan.md` para saber quais pacotes cada fase precisa.

## 2. Criar/Atualizar Schema SQL (se aplicável)
- Verificar se a fase requer novas tabelas ou alterações
- Gerar o SQL e documentar em `supabase-schema.sql`
- Executar no Supabase Dashboard → SQL Editor

## 3. Criar Componentes UI
- Criar componentes em `components/` seguindo as regras de `rules.md`
- Usar `shadcn/ui` como base (skill: `shadcn-components`)
- Texto da UI em PT-BR
- Aplicar tema dark purple/blue com glassmorphism

## 4. Criar API Routes
- Criar em `app/api/` com validação `zod`
- Verificar auth do usuário via Supabase (skill: `nextjs-supabase`)
- Retornar JSON padronizado `{ success, data?, error? }`
- Tratar erros com mensagens user-friendly

## 5. Conectar Frontend ↔ Backend
- Integrar componentes com as API routes
- Implementar loading states (skeletons)
- Implementar error states com toast
- Implementar empty states

// turbo
## 6. Verificar Build
```bash
npm run build
```
- Resolver TODOS os erros de TypeScript
- Resolver warnings críticos

## 7. Testar Visualmente
- Abrir `http://localhost:3000` no browser
- Verificar cada nova rota/página
- Verificar responsividade (desktop, tablet, mobile)
- Verificar tema e animações
- Documentar bugs encontrados

## 8. Commit da Fase
```bash
git add .
git commit -m "feat: phase X - <descrição>"
```
