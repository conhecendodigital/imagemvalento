---
name: dashboard-layout
description: Build the main dashboard layout with sidebar navigation
---

## Layout Structure
Create `app/dashboard/layout.tsx` with:

### Sidebar (left, collapsible)
Width: 260px expanded, 64px collapsed
Items with icons (Lucide React):
- 🖼️ ImageIcon → "Imagens" → /dashboard/images
- 📄 FileText → "Páginas" → /dashboard/pages
- 🧠 BrainCircuit → "Quiz" → /dashboard/quiz
- 🔍 Search → "Analisador" → /dashboard/analyzer
- 💡 Lightbulb → "Estrategista" → /dashboard/strategist
- ── Separator ──
- 📊 LayoutDashboard → "Painel" → /dashboard
- ⚙️ Settings → "Configurações" → /dashboard/settings

Active state: purple left border + purple bg tint
Mobile: Sheet component (slides from left)

### Top bar
- Left: hamburger toggle (mobile) + "AI Marketing Studio" logo
- Right: credits badge ("🖼️ 10 | 📄 3"), avatar dropdown

### Dashboard home cards
- "Imagens geradas": count from generated_images
- "Páginas ativas": count from pages where status='published'
- "Respostas de quiz": count from quiz_responses
- "Conversas": count from conversations
- Quick actions: 3 buttons → "Gerar Imagem", "Criar Página", "Novo Quiz"
