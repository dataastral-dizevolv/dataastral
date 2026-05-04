A instrução abaixo está formatada para ser colada diretamente no Cursor (como uma prompt de agente) ou num `TASK.md` no VS Code para o dev seguir — sem ambiguidade sobre o que fazer e por quê.

---

### **Instrução para o dev — Refatoração Visual: Flat Edge-to-Edge UI**

**Contexto** A cliente solicitou uma reformulação visual completa da interface. O objetivo é eliminar qualquer padrão de card-based UI e adotar uma linguagem flat, edge-to-edge, de alta densidade informacional — referência direta a produtos como Linear, Raycast e interfaces Apple modernas.

Isso **não é** uma refatoração de lógica. É uma refatoração de **camada de apresentação**: CSS, estrutura de layout e hierarquia visual via tipografia e contraste.

---

#### **1\. Layout — Edge-to-Edge sem contêineres**

* Remover todo `max-width` com centralização decorativa em wrappers de seção. O layout deve ocupar **100vw** sem padding horizontal artificial.  
* Substituir qualquer grid de cards (`display: grid; grid-template-columns: repeat(...)` com itens encaixotados) por **grid de 12 colunas fluido** onde o conteúdo flui entre colunas sem fronteiras visuais.  
* Seções devem ser separadas por **espaçamento rítmico** (`margin-top` ou `gap` consistente, ex: múltiplos de 8px), nunca por bordas ou containers.  
* `padding` interno de seção deve ser usado apenas para alinhamento de texto ao grid — não para criar a ilusão de um card.

css  
/\* ANTES — padrão a eliminar \*/  
.card { background: \#fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,.1); }

/\* DEPOIS — padrão flat integrado \*/  
.section-item { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }  
---

#### **2\. Separação visual — Sem sombras, sem boxes**

Substituir toda separação baseada em sombra/elevação por:

| Anti-padrão | Substituto |
| ----- | ----- |
| `box-shadow` em cards | `border-bottom` com opacidade baixa (`rgba` 5–10%) |
| `background: #fff` em seções | Shift sutil de tom no background (`background: rgba(255,255,255,0.02)`) |
| `border-radius` decorativo | Zero ou `border-radius: 2px` apenas em elementos interativos (botões, inputs) |
| Elevação em hover | `opacity: 0.7` ou `background-color` shift \+ `transition: 0.15s ease` |

---

#### **3\. Tipografia como estrutura**

A hierarquia visual deve emergir **exclusivamente** de tamanho, peso e tracking — não de containers.

Definir um sistema tipográfico claro:

css  
/\* Escala sugerida — adaptar à fonte já em uso no projeto \*/  
\--text-xs:   11px; letter-spacing: 0.08em; font-weight: 500;  /\* labels, metadata \*/  
\--text-sm:   13px; letter-spacing: 0.01em; font-weight: 400;  /\* corpo secundário \*/  
\--text-base: 15px; letter-spacing: 0;      font-weight: 400;  /\* corpo principal \*/  
\--text-lg:   20px; letter-spacing: \-0.01em; font-weight: 600; /\* subtítulos \*/  
\--text-xl:   28px; letter-spacing: \-0.03em; font-weight: 700; /\* títulos de seção \*/  
\--text-2xl:  40px; letter-spacing: \-0.04em; font-weight: 800; /\* hero/heading \*/

* Headings devem ter `line-height` apertado (1.1–1.2).  
* Labels e metadados devem usar `text-transform: uppercase` \+ tracking alto para criar diferenciação sem cor.

---

#### **4\. Componentes — Flush, não encaixotados**

**Listas e tabelas**

* Estilo flush (como iOS Settings ou tabela do Linear): sem background individual por item, apenas `border-bottom` sutil.  
* Hover via `background-color: rgba(255,255,255,0.04)` com transição suave.

**Botões**

* Primário: background sólido na cor de ação, `border-radius` pequeno (4px), sem sombra.  
* Secundário/ghost: apenas borda `1px solid` com opacidade \+ texto — nunca fundo opaco branco.  
* Destruir qualquer botão com `box-shadow` decorativa.

**Inputs**

* Sem border-radius alto. `border-bottom: 1px solid` ou borda completa com `1px solid rgba(...)` baixa opacidade.  
* Focus state: trocar cor da borda para a cor de ação — **sem** `box-shadow: 0 0 0 3px`.

**Navegação**

* Deve parecer parte da superfície. Sem `background` separado do body, sem sombra inferior.  
* Item ativo: cor de texto ou indicador de linha — não background highlight em card.

---

#### **5\. Backgrounds e superfícies**

* Background único por tela. Variações de seção via **shift de opacidade** (`rgba(255,255,255,0.02)`) — nunca cor radicalmente diferente em bloco.  
* Se houver gradiente, aplicar no `body` ou em pseudo-elemento fixo — nunca em cards individuais.  
* Remover qualquer `backdrop-filter: blur` aplicado a containers flutuantes que simulem cards.

---

#### **6\. Checklist de revisão antes do PR**

* Nenhum elemento tem `box-shadow` com intenção decorativa/elevação  
* Nenhum elemento tem `border-radius > 6px` (exceto avatares e imagens)  
* Nenhuma seção usa `background` contrastante para simular container  
* Grid é fluido ou 12 colunas — sem wrappers com `max-width` centrados para decoração  
* Tipografia segue escala definida — hierarquia legível sem containers  
* Estados de hover/focus usam opacidade ou cor, nunca elevação  
* Navegação não tem background separado do restante da interface

---

**Referências visuais para o dev consultar antes de começar:**

* [linear.app](https://linear.app) — tabelas flush, tipografia densa, zero cards  
* [raycast.com](https://raycast.com) — superfícies contínuas, micro-interações  
* Apple Settings (iOS/macOS) — listas flush com separadores sutis

Se houver dúvida sobre um componente específico, abrir para revisão antes de implementar — o risco de interpretar errado é menor do que refatorar duas vezes.

