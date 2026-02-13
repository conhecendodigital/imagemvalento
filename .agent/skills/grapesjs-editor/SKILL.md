---
name: grapesjs-editor
description: Integração do editor visual GrapesJS com Next.js e Supabase para edição de páginas
---

# GrapesJS Visual Editor

## Setup

### Dependências
```bash
npm install grapesjs @grapesjs/react grapesjs-preset-webpage
```

### Importação (Client-Only)
GrapesJS só funciona no browser. DEVE usar `"use client"` e importação dinâmica:

```typescript
// components/editor/PageEditor.tsx
"use client";

import GjsEditor, { Canvas } from "@grapesjs/react";
import type { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
```

### Importação Dinâmica na Page
```typescript
// app/dashboard/pages/[id]/edit/page.tsx
import dynamic from "next/dynamic";

const PageEditor = dynamic(
  () => import("@/components/editor/PageEditor"),
  { ssr: false, loading: () => <EditorSkeleton /> }
);
```

## Padrão: Configuração do Editor

```typescript
const editorConfig = {
  height: "100vh",
  storageManager: false, // Controlamos save manualmente
  undoManager: { trackSelection: false },
  panels: { defaults: [] }, // Custom panels
  canvas: {
    styles: [
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    ],
  },
  deviceManager: {
    devices: [
      { name: "Desktop", width: "" },
      { name: "Tablet", width: "768px", widthMedia: "992px" },
      { name: "Mobile", width: "375px", widthMedia: "480px" },
    ],
  },
};
```

## Padrão: Custom Blocks

### Blocos Básicos
```typescript
function addBasicBlocks(editor: Editor) {
  const bm = editor.BlockManager;

  bm.add("text-block", {
    label: "Texto",
    category: "Básico",
    content: '<div data-gjs-type="text"><p>Digite seu texto aqui</p></div>',
    media: '<svg>...</svg>',
  });

  bm.add("image-block", {
    label: "Imagem",
    category: "Básico",
    content: { type: "image" },
  });

  bm.add("button-block", {
    label: "Botão",
    category: "Básico",
    content: `<a href="#" class="btn-cta" style="
      display:inline-block;padding:12px 32px;
      background:linear-gradient(135deg,#8B5CF6,#3B82F6);
      color:white;border-radius:8px;text-decoration:none;
      font-weight:600;font-size:16px;
    ">Clique Aqui</a>`,
  });

  bm.add("columns-2", {
    label: "2 Colunas",
    category: "Básico",
    content: `<div style="display:flex;gap:20px;padding:20px;">
      <div style="flex:1;padding:20px;">Coluna 1</div>
      <div style="flex:1;padding:20px;">Coluna 2</div>
    </div>`,
  });
}
```

### Blocos de Conversão
```typescript
function addConversionBlocks(editor: Editor) {
  const bm = editor.BlockManager;

  bm.add("testimonial", {
    label: "Depoimento",
    category: "Conversão",
    content: `<div style="background:#f8f9fa;border-radius:12px;padding:24px;max-width:400px;">
      <p style="font-style:italic;color:#4b5563;">"Depoimento do cliente aqui..."</p>
      <div style="display:flex;align-items:center;gap:12px;margin-top:16px;">
        <div style="width:48px;height:48px;border-radius:50%;background:#8B5CF6;"></div>
        <div>
          <strong>Nome do Cliente</strong>
          <p style="color:#6b7280;font-size:14px;">Cargo / Empresa</p>
        </div>
      </div>
    </div>`,
  });

  bm.add("pricing-card", {
    label: "Preço",
    category: "Conversão",
    content: `<div style="background:white;border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.1);max-width:320px;">
      <h3 style="color:#8B5CF6;font-size:14px;text-transform:uppercase;">Plano Premium</h3>
      <div style="font-size:48px;font-weight:700;margin:16px 0;">R$ 97</div>
      <p style="color:#6b7280;">/mês</p>
      <ul style="text-align:left;margin:24px 0;list-style:none;padding:0;">
        <li style="padding:8px 0;">✅ Benefício 1</li>
        <li style="padding:8px 0;">✅ Benefício 2</li>
        <li style="padding:8px 0;">✅ Benefício 3</li>
      </ul>
      <a href="#" style="display:block;padding:14px;background:#8B5CF6;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Assinar Agora</a>
    </div>`,
  });

  bm.add("countdown-timer", {
    label: "Contador",
    category: "Conversão",
    content: `<div style="text-align:center;padding:24px;">
      <p style="font-size:14px;color:#6b7280;margin-bottom:12px;">OFERTA EXPIRA EM:</p>
      <div style="display:flex;justify-content:center;gap:16px;">
        <div style="background:#1e1b4b;color:white;padding:12px 20px;border-radius:8px;">
          <div style="font-size:32px;font-weight:700;">23</div><div style="font-size:12px;">HORAS</div>
        </div>
        <div style="background:#1e1b4b;color:white;padding:12px 20px;border-radius:8px;">
          <div style="font-size:32px;font-weight:700;">59</div><div style="font-size:12px;">MIN</div>
        </div>
        <div style="background:#1e1b4b;color:white;padding:12px 20px;border-radius:8px;">
          <div style="font-size:32px;font-weight:700;">47</div><div style="font-size:12px;">SEG</div>
        </div>
      </div>
    </div>`,
  });

  bm.add("faq-section", {
    label: "FAQ",
    category: "Conversão",
    content: `<div style="max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="text-align:center;margin-bottom:24px;">Perguntas Frequentes</h2>
      <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
        <summary style="cursor:pointer;font-weight:600;">Pergunta 1?</summary>
        <p style="color:#6b7280;margin-top:8px;">Resposta aqui...</p>
      </details>
      <details style="border-bottom:1px solid #e5e7eb;padding:16px 0;">
        <summary style="cursor:pointer;font-weight:600;">Pergunta 2?</summary>
        <p style="color:#6b7280;margin-top:8px;">Resposta aqui...</p>
      </details>
    </div>`,
  });
}
```

## Padrão: Save/Load com Supabase

```typescript
// Save
async function savePage(editor: Editor, pageId: string) {
  const supabase = createClient();
  const html = editor.getHtml();
  const css = editor.getCss();
  const projectData = editor.getProjectData();

  await supabase
    .from("pages")
    .update({
      html_content: html,
      css_content: css,
      editor_data: projectData, // JSON completo para restaurar estado
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);
}

// Load
async function loadPage(editor: Editor, pageId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pages")
    .select("editor_data, html_content, css_content")
    .eq("id", pageId)
    .single();

  if (data?.editor_data) {
    editor.loadProjectData(data.editor_data);
  } else if (data?.html_content) {
    editor.setComponents(data.html_content);
    editor.setStyle(data.css_content || "");
  }
}
```

## Padrão: Auto-Save

```typescript
function setupAutoSave(editor: Editor, pageId: string) {
  let saveTimeout: NodeJS.Timeout;

  editor.on("component:update", () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => savePage(editor, pageId), 60000); // 60s
  });
}
```

## Regras Importantes
- SEMPRE usar `dynamic(() => import(...), { ssr: false })` para o editor
- Importar CSS do GrapesJS apenas no componente client
- Editor data (JSON) salvo separadamente do HTML final para restauração fiel
- Testar responsividade usando o Device Manager integrado
