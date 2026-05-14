# Proposal — Módulos de Categorias e Transações (Entrega v1 Conjunta)

**Status:** proposto  
**Data:** 2026-05-13  
**Contexto:** O backend entregou os módulos de Categorias (5 endpoints) e Transações (6 endpoints) estáveis. Esta change completa o frontend para que a entrega v1 seja feita em conjunto.

---

## Problema

O backend expõe 17 endpoints v1. O frontend só consome 6 (Contas). Os 11 restantes — `/api/categorias` e `/api/transacoes` — não têm representação alguma no frontend: sem serviços, sem modelos, sem telas, sem navegação.

---

## O que será construído

### Módulo de Categorias

- **Lista de categorias** (`/categorias`): tabela com nome, tipo (Receita/Despesa), ícone, cor e ações (Editar, Desativar)
- **Formulário de categoria** (`/categorias/nova`, `/categorias/:id/editar`): campos nome, tipo, ícone e cor com validação
- `CategoriaServico` com os 5 métodos de API
- `categoria.modelo.ts` com interfaces TypeScript alinhadas ao contrato

### Módulo de Transações

- **Extrato** (`/transacoes`): listagem paginada (scaffold), com seletor de conta e filtro por tipo (Receita/Despesa/Todos); diferenciação visual entre efetivadas e pendentes
- **Formulário de transação** (`/transacoes/nova`, `/transacoes/:id/editar`): campos conta, categoria (filtrada por tipo), descrição, valor, tipo, data (MatDatepicker), efetivada
- Ação **efetivar inline** (sem confirmação) e **desefetivar com confirmação** (diálogo)
- Ação **desativar** transação (com confirmação)
- `TransacaoServico` com os 6 métodos de API
- `transacao.modelo.ts` com interfaces TypeScript alinhadas ao contrato

### Navegação

- Sidenav atualizado: Categorias como item independente; Transações como sub-item de Contas
- Rotas lazy-loaded adicionadas em `app.routes.ts`

---

## Fora do Escopo

- Paginação navegável na UI (o serviço usa `PaginaResposta<T>` mas controles de página ficam para change futura)
- Filtros de período no extrato (DatePicker de intervalo — futura change)
- Dashboard de saldo total / relatórios
- Subcategorias
- Autenticação (v2)
- Ativação de categorias ou transações desativadas (só desativar, não reativar via UI — backend permite, UI adia)

---

## Impacto em rotas e navegação

```
Rotas adicionadas:
  /categorias                           → ListaCategoriasComponent
  /categorias/nova                      → FormularioCategoriaComponent
  /categorias/:id/editar                → FormularioCategoriaComponent
  /transacoes                           → ExtratoTransacoesComponent
  /transacoes/nova                      → FormularioTransacaoComponent
  /transacoes/:id/editar                → FormularioTransacaoComponent

Sidenav:
  Antes: [Contas]
  Depois: [Contas] [Transações↳ sub-item] [Categorias]
```

Padrão de rota para Transações: **Combinação Y** — `/transacoes` com seletor de conta na tela (não rota filha de `/contas/:id`). Ver `design.md` para decisão completa.

---

## Bugs intencionais (4 no módulo de Transações)

Este módulo inclui 4 bugs para exercício de revisão de código. O módulo de Categorias é gerado limpo (serve de referência). Ver `design.md` seção "Bugs intencionais" para localização e descrição de cada um.

---

## Critérios de aceite

| # | Critério |
|---|---------|
| 1 | `GET /api/categorias` é chamado ao navegar para `/categorias`; lista é exibida |
| 2 | Criar categoria com nome duplicado exibe o `mensagem` do erro 422 via snackbar |
| 3 | Desativar categoria atualiza a lista sem recarregar a página inteira |
| 4 | `GET /api/transacoes?contaId=:id` é chamado ao selecionar uma conta no extrato |
| 5 | Transação pendente (`efetivada=false`) é visualmente diferente da efetivada |
| 6 | Clicar "Efetivar" na linha chama `PATCH /efetivar` sem confirmação |
| 7 | Clicar "Desefetivar" na linha abre diálogo de confirmação antes de chamar PATCH |
| 8 | Criar transação sem conta selecionada bloqueia o formulário (campo obrigatório) |
| 9 | O seletor de categorias no formulário exibe apenas categorias do mesmo tipo da transação |
| 10 | `ng build --configuration production` compila sem erros |
