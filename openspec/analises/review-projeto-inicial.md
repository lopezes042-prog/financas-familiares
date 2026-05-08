# Review: Configuração Inicial do Projeto FamilyFinance Web

**Data:** 2026-05-07  
**Escopo:** Estrutura do projeto, ferramental, design system, infraestrutura Angular  
**Referência:** `openspec/changes/projeto-inicial-web/`

---

## Resumo Executivo

O projeto está estruturalmente sólido: Angular 21 standalone, strict TypeScript, lazy loading, Signals, interceptor funcional, ambientes configurados, CI mínimo com Husky/lint-staged. Os 6 bugs intencionais estão presentes e bem documentados para o exercício de treinamento.

Há, porém, três categorias de problemas reais que ficaram fora dos bugs intencionais:

1. **Design system definido mas não consumido pelos componentes** — as classes `ff-*` existem em `_layout.scss` e `_componentes.scss`, mas os componentes definiram estilos paralelos com hardcode de valores.
2. **Inconsistências entre documentação e implementação** — versão Angular, tema M2/M3, estrutura de arquivos referenciada no design.md.
3. **Gaps funcionais menores** — `CommonModule` desnecessário, tipo exibido como enum cru na tabela, inexistência de estado de carregamento no submit do formulário.

---

## 1. Tooling e Configuração de Build

### ✅ O que está certo

- **TypeScript strict máximo**: além do `"strict": true` padrão, o projeto tem `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature` e `strictTemplates` no Angular compiler. É uma baseline rigorosa — boa para treinamento.
- **`target: ES2022`, `module: preserve`**: configuração correta para Angular 21 com bundler moderno.
- **Scripts completos**: `start`, `build`, `build:prod`, `test`, `test:cobertura`, `lint`, `format` — cobre os casos de uso básicos.
- **Husky + lint-staged**: formata e linta apenas arquivos staged, não o projeto todo a cada commit.
- **`angular-eslint` meta-package**: uso correto (evita conflitos de peer dep com versões individuais).
- **`@angular/animations` explícito em `dependencies`**: necessário em Angular 21, não vem mais implícito.

### ⚠️ Problemas encontrados

#### P-01 — Versão Angular incorreta na documentação

`proposal.md` e `design.md` mencionam "Angular 18" em múltiplos lugares, mas o projeto usa **Angular 21** (conforme `package.json`). Isso confunde quem lê o spec após a implementação.

```
proposal.md, linha 9: "Angular 18 criado com ng new"
design.md, D-01: "Alinhado com Angular 18 best practices"
design.md, D-07: "Tema customizado com Angular Material M2 (não M3) [...] M2 é mais estável no Angular 18"
```

#### P-02 — Tema M3, não M2 (design.md está desatualizado)

`_tema.scss` usa `mat.define-theme()` — que é a **API M3** do Angular Material. A API M2 seria `mat.define-dark-theme()` + `mat.define-palette()`. D-07 em `design.md` diz explicitamente "M2 (não M3)", o que está incorreto.

A decisão de usar M3 foi correta dado o Angular 21, mas a documentação contradiz o código.

```scss
// _tema.scss — usa mat.define-theme() = API M3
$tema-familyfinance: mat.define-theme((
  color: ( theme-type: dark, primary: mat.$orange-palette, ... )
));
```

#### P-03 — `test:cobertura` com flag possivelmente inválida

```json
"test:cobertura": "ng test --coverage --run"
```

O flag `--run` é específico do vitest CLI direto. Passado via `ng test`, pode não ser reconhecido. Para execução única sem watch, o correto seria `--watch=false`:

```json
"test:cobertura": "ng test --coverage --watch=false"
```

#### P-04 — `eslint.config.mjs` vs `.eslintrc.json` no design.md

A árvore de arquivos em `design.md` lista `.eslintrc.json`, mas o arquivo criado é `eslint.config.mjs` (flat config, padrão do ESLint 9). Menor, mas cria confusão se alguém seguir o design.md como referência.

---

## 2. Design System SCSS

### ✅ O que está certo

- Arquitetura em 6 camadas com ordem de import explícita em `styles.scss`.
- `_tokens.scss` bem detalhado: escala de 4px, paleta semântica (receita/despesa/meta), breakpoints, z-index, transições.
- Regra documentada: `::ng-deep` centralizado em `_componentes.scss` — boa prática para overrides de Material.
- Comentários de seção com separadores ASCII — fácil de navegar.

### ⚠️ Problema central: design system não consumido pelos componentes

Este é o achado mais relevante da review. O design system define uma biblioteca completa de classes `ff-*`, mas **nenhum componente as usa**. Cada componente criou seu próprio arquivo SCSS com valores hardcoded.

#### P-05 — Estilos duplicados com hardcode (sem uso dos tokens)

Comparação entre o que o design system define e o que os componentes usam:

