# Review: Fluxo de Endpoints e Telas — Gerenciar Contas

**Data:** 2026-05-07  
**Escopo:** Mapeamento entre endpoints da API e componentes Angular, cobertura funcional e bugs  
**Referência:** `documentacao-inicial-frontend/contratos-frontend-projeto-inicial.md`

---

## Visão Geral do Fluxo

```
Usuário
   │
   ▼
LayoutPrincipalComponent
   │  (sidenav fixo, RouterOutlet)
   │
   ├─ /contas ─────────────────── ListaContasComponent
   │                                  │ ngOnInit → carregarContas()
   │                                  │               │
   │                                  │         ContaServico.listar()
   │                                  │         GET /conta          ← BUG-01: /conta em vez de /contas
   │                                  │
   │                                  ├─ [Editar] ──► router.navigate(['/contas', id, 'editar'])
   │                                  └─ [Desativar] ► ConfirmacaoDialogoComponent
   │                                                       │ confirmado=true
   │                                                       ▼
   │                                              ContaServico.alterarSituacao()
   │                                              PATCH /conta/{id}/ativo  ← BUG-01
   │
   ├─ /contas/nova ─────────────── FormularioContaComponent (modo criação)
   │                                  │ [Salvar] clicado
   │                                  │    ↑ BUG-06: type="button", evento nunca dispara
   │                                  │    ↑ BUG-04: nome sem minLength(2)
   │                                  │
   │                                  └─ ContaServico.criar()
   │                                     POST /conta             ← BUG-01
   │
   └─ /contas/:id/editar ─────── FormularioContaComponent (modo edição)
                                     │ ngOnInit → carregarConta(id)
                                     │               │
                                     │         ContaServico.buscarPorId()
                                     │         GET /conta/{id}    ← BUG-01
                                     │
                                     └─ [Salvar] clicado
                                            ↑ BUG-06: type="button"
                                            ↑ BUG-04: nome sem minLength(2)
                                            ↑ BUG-05: envia saldoInicial no body
                                            │
                                            ContaServico.atualizar()
                                            POST /conta/{id}      ← BUG-01 + BUG-02 (deveria ser PUT)
```

---

## Mapeamento Endpoint × Componente

| Endpoint (contrato) | Método | Usado em | Status no código | Bugs ativos |
|---------------------|--------|----------|-----------------|-------------|
| `/contas` | GET | `ListaContasComponent.carregarContas()` | Implementado | BUG-01, BUG-03 |
| `/contas/{id}` | GET | `FormularioContaComponent.carregarConta()` | Implementado | BUG-01 |
| `/contas` | POST | `FormularioContaComponent.criar()` | Implementado | BUG-01, BUG-04, BUG-06 |
| `/contas/{id}` | PUT | `FormularioContaComponent.atualizar()` | Implementado | BUG-01, BUG-02, BUG-05, BUG-06 |
| `/contas/{id}/ativo` | PATCH | `ListaContasComponent.desativar()` | Implementado | BUG-01 |
| `/contas/{id}/saldo` | GET | — | **Nunca chamado** | — |

---

## Análise por Operação

### 1. Listar Contas — `GET /contas`

**Tela:** `/contas` → `ListaContasComponent`

**Fluxo esperado (corrigido):**
```
ngOnInit → carregarContas() → carregando=true → GET /contas
  └─ sucesso → contas=[...] → carregando=false → tabela renderizada
  └─ erro    → snackbar (interceptor) → carregando permanece true  ← BUG-03
```

**Bugs ativos:**

- **BUG-01**: `urlBase = .../conta` → todas as chamadas chegam como `GET /conta` → backend responde 404 → interceptor mostra "Recurso não encontrado." → lista nunca carrega.
- **BUG-03**: sem callback `error` no `subscribe`. Quando ocorre qualquer erro (incluindo o 404 do BUG-01), o spinner fica girando indefinidamente. O snackbar é exibido (pelo interceptor), mas visualmente a tela mostra só o spinner.

**Comportamento real ao abrir `/contas` com os bugs:**
```
1. Spinner aparece
2. GET http://localhost:8080/conta → 404
3. Snackbar: "Recurso não encontrado."
4. Spinner continua girando para sempre
5. Tabela e estado vazio nunca aparecem
```

**Após corrigir BUG-01 + BUG-03:**
- Lista carrega normalmente
- Se backend estiver fora, spinner para e tela fica em estado indeterminado (vazio mas sem mensagem clara)

