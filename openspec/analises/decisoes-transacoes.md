# Pontos de Decisão — Change Proposal: Módulo de Transações

**Referência:** descrição do módulo fornecida em exploração  
**Próximo passo:** quando este arquivo estiver respondido, será criada a change proposal.

---

## Como usar este arquivo

Edite a linha `Escolha:` de cada decisão.  
Decisões marcadas com 🔴 bloqueiam o design se não forem respondidas.  
Decisões marcadas com 🟡 impactam o escopo mas têm fallback razoável.  
Decisões marcadas com 🟢 têm recomendação clara — confirme ou ajuste.

---

## Seção A — Navegação e Rotas

### A-01 🔴 Ponto de entrada do extrato

O extrato lista transações filtradas por conta. Como o usuário chega a ele?

```
Opção 1 — Via lista de contas (link por conta)
  /contas → tabela → botão "Extrato" por linha → /contas/:id/transacoes
  
  Prós: conta_id vem da URL, contexto claro, sem seletor de conta na tela
  Contras: sem acesso global por transações; sidenav não muda
  
Opção 2 — Item no sidenav "Transações" + seletor de conta na tela
  /transacoes → usuário escolhe a conta via select no topo do extrato
  
  Prós: acesso direto pelo sidenav; extensível para visão global futura
  Contras: mais complexo; estado do filtro de conta precisa ser mantido
  
Opção 3 — Ambos: sidenav + link por conta
  Sidenav "Transações" → /transacoes (com select)
  Lista de contas → /contas/:id/transacoes (pré-filtrado)
  Mesmo componente, mas com parâmetro opcional
  
  Prós: melhor UX
  Contras: componente mais complexo; duas formas de chegar ao mesmo lugar
```

**Escolha:** 2

---

### A-02 🔴 Estrutura da rota do extrato

Dependente de A-01, mas com impacto próprio no `app.routes.ts`.

```
Opção 1 — Rota filha de /contas
  /contas/:id/transacoes (extrato de uma conta)
  /contas/:id/transacoes/nova (nova transação pré-vinculada à conta)
  /contas/:id/transacoes/:transacaoId/editar

Opção 2 — Rota independente
  /transacoes?conta=:id (extrato com query params)
  /transacoes/nova
  /transacoes/:id/editar
  
Opção 3 — Misto
  /contas/:id/transacoes (extrato vinculado à conta)
  /transacoes/nova (formulário genérico — usuário escolhe a conta no form)
  /transacoes/:id/editar
```

A Opção 1 é mais consistente com o backend (filtro obrigatório por conta_id), mas gera rotas longas. A Opção 2 é mais flexível mas o `conta_id` precisa vir de outro lugar quando não há query param.

**Escolha:** 2

---

### ⚠️ ATENÇÃO — Inconsistência entre A-01 e A-02

**A-01=2** (sidenav + seletor de conta) implica rota **`/transacoes`** com conta selecionada via select na tela.  
**A-02=1** (rota filha de /contas) implica rota **`/contas/:id/transacoes`** sem seletor.

Essas duas escolhas se contradizem. Precisa escolher uma das combinações:

```
Combinação X: A-01=1, A-02=1
  Acesso via lista de contas → /contas/:id/transacoes (sem seletor, sem item no sidenav)

Combinação Y: A-01=2, A-02=2
  Sidenav "Transações" → /transacoes?conta=:id (com seletor na tela)

Combinação Z: A-01=3, A-02=3 (misto)
  Sidenav → /transacoes (seletor)
  Lista de contas → /contas/:id/transacoes (sem seletor)
  Mesmo componente de extrato, contaId vem da rota ou do select
```

**Resolva revisando A-01 e A-02 para ficarem consistentes.** Combinação Y

---

### A-03 🟢 Item no sidenav

Se A-01 inclui um item no sidenav para Transações, ele deve aparecer como:

```
Opção 1 — Item direto "Transações" (ícone: receipt_long)
Opção 2 — Sub-item abaixo de "Contas" (hierarquia visual)
Opção 3 — Não adicionar no sidenav (acesso apenas via lista de contas)
```

