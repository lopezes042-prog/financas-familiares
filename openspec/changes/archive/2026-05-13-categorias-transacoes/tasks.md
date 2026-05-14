# Tasks — Módulos de Categorias e Transações

**Change:** categorias-transacoes  
**Data:** 2026-05-13  

Complexidade: P = < 30 min · M = 30–90 min · G = > 90 min  
Status: [ ] pendente · [x] concluído · [~] em andamento

---

## Bloco 1 — Modelos

- [x] **T-01** [P] Criar `categoria.modelo.ts` com `TipoCategoria`, `Categoria`, `CriarCategoriaComando`, `EditarCategoriaComando`
- [x] **T-02** [P] Criar `transacao.modelo.ts` com `TipoTransacao`, `ContaResumo`, `CategoriaResumo`, `Transacao`, `PaginaResposta<T>`, `CriarTransacaoComando`, `EditarTransacaoComando`, `EfetivarTransacaoComando`, `FiltrosTransacao`

---

## Bloco 2 — Serviços

- [x] **T-03** [P] Criar `categoria.servico.ts` — métodos: `listar()`, `buscarPorId()`, `criar()`, `atualizar()`, `alterarSituacao()`
- [x] **T-04** [P] Criar `transacao.servico.ts` — métodos: `listar(filtros)`, `buscarPorId()`, `criar()`, `atualizar()`, `alterarSituacao()`, `efetivar()`
  - `listar()` converte filtros para `HttpParams` (todos os valores via `String(valor)`)
  - **⚠️ BUG-T-01:** no mapeamento de `dataInicio`/`dataFim`, usar formato `DD/MM/AAAA` em vez de `YYYY-MM-DD`

---

## Bloco 3 — Módulo de Categorias (limpo, sem bugs)

- [x] **T-05** [M] Criar `lista-categorias.component` (ts + html + scss)
  - Tabela: nome, tipo (Receita/Despesa), ícone, cor, ações (Editar, Desativar)
  - Chip de cor renderizado como `<span>` com `background-color` inline
  - Botão Desativar abre `ConfirmacaoDialogoComponent`; após confirmação chama `alterarSituacao(id, false)` e recarrega lista
  - Botão "Nova categoria" navega para `/categorias/nova`
  - Estado de carregamento com `MatProgressSpinnerModule`

- [x] **T-06** [M] Criar `formulario-categoria.component` (ts + html + scss)
  - Modo criação (`/categorias/nova`) e modo edição (`/categorias/:id/editar`)
  - Campos: nome (`required`, `minLength(2)`, `maxLength(100)`), tipo (select: Receita/Despesa), ícone (`maxLength(50)`, opcional), cor (input `#RRGGBB`, opcional)
  - Botão Cancelar → volta para `/categorias`
  - Botão Salvar → cria ou atualiza; em sucesso navega para `/categorias`
  - Erros de API exibidos via interceptor (snackbar)

---

## Bloco 4 — Rotas e Navegação

- [x] **T-07** [P] Adicionar rotas de categorias em `app.routes.ts`:
  - `/categorias` → `ListaCategoriasComponent` (lazy)
  - `/categorias/nova` → `FormularioCategoriaComponent` (lazy)
  - `/categorias/:id/editar` → `FormularioCategoriaComponent` (lazy)

- [x] **T-08** [P] Adicionar rotas de transações em `app.routes.ts`:
  - `/transacoes` → `ExtratoTransacoesComponent` (lazy)
  - `/transacoes/nova` → `FormularioTransacaoComponent` (lazy)
  - `/transacoes/:id/editar` → `FormularioTransacaoComponent` (lazy)

- [x] **T-09** [P] Atualizar `layout-principal.component.html` — adicionar ao sidenav:
  - Item "Transações" (ícone: `receipt_long`) → `/transacoes` — posicionar acima de Contas
  - Item "Categorias" (ícone: `folder`) → `/categorias`

---

## Bloco 5 — Módulo de Transações (com bugs)

- [x] **T-10** [G] Criar `extrato-transacoes.component` (ts + html + scss)
  - Seletor de conta no topo (carrega via `ContaServico.listar()`)
  - Chips de filtro por tipo: Todos / Receita / Despesa
  - Ao selecionar conta: chama `TransacaoServico.listar({ contaId, tamanho: 50 })` e `ContaServico.buscarPorId(contaId)` (para exibir `saldoAtual` no cabeçalho)
  - Tabela: data, descrição, categoria (ou "Sem categoria"), valor, status (ícone), ações
  - **⚠️ BUG-T-03:** classe de cor aplicada ao contrário — RECEITA com classe `ff-valor-despesa`, DESPESA com classe `ff-valor-receita`
  - **⚠️ BUG-T-06:** `carregarTransacoes()` usa `subscribe({ next: ..., complete: ... })` — sem callback `error`; spinner nunca para em falha
  - **⚠️ BUG-T-08:** signal `tipoFiltro` existe e é atualizado pelos chips, mas o valor **não é incluído** nos `FiltrosTransacao` enviados ao `TransacaoServico.listar()`
  - Ação Efetivar: chama `TransacaoServico.efetivar(id, true)` direto (sem diálogo), depois recarrega extrato e conta
  - Ação Desefetivar: abre `ConfirmacaoDialogoComponent`, depois chama `efetivar(id, false)`, recarrega extrato e conta
  - Ação Desativar: abre `ConfirmacaoDialogoComponent`, depois chama `alterarSituacao(id, false)`, recarrega extrato
  - Botão Editar: navega para `/transacoes/:id/editar`
  - Botão "Nova transação": navega para `/transacoes/nova`

- [x] **T-11** [G] Criar `formulario-transacao.component` (ts + html + scss)
  - Modo criação (`/transacoes/nova`) e modo edição (`/transacoes/:id/editar`)
  - Carrega lista de contas (`ContaServico.listar()`) para seletor
  - Carrega lista de categorias (`CategoriaServico.listar()`) para seletor filtrado por tipo
  - Ao alterar `tipo` da transação: filtra categorias exibidas no seletor
  - Campos: conta (select, `required`), tipo (select RECEITA/DESPESA, `required`), descrição (`required`, `maxLength(200)`), valor (`required`, `Validators.min(0.01)`), data (MatDatepicker, `required`), categoria (select opcional, filtrado por tipo), efetivada (checkbox)
  - Ao salvar: converte `Date` do picker para `"yyyy-MM-dd"` antes de montar o comando
  - Botão Cancelar → volta para `/transacoes`
  - Botão Salvar → cria ou atualiza; em sucesso navega para `/transacoes`

---

## Bloco 6 — Qualidade

- [x] **T-12** [P] Verificar `ng build --configuration production` sem erros
- [x] **T-13** [P] Smoke test manual: criar categoria → criar transação categorizada → verificar saldo atualizado na conta
