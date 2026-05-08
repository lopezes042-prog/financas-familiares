# Tarefas: Correções do Projeto Inicial FamilyFinance Web

Referência primária: `openspec/analises/review-projeto-inicial.md`
Decisões: `openspec/changes/correcoes-projeto-inicial/design.md`

---

## Bloco 1 — Correção crítica de URL (P-14)

- [x] T-01 [P] Atualizar `src/ambientes/ambiente.ts`: `urlApi` de `'http://localhost:8080'` para `'http://localhost:8080/api'`
- [x] T-02 [P] Atualizar `src/ambientes/ambiente.producao.ts`: `urlApi` de `'https://api.familyfinance.com.br'` para `'https://api.familyfinance.com.br/api'`

## Bloco 2 — Integração de tokens no design system (P-05, P-06)

- [x] T-03 [P] Atualizar `src/app/layout/layout-principal/layout-principal.component.scss`: adicionar `@use 'estilos/tokens' as *` e substituir todos os valores hex hardcoded por variáveis de token (incluindo corrigir a cor do sidenav de `#1a3a52` para `$cor-fundo-sidenav`)
- [x] T-04 [P] Atualizar `src/app/funcionalidades/contas/lista-contas/lista-contas.component.scss`: adicionar `@use` e substituir todos os hex por tokens
- [x] T-05 [P] Atualizar `src/app/funcionalidades/contas/formulario-conta/formulario-conta.component.scss`: adicionar `@use` e substituir todos os hex por tokens

## Bloco 3 — Qualidade do código Angular (P-08, P-09, P-11)

- [x] T-06 [P] Remover `CommonModule` de `lista-contas.component.ts` e manter apenas `CurrencyPipe` como import individual; remover `CommonModule` de `formulario-conta.component.ts`
- [x] T-07 [M] Criar `src/app/compartilhado/pipes/tipo-conta.pipe.ts` com `TipoContaPipe` (pipe standalone puro que converte `TipoConta` para rótulo em português usando `TIPOS_CONTA`)
- [x] T-08 [P] Importar `TipoContaPipe` em `lista-contas.component.ts` e atualizar o template para usar `{{ conta.tipo | tipoContaLabel }}` na coluna Tipo
- [x] T-09 [P] Adicionar comentário `// v2: usado ao exibir saldo em tempo real após lançamento de transações` em `ContaServico.consultarSaldo()`

## Bloco 4 — Tooling (P-03)

- [x] T-10 [P] Corrigir script `test:cobertura` em `package.json`: `"ng test --coverage --run"` → `"ng test --coverage --watch=false"`

## Bloco 5 — Documentação OpenSpec (P-01, P-02, P-04, P-12)

- [x] T-11 [P] Atualizar `openspec/config.yaml`: Angular 18 → 21, Karma/Jasmine → Vitest, M2 → M3 nas referências ao stack
- [x] T-12 [P] Atualizar `openspec/changes/projeto-inicial-web/proposal.md`: substituir "Angular 18" por "Angular 21" nas ocorrências
- [x] T-13 [P] Atualizar `openspec/changes/projeto-inicial-web/design.md`:
  - D-01: "Angular 18 best practices" → "Angular 21 best practices"
  - D-07: reescrever para refletir M3 real (não M2); justificar que Angular 21 usa M3 por padrão
  - Árvore de arquivos: `.eslintrc.json` → `eslint.config.mjs`
- [x] T-14 [P] Corrigir `lista-contas.component.spec.ts`: melhorar título e descrição do teste "deve manter spinner girando quando API falha (BUG-03 presente)" para refletir com precisão o que o teste verifica (estado de carregamento durante requisição pendente, não durante falha)

## Bloco 6 — Verificação final

- [x] T-15 [P] Rodar `npm test` e confirmar 21/21 testes passando
- [x] T-16 [P] Rodar `npm run build:prod` e confirmar build sem erros
- [x] T-17 [P] Rodar `npm run lint` e confirmar sem erros