Recomendação: Opção 1 se A-01 for Opção 2 ou 3; Opção 3 se A-01 for Opção 1.

**Escolha:** 2

---

## Seção B — Escopo e Funcionalidades

### B-01 🔴 O que entra nesta change

```
Opção 1 — Completo: extrato + criar + editar + efetivar/desefetivar + excluir
  Uma change única, mais longa

Opção 2 — Dividido em duas changes:
  Change A: extrato (listagem filtrada) + criar transação
  Change B: editar + efetivar/desefetivar
  
  Prós: Change A pode ir a produção antes; Change B aguarda decisões de backend
  Contras: extrato sem edição é parcialmente utilizável
  
Opção 3 — MVP: extrato + criar + efetivar (sem editar)
  Edição é rara — usuário exclui e recria
```

**Escolha:** 1

---

### B-02 🔴 Categorias: incluir ou não nesta change

O backend ainda não decidiu se vai expor `GET /api/categorias`, nem se vai enriquecer a resposta de transação com `nomeCategoria`.

```
Opção 1 — Excluir categoria desta change
  O campo categoria_id não aparece no formulário nem no extrato.
  Uma change futura adiciona categorias quando o backend estiver pronto.
  
  Prós: sem bloqueio de backend; sem decisão prematura de UX
  Contras: usuário não consegue categorizar transações neste ciclo

Opção 2 — Incluir campo categoria_id como texto livre (temporário)
  Input de texto para o ID — ruim para UX mas não bloqueia
  
  Contras: péssima experiência; cria dívida de UX

Opção 3 — Incluir dropdown de categorias (requer GET /api/categorias)
  Depende de o backend expor o endpoint. Se não existir, tela quebra.
  
  Contras: bloqueado pelo backend
```

**Escolha:** 3

> **✅ Contrato confirma:** `GET /api/categorias` existe e retorna `Categoria[]` (lista simples, sem paginação).
> A resposta de transação já embute `categoria: CategoriaResumo | null` — nenhum endpoint extra necessário para exibição.
> **Regra do seletor:** ao exibir as categorias no formulário, filtrar pelo mesmo `tipo` da transação
> (transação RECEITA → exibir só categorias com `tipo = 'RECEITA'`, e vice-versa).

---

### B-03 🔴 Paginação: scaffold ou aguardar

O backend não decidiu se vai paginar. Se implementar sem paginação e o backend retornar `{ content: [...], totalElements: N, page: P }`, o serviço Angular vai receber um objeto em vez de array e vai quebrar silenciosamente.

```
Opção 1 — Implementar sem paginação agora
  Serviço espera Observable<Transacao[]>.
  Se o backend adotar paginação, o serviço precisará ser reescrito.
  
Opção 2 — Preparar interface paginada mas não mostrar controles de página
  interface PaginaResposta<T> { conteudo: T[]; totalItens: number; totalPaginas: number; ... }
  Serviço retorna Observable<PaginaResposta<Transacao>>, extrato usa .conteudo.
  Controles de paginação (MatPaginator) ficam para uma change futura.
  
  Prós: não quebra quando o backend adotar paginação
  Contras: mais complexo sem benefício imediato visível ao usuário
  
Opção 3 — Aguardar decisão do backend antes de implementar
  Bloqueia a change até o backend definir o contrato.
```

**Escolha:** 2

> **✅ Contrato determina:** `GET /api/transacoes` **já retorna** `PaginaResposta<Transacao>`, não um array simples.
> Campos do wrapper: `conteudo: T[]`, `pagina`, `tamanho`, `totalItens`, `totalPaginas`, `ultima`.
> Usar Opção 1 quebraria na primeira chamada. Opção 2 é obrigatória.
> Os dados ficam em `.conteudo`, nunca na raiz do objeto.

---

## Seção C — UX do Extrato

### C-01 🔴 Semântica visual de `efetivada`