**Observação adicional (não é bug intencional):** após corrigir BUG-01, a URL final seria `http://localhost:8080/contas`. O contrato define `/api/contas`. Se o backend usa o prefixo `/api`, haverá um segundo 404 que pode confundir a Júnior. Ver D-08 e P-14 do review de configuração.

---

### 2. Criar Conta — `POST /contas`

**Tela:** `/contas/nova` → `FormularioContaComponent` (modoEdicao=false)

**Fluxo esperado (corrigido):**
```
usuário preenche → clica "Salvar" → formulario.valid? → criar(valor) → POST /contas
  └─ sucesso → snackbar "Conta criada com sucesso" → router.navigate(['/contas'])
  └─ erro    → snackbar do interceptor
```

**Bugs ativos (acumulados — 3 bugs afetam este fluxo):**

- **BUG-06** (impacto imediato): botão "Salvar" com `type="button"`. O formulário tem `(ngSubmit)="salvar()"`, mas o botão não dispara o evento `submit`. **Clicar o botão não faz nada.** O único jeito de submeter é pressionar Enter enquanto um campo está focado.
- **BUG-04** (impacto após BUG-06 ser corrigido): `Validators.minLength(2)` ausente. Nome "A" passa pela validação frontend → chega ao backend → backend retorna 400. O template já tem a mensagem de erro para `minlength`, mas o validator não existe — então a mensagem nunca aparece no frontend.
- **BUG-01** (impacto após BUG-06+BUG-04 corrigidos): `POST http://localhost:8080/conta` em vez de `/contas` → 404.

**Sequência de descoberta esperada para a Júnior:**
1. Clica "Salvar" → nada acontece → inspeciona HTML → corrige `type="submit"` (BUG-06)
2. Testa com nome "A" → backend rejeita → procura validação frontend → adiciona `minLength(2)` (BUG-04)
3. Preenche tudo correto → Network 404 → compara URL com Swagger → corrige `/conta` → `/contas` (BUG-01)

**Observação:** O campo `cor` usa `<input type="color">` — o browser exibe um color picker nativo. O valor enviado ao backend é sempre um hex `#RRGGBB` válido quando preenchido. Porém, o campo tem valor padrão vazio (`''`), e no `criar()` há `cor: valor.cor || undefined` — so se o usuário não escolheu cor, é enviado como `undefined` (campo ausente). Correto.

---

### 3. Carregar para Edição — `GET /contas/{id}`

**Tela:** `/contas/:id/editar` → `FormularioContaComponent` (modoEdicao=true)

**Fluxo esperado (corrigido):**
```
ngOnInit → rota.snapshot.paramMap.get('id') → carregarConta(id)
  → carregando=true → GET /contas/{id}
    └─ sucesso → patchValue → saldoInicial.disable() → carregando=false
    └─ erro    → carregando=false → router.navigate(['/contas'])  ← CORRETO
```

**Bugs ativos:**

- **BUG-01**: `GET http://localhost:8080/conta/{id}` → 404 → o componente **redireciona corretamente para `/contas`** (diferente do BUG-03 — o formulário tem callback `error`). O snackbar do interceptor exibe "Recurso não encontrado." e o usuário é levado de volta à lista.

**Assimetria de tratamento de erro (não intencional):**

Este é um ponto relevante para a Júnior aprender: `carregarConta()` tem o callback `error` correto, mas `carregarContas()` (lista) não tem. A mesma situação de erro (404 pelo BUG-01) tem **comportamentos completamente diferentes**:

```
Lista:      BUG-01 → 404 → spinner infinito (BUG-03)
Formulário: BUG-01 → 404 → redireciona para /contas (correto)
```

---

### 4. Editar Conta — `PUT /contas/{id}`

**Tela:** `/contas/:id/editar` → `FormularioContaComponent` (modoEdicao=true, após carregar dados)

**Fluxo esperado (corrigido):**
```
usuário edita → clica "Atualizar" → formulario.valid? → atualizar(valor) → PUT /contas/{id}
  └─ sucesso → snackbar "Conta atualizada com sucesso" → router.navigate(['/contas'])
  └─ erro    → snackbar do interceptor
```

**Bugs ativos (4 bugs — operação mais afetada do sistema):**