| Design system (`_layout.scss`, `_componentes.scss`) | Componente (hardcoded) |
|-----------------------------------------------------|------------------------|
| `.ff-cabecalho-pagina` com tokens | `.cabecalho-pagina` em cada `.component.scss` |
| `.ff-area-carregando` com tokens | `.area-carregando` em cada `.component.scss` |
| `.ff-estado-vazio` com tokens | `.estado-vazio` em `lista-contas.component.scss` |
| `.ff-formulario` com tokens | `.formulario` em `formulario-conta.component.scss` |
| `$cor-fundo-cartao: #1e293b` | `background: #1e293b` hardcoded |
| `$cor-borda: #2d3f55` | `border: 1px solid #2d3f55` hardcoded |
| `$cor-texto-desabilitado: #475569` | `color: #475569` hardcoded |
| `$cor-texto-secundario: #94a3b8` | `color: #94a3b8` hardcoded |

Se alguém mudar a cor `$cor-fundo-cartao` nos tokens para escurecer o tema, o efeito **não se propagaria** para nenhum dos componentes. O design system seria ignorado.

#### P-06 — Cor do sidenav diverge entre token e componente

`layout-principal.component.scss` define o fundo do sidenav como `#1a3a52`, mas o token `$cor-fundo-sidenav` é `#1e2a3b`. São tons de azul-escuro diferentes — não é apenas "falta de uso de token", é uma **cor inconsistente** na UI.

```scss
// _tokens.scss
$cor-fundo-sidenav: #1e2a3b; // não usado no componente

// layout-principal.component.scss
background-color: #1a3a52; // diverge do token
```

#### P-07 — `::ng-deep` em `_componentes.scss` dentro de `html {}`

O override de `.mat-mdc-form-field` em `_componentes.scss` usa `::ng-deep` fora de qualquer escopo de componente (está no arquivo global), o que na prática é equivalente a não ter o seletor `::ng-deep` — já é global. O efeito é o esperado, mas a semântica é estranha. Não há encapsulamento a "perfurar" em estilos globais.

---

## 3. Estrutura Angular

### ✅ O que está certo

- **Standalone components** em todos os componentes — sem AppModule, sem feature modules.
- **Lazy loading via `loadComponent()`** — cada componente carregado sob demanda.
- **`inject()` em vez de construtor** — padrão moderno, consistente em todos os componentes.
- **Signals para estado local** — `signal<T>()` em vez de propriedades mutáveis ou BehaviorSubject.
- **`fb.nonNullable.group()`** no formulário — evita nullable types nos valores dos controls.
- **`withComponentInputBinding()`** no router — habilita binding de params de rota diretamente como inputs.
- **`erroHttpInterceptor` funcional** (`HttpInterceptorFn`) — pattern moderno sem classe.

### ⚠️ Problemas encontrados

#### P-08 — `CommonModule` desnecessário nos standalone components

`lista-contas.component.ts` e `formulario-conta.component.ts` importam `CommonModule`. Em componentes standalone com Angular 17+, os blocos `@if` e `@for` são built-in e não precisam de `NgIf`/`NgFor`. `CommonModule` traz ~100KB de funcionalidades desnecessárias (pipes, diretivas legadas).

Além disso, `lista-contas.component.ts` importa `CommonModule` **e** `CurrencyPipe` individualmente — a pipe já está incluída no `CommonModule`, então uma das importações é redundante.

```typescript
// lista-contas.component.ts — imports excessivos
imports: [
  CommonModule,  // ← desnecessário
  CurrencyPipe,  // ← já incluso no CommonModule acima
  ...
]
```

Correto para Angular 21:
```typescript
imports: [CurrencyPipe, RouterLink, MatTableModule, ...]
// @if e @for são built-in — não precisam de importação
```

#### P-09 — `tipo` exibido como enum cru na tabela

Em `lista-contas.component.html`, a coluna Tipo mostra `{{ conta.tipo }}` que renderiza `CORRENTE`, `POUPANCA`, `CARTAO_CREDITO` — valores de enum crus. O spec exige "rótulo em português". O modelo já tem `TIPOS_CONTA` com os rótulos, mas não há pipe ou lookup na template para traduzi-los.

```html
<!-- atual: exibe "CARTAO_CREDITO" -->
<td mat-cell *matCellDef="let conta">{{ conta.tipo }}</td>

<!-- correto: exibiria "Cartão de crédito" -->
<td mat-cell *matCellDef="let conta">{{ tipoLabel(conta.tipo) }}</td>
```

#### P-10 — Formulário sem proteção contra duplo-submit

`FormularioContaComponent` usa `carregando` apenas para o carregamento inicial (modo edição). Durante o submit (`criar` / `atualizar`), o signal `carregando` nunca é ativado e o botão não é desabilitado. Um usuário pode clicar o botão (quando funcionar após corrigir BUG-06) múltiplas vezes e disparar várias requisições simultâneas.