Transações pendentes são visíveis mas não afetam o saldo. Como diferenciar visualmente?

```
Opção 1 — Opacidade reduzida para pendentes (opacity: 0.5 ou cor mais clara)
Opção 2 — Badge/chip "Pendente" na linha
Opção 3 — Ícone de status (check_circle para efetivadas, schedule para pendentes)
Opção 4 — Cor de texto diferente (texto-desabilitado para pendentes)
Opção 5 — Combinação: ícone + cor diferente para pendentes
```

**Escolha:** 5

---

### C-02 🔴 Como acionar "efetivar/desefetivar"

```
Opção 1 — Toggle/checkbox inline na linha do extrato (sem confirmação)
  Mais rápido, mas pode ser acionado por acidente.
  
Opção 2 — Botão de ação na coluna "Ações" (igual a Editar/Excluir)
  Requer identificar qual botão mostra para qual estado.
  
Opção 3 — Diálogo de confirmação (como o de desativar conta)
  Mais seguro, mais fricção.
  
Opção 4 — Efetivar inline sem confirmação, desefetivar com confirmação
  Faz sentido semanticamente: efetivar é "confirmar que aconteceu",
  desefetivar é "reverter um estado confirmado" — merece mais atenção.
```

**Escolha:** 4

---

### C-03 🟡 Saldo exibido no cabeçalho do extrato

O extrato pode mostrar informações de saldo da conta no topo. Qual nível de detalhe?

```
Opção 1 — Sem saldo no extrato (usuário vê saldo na lista de contas)
Opção 2 — Apenas saldoAtual (efetivadas) via GET /contas/{id}
Opção 3 — saldoAtual + saldoPrevisto (efetivadas + pendentes)
  saldoPrevisto calculado pelo frontend (saldoAtual ± transações pendentes)
  ou pelo backend (endpoint específico — a confirmar)
Opção 4 — saldoAtual + saldoInicial (sem calcular pendentes)
```

Nota: `ContaServico.consultarSaldo()` já está implementado (marcado para uso em v2). No contexto do extrato,
a forma natural seria `contaServico.buscarPorId(contaId)` — o campo `saldoAtual` já vem na resposta de Conta,
calculado pelo backend em tempo real. Após qualquer mutação em transação, recarregar a conta pelo mesmo método.

**Escolha:** Escolha o mais adequado ao momento atual.

---

### C-04 🟢 Filtros no extrato

O backend aceita `conta_id`, `tipo` e período (data início/fim). Quais filtros expor na UI?

```
Opção 1 — Só filtro de conta (conta_id via URL, sem UI adicional)
Opção 2 — Conta (URL) + tipo (RECEITA/DESPESA/Todos) via chips ou select
Opção 3 — Conta (URL) + tipo + período (MatDatepicker range)
Opção 4 — Nenhum filtro além da conta (tudo carregado de uma vez)
```

Recomendação: Opção 2 — tipo é simples e muito útil; período pode vir numa change futura quando paginação estiver definida.

**Escolha:** 2

---

### C-05 🟡 Ordenação das transações

```
Opção 1 — Backend controla (frontend não interfere)
Opção 2 — Frontend solicita ordem via query param (ex: sort=dataLancamento,desc)
Opção 3 — Frontend ordena no lado do cliente após receber a lista
```

**Escolha:** 1

> **✅ Contrato determina:** `FiltrosTransacao` não possui nenhum parâmetro de ordenação (`sort`, `order`, etc.).
> O backend controla a ordem. Opções 2 e 3 não são viáveis sem contrato que as suporte.

---

## Seção D — Formulário de Transação

### D-01 🔴 Campo data_lancamento: DatePicker ou input nativo

```
Opção 1 — MatDatepicker (Angular Material)
  Requer: MatDatepickerModule + MatNativeDateModule (ou MatMomentDateModule)
  MatNativeDateModule já está disponível em @angular/material sem nova dependência
  Prós: UX consistente com o tema Material; formatação automática
  
Opção 2 — <input type="date"> nativo
  Sem dependência adicional; aparência varia por browser
  
Opção 3 — Input de texto com máscara (DD/MM/AAAA)
  Requer biblioteca de máscara (ngx-mask) — nova dependência
```

