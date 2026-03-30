

## Problema

A seção de soluções (#solutions) usa fundo amarelo puro (#FFD600) com texto escuro (#0A0A08) em opacidades baixas (45-55%). Em telas com baixa densidade de pixel ou menores, o contraste fica insuficiente — o texto parece "sumir" no amarelo vibrante, dificultando a leitura.

## Diagnóstico Técnico

- **Texto introdutório**: `color: rgba(10,10,8,.55)` — contraste ~3.2:1 (falha WCAG AA)
- **Texto dos cards**: `color: rgba(10,10,8,.45)` — contraste ~2.6:1 (falha WCAG AA)
- **Numeração dos cards**: `color: rgba(10,10,8,.2)` — decorativo, aceitável
- **Fundo**: amarelo puro sem textura, causa fadiga visual em áreas grandes

## Proposta de Design

### 1. Textura de ruído sutil no fundo amarelo
Adicionar um pseudo-elemento `::after` com noise overlay (similar ao já existente no site) sobre o fundo amarelo, com opacidade baixa (~8-12%). Isso quebra a monotonia do amarelo sólido, reduz o brilho percebido e adiciona profundidade visual sem alterar a identidade da marca.

### 2. Gradiente tonal no fundo
Substituir o amarelo flat por um gradiente sutil que vai de `#FFD600` para um tom levemente mais escuro/quente como `#F0C800` nas bordas, criando uma sensação de "vinheta" que guia o olhar para o conteúdo central.

### 3. Aumento de contraste nos textos
- **Texto introdutório** (`.sol-intro`): de `rgba(10,10,8,.55)` para `rgba(10,10,8,.72)` — contraste ~5:1
- **Texto dos cards** (`.sol-card-text`): de `rgba(10,10,8,.45)` para `rgba(10,10,8,.65)` — contraste ~4.5:1
- **Eyebrow/título**: já estão com contraste adequado, manter

### 4. Cards com fundo semi-opaco
Alterar o fundo dos cards de `rgba(10,10,8,.04)` para `rgba(255,255,255,.18)` — um branco translúcido que cria uma "ilha de leitura" mais clara, destacando o texto sobre o amarelo sem parecer deslocado.

### 5. Padrão geométrico existente reutilizado
Aplicar o mesmo padrão geométrico (`.geo-pattern`) já usado no restante do site, mas adaptado em tom escuro sobre o amarelo com opacidade de ~3-4%, adicionando textura e sofisticação.

## Resumo das Alterações

Arquivo: `public/landing.html`

1. **CSS do `#solutions`**: adicionar gradiente tonal + pseudo-elemento de noise
2. **CSS `.sol-intro`**: aumentar opacidade do texto
3. **CSS `.sol-card-text`**: aumentar opacidade do texto
4. **CSS `.sol-card`**: fundo branco translúcido nos cards
5. **Adicionar pseudo-elemento** com o padrão geométrico existente sobre a seção

Todas as mudanças são apenas CSS — sem alterações de estrutura HTML.

