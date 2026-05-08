# Tarefas: Projeto Inicial do FamilyFinance Web

Referência primária: `documentacao-inicial-frontend/familyfinance-web-projeto-inicial.md`
Contrato da API: `documentacao-inicial-frontend/contratos-frontend-projeto-inicial.md`

---

## Bloco 1 — Scaffolding

- [x] T-01 [P] Criar projeto Angular 18 com `ng new familyfinance-web --style=scss --routing=true --strict=true --standalone=true --ssr=false --package-manager=npm` e ajustar tsconfig.json com opções strict adicionais (ver seção 3 do spec)
- [x] T-02 [P] Instalar Angular Material com `ng add @angular/material --theme=custom --typography=true --animations=enabled`
- [x] T-03 [P] Instalar e configurar Prettier, Husky e lint-staged; criar `.prettierrc.json` e `.editorconfig`; adicionar bloco `lint-staged` no package.json
- [x] T-04 [P] Configurar scripts no package.json: `start`, `build`, `build:prod` (--configuration=production), `test`, `test:cobertura`, `lint`, `format`

## Bloco 2 — Ambientes

- [x] T-05 [P] Criar `src/ambientes/ambiente.ts` (dev) e `src/ambientes/ambiente.producao.ts` (prod); configurar `fileReplacements` no angular.json para troca na build production (ver D-08 em design.md — verificar path correto com Swagger UI do backend antes de implementar)

## Bloco 3 — Design System

- [x] T-06 [G] Criar design system SCSS em `src/estilos/`: `_tokens.scss`, `_tipografia.scss`, `_tema.scss` (Angular Material M2 dark Halloween — laranja/roxo), `_utilitarios.scss`, `_layout.scss`, `_componentes.scss`; atualizar `styles.scss` para importar todos na ordem correta (ver seção 14 completa do spec)

## Bloco 4 — Infraestrutura Angular

- [x] T-07 [P] Criar `src/app/modelos/conta.modelo.ts` com TipoConta, Conta, CriarContaComando, EditarContaComando (sem saldoInicial), SaldoContaResposta e TIPOS_CONTA
- [x] T-08 [P] Criar `src/app/nucleo/interceptores/erro-http.interceptor.ts` (HttpInterceptorFn) com leitura de `erro.error?.mensagem`, fallback por status e exibição via MatSnackBar
- [x] T-09 [P] Configurar `app.config.ts` (providers: ZoneChange, Router com inputBinding, HttpClient com interceptor, Animations) e `app.routes.ts` (lazy loading: LayoutPrincipal > contas, contas/nova, contas/:id/editar); `app.component.html` com apenas `<router-outlet />`
- [x] T-10 [P] Criar `src/app/nucleo/servicos/conta.servico.ts` com métodos listar, buscarPorId, criar, atualizar, alterarSituacao, consultarSaldo — INCLUIR BUG-01 (urlBase `/conta` em vez de `/contas`) e BUG-02 (atualizar usa POST em vez de PUT) com comentários `🐛 BUG-INTENCIONAL-NN`

## Bloco 5 — Componentes

- [x] T-11 [P] Criar `src/app/compartilhado/componentes/confirmacao-dialogo/` com ConfirmacaoDialogoComponent (recebe MAT_DIALOG_DATA com titulo/mensagem, fecha com true/false)
- [x] T-12 [P] Criar `src/app/layout/layout-principal/` com LayoutPrincipalComponent (sidenav fixo, cabeçalho "FamilyFinance", nav-item "Contas" com ícone account_balance_wallet, router-outlet na área de conteúdo)
- [x] T-13 [M] Criar `src/app/funcionalidades/contas/lista-contas/` com ListaContasComponent (signal de carregamento, tabela com colunas nome/tipo/saldoInicial/cor/ações, estado vazio, editar navega, desativar abre diálogo) — INCLUIR BUG-03 (subscribe sem callback error) com comentário `🐛 BUG-INTENCIONAL-03`
- [x] T-14 [M] Criar `src/app/funcionalidades/contas/formulario-conta/` com FormularioContaComponent (modo criação/edição via :id, carrega dados, desabilita saldoInicial na edição) — INCLUIR BUG-04 (falta Validators.minLength(2)), BUG-05 (envia saldoInicial no atualizar), BUG-06 (botão com type="button" em vez de type="submit") com comentários `🐛 BUG-INTENCIONAL-NN`

## Bloco 6 — Testes

- [x] T-15 [M] Escrever testes unitários para ListaContasComponent (spinner durante load, tabela após sucesso, estado vazio, navegação ao editar, diálogo de confirmação ao desativar)
- [x] T-16 [M] Escrever testes unitários para FormularioContaComponent (modo criação, modo edição com dados carregados, validação required, submit inválido não chama serviço, submit válido chama criar/atualizar)

## Bloco 7 — Documentação

- [x] T-17 [P] Criar `README.md` com pré-requisitos, npm install, tabela de comandos e referência à apostila de onboarding (ver seção 15 do spec)