**Escolha:** 1

---

### D-02 🟡 `descricao` — obrigatório ou opcional?

O modelo foi descrito como "tem descricao" mas não foi dito se é obrigatório no backend.

```
Opção 1 — Obrigatório no frontend (Validators.required + Validators.maxLength(200))
Opção 2 — Opcional no frontend (campo preenchível mas não bloqueante)
```

Se o backend rejeitar descrição vazia com 400, a Opção 1 evita uma ida desnecessária ao servidor. Se o backend aceitar, a Opção 2 dá mais flexibilidade.

**Escolha:** 1

> **✅ Contrato determina:** `CriarTransacaoComando.descricao` — "1–200 caracteres, **obrigatório**".
> Usar `Validators.required` + `Validators.minLength(1)` + `Validators.maxLength(200)`.
> O mesmo se aplica a `EditarTransacaoComando`.

---

### D-03 🟡 Conta vinculada no formulário de nova transação

Quando o usuário chega ao formulário via `/contas/:id/transacoes/nova`, a conta está pré-definida. E quando chega via `/transacoes/nova`?

```
Opção 1 — Conta sempre pré-definida (formulário só acessível via extrato de conta)
  Simplifica o formulário — sem seletor de conta
  
Opção 2 — Formulário com select de conta (carrega lista via GET /contas)
  Permite criação de transação independente do contexto
  
Opção 3 — Depende da rota: pré-definida se vier com conta_id, seletor se não vier
```

**Escolha:** 3

> **Nota:** Se A-01/A-02 for resolvido como Combinação X (rota `/contas/:id/transacoes`), então
> Opção 1 é suficiente — `contaId` vem sempre da URL. Se for Combinação Y ou Z, Opção 3 é necessária.

---

## Seção E — Bugs Intencionais

### E-01 🔴 Este módulo terá bugs intencionais de treinamento?

O módulo de Contas foi gerado com 6 bugs intencionais. O módulo de Transações segue o mesmo padrão?

```
Opção 1 — Sim, com bugs análogos ao módulo de Contas
Opção 2 — Sim, mas menos bugs (ex: 3-4) — módulo de transações é mais complexo
           e a Júnior já passou pelo exercício uma vez
Opção 3 — Não — módulo gerado limpo, serve como referência de "código correto"
           para a Júnior comparar com o módulo de Contas
```

**Escolha:** 2

---

### E-02 🟡 Se sim (E-01 = 1 ou 2), quais bugs? (sugestões para selecionar)

```
[x] BUG-T-01: filtro de data enviado no formato DD/MM/AAAA em vez de YYYY-MM-DD (formato ISO esperado pelo backend)
[ ] BUG-T-02: PATCH /efetivar chamado com PUT (análogo ao BUG-02 de Contas)
[x] BUG-T-03: sinal do valor (RECEITA como negativo, DESPESA como positivo — invertido)
[ ] BUG-T-04: falta de Validators.min(0.01) no valor — permite transação de R$0,00
[x] BUG-T-06: callback error ausente no subscribe do extrato (análogo ao BUG-03)
[ ] BUG-T-07: conta_id hardcoded ou errado no comando de criação
[x] BUG-T-08: filtro de tipo não enviado ao backend (componente tem select mas parâmetro não vai na requisição)
```

> **✅ BUG-T-05 removido:** O contrato confirma que `EditarTransacaoComando` inclui `efetivada: boolean`
> como campo explícito. Enviar `efetivada` no PUT é comportamento correto — não é bug.

**Selecione os que devem ser incluídos (marque com X):**

---

## Seção F — Infraestrutura

### F-01 🟢 `TransacaoServico` no padrão de `ContaServico`

O serviço deve seguir o mesmo padrão: `inject(HttpClient)`, `urlBase = ${urlApi}/transacoes`, métodos para cada endpoint.