- **BUG-06**: botão com `type="button"` → clique não dispara submit.
- **BUG-04**: falta `minLength(2)` → nomes curtos chegam ao backend.
- **BUG-05**: `saldoInicial` incluído no body do `atualizar()`:
  ```typescript
  const comando = {
    nome: valor.nome,
    tipo: valor.tipo,
    saldoInicial: valor.saldoInicial, // ← não deveria estar aqui
    cor: valor.cor || undefined
  } as EditarContaComando;
  ```
  O contrato diz: *"Campos extras no body são ignorados silenciosamente pelo backend."* Portanto este bug **não causa erro visível** — o campo é simplesmente ignorado. Porém o `as EditarContaComando` força o TypeScript a aceitar a atribuição sem reclamar, mascarando o erro de tipo.

- **BUG-02**: método `POST` em vez de `PUT`:
  ```typescript
  return this.http.post<Conta>(`${this.urlBase}/${id}`, comando);
  //                   ^^^^^ deveria ser put
  ```
  Sintoma: backend retorna 405 (Method Not Allowed). O interceptor trata com "Operação não permitida pelo servidor."

**Sequência de descoberta esperada para a Júnior:**
1. Corrige BUG-06 → botão funciona
2. Corrige BUG-01 → URL correta
3. Testa → recebe 405 → abre Network → vê POST → compara com Swagger (PUT) → corrige (BUG-02)
4. Corrige BUG-04 e BUG-05 (pode ser descoberto pelo instrutor ao revisar o código)

---

### 5. Desativar Conta — `PATCH /contas/{id}/ativo`

**Tela:** Lista → clique "Desativar" → `ConfirmacaoDialogoComponent` → confirmação

**Fluxo esperado (corrigido):**
```
desativar(conta) → dialog.open(ConfirmacaoDialogoComponent)
  └─ afterClosed(confirmado=true) → ContaServico.alterarSituacao(id, false)
       └─ PATCH /contas/{id}/ativo { ativo: false }
            └─ 204 → snackbar "Conta desativada" → carregarContas()
  └─ afterClosed(confirmado=false) → nada acontece
```

**Bugs ativos:**
- **BUG-01**: `PATCH http://localhost:8080/conta/{id}/ativo` → 404.

**Comportamento do ConfirmacaoDialogoComponent:** correto. Recebe `{titulo, mensagem}` via `MAT_DIALOG_DATA`, fecha com `true` (confirmar) ou `false` (cancelar). O diálogo não tem bugs intencionais — é um componente de infraestrutura limpo.

**Observação:** O `desativar()` em `ListaContasComponent` não trata o callback `error` no subscribe de `alterarSituacao()`. Isso é análogo ao BUG-03 da lista — se o PATCH falhar, o snackbar do interceptor dispara, mas o `carregarContas()` também não é chamado e a lista não é recarregada. Não é um dos 6 bugs intencionais, mas é comportamento inconsistente.

---

### 6. Consultar Saldo — `GET /contas/{id}/saldo`

**Status: endpoint implementado no serviço, nunca chamado pela aplicação.**

`ContaServico.consultarSaldo()` existe, mas nenhum componente o invoca na v1. O saldo exibido na tabela é `conta.saldoAtual`, que vem diretamente da resposta do `GET /contas` (calculado pelo backend ao listar).

```typescript
// conta.servico.ts — método existente mas órfão na v1
consultarSaldo(id: string): Observable<SaldoContaResposta> {
  return this.http.get<SaldoContaResposta>(`${this.urlBase}/${id}/saldo`);
}
```

Uso previsto para versões futuras: exibir saldo atualizado em tempo real (após lançamento de transações), sem recarregar a lista completa.

---

## Análise do Interceptor HTTP

O `erroHttpInterceptor` é o único mecanismo de feedback de erros disponível na aplicação v1.

**O que ele faz corretamente:**
- Lê `erro.error?.mensagem` (campo do `ErroResposta` do backend) — prioridade ao backend.
- Fallbacks por status HTTP: 0, 404, 405, 422, 500.
- `duration: 5000` — dá tempo suficiente para leitura.
- `panelClass: ['snackbar-erro']` — aplica estilo vermelho via `_componentes.scss`.

**Limitações:**
- Status 400 não tem fallback dedicado. Vai para o `default` → "Ocorreu um erro inesperado." Mas como o 400 do backend sempre inclui `mensagem`, na prática o fallback nunca é acionado para 400.
- O interceptor sempre re-lança o erro (`throwError(() => erro)`). Componentes que não têm callback `error` no `subscribe` vão logar o erro no console como "unhandled". Isso é o comportamento correto (não engolir erros), mas pode gerar ruído no console da Júnior enquanto depura.

