# Design: Projeto Inicial do FamilyFinance Web

## Decisões de Arquitetura

### D-01 — Standalone components (sem NgModule)

**Decisão:** Usar `standalone: true` em todos os componentes, sem `AppModule` ou feature modules.

**Alternativas consideradas:**
- NgModule tradicionais — mais verboso, padrão legado do Angular
- Standalone (escolhido) — padrão atual do Angular 17+, mais simples e coeso

**Motivo:** Alinhado com Angular 21 best practices. Reduz boilerplate. Lazy loading via
`loadComponent()` em `app.routes.ts` é mais explícito e direto.

---

### D-02 — Estratégia de ambientes

**Decisão:** Dois arquivos em `src/ambientes/` (português):
- `ambiente.ts` → desenvolvimento: `urlApi: 'http://localhost:8080'`
- `ambiente.producao.ts` → produção: `urlApi: 'https://api.familyfinance.com.br'`

Troca feita via `fileReplacements` no `angular.json` na configuração `production`.

```json
// angular.json — configuração production
"fileReplacements": [
  {
    "replace": "src/ambientes/ambiente.ts",
    "with": "src/ambientes/ambiente.producao.ts"
  }
]
```

**Alternativas consideradas:**
- `src/environments/` padrão do Angular — em inglês, fora da convenção do projeto
- Variáveis de ambiente em `.env` + biblioteca dotenv — mais complexo, menos idiomático em Angular

**Motivo:** Português BR em tudo, conforme ADR-01. A troca por `fileReplacements` é o
mecanismo nativo do Angular CLI — sem dependência adicional.

---

### D-03 — Autenticação: ausente na v1

**Decisão:** Nenhum mecanismo de auth na v1.

**Contexto:** A especificação é explícita: *"Sem autenticação (rede interna). Uma única família,
`familiaId` presente em todas as tabelas desde o início."* O backend resolve `familiaId` por
configuração fixa em `application.yml`.

**O que NÃO criar:**
- `TokenInterceptor` (entra na v2)
- `AutenticacaoGuarda` (entra na v2)
- Tela de login (entra na v2)
- Armazenamento de token

**Evolução v2:** o `ContextoFamilia` no backend passa a extrair `familiaId` do JWT. O
`TokenInterceptor` no frontend injeta o token em toda requisição. Nenhum serviço existente
precisará ser alterado.

---

### D-04 — Estado local com Signals

**Decisão:** Usar `signal<T>()` para estado reativo local nos componentes.

```typescript
readonly contas = signal<Conta[]>([]);
readonly carregando = signal<boolean>(false);
```

**Motivo:** Signals são a direção declarada pelo Angular (disponível desde Angular 16, estável
no 17+). Simples, sem necessidade de NgRx Signals para a escala atual.

**Quando usar NgRx Signals:** ao introduzir estado compartilhado entre múltiplas features
(ex: usuário autenticado, notificações globais) — fora do escopo da v1.

---

### D-05 — inject() em vez de injeção por construtor

**Decisão:** Usar a função `inject()` para injeção de dependências.

```typescript
private readonly contaServico = inject(ContaServico);
private readonly router = inject(Router);
```

**Motivo:** Padrão moderno do Angular. Elimina o construtor em componentes que não precisam
dele por outros motivos. Mais legível para classes com muitas dependências.

---

### D-06 — Design system como arquivos SCSS parciais

**Decisão:** Design system em `src/estilos/` com 6 arquivos parciais SCSS, importados em
ordem específica pelo `styles.scss`.

```
styles.scss
  @use 'estilos/tokens'      ← 1º: variáveis e funções base
  @use 'estilos/tipografia'  ← 2º: depends on tokens
  @use 'estilos/tema'        ← 3º: Angular Material (depends on tokens)
  @use 'estilos/utilitarios' ← 4º: classes ff-*
  @use 'estilos/layout'      ← 5º: estrutura (depends on tokens)
  @use 'estilos/componentes' ← 6º: overrides Material (depends on tokens)
```