```
Opção 1 — Sim, padrão idêntico ao ContaServico
Opção 2 — Adicionar alguma abstração compartilhada (ex: ServicoBase<T>)
           dado que o padrão se repete
```

Recomendação: Opção 1 — YAGNI; abstração prematura com apenas dois serviços.

**Escolha:** 1

> **✅ Contrato confirma:** o documento de contratos já inclui exemplo completo de `TransacaoServico`
> no exato padrão de `ContaServico` — `inject(HttpClient)`, `urlBase`, métodos por endpoint.

---

### F-02 🟡 Modelo `Transacao` — campo de valor negativo/positivo

Ao exibir no extrato, RECEITA deve aparecer em verde e DESPESA em vermelho. O valor armazenado é sempre `≥ 0` (campo decimal unsigned), com o tipo indicando o sinal semântico.

```
Opção 1 — Frontend interpreta: RECEITA = positivo, DESPESA = negativo para cálculos e exibição
Opção 2 — Frontend só aplica cor; nunca inverte o sinal do valor (valor sempre positivo na tela)
```

**Escolha:** 2

> **✅ Contrato determina:** `CriarTransacaoComando.valor: number; // > 0, obrigatório` — valor sempre positivo.
> O campo `tipo` ('RECEITA' | 'DESPESA') é a fonte do significado semântico.
> Frontend aplica cor via classe CSS ou condição no template; não inverte nem calcula sinal.

---

### F-03 🟢 `TipoTransacaoPipe` para rótulos

Análogo ao `TipoContaPipe` já criado. O tipo `RECEITA`/`DESPESA` precisa de rótulo em português?

```
Opção 1 — Criar TipoTransacaoPipe (em compartilhado/pipes/)
Opção 2 — Usar string diretamente no template (rótulos simples o suficiente)
```

Recomendação: Opção 2 — "Receita" e "Despesa" são legíveis o suficiente; pipe seria overkill.
Ao contrário de `TipoConta` (CORRENTE, POUPANCA, INVESTIMENTO — todos precisam de formatação),
`TipoTransacao` só tem dois valores e ambos já são palavras portuguesas reconhecíveis.

**Escolha:** 2

---

## Resumo das decisões críticas (🔴)

| ID | Tema | Status |
|----|------|--------|
| A-01 | Ponto de entrada do extrato | ⚠️ inconsistente com A-02 — resolver |
| A-02 | Estrutura de rota | ⚠️ inconsistente com A-01 — resolver |
| B-01 | Escopo da change | ✅ Opção 1 (usuário) |
| B-02 | Categorias: incluir ou não | ✅ Opção 3 (usuário) — endpoint confirmado pelo contrato |
| B-03 | Paginação: scaffold ou não | ✅ Opção 2 (contrato obriga) |
| C-01 | Visual de transação pendente | ⬜ |
| C-02 | Acionamento de efetivar | ⬜ |
| D-01 | DatePicker vs. input nativo | ⬜ |
| D-02 | `descricao` obrigatório | ✅ Opção 1 (contrato obriga) |
| E-01 | Bugs intencionais: sim ou não | ⬜ |

## Resumo das decisões secundárias (🟡/🟢)

| ID | Tema | Status |
|----|------|--------|
| A-03 | Item no sidenav | ✅ Opção 2 (usuário) |
| C-03 | Saldo no cabeçalho do extrato | ⬜ |
| C-04 | Filtros no extrato | ⬜ |
| C-05 | Ordenação | ✅ Opção 1 (contrato determina) |
| D-03 | Conta no formulário | ⬜ aguarda A-01/A-02 |
| E-02 | Quais bugs intencionais | ⬜ aguarda E-01 |
| F-01 | Padrão do TransacaoServico | ✅ Opção 1 (contrato confirma) |
| F-02 | Valor negativo/positivo | ✅ Opção 2 (contrato determina) |
| F-03 | TipoTransacaoPipe | ✅ Opção 2 (recomendação confirmada) |
