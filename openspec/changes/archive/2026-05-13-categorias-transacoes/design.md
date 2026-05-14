# Design — Módulos de Categorias e Transações

**Change:** categorias-transacoes  
**Data:** 2026-05-13  
**Referência de contratos:** `openspec/analises/contratos-frontend-transacoes.md`  
**Referência de decisões:** `openspec/analises/decisoes-transacoes.md`

---

## Arquitetura geral

Ambos os módulos seguem a estrutura já estabelecida pelo módulo de Contas:

```
app/
├── modelos/
│   ├── conta.modelo.ts          ← existente
│   ├── categoria.modelo.ts      ← novo
│   └── transacao.modelo.ts      ← novo
├── nucleo/servicos/
│   ├── conta.servico.ts         ← existente
│   ├── categoria.servico.ts     ← novo
│   └── transacao.servico.ts     ← novo
└── funcionalidades/
    ├── contas/                  ← existente
    ├── categorias/              ← novo
    │   ├── lista-categorias/
    │   └── formulario-categoria/
    └── transacoes/              ← novo
        ├── extrato-transacoes/
        └── formulario-transacao/
```

Nenhuma abstração compartilhada entre serviços (YAGNI — dois serviços não justificam `ServicoBase<T>`).

---

## Decisão: roteamento de Transações

**Escolhida:** Combinação Y — rota independente `/transacoes` com seletor de conta na tela.

```
Alternativas consideradas:
  Combinação X: /contas/:id/transacoes — conta pré-definida pela URL, sem seletor
  Combinação Y: /transacoes + seletor de conta na tela ← ESCOLHIDA
  Combinação Z: misto (ambas as rotas para o mesmo componente)

Motivo: sidenav acessível em qualquer tela; usuário não precisa sair para Contas antes
de ver o extrato. Combinação X obrigaria navegação em dois passos.
Tradeoff: componente extrato precisa carregar lista de contas para popular o seletor.
```

**Sidenav resultante:**
```
[receipt_long]  Transações    → /transacoes
[folder]        Categorias    → /categorias
[account_balance] Contas      → /contas
```

Transações aparece **acima** de Contas para ser o ponto de entrada principal de uso diário.

> **Nota:** `decisoes-transacoes.md` registrou A-03=2 ("sub-item abaixo de Contas") em conflito com
> a Combinação Y escolhida. Após análise, sub-item foi descartado — Transações é ponto de entrada
> principal e merece item de primeiro nível no sidenav.

---

## Decisão: paginação no extrato

**Escolhida:** scaffold sem controles visuais.

`GET /api/transacoes` retorna `PaginaResposta<Transacao>`, nunca array simples. O serviço e o modelo refletem isso. O componente extrato usa `pagina.conteudo` para renderizar a lista. Controles de paginação (MatPaginator) ficam para change futura.

Parâmetros enviados por padrão: `{ pagina: 0, tamanho: 50 }` — volume alto o suficiente para uso inicial sem precisar paginar.

---

## Decisão: diferenciação visual de transação pendente

**Escolhida:** Opção 5 — ícone + cor diferente.

```
Efetivada:  ícone check_circle (verde/cor-sucesso) + texto normal
Pendente:   ícone schedule (cor neutra) + texto com opacity: 0.6
```

Implementado via classe CSS condicional `ff-transacao--pendente` no `<tr>` da tabela.

---

## Decisão: acionamento de efetivar/desefetivar

**Escolhida:** Opção 4 — efetivar inline, desefetivar com confirmação.

```
Efetivar:      botão direto na linha → PATCH /efetivar { efetivada: true }  (sem diálogo)
Desefetivar:   abre ConfirmacaoDialogoComponent → PATCH /efetivar { efetivada: false }
```

Semântica: confirmar que algo aconteceu é ação primária (rápida). Reverter uma confirmação é ação excepcional (merece fricção).

---

## Decisão: saldo no cabeçalho do extrato

**Escolhida:** Opção 2 — exibir `saldoAtual` via `GET /api/contas/{id}`.

Quando o usuário seleciona uma conta no extrato, o componente também chama `ContaServico.buscarPorId(contaId)` e exibe `conta.saldoAtual` no cabeçalho. Após qualquer mutação em transação, recarrega a conta para atualizar o saldo exibido.

---

## Decisão: filtros no extrato

**Escolhidos:** conta (seletor) + tipo (chips: Todos / Receita / Despesa).

Filtro de período (DatePicker de intervalo) adiado para change futura.

```typescript
// estado dos filtros no componente
readonly contaIdSelecionada = signal<string | null>(null);
readonly tipoFiltro = signal<TipoTransacao | null>(null);
```

---

## Decisão: `descricao` no formulário

Obrigatório, 1–200 caracteres. Validado em `Validators.required` + `Validators.maxLength(200)`.

---

## Decisão: data de lançamento

**Escolhida:** `MatDatepickerModule` + `MatNativeDateModule`.

O formulário usa `<input matDatepicker>`. O componente converte o `Date` do picker para string `"yyyy-MM-dd"` antes de enviar ao backend — usando `DatePipe` ou format manual (`toISOString().slice(0, 10)`).

---

## Decisão: conta no formulário de transação

Com Combinação Y, a rota `/transacoes/nova` não carrega `contaId` via URL path. O formulário inclui seletor de conta (carrega via `ContaServico.listar()`). Se o usuário navegar de uma tela com conta já em foco (futura melhoria), o seletor pode ser pré-preenchido via query param `?contaId=:id`.

---

## Módulo de Categorias — sem bugs intencionais

Categorias é gerado limpo e serve como referência de "código correto" para comparação com o módulo de Contas (que contém bugs de treinamento) e o módulo de Transações (que contém novos bugs).

---

## Bugs intencionais — Módulo de Transações (4 bugs)

| ID | Componente | Descrição | Comportamento observável |
|----|-----------|-----------|-------------------------|
| BUG-T-01 | `TransacaoServico.listar()` | Filtro `dataInicio`/`dataFim` enviado no formato `DD/MM/AAAA` em vez de `YYYY-MM-DD` | Backend ignora os filtros de data (retorna tudo) |
| BUG-T-03 | `extrato-transacoes.component.html` | Sinal do valor invertido: RECEITA exibida em vermelho, DESPESA em verde | Cores confusas — receita parece despesa |
| BUG-T-06 | `ExtratoTransacoesComponent.carregarTransacoes()` | Callback `error` ausente no `subscribe` | Spinner nunca para quando a API falha |
| BUG-T-08 | `ExtratoTransacoesComponent` | Filtro de `tipo` presente no template mas o valor do signal nunca incluído nos `FiltrosTransacao` | Select de tipo não filtra — backend sempre recebe todos |

Os bugs são introduzidos nos momentos específicos de implementação indicados em `tasks.md`.

---

## Contratos relevantes (resumo rápido)

Ver `openspec/analises/contratos-frontend-transacoes.md` para detalhes completos.

```
GET  /api/categorias          → Categoria[]  (array simples, sem paginação)
GET  /api/transacoes          → PaginaResposta<Transacao>  (dados em .conteudo)
PATCH /api/transacoes/:id/ativo    → 204 sem body
PATCH /api/transacoes/:id/efetivar → 204 sem body
```

`categoria` em `Transacao` pode ser `null` — sempre verificar antes de acessar `.nome`.
`efetivada = true` → entra no cálculo de `saldoAtual`; `efetivada = false` → planejada, não impacta saldo.
