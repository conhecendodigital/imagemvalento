---
name: nextjs-supabase
description: Padrões de integração Next.js 14 (App Router) com Supabase para auth, database e storage
---

# Next.js + Supabase Integration

## Setup Inicial

### Dependências
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Variáveis de Ambiente (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...  # NUNCA expor no client
```

## Padrão: Browser Client

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Usar em componentes `"use client"`:
```typescript
"use client";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

## Padrão: Server Client

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

Usar em Server Components e API Routes:
```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

## Padrão: Auth Middleware

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

## Padrão: RLS (Row Level Security)

Todas as tabelas devem ter RLS habilitado. Exemplo:
```sql
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Padrão: Storage Upload

```typescript
const { data, error } = await supabase.storage
  .from("images")
  .upload(`${userId}/${fileName}`, file, {
    contentType: "image/png",
    upsert: false,
  });

const { data: { publicUrl } } = supabase.storage
  .from("images")
  .getPublicUrl(data.path);
```

## Padrão: Buscar Usuário Autenticado

```typescript
// Em API Routes — sempre verificar auth
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  // ... lógica protegida
}
```
