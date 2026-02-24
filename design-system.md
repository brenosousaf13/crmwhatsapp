# Design System — CRM SaaS

Este documento define o sistema de design visual do projeto. **Todas as telas e componentes devem seguir rigorosamente estas especificações.** Use este arquivo como referência absoluta para cores, espaçamentos, tipografia, componentes e layout.

---

## 1. Layout Geral

A aplicação segue um layout de **duas colunas fixas**:

```
┌──────────────┬─────────────────────────────────────────────┐
│              │  Header (título da página + ações)           │
│   Sidebar    ├─────────────────────────────────────────────│
│   (fixa)     │                                             │
│   ~240px     │  Área de conteúdo principal                 │
│              │  (fundo claro, scroll independente)          │
│              │                                             │
│              │                                             │
│              │                                             │
│              │                                             │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

- **Sidebar**: largura fixa de `240px`, altura `100vh`, posição fixa, fundo escuro
- **Área principal**: ocupa o restante da largura, fundo claro `#F8F9FB`, scroll vertical independente
- **Header da página**: dentro da área principal, sticky no topo, fundo branco com borda inferior sutil

---

## 2. Paleta de Cores

### Cores base
```
Sidebar Background:       #1B1F3B  (azul-marinho muito escuro)
Sidebar Text:             #8B8FA3  (cinza médio — itens inativos)
Sidebar Text Active:      #FFFFFF  (branco — item ativo)
Sidebar Active Item BG:   #2563EB  (azul vibrante, border-radius: 8px)
Sidebar Hover BG:         #232847  (azul-marinho levemente mais claro)

Main Background:          #F8F9FB  (cinza muito claro, quase branco)
Card Background:          #FFFFFF
Card Border:              #E5E7EB  (cinza claro)
Card Hover Shadow:        0 2px 8px rgba(0,0,0,0.06)

Text Primary:             #111827  (quase preto)
Text Secondary:           #6B7280  (cinza médio)
Text Muted:               #9CA3AF  (cinza claro)
```

### Cores de status (badges/pills)
```
Active / Ganho:           bg: #DCFCE7  text: #16A34A  (verde)
Prospect / Em contato:    bg: #FFF7ED  text: #EA580C  (laranja)
Inactive / Perdido:       bg: #F3F4F6  text: #6B7280  (cinza)
Contacted / Negociando:   bg: #DBEAFE  text: #2563EB  (azul)
New / Novo:               bg: #EDE9FE  text: #7C3AED  (roxo)
```

### Cores de tags
```
Marketing:                bg: #DCFCE7  text: #16A34A  (verde)
Sales-Oriented:           bg: #FEE2E2  text: #DC2626  (vermelho)
General:                  bg: #DBEAFE  text: #2563EB  (azul)
Custom (fallback):        bg: #F3F4F6  text: #374151  (cinza escuro)
```

### Cores de ação
```
Primary Button:           bg: #16A34A  text: #FFFFFF  (verde — "Add", "Salvar")
Primary Button Hover:     bg: #15803D
Destructive Button:       bg: #DC2626  text: #FFFFFF
Icon Button / Ghost:      bg: transparent  text: #6B7280  hover-bg: #F3F4F6
```

### Cores do Kanban
```
Coluna header badge (cada etapa tem sua cor):
  "To-do" / "Novo":          bg: #DCFCE7  text: #16A34A  border-left: 3px solid #16A34A
  "In Progress" / "Em contato": bg: #FFF7ED  text: #EA580C  border-left: 3px solid #EA580C
  "Done" / "Fechado":        bg: #FEE2E2  text: #DC2626  border-left: 3px solid #DC2626
  "Prospect" / "Negociando": bg: #FFF7ED  text: #EA580C  border-left: 3px solid #EA580C
  "Inactive" / "Perdido":    bg: #F3F4F6  text: #6B7280  border-left: 3px solid #6B7280
```

---

## 3. Tipografia

