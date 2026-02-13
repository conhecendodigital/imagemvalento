---
name: gemini-ai
description: Integração com Google Gemini API para geração de imagens, HTML, conteúdo e chat streaming
---

# Gemini AI Integration

## Setup

### Dependência
```bash
npm install @google/genai
```

### Variável de Ambiente
```
GEMINI_API_KEY=AIza...
```

### Client Helper
```typescript
// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
```

## Padrão: Geração de Imagens

Usar modelo `gemini-2.0-flash-exp` com `responseModalities: ["image", "text"]`:

```typescript
import { genai } from "@/lib/gemini";

export async function generateImage(prompt: string) {
  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["image", "text"],
    },
  });

  // Extrair imagem da resposta
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart?.inlineData) throw new Error("Falha ao gerar imagem");

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}
```

### Prompt Engineering para Imagens
Sempre prefixar o prompt do usuário com contexto de marketing:
```typescript
const PRESET_PREFIXES: Record<string, string> = {
  "post-instagram": "Professional Instagram post image, 1080x1080, modern design,",
  "banner-facebook": "Facebook cover banner, 820x312, professional,",
  "thumbnail-youtube": "YouTube thumbnail, 1280x720, eye-catching, bold text,",
  "story": "Instagram/WhatsApp story, 1080x1920, vertical, trendy,",
  "logo": "Minimalist professional logo, clean lines, vector style,",
  "product": "Product photography, white background, professional lighting,",
};

function buildImagePrompt(preset: string, userPrompt: string, style: string): string {
  const prefix = PRESET_PREFIXES[preset] || "";
  return `${prefix} ${userPrompt}. Style: ${style}. High quality, 4K resolution.`;
}
```

## Padrão: Geração de HTML/Conteúdo

Usar `gemini-2.5-flash` para geração de texto/código:

```typescript
export async function generatePageHTML(
  type: string,
  businessInfo: object
): Promise<string> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [{ text: buildPagePrompt(type, businessInfo) }],
    }],
    config: {
      temperature: 0.7,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // Extrair HTML do markdown code block se necessário
  return text.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();
}
```

### System Prompts por Tipo de Página
```typescript
const PAGE_SYSTEM_PROMPTS: Record<string, string> = {
  "landing-page": `Você é um designer web expert. Crie uma landing page completa em HTML+CSS inline.
    Use design moderno, responsivo, com CTAs claros. Cores vibrantes e profissionais.
    Inclua: hero section, benefícios, depoimentos, CTA final.`,
  "sales-page": `Crie uma página de vendas persuasiva com técnicas de copywriting.
    Inclua: headline impactante, problema/solução, benefícios, garantia, preço, CTA.`,
  "capture-page": `Crie uma página de captura minimalista e focada.
    Inclua: headline magnética, bullet points de benefícios, formulário de email, CTA.`,
  "thank-you": `Crie uma página de agradecimento após conversão.
    Inclua: confirmação, próximos passos, oferta complementar, links sociais.`,
};
```

## Padrão: Chat Streaming

```typescript
export async function streamChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
) {
  const stream = await genai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.8,
    },
  });

  return stream;
}
```

### API Route com Streaming
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await streamChat(messages, STRATEGIST_SYSTEM_PROMPT);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## Regras Importantes
- NUNCA expor `GEMINI_API_KEY` no client — sempre chamar via API Route
- Implementar rate limiting por usuário
- Guardar prompts e resultados no Supabase para histórico
- Tratar erros de quota/rate limit com retry e mensagens claras
