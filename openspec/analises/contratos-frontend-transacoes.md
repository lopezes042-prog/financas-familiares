# Contratos de API — Categorias e Transações (v1)

**Base URL dev:** `http://localhost:8080`  
**Documentação interativa:** `http://localhost:8080/swagger-ui.html`  
**Content-Type:** `application/json`

---

## Endpoints

### Categorias

| Método | Path | Status sucesso | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/categorias` | 200 | Lista categorias ativas, ordenadas por nome |
| GET | `/api/categorias/{id}` | 200 | Busca categoria por ID |
| POST | `/api/categorias` | 201 | Cria nova categoria |
| PUT | `/api/categorias/{id}` | 200 | Atualiza nome, tipo, ícone e cor |
| PATCH | `/api/categorias/{id}/ativo` | 204 | Ativa ou desativa categoria |

### Transações

| Método | Path | Status sucesso | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/transacoes` | 200 | Lista transações com filtros e paginação |
| GET | `/api/transacoes/{id}` | 200 | Busca transação por ID |
| POST | `/api/transacoes` | 201 | Cria nova transação |
| PUT | `/api/transacoes/{id}` | 200 | Atualiza todos os campos editáveis |
| PATCH | `/api/transacoes/{id}/ativo` | 204 | Ativa ou desativa transação |
| PATCH | `/api/transacoes/{id}/efetivar` | 204 | Confirma ou desfaz confirmação |

---

## Interfaces TypeScript

```typescript
// ─── Enums ────────────────────────────────────────────────────────────────────

type TipoCategoria = 'RECEITA' | 'DESPESA';
type TipoTransacao = 'RECEITA' | 'DESPESA';

// ─── Categorias ───────────────────────────────────────────────────────────────

// Resposta padrão de categoria (GET e escritas bem-sucedidas)
interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  icone: string | null;
  cor: string | null;   // formato HEX: #RRGGBB, ou null
  ativo: boolean;
}

// Body do POST /api/categorias
interface CriarCategoriaComando {
  nome: string;         // 2–100 caracteres, obrigatório
  tipo: TipoCategoria;  // obrigatório
  icone?: string;       // opcional, max 50 caracteres
  cor?: string;         // opcional, #RRGGBB
}

// Body do PUT /api/categorias/{id}
interface EditarCategoriaComando {
  nome: string;
  tipo: TipoCategoria;
  icone?: string | null;  // enviar null para remover
  cor?: string | null;    // enviar null para remover
}

// ─── Transações ───────────────────────────────────────────────────────────────

// Objetos embutidos na resposta de transação
interface ContaResumo {
  id: string;
  nome: string;
}

interface CategoriaResumo {
  id: string;
  nome: string;
}

// Resposta padrão de transação — conta e categoria sempre embutidas
interface Transacao {
  id: string;
  conta: ContaResumo;              // sempre presente
  categoria: CategoriaResumo | null; // null se não categorizada
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;          // formato: "yyyy-MM-dd"
  efetivada: boolean;              // true = impacta saldo; false = planejada
  ativo: boolean;
}

// Wrapper de paginação — retornado por GET /api/transacoes
interface PaginaResposta<T> {
  conteudo: T[];
  pagina: number;       // 0-indexed
  tamanho: number;      // itens por página
  totalItens: number;
  totalPaginas: number;
  ultima: boolean;      // true se for a última página
}

// Body do POST /api/transacoes
interface CriarTransacaoComando {
  contaId: string;             // UUID, obrigatório — conta ativa da família
  categoriaId?: string | null; // UUID opcional — categoria ativa
  descricao: string;           // 1–200 caracteres, obrigatório
  valor: number;               // > 0, obrigatório
  tipo: TipoTransacao;         // obrigatório
  dataLancamento: string;      // "yyyy-MM-dd", obrigatório
  efetivada: boolean;          // obrigatório — true para registros passados, false para planejados
}

// Body do PUT /api/transacoes/{id}
interface EditarTransacaoComando {
  contaId: string;             // todos os campos reeditar, inclusive contaId e tipo
  categoriaId?: string | null;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;
  efetivada: boolean;
}

// Body do PATCH /api/transacoes/{id}/efetivar
interface EfetivarTransacaoComando {
  efetivada: boolean;  // obrigatório
}

// Body do PATCH /api/categorias/{id}/ativo  e  PATCH /api/transacoes/{id}/ativo
// (mesmo AlterarSituacaoComando já usado em Contas)
interface AlterarSituacaoComando {
  ativo: boolean;      // obrigatório
}

// ─── Filtros de listagem de transações ────────────────────────────────────────

interface FiltrosTransacao {
  contaId?: string;         // UUID — filtrar por conta
  categoriaId?: string;     // UUID — filtrar por categoria
  efetivada?: boolean;      // filtrar por estado de confirmação
  tipo?: TipoTransacao;     // 'RECEITA' | 'DESPESA'
  dataInicio?: string;      // "yyyy-MM-dd" — data de lançamento mínima (inclusive)
  dataFim?: string;         // "yyyy-MM-dd" — data de lançamento máxima (inclusive)
  pagina?: number;          // default 0
  tamanho?: number;         // default 20
}

// ─── Erros (igual a Contas) ───────────────────────────────────────────────────

interface ErroResposta {
  timestamp: string;  // ISO-8601 UTC
  status: number;
  erro: string;
  mensagem: string;   // exibir ao usuário
  caminho: string;
}
```

