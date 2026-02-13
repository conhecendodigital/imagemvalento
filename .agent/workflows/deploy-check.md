---
description: Verificação pré-deploy para garantir que o projeto está pronto para produção
---

# Deploy Check Workflow

Seguir estes passos antes de fazer deploy:

// turbo
## 1. Verificar Build
```bash
cd /Users/matheusdaia/saas && npm run build
```
- ❌ Se falhar: corrigir erros antes de continuar
- ✅ Se passar: seguir para o próximo passo

// turbo
## 2. Verificar TypeScript
```bash
cd /Users/matheusdaia/saas && npx tsc --noEmit
```
- Resolver todos os erros de tipo

## 3. Verificar Variáveis de Ambiente
Confirmar que `.env.local` contém:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `GEMINI_API_KEY`

## 4. Verificar Supabase
- [ ] Schema SQL executado no Supabase Dashboard
- [ ] RLS habilitado em todas as tabelas
- [ ] Storage bucket `images` criado com política pública
- [ ] Auth providers configurados (Email + Google OAuth)

## 5. Testar Rotas Críticas
Usar o browser para verificar:
- [ ] `/login` → Formulário renderiza corretamente
- [ ] `/dashboard` → Redireciona se não logado
- [ ] `/dashboard` → Mostra sidebar + cards se logado
- [ ] Cada módulo ativo carrega sem erros

## 6. Verificar Responsividade
Testar em 3 viewports:
- [ ] Desktop (1440px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

## 7. Deploy
```bash
npx vercel --prod
```
Ou configurar deploy automático via GitHub.