(Isso é separado dos bugs intencionais — não faz parte do exercício de treinamento.)

#### P-11 — `consultarSaldo()` nunca é chamado

`ContaServico.consultarSaldo()` está implementado, mas nenhum componente da v1 o invoca. A coluna `saldoAtual` na tabela vem do objeto `Conta` (retornado pelo GET /contas), não de uma chamada separada ao endpoint de saldo.

O método existe para uso futuro (transações), o que é OK, mas seu scaffolding no componente de lista foi omitido mesmo existindo no serviço.

---

## 4. Testes

### ✅ O que está certo

- 21 testes passando, distribuídos em 3 arquivos.
- Uso correto de `vitest` API (`vi.fn()`, `vi.fn().mockReturnValue()`, `toHaveBeenCalledOnce()`).
- `TestBed.resetTestingModule()` no `afterEach` do formulário — necessário por usar múltiplos `configureTestingModule` por describe.
- `registerLocaleData(localePt, 'pt-BR')` no spec de lista — corretamente lida com o `CurrencyPipe`.
- `Subject` para testar estado de carregamento (pendente) — melhor que Promise.

### ⚠️ Problemas encontrados

#### P-12 — BUG-03 documentado de forma enganosa no spec

O teste "deve manter spinner girando quando API falha (BUG-03 presente)" é **idêntico** ao teste anterior "deve exibir spinner durante carregamento" — ambos criam um Subject e verificam que `carregando()` é `true` antes do Subject completar. O teste não demonstra o problema real do BUG-03 (que é: o spinner permanece `true` após um `throwError`).

Isso pode confundir a Júnior — o título diz "quando API falha" mas o Subject nunca emite um erro no teste.

#### P-13 — App spec mínimo

`app.spec.ts` tem apenas 1 teste ("deve criar o componente raiz"). `AppComponent` é trivial (só RouterOutlet), então faz sentido — mas se `app.ts` crescer com lógica, o spec não vai capturar regressões.

---

## 5. Ambientes e Deploy

### ✅ O que está certo

- `fileReplacements` configurado corretamente no `angular.json` para a build `production`.
- `ambiente.producao.ts` com `urlApi` diferente — pronto para deploy real.
- Budget de 1MB/2MB (warning/error) no `angular.json` — adequado para a stack atual.

### ⚠️ P-14 — URL `/api` pendente de verificação

Conforme registrado em D-08, o contrato `contratos-frontend-projeto-inicial.md` define endpoints como `/api/contas`, mas `ambiente.urlApi` é `http://localhost:8080` (sem `/api`). A decisão foi "seguir o spec web" e deixar em aberto para verificar com o Swagger UI do backend.

**Se o backend expõe em `/api/contas`** (o que o contrato sugere), a URL precisará ser ajustada. Isso é separado dos 6 bugs intencionais e pode causar confusão após a Júnior corrigir o BUG-01 (`/conta` → `/contas`) mas ainda receber 404.

---

## Mapa de Problemas

| ID | Categoria | Severidade | Intencional? |
|----|-----------|------------|--------------|
| P-01 | Docs | Baixa | Não |
| P-02 | Docs (design.md) | Baixa | Não |
| P-03 | Tooling | Média | Não |
| P-04 | Docs | Baixa | Não |
| P-05 | Design System | Alta | Não |
| P-06 | Design System | Média | Não |
| P-07 | SCSS | Baixa | Não |
| P-08 | Angular | Baixa | Não |
| P-09 | UI/Funcional | Média | Não |
| P-10 | UX | Baixa | Não |
| P-11 | Funcional | Baixa | Não |
| P-12 | Testes | Baixa | Não |
| P-13 | Testes | Baixa | Não |
| P-14 | Infra | Alta | Não (D-08) |

---

## Ações Recomendadas

**Alta prioridade (antes de usar com Júnior):**
- Verificar se o backend usa `/api/contas` ou `/contas` e ajustar `ambiente.urlApi` (P-14).
- Corrigir o import de `CommonModule` para não poluir o exemplo que a Júnior vai ler (P-08).
- Fazer componentes consumirem o design system (usar `@use 'tokens' as *` e as classes `ff-*`) em vez de duplicar estilos com hardcode (P-05, P-06).

**Média prioridade:**
- Corrigir exibição de tipo como rótulo em português na tabela (P-09).
- Corrigir `test:cobertura` script (P-03).
- Atualizar `proposal.md` e `design.md` para Angular 21 / M3 (P-01, P-02).

**Baixa prioridade:**
- Adicionar proteção contra duplo-submit no formulário (P-10).
- Melhorar o teste do BUG-03 para de fato demonstrar o comportamento do spinner com erro (P-12).