---

## Exemplo de serviços Angular

### CategoriaServico

```typescript
// categoria.servico.ts
@Injectable({ providedIn: 'root' })
export class CategoriaServico {
  private readonly urlBase = 'http://localhost:8080/api/categorias';

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

### TransacaoServico

```typescript
// transacao.servico.ts
@Injectable({ providedIn: 'root' })
export class TransacaoServico {
  private readonly urlBase = 'http://localhost:8080/api/transacoes';

  constructor(private http: HttpClient) {}

  listar(filtros: FiltrosTransacao = {}): Observable<PaginaResposta<Transacao>> {
    // Remover entradas undefined para não enviar query params vazios
    const paramsObj: Record<string, string> = {};
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null) {
        paramsObj[chave] = String(valor);
      }
    });
    const params = new HttpParams({ fromObject: paramsObj });
    return this.http.get<PaginaResposta<Transacao>>(this.urlBase, { params });
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

---

## Tratamento de erros

```typescript
function obterMensagem(erro: HttpErrorResponse): string {
  return erro.error?.mensagem ?? mensagemGenerica(erro.status);
}
```

| Status | Contexto | Significado |
|--------|---------|-------------|
| 400 | Categoria / Transação | Campo inválido — ver `mensagem` para detalhes |
| 404 | Categoria / Transação | Não encontrada, inativa ou de outra família |
| 422 | Categoria | Nome duplicado na família |
| 422 | Transação | Conta não encontrada ou inativa / Categoria não encontrada ou inativa |
| 500 | Todos | Erro interno |

---

## Fluxo de dependências entre recursos

```
┌─────────────┐       ┌─────────────┐
│    Conta    │◀──────│  Transação  │
│ (já existe) │       │  contaId    │
└─────────────┘       └──────┬──────┘
                             │ categoriaId (opcional)
                      ┌──────▼──────┐
                      │  Categoria  │
                      │ (este PR)   │
                      └─────────────┘
```

- Para criar uma transação categorizada: primeiro listar `GET /api/categorias` para popular o seletor
- O seletor de categorias deve filtrar pelo mesmo `tipo` da transação (RECEITA mostra apenas categorias RECEITA, e vice-versa)
- `contaId` é obtido a partir do estado atual da app (conta selecionada ou listagem de contas)

---

## Impacto no saldo de conta

`efetivada = true` → transação entra no cálculo de `saldoAtual` em `GET /api/contas/{id}` e `GET /api/contas`  
`efetivada = false` → transação **não** impacta o saldo (comportamento de "planejado/agendado")

Após criar, editar, desativar ou efetivar uma transação, recarregar a conta correspondente para atualizar o saldo exibido:

```typescript
// Após operação em transação da contaId:
this.contaServico.buscarPorId(contaId).subscribe(conta => {
  this.contaAtual = conta; // saldoAtual já atualizado pelo backend
});
```

---

## Paginação

`GET /api/transacoes` **não retorna um array simples** — retorna `PaginaResposta<Transacao>`.  
Os dados estão em `.conteudo`, não na raiz do objeto.

```typescript
// Acessar os itens:
resposta.conteudo       // Transacao[]
resposta.totalItens     // número total (para "Exibindo X de Y")
resposta.ultima         // true se não há próxima página
resposta.totalPaginas   // para gerar navegação numérica
```

Próxima página: incrementar `pagina` no objeto de filtros e chamar `listar()` novamente.

---

## Notas

- `GET /api/categorias` retorna lista simples (sem paginação) — volume esperado pequeno
- `categoria` na resposta de transação pode ser `null` — sempre verificar antes de acessar `categoria.nome`
- `dataLancamento` vem como `string` no formato `"yyyy-MM-dd"` — converter para exibição com `DatePipe` ou `date-fns`
- `contaId` e `categoriaId` nos comandos são **UUIDs** (string), não nomes
- PATCH `/ativo` e PATCH `/efetivar` retornam **204 sem body** — recarregar dados após receber
- `id`, `ativo`, `familiaId` são ignorados em POST e PUT mesmo se enviados
- Campos extras no body são ignorados silenciosamente pelo backend
- O filtro `efetivada` no `listar()` precisa ser enviado como string `"true"` ou `"false"` via HttpParams — o helper no `TransacaoServico` acima cuida disso com `String(valor)`