**Regra:** `::ng-deep` é usado APENAS em `_componentes.scss` (global) — nunca em arquivos
de componente individuais. Overrides de Material pertencem ao design system global.

---

### D-07 — Tema Angular Material M3 "Halloween"

**Decisão:** Tema customizado com Angular Material M3 (API `mat.define-theme()`), cores laranja/roxo.

**Paleta primária:** laranja — `$cor-primaria: #ff6b00` → `mat.$orange-palette`
**Paleta terciária:** roxo — `$cor-acento: #7c3aed` → `mat.$violet-palette`
**Fundo:** escuro (~`#0f172a`) via `theme-type: dark`

**Motivo:** Angular Material 21 usa M3 por padrão. A API M2 (`mat.define-dark-theme()` +
`mat.define-palette()`) foi descontinuada nesta versão. O tema M3 usa `mat.define-theme()`
com suporte nativo a `theme-type: dark`, que é mais simples e idiomático no Angular 21.
A paleta laranja/roxo é preservada via `mat.$orange-palette` e `mat.$violet-palette`.

---

### D-08 — Inconsistência de URL nos documentos de referência

**⚠️ Atenção para a implementação:**

Há uma inconsistência entre dois documentos:

| Documento | URL base | Path de Contas | URL completa |
|-----------|----------|----------------|--------------|
| `familyfinance-web-projeto-inicial.md` | `http://localhost:8080` | `/contas` | `http://localhost:8080/contas` |
| `contratos-frontend-projeto-inicial.md` | `http://localhost:8080` | `/api/contas` | `http://localhost:8080/api/contas` |

**Resolução:** Seguir `familyfinance-web-projeto-inicial.md` como fonte primária (é o spec
do projeto Angular). O ambiente fica com `urlApi: 'http://localhost:8080'` e os serviços
usam `${urlApi}/contas`.

**Alternativa se o backend usar `/api`:** alterar apenas o `urlApi` para
`'http://localhost:8080/api'` — sem mudança nos serviços. Verificar com o Swagger UI
antes de implementar.

---

## Estrutura de Arquivos Relevantes

```
familyfinance-web/
├── src/
│   ├── ambientes/
│   │   ├── ambiente.ts
│   │   └── ambiente.producao.ts
│   ├── app/
│   │   ├── nucleo/
│   │   │   ├── interceptores/
│   │   │   │   └── erro-http.interceptor.ts
│   │   │   └── servicos/
│   │   │       └── conta.servico.ts
│   │   ├── compartilhado/
│   │   │   └── componentes/
│   │   │       └── confirmacao-dialogo/
│   │   │           ├── confirmacao-dialogo.component.ts
│   │   │           ├── confirmacao-dialogo.component.html
│   │   │           └── confirmacao-dialogo.component.scss
│   │   ├── funcionalidades/
│   │   │   └── contas/
│   │   │       ├── lista-contas/
│   │   │       │   ├── lista-contas.component.ts
│   │   │       │   ├── lista-contas.component.html
│   │   │       │   ├── lista-contas.component.scss
│   │   │       │   └── lista-contas.component.spec.ts
│   │   │       └── formulario-conta/
│   │   │           ├── formulario-conta.component.ts
│   │   │           ├── formulario-conta.component.html
│   │   │           ├── formulario-conta.component.scss
│   │   │           └── formulario-conta.component.spec.ts
│   │   ├── layout/
│   │   │   └── layout-principal/
│   │   │       ├── layout-principal.component.ts
│   │   │       ├── layout-principal.component.html
│   │   │       └── layout-principal.component.scss
│   │   ├── modelos/
│   │   │   └── conta.modelo.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── estilos/
│   │   ├── _tokens.scss
│   │   ├── _tipografia.scss
│   │   ├── _tema.scss
│   │   ├── _utilitarios.scss
│   │   ├── _layout.scss
│   │   └── _componentes.scss
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── .editorconfig
├── eslint.config.mjs
├── .prettierrc.json
├── .husky/
│   └── pre-commit
├── angular.json
├── package.json
├── README.md
└── tsconfig.json
```