```
Font Family:              "Inter", sans-serif  (importar do Google Fonts)

Page Title:               24px, font-weight: 600, color: #111827
Section Title:            16px, font-weight: 600, color: #111827
Card Title:               14px, font-weight: 600, color: #111827
Card Subtitle:            13px, font-weight: 400, color: #6B7280
Body Text:                14px, font-weight: 400, color: #374151
Small / Caption:          12px, font-weight: 400, color: #9CA3AF
Badge / Tag Text:         12px, font-weight: 500
Sidebar Item:             14px, font-weight: 500
Sidebar Section Label:    11px, font-weight: 600, text-transform: uppercase, letter-spacing: 0.05em, color: #6B7280
```

---

## 4. Espaçamentos e Border Radius

```
Border Radius:
  Cards:                  12px
  Badges/Tags:            6px  (pills arredondados)
  Botões:                 8px
  Sidebar Active Item:    8px
  Avatares:               50% (circular)
  Inputs:                 8px

Espaçamentos:
  Sidebar padding:        16px horizontal, 12px entre itens
  Card padding:           16px
  Card gap (kanban):      12px entre cards
  Coluna kanban gap:      16px entre colunas
  Page padding:           24px (horizontal e topo)
  Seção gap:              24px entre seções
```

---

## 5. Componentes

### 5.1 Sidebar

```
┌─────────────────────────┐
│  🟢 Logo + Nome App  ▾  │  ← Logo circular + nome da org + chevron
│                         │
│  📊 Dashboard           │
│  ✅ Task            (1) │  ← Badge de notificação (círculo vermelho)
│  📅 Calendar            │
│                         │
│  Sales          🔍 +    │  ← Section label com ícones de busca e add
│  👤 Leads               │
│  📈 Opportunities       │
│  📇 Contacts            │
│  🏢 Companies      ◀── │  ← Item ativo: fundo azul (#2563EB), texto branco
│                         │
│  Marketing              │  ← Section label
│  📝 Forms               │
│  📧 Emails              │
│  📱 Social Media Ads    │
│                         │
│           ...           │
│                         │
│  ❓ Help and Support    │  ← Itens fixos no rodapé
│  ⚙️ Settings            │
│                         │
│  ┌─────────────────┐    │
│  │ 🔵 John Marp... │  > │  ← Avatar + nome + email + chevron
│  │ john@gmail.com  │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

**Regras da sidebar:**
- Fundo: `#1B1F3B`
- Itens inativos: ícone + texto em `#8B8FA3`, sem fundo
- Item ativo: fundo `#2563EB`, texto `#FFFFFF`, `border-radius: 8px`
- Hover em itens inativos: fundo `#232847`
- Section labels (ex: "Sales", "Marketing"): uppercase, `11px`, `#6B7280`, com margem superior de `24px`
- Badge de notificação: círculo vermelho `#EF4444` com texto branco, `18px` de diâmetro
- Separador visual entre seções: apenas espaço, sem linha
- Rodapé: usuário logado com avatar circular `36px`, nome truncado, email em `#8B8FA3`

### 5.2 Header da Página

```
┌──────────────────────────────────────────────────────────────┐
│  Companies  •••         🔔  ❓  (+)                          │
│  All Companies | US Companies | Non-US Companies   Manage ▾  │
│  🔍 Search...    ↕ Sort   🔽 Filter       Kanban View ▾  +  │
└──────────────────────────────────────────────────────────────┘
```

**Regras do header:**
- Título da página: `24px`, `font-weight: 600`
- Menu de 3 pontos (`•••`) ao lado do título
- Ícones no canto direito: sino de notificação, interrogação, botão "+" circular verde
- Tabs de filtro abaixo: texto normal `#6B7280`, tab ativa em `#2563EB` com underline
- Barra de ferramentas: search input com ícone, botões ghost de Sort e Filter, dropdown de view, botão primário verde

### 5.3 Kanban Board

```
┌─ Active (6) ─ + ── •••──┐  ┌─ Prospect (4) ─ + ── •••─┐
│                          │  │                            │
│ ┌──────────────────────┐ │  │ ┌────────────────────────┐ │
│ │ 🔵 Code Sphere  •••  │ │  │ │ 🟡 Capital Flow  •••   │ │
│ │    Technology         │ │  │ │    Technology           │ │
│ │                       │ │  │ │                         │ │
│ │ Industry    Last Int. │ │  │ │ Industry    Last Int.   │ │
│ │ Technology  2h ago    │ │  │ │ Technology  2h ago      │ │
│ │                       │ │  │ │                         │ │
│ │ Emp. Range  Location  │ │  │ │ Emp. Range  Location    │ │
│ │ 100K+       Indonesia │ │  │ │ 100K+       Indonesia   │ │
│ └──────────────────────┘ │  │ └────────────────────────┘ │
│                          │  │                            │
│ ┌──────────────────────┐ │  │ ┌────────────────────────┐ │
│ │ ...next card          │ │  │ │ ...next card            │ │
│ └──────────────────────┘ │  │ └────────────────────────┘ │
└──────────────────────────┘  └────────────────────────────┘
```

