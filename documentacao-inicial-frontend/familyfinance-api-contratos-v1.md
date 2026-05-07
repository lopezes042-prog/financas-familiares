# FamilyFinance — Especificação da API e Contratos Back/Front

> **Versão:** 1.0 · Beta familiar  
> **Escopo:** Todas as operações HTTP da v1 — Spring MVC backend + Angular frontend.  
> **Idioma:** Português BR em código, mensagens, nomes e documentação.  
> **Base URL (desenvolvimento):** `http://localhost:8080`  
> **Frontend:** `http://localhost:4200`  
> **Autenticação:** nenhuma na v1. `familiaId` resolvido por contexto fixo de configuração.  
> **Documentação interativa:** `http://localhost:8080/swagger-ui.html`

---

## Sumário

1. [Visão Geral da API](#1-visão-geral-da-api)
2. [Convenções Globais](#2-convenções-globais)
3. [Formato de Erro Padrão](#3-formato-de-erro-padrão)
4. [CORS](#4-cors)
5. [Enumerações](#5-enumerações)
6. [Schemas de Dados](#6-schemas-de-dados)
7. [Endpoints — Contas](#7-endpoints--contas)
   - [GET /contas](#71-get-contas)
   - [GET /contas/{id}](#72-get-contasid)
   - [POST /contas](#73-post-contas)
   - [PUT /contas/{id}](#74-put-contasid)
   - [PATCH /contas/{id}/ativo](#75-patch-contasidativo)
   - [GET /contas/{id}/saldo](#76-get-contasidsaldo)
8. [Matriz de Contratos Back × Front](#8-matriz-de-contratos-back--front)
9. [Regras Transversais](#9-regras-transversais)
10. [Mapeamento de Status HTTP](#10-mapeamento-de-status-http)
11. [Ciclo de Vida de uma Requisição](#11-ciclo-de-vida-de-uma-requisição)
12. [Validações por Campo](#12-validações-por-campo)
13. [Exemplos Completos de Requisição e Resposta](#13-exemplos-completos-de-requisição-e-resposta)

---

## 1. Visão Geral da API

### 1.1 Arquitetura

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│   Angular (localhost:4200)      │        │   Spring Boot (localhost:8080)    │
│                                 │        │                                   │
│  ContaServico                   │        │  ContaController                  │
│    .listar()          ──GET───▶ │        │ ▶ ListarContasServico             │
│    .buscarPorId()     ──GET───▶ │        │ ▶ BuscarContaServico              │
│    .criar()           ──POST──▶ │  HTTP  │ ▶ CriarContaServico              │
│    .atualizar()       ──PUT───▶ │◀──────▶│ ▶ AtualizarContaServico          │
│    .alterarSituacao() ─PATCH──▶ │        │ ▶ AlterarSituacaoContaServico     │
│    .consultarSaldo()  ──GET───▶ │        │ ▶ SaldoContaServico               │
│                                 │        │                                   │
│  erroHttpInterceptor            │        │  TratadorGlobalDeExcecoes         │
│    (captura ErroResposta)       │        │  (produz ErroResposta)            │
└─────────────────────────────────┘        └──────────────────────────────────┘
```

### 1.2 Stack Técnica

| Lado | Tecnologia | Versão |
|---|---|---|
| Backend — Linguagem | Java | 21 |
| Backend — Framework | Spring Boot + Spring MVC | 3.x |
| Backend — Persistência | Spring Data JPA + Hibernate | — |
| Backend — Banco | PostgreSQL | 16 |
| Backend — Migrações | Flyway | — |
| Backend — Validação | Bean Validation (Jakarta) | — |
| Backend — Documentação | springdoc-openapi (Swagger UI) | — |
| Frontend — Framework | Angular | 18 |
| Frontend — HTTP | `@angular/common/http` (HttpClient) | — |
| Contrato HTTP | OpenAPI 3.1 (`especificacao-api.yaml`) | — |

### 1.3 Contexto Beta Single-Tenant (v1)

Não há autenticação na v1. O sistema opera com uma única família, cujo `familiaId` é resolvido por configuração:

```yaml
# application.yml
familyfinance:
  beta:
    familia-id: 00000000-0000-0000-0000-000000000001
```

O componente `ContextoFamilia` injeta esse valor em todos os serviços:

```java
@Component
public class ContextoFamilia {
    @Value("${familyfinance.beta.familia-id}")
    private UUID familiaId;

    public UUID obterFamiliaId() { return familiaId; }
}
```

> **Evolução v2:** `ContextoFamilia` passará a extrair o `familiaId` do token JWT, sem alterar nenhum serviço que já o consome via injeção.

---

## 2. Convenções Globais

### 2.1 Headers Obrigatórios em Toda Requisição com Body

```http
Content-Type: application/json
Accept: application/json
```

### 2.2 Formato de Datas e Horas

| Tipo | Formato | Exemplo |
|---|---|---|
| Data | `YYYY-MM-DD` (ISO 8601) | `2025-01-15` |
| Data e hora | `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601 UTC) | `2025-01-15T10:30:00Z` |
| Período | `AAAA-MM` | `2025-01` |

### 2.3 Formato de Valores Monetários

- Tipo JSON: `number` com precisão decimal
- Escala: 2 casas decimais (`15,2` no banco)
- Sem símbolo de moeda na API — formatação é responsabilidade do frontend
- Exemplos válidos: `1000.00`, `0.00`, `2500.50`, `-200.00` (saldo negativo é válido)

### 2.4 Identificadores

- Tipo: UUID v4
- Formato JSON: `string` com padrão `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Gerado pela **aplicação** via `UUID.randomUUID()` — nunca pelo banco
- Nunca aceitar `id` ou `familiaId` em request bodies

### 2.5 Campos Desconhecidos

Campos extras no request body são **ignorados silenciosamente** (`FAIL_ON_UNKNOWN_PROPERTIES = false`). Isso garante retrocompatibilidade quando o frontend envia campos que o backend ainda não conhece.

### 2.6 Paginação (v1)

Não há paginação nas listagens da v1. Todos os recursos retornam a coleção completa. Paginação será introduzida quando o volume justificar.

---

## 3. Formato de Erro Padrão

**Toda** resposta de erro da API — independente de origem, rota ou tipo — segue este formato JSON:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 422,
  "erro": "Regra de negócio violada",
  "mensagem": "Já existe uma conta com o nome 'Nubank' nesta família",
  "caminho": "/contas"
}
```

### 3.1 Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `timestamp` | string (ISO 8601 UTC) | Momento exato do erro |
| `status` | integer | Código HTTP repetido no body para facilitar parsing |
| `erro` | string | Categoria do erro — para log e debug |
| `mensagem` | string | **Mensagem legível ao usuário final** — exibida pelo frontend |
| `caminho` | string | Path da requisição que originou o erro |

### 3.2 Como o Frontend Consome

O `erroHttpInterceptor` do Angular lê `erro.error.mensagem` e exibe via `MatSnackBar`:

```typescript
// erro-http.interceptor.ts
function obterMensagemAmigavel(erro: HttpErrorResponse): string {
  if (erro.error?.mensagem) {
    return erro.error.mensagem;  // ← usa o campo `mensagem` do backend
  }
  // fallback por status:
  switch (erro.status) {
    case 0:   return 'Não foi possível conectar ao servidor.';
    case 404: return 'Recurso não encontrado.';
    case 405: return 'Operação não permitida pelo servidor.';
    case 422: return 'Dados inválidos.';
    case 500: return 'Erro interno do servidor.';
    default:  return 'Ocorreu um erro inesperado.';
  }
}
```

### 3.3 Categorias de Erro × Status HTTP

| Exceção Java | Status | Campo `erro` |
|---|---|---|
| `MethodArgumentNotValidException` | 400 | `"Erro de validação"` |
| `HttpMessageNotReadableException` | 400 | `"Requisição inválida"` |
| `MethodNotAllowedException` | 405 | `"Método não permitido"` |
| `RecursoNaoEncontradoExcecao` | 404 | `"Recurso não encontrado"` |
| `RegraDeNegocioExcecao` | 422 | `"Regra de negócio violada"` |
| `Exception` (genérica) | 500 | `"Erro interno do servidor"` |

### 3.4 Erros de Validação com Múltiplos Campos

Quando múltiplos campos falham na validação, `mensagem` lista todos separados por `"; "`:

```json
{
  "status": 400,
  "erro": "Erro de validação",
  "mensagem": "nome: O nome deve ter no mínimo 2 caracteres; saldoInicial: O saldo inicial não pode ser negativo"
}
```

---

## 4. CORS

O backend libera requisições cross-origin do frontend Angular em desenvolvimento local:

```
Origem permitida:  http://localhost:4200
Métodos:           GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers:           * (todos, em desenvolvimento)
Headers expostos:  Location
Cache preflight:   3600 segundos
```

**Implementação Java:**

```java
@Configuration
public class ConfiguracaoWeb implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registro) {
        registro.addMapping("/api/**")
            .allowedOrigins("http://localhost:4200")
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Location")
            .maxAge(3600);
    }
}
```

> **Atenção v2:** Em produção, substituir `allowedOrigins("http://localhost:4200")` pelo domínio real e restringir `allowedHeaders` para `Content-Type, Authorization`.

---

## 5. Enumerações

Todos os valores de enumeração são strings em maiúsculas. O frontend deve usar exatamente esses valores ao enviar e receber dados.

### 5.1 TipoConta

| Valor | Descrição | Exibição no Frontend |
|---|---|---|
| `CORRENTE` | Conta corrente bancária | "Conta corrente" |
| `POUPANCA` | Conta poupança | "Poupança" |
| `CARTAO_CREDITO` | Cartão de crédito | "Cartão de crédito" |
| `CARTEIRA` | Dinheiro em espécie / carteira física | "Carteira" |
| `INVESTIMENTO` | Conta de corretora / investimento | "Investimento" |

### 5.2 Enumerações Futuras (v1 — reservadas no modelo)

| Enum | Valores |
|---|---|
| `TipoTransacao` | `DESPESA`, `RECEITA`, `TRANSFERENCIA` |
| `RegraRecorrencia` | `DIARIA`, `SEMANAL`, `QUINZENAL`, `MENSAL`, `ANUAL` |
| `TipoInvestimento` | `RENDA_FIXA`, `RENDA_VARIAVEL`, `FUNDO`, `FII`, `CRIPTOMOEDA`, `PREVIDENCIA`, `OUTRO` |
| `TipoLancamentoInvestimento` | `APORTE`, `RESGATE`, `RENDIMENTO`, `SNAPSHOT` |
| `SituacaoMeta` | `EM_ANDAMENTO`, `CONCLUIDA`, `PAUSADA`, `CANCELADA` |
| `PerfilMembro` | `ADMIN`, `MEMBRO` |
| `PlanoFamilia` | `BETA`, `GRATIS`, `PRO` |

---

## 6. Schemas de Dados

### 6.1 ContaResposta

Retornado em todas as operações que devolvem uma conta.

```typescript
// TypeScript (frontend)
interface Conta {
  id: string;          // UUID
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;  // calculado dinamicamente — não armazenado
  cor?: string;        // HEX #RRGGBB ou null
  ativo: boolean;
}
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 1000.00,
  "saldoAtual": 2500.50,
  "cor": "#8A05BE",
  "ativo": true
}
```

```java
// Java (backend)
public record ContaResposta(
    UUID id,
    String nome,
    TipoConta tipo,
    BigDecimal saldoInicial,
    BigDecimal saldoAtual,
    String cor,
    Boolean ativo
) {}
```

### 6.2 CriarContaComando

Enviado pelo frontend ao criar uma conta. `id`, `ativo` e `familiaId` são **ignorados** mesmo se enviados.

```typescript
// TypeScript (frontend)
interface CriarContaComando {
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  cor?: string;
}
```

```json
{
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 1000.00,
  "cor": "#8A05BE"
}
```

```java
// Java (backend)
public record CriarContaComando(
    @NotBlank @Size(min = 2, max = 100)
    String nome,

    @NotNull
    TipoConta tipo,

    @NotNull @DecimalMin("0.00")
    BigDecimal saldoInicial,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    String cor
) {}
```

### 6.3 EditarContaComando

Enviado pelo frontend ao atualizar uma conta. `saldoInicial` **não está neste comando** — é imutável após criação.

```typescript
// TypeScript (frontend)
interface EditarContaComando {
  nome: string;
  tipo: TipoConta;
  cor?: string;
}
```

```json
{
  "nome": "Nubank Atualizado",
  "tipo": "CORRENTE",
  "cor": "#8A05BE"
}
```

```java
// Java (backend)
public record EditarContaComando(
    @NotBlank @Size(min = 2, max = 100)
    String nome,

    @NotNull
    TipoConta tipo,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$")
    String cor
) {}
```

### 6.4 AlterarSituacaoComando

Enviado pelo frontend ao desativar ou reativar uma conta.

```typescript
// TypeScript (frontend)
interface AlterarSituacaoComando {
  ativo: boolean;
}
```

```json
{ "ativo": false }
```

```java
// Java (backend)
public record AlterarSituacaoComando(
    @NotNull Boolean ativo
) {}
```

### 6.5 SaldoContaResposta

Retornado pelo endpoint dedicado de saldo.

```typescript
// TypeScript (frontend)
interface SaldoContaResposta {
  saldoAtual: number;
}
```

```json
{ "saldoAtual": 1450.00 }
```

```java
// Java (backend)
public record SaldoContaResposta(BigDecimal saldoAtual) {}
```

### 6.6 ErroResposta

Retornado em qualquer erro. Consumido pelo interceptor do Angular.

```typescript
// TypeScript (frontend — implícito via HttpErrorResponse)
interface ErroResposta {
  timestamp: string;  // ISO 8601
  status: number;
  erro: string;
  mensagem: string;   // exibido ao usuário
  caminho: string;
}
```

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 404,
  "erro": "Recurso não encontrado",
  "mensagem": "Conta não encontrada com id: abc-123",
  "caminho": "/contas/abc-123"
}
```

```java
// Java (backend)
public record ErroResposta(
    LocalDateTime timestamp,
    Integer status,
    String erro,
    String mensagem,
    String caminho
) {}
```

---

## 7. Endpoints — Contas

### 7.1 GET /contas

**Descrição:** Lista todas as contas ativas da família, com saldo calculado.

**Consumidor Angular:** `ContaServico.listar()` → `ListaContasComponent.ngOnInit()`

```typescript
// Frontend
listar(): Observable<Conta[]> {
  return this.http.get<Conta[]>(`${this.urlBase}/contas`);
}
```

#### Request

```http
GET /contas HTTP/1.1
Host: localhost:8080
Accept: application/json
```

Sem parâmetros, sem body.

#### Response — 200 OK

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "nome": "Bradesco",
    "tipo": "CORRENTE",
    "saldoInicial": 500.00,
    "saldoAtual": 1200.00,
    "cor": "#CC0000",
    "ativo": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "nome": "Carteira",
    "tipo": "CARTEIRA",
    "saldoInicial": 200.00,
    "saldoAtual": 150.00,
    "cor": null,
    "ativo": true
  }
]
```

#### Response — 200 OK (lista vazia)

```json
[]
```

#### Regras Aplicadas

| Regra | Detalhe |
|---|---|
| Filtro `ativo` | Retorna apenas `ativo = true` |
| Filtro família | Retorna apenas contas do `familiaId` do contexto |
| Ordenação | Por `nome` ASC |
| `saldoAtual` | Calculado: `saldoInicial + Σreceitas_efetivadas - Σdespesas_efetivadas` |
| Transações | Somente `efetivada = true` e `ativo = true` entram no cálculo |

#### Possíveis Status

| Status | Quando |
|---|---|
| 200 | Sucesso (mesmo se array vazio) |
| 500 | Erro interno |

---

### 7.2 GET /contas/{id}

**Descrição:** Busca uma conta específica pelo ID. Usado para pré-preencher o formulário de edição.

**Consumidor Angular:** `ContaServico.buscarPorId(id)` → `FormularioContaComponent.carregarConta()`

```typescript
// Frontend
buscarPorId(id: string): Observable<Conta> {
  return this.http.get<Conta>(`${this.urlBase}/contas/${id}`);
}
```

#### Request

```http
GET /contas/550e8400-e29b-41d4-a716-446655440001 HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Path Parameters

| Parâmetro | Tipo | Obrigatório |
|---|---|---|
| `id` | UUID string | sim |

#### Response — 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 1000.00,
  "saldoAtual": 2500.50,
  "cor": "#8A05BE",
  "ativo": true
}
```

#### Response — 404 Not Found

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 404,
  "erro": "Recurso não encontrado",
  "mensagem": "Conta não encontrada com id: 550e8400-e29b-41d4-a716-446655440001",
  "caminho": "/contas/550e8400-e29b-41d4-a716-446655440001"
}
```

#### Regras Aplicadas

| Regra | Detalhe |
|---|---|
| 404 para inativo | Conta com `ativo = false` retorna 404 |
| 404 para outra família | Conta de outra família retorna 404 (não revelar existência) |
| `saldoAtual` calculado | Mesmo cálculo de `GET /contas` |

#### Possíveis Status

| Status | Quando |
|---|---|
| 200 | Conta encontrada e ativa na família |
| 404 | ID inexistente, inativo, ou de outra família |
| 500 | Erro interno |

---

### 7.3 POST /contas

**Descrição:** Cria uma nova conta financeira para a família. Retorna a conta criada com `id` gerado e `saldoAtual = saldoInicial`.

**Consumidor Angular:** `ContaServico.criar(comando)` → `FormularioContaComponent.criar()`

```typescript
// Frontend
criar(comando: CriarContaComando): Observable<Conta> {
  return this.http.post<Conta>(`${this.urlBase}/contas`, comando);
}
```

#### Request

```http
POST /contas HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Accept: application/json

{
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 1000.00,
  "cor": "#8A05BE"
}
```

#### Request Body — Campos

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `nome` | string | **sim** | 2–100 caracteres, não vazio |
| `tipo` | enum | **sim** | Valor válido de `TipoConta` |
| `saldoInicial` | decimal | **sim** | ≥ 0.00 |
| `cor` | string | não | Regex `^#[0-9A-Fa-f]{6}$` ou ausente/null |

#### Response — 201 Created

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 1000.00,
  "saldoAtual": 1000.00,
  "cor": "#8A05BE",
  "ativo": true
}
```

#### Response — 400 Bad Request (validação)

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 400,
  "erro": "Erro de validação",
  "mensagem": "nome: O nome deve ter no mínimo 2 caracteres",
  "caminho": "/contas"
}
```

#### Response — 422 Unprocessable Entity (regra de negócio)

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 422,
  "erro": "Regra de negócio violada",
  "mensagem": "Já existe uma conta com o nome 'Nubank' nesta família",
  "caminho": "/contas"
}
```

#### Regras Aplicadas

| Regra | Detalhe |
|---|---|
| `familiaId` do contexto | Nunca do body — ignorado se enviado |
| `id` gerado | `UUID.randomUUID()` na aplicação |
| `ativo = true` | Sempre na criação |
| Nome único | Único por família (case-sensitive) |
| Campos extras ignorados | `FAIL_ON_UNKNOWN_PROPERTIES = false` |

#### Possíveis Status

| Status | Quando |
|---|---|
| 201 | Conta criada com sucesso |
| 400 | Campos inválidos |
| 422 | Nome duplicado na família |
| 500 | Erro interno |

---

### 7.4 PUT /contas/{id}

**Descrição:** Atualiza os campos editáveis de uma conta existente. `saldoInicial` é imutável após criação — se enviado no body, é ignorado. Operação de substituição total dos campos editáveis.

**Consumidor Angular:** `ContaServico.atualizar(id, comando)` → `FormularioContaComponent.atualizar()`

```typescript
// Frontend
atualizar(id: string, comando: EditarContaComando): Observable<Conta> {
  return this.http.put<Conta>(`${this.urlBase}/contas/${id}`, comando);
}
```

> **Bug intencional no projeto inicial:** o frontend gerado usa `this.http.post` em vez de `this.http.put`. A Analista Júnior deve identificar e corrigir.

#### Request

```http
PUT /contas/550e8400-e29b-41d4-a716-446655440001 HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Accept: application/json

{
  "nome": "Nubank Conta Pessoal",
  "tipo": "CORRENTE",
  "cor": "#9B1FBE"
}
```

#### Path Parameters

| Parâmetro | Tipo | Obrigatório |
|---|---|---|
| `id` | UUID string | sim |

#### Request Body — Campos

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `nome` | string | **sim** | 2–100 caracteres |
| `tipo` | enum | **sim** | Valor válido de `TipoConta` |
| `cor` | string | não | Regex HEX ou null para remover |

#### Response — 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nome": "Nubank Conta Pessoal",
  "tipo": "CORRENTE",
  "saldoInicial": 1000.00,
  "saldoAtual": 2500.50,
  "cor": "#9B1FBE",
  "ativo": true
}
```

#### Regras Aplicadas

| Regra | Detalhe |
|---|---|
| `saldoInicial` imutável | Ignorado mesmo se enviado no body |
| `id`, `ativo`, `familiaId` | Ignorados mesmo se enviados |
| 404 para inativo | Conta com `ativo = false` retorna 404 |
| Nome único | Exceto o próprio nome da conta sendo editada |
| `dataAtualizacao` | Atualizado em toda operação bem-sucedida |

#### Possíveis Status

| Status | Quando |
|---|---|
| 200 | Conta atualizada com sucesso |
| 400 | Campos inválidos |
| 404 | Conta não encontrada, inativa ou de outra família |
| 422 | Nome já pertence a outra conta da família |
| 500 | Erro interno |

---

### 7.5 PATCH /contas/{id}/ativo

**Descrição:** Ativa ou desativa uma conta (exclusão lógica). A conta não é removida do banco — apenas `ativo` é alterado. Retorna `204 No Content` sem body.

**Consumidor Angular:** `ContaServico.alterarSituacao(id, false)` → `ListaContasComponent.desativar()`

```typescript
// Frontend
alterarSituacao(id: string, ativo: boolean): Observable<void> {
  return this.http.patch<void>(`${this.urlBase}/contas/${id}/ativo`, { ativo });
}
```

#### Request — Desativar

```http
PATCH /contas/550e8400-e29b-41d4-a716-446655440001/ativo HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "ativo": false
}
```

#### Request — Reativar

```http
PATCH /contas/550e8400-e29b-41d4-a716-446655440001/ativo HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "ativo": true
}
```

#### Path Parameters

| Parâmetro | Tipo | Obrigatório |
|---|---|---|
| `id` | UUID string | sim |

#### Request Body

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `ativo` | boolean | **sim** | `true` ou `false` — tipo exato |

#### Response — 204 No Content

Sem body. O frontend recarrega a lista após receber o 204.

#### Response — 400 Bad Request (body inválido)

```json
{
  "status": 400,
  "erro": "Erro de validação",
  "mensagem": "ativo: Campo obrigatório",
  "caminho": "/contas/550e8400-e29b-41d4-a716-446655440001/ativo"
}
```

#### Response — 404 Not Found

```json
{
  "status": 404,
  "erro": "Recurso não encontrado",
  "mensagem": "Conta não encontrada com id: 550e8400-e29b-41d4-a716-446655440001",
  "caminho": "/contas/550e8400-e29b-41d4-a716-446655440001/ativo"
}
```

#### Regras Aplicadas

| Regra | Detalhe |
|---|---|
| Idempotência | Desativar conta já inativa retorna 204 (sem erro) |
| 404 | ID inexistente ou de outra família |
| Body obrigatório | Sem `ativo` no body → 400 |

#### Possíveis Status

| Status | Quando |
|---|---|
| 204 | Situação alterada (ou já estava no estado desejado) |
| 400 | Body inválido ou campo `ativo` ausente/tipo errado |
| 404 | Conta não encontrada ou de outra família |
| 500 | Erro interno |

---

### 7.6 GET /contas/{id}/saldo

**Descrição:** Retorna o saldo atual calculado de uma conta específica, sem recarregar todos os dados. Endpoint dedicado para consulta pontual de saldo.

**Consumidor Angular:** `ContaServico.consultarSaldo(id)` → exercício de melhoria da lista de contas.

```typescript
// Frontend
consultarSaldo(id: string): Observable<SaldoContaResposta> {
  return this.http.get<SaldoContaResposta>(`${this.urlBase}/contas/${id}/saldo`);
}
```

#### Request

```http
GET /contas/550e8400-e29b-41d4-a716-446655440001/saldo HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Path Parameters

| Parâmetro | Tipo | Obrigatório |
|---|---|---|
| `id` | UUID string | sim |

#### Response — 200 OK

```json
{
  "saldoAtual": 1450.00
}
```

#### Fórmula do Cálculo

```
saldoAtual = saldoInicial
           + SUM(valor WHERE tipo = 'RECEITA' AND efetivada = true AND ativo = true)
           - SUM(valor WHERE tipo = 'DESPESA' AND efetivada = true AND ativo = true)
```

Transações agendadas (`efetivada = false`) e excluídas logicamente (`ativo = false`) **não** entram no cálculo.

#### Casos Especiais

| Caso | Resultado |
|---|---|
| Conta sem movimentações | `saldoAtual = saldoInicial` |
| Saldo negativo | Valor negativo retornado normalmente (ex: `{ "saldoAtual": -200.00 }`) |
| `CARTAO_CREDITO` | Saldo representa a fatura: `saldoInicial - Σdespesas` (geralmente negativo) |

#### Possíveis Status

| Status | Quando |
|---|---|
| 200 | Saldo calculado com sucesso |
| 404 | Conta não encontrada, inativa ou de outra família |
| 500 | Erro interno |

---

## 8. Matriz de Contratos Back × Front

Mapeamento completo de cada chamada do frontend Angular para o correspondente no backend Spring Boot.

| Método Frontend | Chamada Angular | Endpoint | Método HTTP | Body Enviado | Resposta Esperada |
|---|---|---|---|---|---|
| `listar()` | `ContaServico.listar()` | `/contas` | GET | — | `Conta[]` |
| `buscarPorId(id)` | `ContaServico.buscarPorId(id)` | `/contas/{id}` | GET | — | `Conta` |
| `criar(comando)` | `ContaServico.criar(comando)` | `/contas` | POST | `CriarContaComando` | `Conta` (201) |
| `atualizar(id, cmd)` | `ContaServico.atualizar(id, cmd)` | `/contas/{id}` | PUT | `EditarContaComando` | `Conta` (200) |
| `alterarSituacao(id, ativo)` | `ContaServico.alterarSituacao(id, ativo)` | `/contas/{id}/ativo` | PATCH | `{ ativo: boolean }` | void (204) |
| `consultarSaldo(id)` | `ContaServico.consultarSaldo(id)` | `/contas/{id}/saldo` | GET | — | `SaldoContaResposta` |

### 8.1 Mapeamento de Interfaces TypeScript × Records Java

| TypeScript (frontend) | Java (backend) | Direção |
|---|---|---|
| `Conta` | `ContaResposta` | Backend → Frontend |
| `CriarContaComando` | `CriarContaComando` | Frontend → Backend |
| `EditarContaComando` | `EditarContaComando` | Frontend → Backend |
| `SaldoContaResposta` | `SaldoContaResposta` | Backend → Frontend |
| `{ ativo: boolean }` | `AlterarSituacaoComando` | Frontend → Backend |
| `(HttpErrorResponse).error` | `ErroResposta` | Backend → Frontend |

### 8.2 Campos Que Existem no Frontend mas Não São Enviados ao Backend

| Campo | Interface TS | Por que não enviado |
|---|---|---|
| `id` | `Conta` | Gerado pelo backend — nunca enviado em criação ou edição |
| `saldoAtual` | `Conta` | Calculado pelo backend — ignorado mesmo se enviado |
| `ativo` | `Conta` | Apenas lido — alterado via endpoint dedicado `/ativo` |
| `saldoInicial` | `EditarContaComando` | **Ausente** — imutável após criação |

### 8.3 Campos Que Existem no Backend mas Não Chegam ao Frontend

| Campo | Entidade Java | Por que não exposto |
|---|---|---|
| `familiaId` | `Conta` | Contexto interno — nunca exposto na API |
| `dataCriacao` | `Conta` | Auditoria interna — não relevante para a UI v1 |
| `dataAtualizacao` | `Conta` | Auditoria interna — não relevante para a UI v1 |

---

## 9. Regras Transversais

Aplicam-se a **todas** as operações sem exceção:

| ID | Regra |
|---|---|
| `RG-01` | Toda operação filtra por `familiaId` do contexto. `familiaId` nunca é aceito do cliente. |
| `RG-02` | Toda query padrão inclui `WHERE ativo = true`, exceto operações explicitamente sobre `ativo`. |
| `RG-03` | Respostas de erro seguem o `ErroResposta` definido na seção 3, sem exceção. |
| `RG-04` | `id` sempre gerado via `UUID.randomUUID()` na aplicação — nunca pelo banco. |
| `RG-05` | Campos desconhecidos no body são ignorados (`FAIL_ON_UNKNOWN_PROPERTIES = false`). |
| `RG-06` | Timestamps sempre em UTC (`ZoneOffset.UTC`). |
| `RG-07` | Conta de outra família retorna 404 — não revela existência de dados alheios. |
| `RG-08` | Exclusão sempre lógica (`ativo = false`) — nunca `DELETE` físico. |
| `RG-09` | Operações de escrita respondem com o recurso completo atualizado (exceto `PATCH /ativo` que retorna 204). |

---

## 10. Mapeamento de Status HTTP

Tabela de referência rápida para todos os status retornados pela API:

| Status | Texto | Quando ocorre |
|---|---|---|
| `200 OK` | Sucesso | `GET` e `PUT` bem-sucedidos |
| `201 Created` | Criado | `POST` bem-sucedido |
| `204 No Content` | Sem conteúdo | `PATCH /ativo` bem-sucedido |
| `400 Bad Request` | Requisição inválida | Validação de campos, body malformado, tipo errado |
| `404 Not Found` | Não encontrado | ID inexistente, conta inativa, ou conta de outra família |
| `405 Method Not Allowed` | Método não permitido | Método HTTP errado (ex: POST onde se espera PUT) |
| `422 Unprocessable Entity` | Entidade não processável | Regra de negócio violada (nome duplicado, etc.) |
| `500 Internal Server Error` | Erro interno | Exceção não tratada no servidor |

---

## 11. Ciclo de Vida de uma Requisição

### 11.1 Fluxo Completo — Frontend para o Banco

```
Angular Component
  │
  ▼
ContaServico.criar(comando)
  │  Observable<Conta> = this.http.post('/contas', comando)
  ▼
HttpClient Angular
  │  Adiciona headers Content-Type: application/json
  │  Serializa TypeScript → JSON
  ▼
erroHttpInterceptor
  │  (próxima chamada — passa adiante)
  ▼
  ──── HTTP POST /contas ────────────────────────────────────
  ▼
ConfiguracaoWeb (CORS)
  │  Valida Origin: http://localhost:4200 → permitido
  ▼
ContaController
  │  @PostMapping("/contas")
  │  @RequestBody CriarContaComando comando
  ▼
CriarContaServico.criar(comando)
  │  Extrai familiaId de ContextoFamilia
  │  Valida comando (Bean Validation via @Valid)
  │  Verifica unicidade do nome
  │  Cria entidade Conta com UUID.randomUUID()
  ▼
ContaRepositorio.save(conta)
  │  Persiste no PostgreSQL
  ▼
SaldoContaServico.calcular(id)
  │  Calcula saldoAtual via query
  ▼
ContaResposta (MapStruct)
  │  Entidade → DTO de resposta
  ▼
  ──── HTTP 201 Created ─────────────────────────────────────
  ▼
erroHttpInterceptor
  │  Sem erro — passa adiante
  ▼
HttpClient Angular
  │  Desserializa JSON → Conta (TypeScript)
  ▼
FormularioContaComponent.criar()
  │  Exibe snackbar "Conta criada com sucesso"
  │  Navega para /contas
  ▼
ListaContasComponent (nova rota)
  │  Recarrega lista
```

### 11.2 Fluxo de Erro — Propagação

```
CriarContaServico (lança RegraDeNegocioExcecao)
  ▼
TratadorGlobalDeExcecoes.tratarRegraDeNegocio()
  │  Cria ErroResposta { status: 422, mensagem: "..." }
  ▼
HTTP 422 com body ErroResposta
  ▼
erroHttpInterceptor (Angular)
  │  catchError: lê erro.error.mensagem
  │  snackBar.open("Já existe uma conta com o nome 'Nubank' nesta família")
  ▼
throwError() — componente ainda recebe e pode reagir
```

---

## 12. Validações por Campo

Tabela consolidada de todas as validações da entidade Conta:

| Campo | Operação | Regra | Mensagem de Erro | Status |
|---|---|---|---|---|
| `nome` | POST, PUT | Obrigatório | `"nome: Campo obrigatório"` | 400 |
| `nome` | POST, PUT | ≥ 2 caracteres | `"nome: O nome deve ter no mínimo 2 caracteres"` | 400 |
| `nome` | POST, PUT | ≤ 100 caracteres | `"nome: O nome deve ter no máximo 100 caracteres"` | 400 |
| `nome` | POST | Único na família | `"Já existe uma conta com o nome '{nome}' nesta família"` | 422 |
| `nome` | PUT | Único (exceto próprio) | `"Já existe uma conta com o nome '{nome}' nesta família"` | 422 |
| `tipo` | POST, PUT | Obrigatório | `"tipo: Campo obrigatório"` | 400 |
| `tipo` | POST, PUT | Valor do enum | `"tipo: Valor inválido"` | 400 |
| `saldoInicial` | POST | Obrigatório | `"saldoInicial: Campo obrigatório"` | 400 |
| `saldoInicial` | POST | ≥ 0.00 | `"saldoInicial: O saldo inicial não pode ser negativo"` | 400 |
| `cor` | POST, PUT | Regex `^#[0-9A-Fa-f]{6}$` | `"cor: Cor deve estar no formato HEX (#RRGGBB)"` | 400 |
| `ativo` | PATCH | Obrigatório | `"ativo: Campo obrigatório"` | 400 |
| `ativo` | PATCH | Boolean (não string) | `"ativo: Tipo inválido"` | 400 |

---

## 13. Exemplos Completos de Requisição e Resposta

### 13.1 Criar Conta — Sucesso

```http
POST /contas HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 2000.00,
  "cor": "#8A05BE"
}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56",
  "nome": "Nubank",
  "tipo": "CORRENTE",
  "saldoInicial": 2000.00,
  "saldoAtual": 2000.00,
  "cor": "#8A05BE",
  "ativo": true
}
```

### 13.2 Criar Conta — Nome Duplicado

```http
POST /contas HTTP/1.1
Content-Type: application/json

{ "nome": "Nubank", "tipo": "POUPANCA", "saldoInicial": 0.00 }
```

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 422,
  "erro": "Regra de negócio violada",
  "mensagem": "Já existe uma conta com o nome 'Nubank' nesta família",
  "caminho": "/contas"
}
```

### 13.3 Atualizar Conta — Sucesso

```http
PUT /contas/c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56 HTTP/1.1
Content-Type: application/json

{
  "nome": "Nubank Pessoal",
  "tipo": "CORRENTE",
  "cor": "#9B1FBE"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56",
  "nome": "Nubank Pessoal",
  "tipo": "CORRENTE",
  "saldoInicial": 2000.00,
  "saldoAtual": 3500.00,
  "cor": "#9B1FBE",
  "ativo": true
}
```

### 13.4 Desativar Conta — Sucesso

```http
PATCH /contas/c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56/ativo HTTP/1.1
Content-Type: application/json

{ "ativo": false }
```

```http
HTTP/1.1 204 No Content
```

### 13.5 Buscar Conta Inativa — 404

```http
GET /contas/c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56 HTTP/1.1
```

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "timestamp": "2025-01-15T10:35:00Z",
  "status": 404,
  "erro": "Recurso não encontrado",
  "mensagem": "Conta não encontrada com id: c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56",
  "caminho": "/contas/c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56"
}
```

### 13.6 Consultar Saldo

```http
GET /contas/c7f3a810-1b2c-4d5e-8f90-ab12cd34ef56/saldo HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "saldoAtual": 3500.00
}
```

### 13.7 Validação — Múltiplos Campos Inválidos

```http
POST /contas HTTP/1.1
Content-Type: application/json

{
  "nome": "A",
  "tipo": "TIPO_INVALIDO",
  "saldoInicial": -50.00
}
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "timestamp": "2025-01-15T10:40:00Z",
  "status": 400,
  "erro": "Erro de validação",
  "mensagem": "nome: O nome deve ter no mínimo 2 caracteres; tipo: Valor inválido; saldoInicial: O saldo inicial não pode ser negativo",
  "caminho": "/contas"
}
```

---

*Documento mantido junto aos repositórios. Toda mudança de contrato — novo campo, novo status, nova validação — deve ser refletida aqui antes de ser implementada.*  
*Referências: `familyfinance-especificacao.md`, `familyfinance-entidades-v1.md`, `openspec/CONTEXTO.md`, `especificacao-api.yaml`.*