---

## Impacto Acumulado dos Bugs na Jornada do Usuário

### Cenário: Júnior abre o projeto do zero, sem contexto dos bugs

```
1. npm start → abre http://localhost:4200
2. Redireciona para /contas
3. Spinner aparece... e não para
4. Snackbar: "Recurso não encontrado."
   ↑ Sintoma: lista nunca exibe nada

→ INVESTIGAÇÃO: abre DevTools → Network
→ VÊ: GET /conta retorna 404
→ CORRIGE: /conta → /contas (BUG-01)

5. Lista carrega → tabela visível ✓
6. Clica "Nova conta" → preenche nome "A" → clica "Salvar"
7. Nada acontece
   ↑ Sintoma: botão não responde

→ INVESTIGAÇÃO: abre DevTools → inspeciona botão → vê type="button"
→ CORRIGE: type="button" → type="submit" (BUG-06)

8. Clica "Salvar" com nome "A"
9. Formulário submete → Network: POST /contas 400 "nome deve ter entre 2 e 100 caracteres"
10. Snackbar: mensagem do backend
    ↑ Sintoma: backend rejeita, mas frontend não mostra erro antes do submit

→ INVESTIGAÇÃO: vê erro do minLength no template, percebe que o validator não existe no TS
→ CORRIGE: adiciona Validators.minLength(2) (BUG-04)

11. Cria conta com nome válido → "Conta criada com sucesso" ✓
12. Navega para editar a conta → preenche → clica "Atualizar"
13. Network: POST /contas/{id} 405 "Method Not Allowed"
14. Snackbar: "Operação não permitida pelo servidor."
    ↑ Sintoma: edição falha

→ INVESTIGAÇÃO: Network → vê POST → Swagger mostra PUT
→ CORRIGE: http.post → http.put (BUG-02)

15. Edição funciona ✓
16. [BUG-05] saldoInicial enviado no body → ignorado silenciosamente pelo backend
    (pode não ser descoberto sem code review)
17. [BUG-03] se API ficar indisponível, spinner fica girando na lista
    (pode não ser descoberto sem teste de resiliência)
```

### Ordem natural de descoberta vs. ordem dos bugs

| Ordem de descoberta | Bug | Dificuldade de achar |
|---------------------|-----|---------------------|
| 1º | BUG-01 | Fácil (Network imediato) |
| 2º | BUG-06 | Fácil (botão não faz nada) |
| 3º | BUG-04 | Médio (erro vem do backend, não do frontend) |
| 4º | BUG-02 | Fácil (Network → 405) |
| 5º | BUG-03 | Médio (precisa simular falha de rede) |
| 6º | BUG-05 | Difícil (sem sintoma visível — só code review) |

---

## Gaps Funcionais (além dos bugs intencionais)

| Gap | Impacto | Tela afetada |
|-----|---------|-------------|
| Tipo exibido como enum cru ("CORRENTE" em vez de "Conta corrente") | Médio — UX ruim | Lista |
| Sem loading/disable no submit do formulário | Baixo — duplo-submit possível | Formulário |
| `carregarContas()` chamado após desativar, mas sem callback error | Baixo — estado inconsistente em erro | Lista |
| `consultarSaldo()` implementado mas não usado | Baixo — dead code | — |
| Tabela não mostra `saldoAtual` (só `saldoInicial`) | Médio — informação mais útil é saldo atual | Lista |

---

## Resumo: O que Funciona sem Nenhum Bug

| Funcionalidade | Status |
|----------------|--------|
| Exibir spinner enquanto carrega lista | ✅ |
| Exibir estado vazio (sem contas) | ✅ |
| Navegar para /contas/nova pelo botão | ✅ |
| Validação `required` e `maxLength` no nome | ✅ |
| Validação `required` no tipo | ✅ |
| Validação `min(0)` no saldo inicial | ✅ |
| Desabilitar saldoInicial no modo edição | ✅ |
| Diálogo de confirmação ao desativar | ✅ |
| Redirecionamento para /contas se ID não encontrado | ✅ |
| Snackbar de erro para todos os status HTTP | ✅ |
| Cancelar → volta para /contas | ✅ |
| `carregarContas()` após desativar (se API estiver ok) | ✅ |