**Regras do Kanban:**
- Cada coluna: fundo transparente, largura mínima `300px`, scroll vertical independente
- Header da coluna: badge colorido com nome da etapa + contador entre parênteses + botão "+" + menu "•••"
- Cards: fundo `#FFFFFF`, `border: 1px solid #E5E7EB`, `border-radius: 12px`, `padding: 16px`
- Card tem: avatar/ícone circular colorido (32px) + nome em bold + subtítulo
- Campos no card: label em `#9CA3AF` (`12px`), valor em `#111827` (`13px`)
- Layout dos campos: 2 colunas (grid) dentro do card
- Badge de Employee Range: pill colorido (ex: `100K+` em vermelho/laranja pill)
- Menu "•••" no canto superior direito do card (aparece no hover ou sempre visível)
- Espaço entre cards: `12px`
- Drag and drop: ao arrastar, card ganha sombra `0 8px 24px rgba(0,0,0,0.12)` e leve rotação

### 5.4 Table / List View

```
┌────┬────────────────┬────────────┬──────────┬──────────┬───────────────┬────────────────┐
│ #  │ Company Name   │ Industry   │ Location │ Status   │ Last Interact.│ Employee Range │
├────┼────────────────┼────────────┼──────────┼──────────┼───────────────┼────────────────┤
│ 1  │ 🔵 Code Sphere │ Technology │ Indonesia│ Active   │ About 2h ago  │ 100K+          │
│ 2  │ 🟡 Capital Flow│ Banking    │ Denmark  │ Prospect │ 2 days ago    │ 250 - 1K       │
│ 3  │ 🟢 BioVita     │ Healthcare │ USA      │ Active   │ About 7h ago  │ 10K - 50K      │
└────┴────────────────┴────────────┴──────────┴──────────┴───────────────┴────────────────┘
```

**Regras da tabela:**
- Fundo: `#FFFFFF` com `border-radius: 12px` no container
- Header da tabela: texto `#6B7280`, `12px`, `font-weight: 500`, `text-transform: uppercase` (opcional), fundo `#FAFAFA`
- Linhas: `border-bottom: 1px solid #F3F4F6`, height `56px`, hover com fundo `#F9FAFB`
- Coluna "#": numeração sequencial em `#9CA3AF`
- Company Name: avatar circular colorido `28px` + nome em `#111827`, `font-weight: 500`
- Status: badge/pill colorido (ver cores de status acima)
- Employee Range: badge/pill com cor correspondente ao tamanho
- Alternância Kanban/List: botões de toggle no header (ícone de grid vs ícone de lista)

### 5.5 Detail View (Lead Details)

```
┌─────────────────────────────────────┬──────────────────────────┐
│  ← Lead Details                     │  Leads Details    •••    │
│                                     │                          │
│  🔵 Wade Warren          [Add New]  │  Company: 🔵 Code Sphere │
│     HR Manager                      │  Industry: Technology    │
│                                     │  Size: 5K-10K Employee   │
│  Overview|Emails|Calls|Tasks|Files  │                          │
│  ─────────────────────────────────  │  Email: wade@code.com    │
│                                     │  Phone: (252) 555-0126   │
│  [Conteúdo da tab ativa]            │                          │
│                                     │  Status: Contacted       │
│  To do (3)            + •••         │  Owner: 🔵 Wade Warren   │
│  ┌─────────────────────────────┐    │                          │
│  │ Email Campaign Setup        │    │  ── Opportunities ──     │
│  │ 📅 23 March 2024  Marketing │    │  ┌────────────────────┐  │
│  └─────────────────────────────┘    │  │ SaaS Collab Deal   │  │
│                                     │  │ Revenue: $8,000     │  │
│  In Progress (1)      + •••         │  │ Stage: Proposal     │  │
│  ┌─────────────────────────────┐    │  │ Prob: 70%           │  │
│  │ Survey Distribution         │    │  │ [View Details]      │  │
│  └─────────────────────────────┘    │  └────────────────────┘  │
│                                     │                          │
└─────────────────────────────────────┴──────────────────────────┘
```

