# Proposta: Correções do Projeto Inicial FamilyFinance Web

## Resumo

Corrigir os 14 problemas identificados na review pós-implementação do projeto inicial
(`openspec/analises/review-projeto-inicial.md`). Nenhuma dessas correções envolve os
6 bugs intencionais de treinamento — esses devem permanecer intactos.

## Motivação

O projeto está funcional e com os bugs intencionais corretos, mas apresenta problemas
que comprometem sua usabilidade como projeto de treinamento:

- **Bloqueio crítico:** `ambiente.urlApi` sem o prefixo `/api` faz com que, após a Júnior
  corrigir o BUG-01 (`/conta` → `/contas`), a URL ainda seja errada (`/contas` em vez de
  `/api/contas`). A Júnior receberia um segundo 404 sem pista clara da causa.
- **Design system inerte:** tokens e classes `ff-*` definidos mas não consumidos pelos
  componentes; mudança de qualquer cor nos tokens não se propaga.
- **Ruído no código de treinamento:** `CommonModule` desnecessário, enum cru na tabela,
  documentação descrevendo Angular 18/M2 mas o código sendo Angular 21/M3.

## Escopo

### Inclui

**Infraestrutura / URL (crítico)**
- Atualizar `ambiente.ts` e `ambiente.producao.ts` com urlApi incluindo `/api`
- Atualizar `openspec/config.yaml` com a URL correta nos exemplos

**Design System — integração de tokens nos componentes**
- Adicionar `@use 'tokens' as *` em todos os arquivos `.component.scss`
- Substituir valores hex hardcoded por variáveis de token em:
  - `lista-contas.component.scss`
  - `formulario-conta.component.scss`
  - `layout-principal.component.scss` (inclui correção da divergência de cor no sidenav)
- As classes globais `ff-*` permanecem como estão; esta change não muda templates HTML

**Angular — qualidade do código**
- Remover `CommonModule` de `lista-contas.component.ts` e `formulario-conta.component.ts`
- Criar `TipoContaPipe` (pipe standalone) para exibir rótulo em português na tabela
- Adicionar comentário de v2 em `ContaServico.consultarSaldo()`

**Tooling**
- Corrigir script `test:cobertura`: `--run` → `--watch=false`

**Documentação (OpenSpec + config)**
- Atualizar `openspec/config.yaml`: Angular 18 → 21, Karma/Jasmine → Vitest, M2 → M3
- Atualizar `openspec/changes/projeto-inicial-web/proposal.md`: Angular 18 → 21
- Atualizar `openspec/changes/projeto-inicial-web/design.md`:
  - D-01: Angular 18 → 21
  - D-07: M2 → M3, justificar a decisão correta
  - Corrigir `.eslintrc.json` → `eslint.config.mjs` na árvore de arquivos
- Corrigir descrição/título do teste do BUG-03 em `lista-contas.component.spec.ts`

### Fora do Escopo

- **Bugs intencionais (BUG-01 a BUG-06):** não tocar — são o exercício da Júnior
- **Proteção contra duplo-submit no formulário:** melhorias de UX fora do foco desta change
- **Templates HTML usando classes `ff-*`:** estratégia escolhida é tokens nos SCSS,
  não refatoração de templates
- **Outros problemas de prioridade baixa:** P-07 (`::ng-deep` semântica), P-13 (app.spec mínimo)

## Decisões tomadas

As decisões foram registradas em `openspec/analises/decisoes-correcoes-projeto-inicial.md`
(apagado após uso). Resumo:

| Decisão | Escolha |
|---------|---------|
| Integração do design system | Opção 2: tokens nos `.component.scss` via `@use` |
| URL da API | Opção 1: `urlApi` inclui `/api` — ex: `http://localhost:8080/api` |
| Tipo na tabela | Opção 2: `TipoContaPipe` standalone |
| Duplo-submit | Fora do escopo desta change |
| `consultarSaldo()` | Opção 3: manter com comentário `// v2: ...` |
| Escopo da change | Opção 1: change única |

## Observação sobre ambiente de produção

`ambiente.producao.ts` tem `urlApi: 'https://api.familyfinance.com.br'`. Assumindo que o
backend de produção também usa prefixo `/api`, o valor será atualizado para
`'https://api.familyfinance.com.br/api'`. Se a estrutura de produção for diferente,
o ambiente de produção precisará ser ajustado separadamente.

## Critérios de Aceite

- `npm test` continua com 21/21 testes passando
- `npm run build:prod` continua sem erros
- `npm run lint` passa sem erros
- Alterar qualquer cor em `_tokens.scss` se reflete nos componentes que usavam o hex correspondente
- A coluna "Tipo" na lista exibe "Conta corrente", "Poupança", etc. (em vez de `CORRENTE`, `POUPANCA`)
- Os 6 bugs intencionais permanecem presentes e funcionando como antes
- `openspec/config.yaml` reflete Angular 21, Vitest e M3
