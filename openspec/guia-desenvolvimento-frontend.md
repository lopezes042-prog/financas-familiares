# Guia de Desenvolvimento Frontend — FamilyFinance API v1

> **Para:** Equipe Frontend (Angular)  
> **Gerado em:** 2026-05-13  
> **Estado:** Escopo atual — inclui o que está implementado + as duas changes em andamento

---

## Índice

1. [Estado atual do backend](#1-estado-atual-do-backend)
2. [URLs de acesso por ambiente](#2-urls-de-acesso-por-ambiente)
3. [Convenções gerais da API](#3-convenções-gerais-da-api)
4. [Formato de erro padrão](#4-formato-de-erro-padrão)
5. [API de Contas](#5-api-de-contas)
6. [API de Categorias](#6-api-de-categorias)
7. [API de Transações](#7-api-de-transações)
8. [Dependências entre recursos](#8-dependências-entre-recursos)
9. [O que muda com as changes em andamento](#9-o-que-muda-com-as-changes-em-andamento)
10. [Coordenação de entrega](#10-coordenação-de-entrega)

---

## 1. Estado atual do backend

O backend está em **v1 beta single-tenant** — sem autenticação, uma única família cadastrada. A v2 adicionará Spring Security + JWT.

### O que foi implementado (entregue)

| Change | Entregue | Conteúdo |
|--------|----------|----------|
| Projeto inicial + API de Contas | 2026-05-08 | 6 endpoints `/api/contas` |
| Correções técnicas | 2026-05-08 | CORS completo, mensagens em português, ambiente local |
| API de Categorias + Transações | 2026-05-11 | 5 endpoints `/api/categorias` + 6 endpoints `/api/transacoes` |
| Correção UUID + Logging SLF4J | 2026-05-11 | Correções internas — sem impacto nos contratos |

### O que está em andamento

| Change | Status | Impacto no frontend |
|--------|--------|---------------------|
| `observabilidade-actuator-micrometer` | Em desenvolvimento | Nenhum — novos endpoints são infraestrutura |
| `containerizacao-docker` | Em desenvolvimento | Muda como subir o ambiente (ver seção 9) |

---

## 2. URLs de acesso por ambiente

### Ambiente local (desenvolvimento — padrão atual)

```
Base URL:       http://localhost:8080
Swagger UI:     http://localhost:8080/swagger-ui.html
API prefix:     /api
```

Backend roda com `mvn spring-boot:run` usando H2 file-based (sem PostgreSQL instalado necessário).

### Ambiente Docker Compose (após change `containerizacao-docker`)

```
Base URL:       http://localhost:8080   ← mesma porta
Swagger UI:     http://localhost:8080/swagger-ui.html
Banco:          PostgreSQL 16 (via Docker)
```

O frontend **não precisa mudar nada** — a URL permanece `http://localhost:8080`. A diferença é o comando de inicialização do backend:

```bash
# Hoje (H2 local)
mvn spring-boot:run

# Após containerização (PostgreSQL via Docker)
cp .env.exemplo .env
docker compose up --build
```

### Configuração no Angular

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.familyfinance.com.br'  // futuro — ainda não existe
};
```

---

## 3. Convenções gerais da API

### Headers obrigatórios

```
Content-Type: application/json
Accept: application/json
```

### CORS configurado

O backend já permite requisições de `http://localhost:4200`:

```
Origens permitidas: http://localhost:4200
Métodos:            GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers:            todos (allowedHeaders: *)
Exposto:            Location (útil após POST 201)
```

Nenhuma configuração adicional necessária no Angular para desenvolvimento local.

### Identificadores

Todos os IDs são **UUID v4** em formato string: `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`.

### Timestamps

Todos os timestamps são retornados em **ISO-8601 UTC**:
```
"2026-05-13T14:30:00.000Z"
```

### Datas de lançamento

Transações usam formato `"yyyy-MM-dd"` (sem hora):
```
"2026-05-13"
```

### Campos extras no body

O backend **ignora silenciosamente** campos desconhecidos em POST/PUT — nunca retorna 400 por isso. Útil para evolução incremental do frontend.

### Campos somente leitura

Os campos `id`, `ativo`, `familiaId`, `dataCriacao`, `dataAtualizacao` são sempre ignorados quando enviados em POST ou PUT — o backend os gera ou controla internamente.

### Paginação (apenas transações)

`GET /api/transacoes` retorna `PaginaResposta<T>` — não um array simples. Os dados ficam em `.conteudo`.

---

## 4. Formato de erro padrão

Todos os erros da API seguem o mesmo schema, sem exceção:

```typescript
interface ErroResposta {
  timestamp: string;   // ISO-8601 UTC
  status: number;      // código HTTP
  erro: string;        // categoria do erro (para debug)
  mensagem: string;    // exibir ao usuário
  caminho: string;     // path da requisição
}
```

**Exemplo:**
```json
{
  "timestamp": "2026-05-13T14:30:00.000Z",
  "status": 422,
  "erro": "Regra de negócio violada",
  "mensagem": "Já existe uma conta com o nome 'Nubank' nesta família",
  "caminho": "/api/contas"
}
```

### Tabela de status e significados

| Status | `erro` | Quando ocorre | Ação sugerida no frontend |
|--------|--------|---------------|---------------------------|
| 400 | "Erro de validação" | Campo obrigatório faltando, tipo inválido, tamanho errado | Exibir `mensagem` próximo ao campo |
| 404 | "Recurso não encontrado" | ID não existe, recurso inativo, ou de outra família | Redirecionar para lista |
| 405 | "Método não permitido" | Método HTTP errado | Erro de programação — corrigir chamada |
| 422 | "Regra de negócio violada" | Nome duplicado, conta inativa referenciada, etc. | Exibir `mensagem` ao usuário |
| 500 | "Erro interno do servidor" | Exceção não tratada | Exibir mensagem genérica, registrar no console |

> **Nunca** leia campos além de `mensagem` para exibir ao usuário. Os demais campos são para diagnóstico técnico.

### Interceptor de erros sugerido

```typescript
// erro-http.interceptor.ts
@Injectable()
export class ErroHttpInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((erro: HttpErrorResponse) => {
        const mensagem = erro.error?.mensagem ?? mensagemGenerica(erro.status);
        if (erro.status !== 404) {  // 404 geralmente é tratado na própria tela
          this.snackBar.open(mensagem, 'Fechar', { duration: 5000 });
        }
        return throwError(() => erro);
      })
    );
  }
}

function mensagemGenerica(status: number): string {
  if (status === 0) return 'Servidor indisponível. Verifique sua conexão.';
  if (status >= 500) return 'Ocorreu um erro inesperado. Tente novamente.';
  return 'Operação não permitida.';
}
```

---

## 5. API de Contas

### Endpoints

| Método | Path | Status sucesso | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/contas` | 200 | Lista contas ativas com saldo calculado, ordenadas por nome |
| GET | `/api/contas/{id}` | 200 | Busca conta por ID |
| POST | `/api/contas` | 201 | Cria nova conta |
| PUT | `/api/contas/{id}` | 200 | Atualiza nome, tipo e cor |
| PATCH | `/api/contas/{id}/ativo` | 204 | Ativa ou desativa conta |
| GET | `/api/contas/{id}/saldo` | 200 | Consulta saldo atual isolado |

### Interfaces TypeScript

```typescript
type TipoConta = 'CORRENTE' | 'POUPANCA' | 'CARTAO_CREDITO' | 'CARTEIRA' | 'INVESTIMENTO';

// Resposta padrão — GET /api/contas e GET /api/contas/{id}
interface Conta {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;   // calculado pelo backend — nunca enviar
  cor: string | null;   // #RRGGBB ou null
  ativo: boolean;
}

// POST /api/contas
interface CriarContaComando {
  nome: string;         // 2–100 caracteres, obrigatório
  tipo: TipoConta;      // obrigatório
  saldoInicial: number; // >= 0.00, obrigatório
  cor?: string;         // #RRGGBB, opcional
}

// PUT /api/contas/{id}
interface EditarContaComando {
  nome: string;         // 2–100 caracteres, obrigatório
  tipo: TipoConta;      // obrigatório
  cor?: string | null;  // null remove a cor
}

// PATCH /api/contas/{id}/ativo  (compartilhado com categorias)
interface AlterarSituacaoComando {
  ativo: boolean;
}

// GET /api/contas/{id}/saldo
interface SaldoContaResposta {
  saldoAtual: number;
}
```

### Serviço Angular

```typescript
@Injectable({ providedIn: 'root' })
export class ContaServico {
  private readonly urlBase = `${environment.apiUrl}/api/contas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Conta[]> {
    return this.http.get<Conta[]>(this.urlBase);
  }

  buscarPorId(id: string): Observable<Conta> {
    return this.http.get<Conta>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarContaComando): Observable<Conta> {
    return this.http.post<Conta>(this.urlBase, comando);
  }

  atualizar(id: string, comando: EditarContaComando): Observable<Conta> {
    return this.http.put<Conta>(`${this.urlBase}/${id}`, comando);
  }

  alterarSituacao(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/ativo`, { ativo });
  }

  consultarSaldo(id: string): Observable<SaldoContaResposta> {
    return this.http.get<SaldoContaResposta>(`${this.urlBase}/${id}/saldo`);
  }
}
```

### Regras de negócio importantes

- `saldoAtual` é **calculado** — inclui apenas transações com `efetivada = true` e `ativo = true`
- `saldoInicial` é **imutável** após a criação — ausente no `EditarContaComando`
- `PATCH /ativo` retorna **204 sem body** — recarregar a lista após receber
- Conta inativa (ativo = false) retorna **404** — não "conta inativa" explicitamente
- `cor` aceita somente formato `#RRGGBB` (6 dígitos hexadecimais)

### Erros específicos

| Status | Contexto | Mensagem típica |
|--------|----------|-----------------|
| 422 | POST | "Já existe uma conta com o nome 'X' nesta família" |
| 404 | GET/PUT/PATCH | Conta não encontrada ou inativa |

---

## 6. API de Categorias

### Endpoints

| Método | Path | Status sucesso | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/categorias` | 200 | Lista categorias ativas, ordenadas por nome |
| GET | `/api/categorias/{id}` | 200 | Busca categoria por ID |
| POST | `/api/categorias` | 201 | Cria nova categoria |
| PUT | `/api/categorias/{id}` | 200 | Atualiza nome, tipo, ícone e cor |
| PATCH | `/api/categorias/{id}/ativo` | 204 | Ativa ou desativa categoria |

> `GET /api/categorias` retorna **array simples** — sem paginação. Volume esperado < 50 itens.

### Interfaces TypeScript

```typescript
type TipoCategoria = 'RECEITA' | 'DESPESA';

// Resposta padrão
interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  icone: string | null;
  cor: string | null;   // #RRGGBB ou null
  ativo: boolean;
}

// POST /api/categorias
interface CriarCategoriaComando {
  nome: string;           // 2–100 caracteres, obrigatório
  tipo: TipoCategoria;    // obrigatório
  icone?: string;         // max 50 caracteres, opcional
  cor?: string;           // #RRGGBB, opcional
}

// PUT /api/categorias/{id}
interface EditarCategoriaComando {
  nome: string;
  tipo: TipoCategoria;
  icone?: string | null;  // null remove o ícone
  cor?: string | null;    // null remove a cor
}
```

### Serviço Angular

```typescript
@Injectable({ providedIn: 'root' })
export class CategoriaServico {
  private readonly urlBase = `${environment.apiUrl}/api/categorias`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.urlBase);
  }

  buscarPorId(id: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarCategoriaComando): Observable<Categoria> {
    return this.http.post<Categoria>(this.urlBase, comando);
  }

  atualizar(id: string, comando: EditarCategoriaComando): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.urlBase}/${id}`, comando);
  }

  alterarSituacao(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/ativo`, { ativo });
  }
}
```

### Regras de negócio importantes

- O campo `tipo` da categoria deve coincidir com o `tipo` da transação que a referencia — o frontend deve filtrar o seletor de categorias pelo tipo da transação sendo criada
- `PATCH /ativo` retorna **204 sem body**
- Categoria inativa retorna **404** quando buscada diretamente

### Erros específicos

| Status | Mensagem típica |
|--------|-----------------|
| 422 | "Já existe uma categoria com o nome 'X' nesta família" |

---

## 7. API de Transações

### Endpoints

| Método | Path | Status sucesso | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/transacoes` | 200 | Lista com filtros e paginação |
| GET | `/api/transacoes/{id}` | 200 | Busca por ID |
| POST | `/api/transacoes` | 201 | Cria nova transação |
| PUT | `/api/transacoes/{id}` | 200 | Atualiza todos os campos editáveis |
| PATCH | `/api/transacoes/{id}/ativo` | 204 | Ativa ou desativa |
| PATCH | `/api/transacoes/{id}/efetivar` | 204 | Confirma ou desfaz confirmação |

### Interfaces TypeScript

```typescript
type TipoTransacao = 'RECEITA' | 'DESPESA';

// Resumos embutidos na resposta
interface ContaResumo {
  id: string;
  nome: string;
}

interface CategoriaResumo {
  id: string;
  nome: string;
}

// Resposta padrão de transação
interface Transacao {
  id: string;
  conta: ContaResumo;                // sempre presente
  categoria: CategoriaResumo | null; // null se não categorizada
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;            // "yyyy-MM-dd"
  efetivada: boolean;
  ativo: boolean;
}

// Wrapper de paginação — retornado por GET /api/transacoes
interface PaginaResposta<T> {
  conteudo: T[];          // os dados ficam aqui, não na raiz
  pagina: number;         // 0-indexed
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  ultima: boolean;        // true = não há próxima página
}

// POST /api/transacoes
interface CriarTransacaoComando {
  contaId: string;              // UUID, obrigatório — conta ativa
  categoriaId?: string | null;  // UUID, opcional — categoria ativa
  descricao: string;            // 1–200 caracteres, obrigatório
  valor: number;                // > 0, obrigatório
  tipo: TipoTransacao;          // obrigatório
  dataLancamento: string;       // "yyyy-MM-dd", obrigatório
  efetivada: boolean;           // obrigatório
}

// PUT /api/transacoes/{id}
interface EditarTransacaoComando {
  contaId: string;
  categoriaId?: string | null;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;
  efetivada: boolean;
}

// PATCH /api/transacoes/{id}/efetivar
interface EfetivarTransacaoComando {
  efetivada: boolean;
}
```

### Filtros da listagem

```typescript
interface FiltrosTransacao {
  contaId?: string;         // UUID
  categoriaId?: string;     // UUID
  efetivada?: boolean;
  tipo?: TipoTransacao;
  dataInicio?: string;      // "yyyy-MM-dd" inclusive
  dataFim?: string;         // "yyyy-MM-dd" inclusive
  pagina?: number;          // default 0
  tamanho?: number;         // default 20
}
```

> **Atenção:** `efetivada` como boolean via `HttpParams` precisa ser convertido para string: `String(true)` → `"true"`.

### Serviço Angular

```typescript
@Injectable({ providedIn: 'root' })
export class TransacaoServico {
  private readonly urlBase = `${environment.apiUrl}/api/transacoes`;

  constructor(private http: HttpClient) {}

  listar(filtros: FiltrosTransacao = {}): Observable<PaginaResposta<Transacao>> {
    const paramsObj: Record<string, string> = {};
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null) {
        paramsObj[chave] = String(valor);
      }
    });
    return this.http.get<PaginaResposta<Transacao>>(this.urlBase, {
      params: new HttpParams({ fromObject: paramsObj })
    });
  }

  buscarPorId(id: string): Observable<Transacao> {
    return this.http.get<Transacao>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarTransacaoComando): Observable<Transacao> {
    return this.http.post<Transacao>(this.urlBase, comando);
  }

  atualizar(id: string, comando: EditarTransacaoComando): Observable<Transacao> {
    return this.http.put<Transacao>(`${this.urlBase}/${id}`, comando);
  }

  alterarSituacao(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/ativo`, { ativo });
  }

  efetivar(id: string, efetivada: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/efetivar`, { efetivada });
  }
}
```

### Regras de negócio importantes

**Impacto no saldo:**

```
efetivada = true  → entra no cálculo de saldoAtual das contas
efetivada = false → transação "planejada" — não afeta saldo
```

Após qualquer operação que possa afetar o saldo (criar, editar, efetivar, desativar), recarregar a conta:

```typescript
// Após operar em transação da contaId:
this.contaServico.buscarPorId(contaId).subscribe(conta => {
  this.contaAtual = conta; // saldoAtual já atualizado
});
```

**Paginação:**

```typescript
// Os dados NÃO estão na raiz — estão em .conteudo
this.transacaoServico.listar({ pagina: 0, tamanho: 20 }).subscribe(pagina => {
  this.transacoes = pagina.conteudo;
  this.total = pagina.totalItens;
  this.ultimaPagina = pagina.ultima;
});

// Próxima página:
this.transacaoServico.listar({ pagina: this.paginaAtual + 1, tamanho: 20 });
```

**Categoria pode ser null:**

```html
<!-- Sempre verificar antes de acessar -->
{{ transacao.categoria?.nome ?? 'Sem categoria' }}
```

**PATCH retorna 204:**

`PATCH /ativo` e `PATCH /efetivar` retornam **204 sem body** — não tentar fazer parse da resposta.

### Erros específicos

| Status | Mensagem típica |
|--------|-----------------|
| 422 | "Conta não encontrada ou inativa" |
| 422 | "Categoria não encontrada ou inativa" |
| 404 | Transação não encontrada ou inativa |

---

## 8. Dependências entre recursos

```
┌─────────────────────────────────────────────────────────────┐
│                    Fluxo de criação                         │
│                                                             │
│   1. Criar/listar Contas                                    │
│      GET /api/contas → popular seletor de conta             │
│                                                             │
│   2. Criar/listar Categorias                                │
│      GET /api/categorias → popular seletor de categoria     │
│      (filtrar por tipo = tipo da transação)                 │
│                                                             │
│   3. Criar Transação                                        │
│      POST /api/transacoes                                   │
│        contaId    → da conta selecionada em (1)             │
│        categoriaId → da categoria selecionada em (2)        │
│                                                             │
│   4. Saldo atualizado automaticamente                       │
│      GET /api/contas/{contaId} → saldoAtual recalculado     │
└─────────────────────────────────────────────────────────────┘
```

**Seletor de categorias:** filtrar pelo tipo da transação — mostrar apenas categorias `RECEITA` em transações de receita e `DESPESA` em transações de despesa:

```typescript
this.categoriaServico.listar().subscribe(categorias => {
  this.categoriasFiltradas = categorias.filter(c => c.tipo === this.tipoTransacao);
});
```

**Conta inativa não pode receber transações:** ao criar/editar transação, o backend retorna 422 se a conta estiver inativa. No frontend, o seletor deve oferecer apenas contas com `ativo = true`.

---

## 9. O que muda com as changes em andamento

### Change: `observabilidade-actuator-micrometer`

**Impacto no frontend: nenhum.**

Adição de Spring Boot Actuator e Prometheus ao backend. Novos endpoints são exclusivamente para infraestrutura:

```
/actuator/health          → saúde da aplicação (para DevOps)
/actuator/health/liveness → liveness probe (para Kubernetes futuro)
/actuator/health/readiness→ readiness probe (para Kubernetes futuro)
/actuator/prometheus      → métricas para Prometheus (para monitoramento)
/actuator/info            → versão do build
```

> **O frontend NÃO deve consumir endpoints `/actuator/**`** — são para infraestrutura, não para a aplicação.

Nenhum contrato de `/api/**` é alterado.

---

### Change: `containerizacao-docker`

**Impacto no frontend: como iniciar o backend muda.**

A API continua em `http://localhost:8080` — sem alteração de URL ou contrato. A mudança é operacional: o backend passa a poder ser iniciado via Docker Compose com PostgreSQL, em vez de H2.

**Como subir o ambiente após esta change:**

```bash
# No repositório do backend:
cp .env.exemplo .env      # apenas na primeira vez
docker compose up --build

# Frontend continua em:
ng serve                  # http://localhost:4200
# Chamando o backend em:
# http://localhost:8080   (agora com PostgreSQL atrás)
```

**Por que isso importa para o frontend:**

O banco PostgreSQL começa vazio (só com os dados de seed). Se o frontend tiver testes ou fixtures que assumem dados específicos, podem precisar de ajuste quando o ambiente Docker for usado.

**Mudança no logback:** o perfil `prod` (usado no Docker) para de gravar arquivo de log e passa a usar apenas stdout. Isso não afeta o frontend.

---

## 10. Coordenação de entrega

### Escopo atual do backend (completo após as duas changes)

```
Módulo          │ Endpoints │ Status
────────────────┼───────────┼─────────────────────────────
Contas          │ 6         │ Implementado ✓
Categorias      │ 5         │ Implementado ✓
Transações      │ 6         │ Implementado ✓
Observabilidade │ —         │ Em desenvolvimento (infra)
Containerização │ —         │ Em desenvolvimento (infra)
────────────────┼───────────┼─────────────────────────────
Total API       │ 17        │ Todos prontos para consumo
```

### O que o frontend pode implementar agora

Todos os 17 endpoints estão disponíveis e estáveis. O frontend pode desenvolver:

- [x] Tela de listagem e gestão de contas
- [x] Tela de listagem e gestão de categorias
- [x] Tela de extrato / listagem de transações (com paginação e filtros)
- [x] Formulário de criação e edição de transação (com seletor de conta e categoria)
- [x] Ação de efetivar/desfazer transação
- [x] Visualização de saldo calculado por conta

### O que não existe ainda (pós-v1)

Não há endpoints para:

- Autenticação (login, JWT) — Spring Security v2
- Múltiplas famílias / multi-tenant
- Relatórios e resumos mensais
- Subcategorias
- Investimentos e metas
- Membros da família

### Referência rápida — todos os endpoints

```
GET    /api/contas
GET    /api/contas/{id}
POST   /api/contas
PUT    /api/contas/{id}
PATCH  /api/contas/{id}/ativo
GET    /api/contas/{id}/saldo

GET    /api/categorias
GET    /api/categorias/{id}
POST   /api/categorias
PUT    /api/categorias/{id}
PATCH  /api/categorias/{id}/ativo

GET    /api/transacoes              ?contaId &categoriaId &efetivada &tipo &dataInicio &dataFim &pagina &tamanho
GET    /api/transacoes/{id}
POST   /api/transacoes
PUT    /api/transacoes/{id}
PATCH  /api/transacoes/{id}/ativo
PATCH  /api/transacoes/{id}/efetivar
```

### Documentação interativa

```
http://localhost:8080/swagger-ui.html
```

Todos os endpoints estão documentados no Swagger com exemplos de request/response. Use para explorar e testar endpoints sem precisar do frontend pronto.