**Regras do Detail View:**
- Layout: área principal (~65%) + painel lateral direito (~35%) com fundo `#FFFFFF` e borda esquerda `#E5E7EB`
- Botão voltar: "←" + texto "Lead Details"
- Avatar grande: `48px` circular + nome `20px bold` + cargo `14px #6B7280`
- Botão "Add New": outline verde, `border-radius: 20px`
- Tabs: texto `#6B7280`, tab ativa com `color: #111827` + `border-bottom: 2px solid #111827`
- Painel lateral: labels em `#6B7280` (`13px`), valores em `#111827` (`14px`)
- Cada campo no painel: ícone à esquerda + label + valor, espaçamento `12px` entre campos
- Card de Opportunity: fundo `#FFFFFF`, borda `#E5E7EB`, campos em grid 2 colunas

### 5.6 Cards de Task (dentro do Kanban)

```
┌──────────────────────────────────┐
│  Email Campaign Setup       •••  │
│                                  │
│  Opportunities                   │  ← label cinza
│  Email Campaign Setup            │  ← valor
│                                  │
│  Due Date                        │
│  23 March 2024                   │
│                                  │
│  [Marketing]        🔵🔴🟡      │  ← tag colorida + avatares empilhados
└──────────────────────────────────┘
```

**Regras dos task cards:**
- Título: `14px`, `font-weight: 600`, `color: #111827`
- Campos: label `12px #9CA3AF` + valor `13px #374151`
- Tags: pills coloridos no canto inferior esquerdo
- Avatares: empilhados (stacked) no canto inferior direito, `28px`, `margin-left: -8px` entre eles, borda branca `2px`
- Menu "•••": canto superior direito

### 5.7 Badges e Pills

```css
/* Status badges */
.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

/* Employee range badges */
.badge-range {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
```

Variantes de cor: ver seção "Cores de status" e "Cores de tags" acima.

### 5.8 Botões

```
Primary (verde):
  bg: #16A34A, text: #FFFFFF, padding: 8px 16px, border-radius: 8px
  hover: bg: #15803D
  Usado para: "Add Company", "Salvar", ações principais

Secondary (outline):
  bg: transparent, border: 1px solid #E5E7EB, text: #374151, border-radius: 8px
  hover: bg: #F9FAFB

Ghost (sem borda):
  bg: transparent, text: #6B7280, border-radius: 8px
  hover: bg: #F3F4F6
  Usado para: Sort, Filter, ações de toolbar

Icon Button (circular):
  bg: #16A34A, text: #FFFFFF, border-radius: 50%, width: 36px, height: 36px
  Usado para: "+" no header

Danger:
  bg: #DC2626, text: #FFFFFF
  hover: bg: #B91C1C
```

### 5.9 Inputs

```
Search Input:
  bg: #FFFFFF, border: 1px solid #E5E7EB, border-radius: 8px
  padding: 8px 12px 8px 36px (espaço para ícone de lupa à esquerda)
  placeholder: #9CA3AF, text: #111827
  focus: border-color: #2563EB, ring: 0 0 0 2px rgba(37,99,235,0.1)
  height: 36px
```

### 5.10 Dropdown / Select

```
Trigger:
  bg: #FFFFFF, border: 1px solid #E5E7EB, border-radius: 8px
  padding: 8px 12px, text: #374151
  chevron icon à direita

Popover:
  bg: #FFFFFF, border: 1px solid #E5E7EB, border-radius: 8px
  shadow: 0 4px 16px rgba(0,0,0,0.08)
  item hover: bg: #F3F4F6
```

---

## 6. Ícones

- **Biblioteca**: Lucide React (`lucide-react`)
- **Tamanho padrão**: `18px` na sidebar, `16px` em botões, `20px` em headers
- **Cor padrão**: herda a cor do texto do contexto
- **Stroke width**: `1.5px` (padrão do Lucide)

