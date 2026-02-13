---
name: setup-project
description: Scaffold the complete Next.js project with all configs
---

## Steps
1. Run `npx create-next-app@latest ./` with:
   - TypeScript: Yes
   - Tailwind: Yes
   - App Router: Yes
   - src/ directory: No
   - Import alias: @/
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr zod sonner
   npx shadcn@latest init
   npx shadcn@latest add button card input label textarea select tabs badge avatar dropdown-menu sheet dialog toast separator skeleton switch
   ```
3. Configure tailwind.config.ts with custom colors
4. Create .env.example with all required variables
5. Create lib/ structure with all base files
6. Verify: `npm run build` must pass with zero errors
