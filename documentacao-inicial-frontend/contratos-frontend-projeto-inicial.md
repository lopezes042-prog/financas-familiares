# Contratos de API — Contas (v1)

**Base URL dev:** `http://localhost:8080`  
**Documentação interativa:** `http://localhost:8080/swagger-ui.html`  
**Content-Type:** `application/json`

---

## Endpoints

| Método | Path | Status sucesso | Descrição |
|--------|------|---------------|-----------|
| GET | `/api/contas` | 200 | Lista contas ativas com saldo calculado |
| GET | `/api/contas/{id}` | 200 | Busca conta por ID |
| POST | `/api/contas` | 201 | Cria nova conta |
| PUT | `/api/contas/{id}` | 200 | Atualiza nome, tipo e cor |
| PATCH | `/api/contas/{id}/ativo` | 204 | Ativa ou desativa conta |
| GET | `/api/contas/{id}/saldo` | 200 | Consulta saldo atual |

---

## Interfaces TypeScript

```typescript
// Enumeração de tipos de conta
type TipoConta = 'CORRENTE' | 'POUPANCA' | 'CARTAO_CREDITO' | 'CARTEIRA' | 'INVESTIMENTO';

// Resposta padrão de conta (GET e escritas bem-sucedidas)
interface Conta {
  id: string;           // UUID
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;   // calculado — não enviar ao backend
  cor: string | null;   // formato HEX: #RRGGBB
  ativo: boolean;
}

// Body do POST /api/contas
interface CriarContaComando {
  nome: string;         // 2–100 caracteres, obrigatório
  tipo: TipoConta;      // obrigatório
  saldoInicial: number; // ≥ 0.00, obrigatório
  cor?: string;         // opcional, #RRGGBB
}

// Body do PUT /api/contas/{id}
interface EditarContaComando {
  nome: string;         // 2–100 caracteres, obrigatório
  tipo: TipoConta;      // obrigatório
  cor?: string | null;  // opcional; enviar null para remover
}

// Body do PATCH /api/contas/{id}/ativo
interface AlterarSituacaoComando {
  ativo: boolean;       // obrigatório
}

// Resposta do GET /api/contas/{id}/saldo
interface SaldoContaResposta {
  saldoAtual: number;
}

// Formato de erro — todos os erros da API seguem este schema
interface ErroResposta {
  timestamp: string;    // ISO-8601 UTC
  status: number;
  erro: string;
  mensagem: string;     // exibir ao usuário
  caminho: string;
}
```

---

## Exemplo de serviço Angular

```typescript
// conta.servico.ts
@Injectable({ providedIn: 'root' })
export class ContaServico {
  private readonly urlBase = 'http://localhost:8080/api/contas';

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

---

## Tratamento de erros

```typescript
// Ler erro.error.mensagem para exibir ao usuário
function obterMensagem(erro: HttpErrorResponse): string {
  return erro.error?.mensagem ?? mensagemGenerica(erro.status);
}
```

| Status | Significado |
|--------|-------------|
| 400 | Campo inválido — ver `mensagem` para detalhes |
| 404 | Conta não encontrada ou inativa |
| 422 | Regra de negócio violada (ex: nome duplicado) |
| 500 | Erro interno |

---

## Notas

- `saldoAtual` é calculado pelo backend — nunca enviá-lo em requests
- `id`, `ativo`, `familiaId` são ignorados em POST e PUT mesmo se enviados
- `saldoInicial` é imutável após criação — ausente no `EditarContaComando`
- PATCH `/ativo` retorna **204 sem body** — recarregar a lista após receber
- Campos extras no body são ignorados silenciosamente pelo backend