Ícones principais usados:
```
Sidebar:
  Dashboard       → LayoutDashboard
  Task            → CheckSquare
  Calendar        → Calendar
  Leads           → Users
  Opportunities   → TrendingUp
  Contacts        → Contact
  Companies       → Building2
  Forms           → FileText
  Emails          → Mail
  Social Media    → Megaphone
  Help            → HelpCircle
  Settings        → Settings

Header:
  Notifications   → Bell
  Help            → HelpCircle
  Add             → Plus
  Search          → Search
  Sort            → ArrowUpDown
  Filter          → SlidersHorizontal
  More menu       → MoreHorizontal

Cards:
  Menu            → MoreHorizontal
  Back            → ChevronLeft
  Chevron right   → ChevronRight
```

---

## 7. Sombras

```
Card default:         none (usa apenas border)
Card hover:           0 2px 8px rgba(0, 0, 0, 0.06)
Card dragging:        0 8px 24px rgba(0, 0, 0, 0.12)
Dropdown/Popover:     0 4px 16px rgba(0, 0, 0, 0.08)
Modal:                0 16px 48px rgba(0, 0, 0, 0.16)
Sidebar:              2px 0 8px rgba(0, 0, 0, 0.04)
```

---

## 8. Animações e Transições

```
Default transition:   all 150ms ease
Hover transitions:    background-color 150ms ease, box-shadow 150ms ease
Sidebar collapse:     width 200ms ease (para responsivo)
Kanban drag:          transform com spring physics (via dnd-kit)
Page transitions:     opacity 150ms ease (fade in)
```

---

## 9. Responsividade

```
Desktop (≥1280px):    Layout completo, sidebar expandida
Tablet (768-1279px):  Sidebar colapsada (apenas ícones, ~64px), expande com hover/click
Mobile (<768px):      Sidebar como drawer (overlay), hamburger menu no header

Kanban no mobile:     Colunas em scroll horizontal (snap scroll)
Table no mobile:      Scroll horizontal com colunas fixas (nome)
```

---

## 10. Tema Escuro (Sidebar Only)

O design usa **sidebar escura com conteúdo principal claro**. NÃO é full dark mode. O contraste entre a sidebar escura e o conteúdo claro é uma característica visual fundamental do design.

```
Sidebar:    tema escuro (dark)
Conteúdo:   tema claro (light)
```

Futuramente podemos adicionar toggle de dark mode completo, mas o design padrão é este.

---

## 11. Avatares

```
Tamanhos:
  Sidebar user:       36px
  Card icon:          32px
  Table row:          28px
  Detail view:        48px
  Stacked (tasks):    28px com margin-left: -8px, border: 2px solid #FFFFFF

Formato:              Circular (border-radius: 50%)
Fallback:             Iniciais do nome em fundo colorido (gerar cor baseada no nome)
                      Cores de fallback: #2563EB, #16A34A, #EA580C, #7C3AED, #DC2626

Stacked avatars:      Máximo 3 visíveis + "+N" badge se houver mais
```

---

## 12. Estados Vazios (Empty States)

Quando uma seção não tem dados, exibir:
```
┌──────────────────────────────────┐
│                                  │
│          [ícone grande]          │  ← ícone em #D1D5DB, 48px
│                                  │
│    Nenhum lead encontrado        │  ← 16px, #374151, font-weight: 500
│    Comece adicionando seu        │  ← 14px, #9CA3AF
│    primeiro lead.                │
│                                  │
│       [+ Adicionar Lead]         │  ← botão primário verde
│                                  │
└──────────────────────────────────┘
```

---

## Resumo rápido de decisões visuais

| Elemento              | Valor principal                              |
|----------------------|----------------------------------------------|
| Font                 | Inter                                        |
| Sidebar bg           | #1B1F3B                                      |
| Active item          | #2563EB com texto branco                     |
| Main bg              | #F8F9FB                                      |
| Card bg              | #FFFFFF com borda #E5E7EB                    |
| Card radius          | 12px                                         |
| Primary button       | #16A34A (verde)                              |
| Ícones               | Lucide React, 18px sidebar, 16px botões      |
| Border radius geral  | 8px                                          |
| Badges               | 6px radius, cores semânticas por status       |