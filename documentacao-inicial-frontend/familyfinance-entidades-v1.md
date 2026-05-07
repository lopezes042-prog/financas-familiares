# FamilyFinance — Especificação de Entidades v1

> **Escopo:** Versão 1 — Spring MVC + Angular + PostgreSQL.
> **Uso:** Este documento é lido em conjunto com `familyfinance-especificacao.md`.
> Toda nomenclatura segue o padrão do projeto: **português BR** em código, banco, API e testes.
> **Tooling:** **OpenSpec** (contexto persistente — `openspec/specs/`) + **Claude Code** (execução) + **especificacao-api.yaml** (contrato HTTP).
>
> Este arquivo descreve entidades, atributos, regras, DDL, classes Java, DTOs e schemas OpenAPI da v1.
> Os `spec.md` do OpenSpec para cada funcionalidade são criados separadamente e referenciam estas definições.

---

## Sumário

1. [Visão Geral das Entidades](#1-visão-geral-das-entidades)
2. [Familia](#2-familia)
3. [Membro](#3-membro)
4. [Categoria](#4-categoria)
5. [Subcategoria](#5-subcategoria)
6. [Conta](#6-conta)
7. [Transacao](#7-transacao)
8. [Investimento](#8-investimento)
9. [LancamentoInvestimento](#9-lancamentoinvestimento)
10. [Meta](#10-meta)
11. [ResumoMensal](#11-resumomensal)
12. [Enumerações](#12-enumerações)
13. [Relacionamentos e Diagrama](#13-relacionamentos-e-diagrama)
14. [Mapeamento OpenAPI — Schemas](#14-mapeamento-openapi--schemas)
15. [Mapeamento JPA — Anotações e Convenções](#15-mapeamento-jpa--anotações-e-convenções)
16. [DTOs por Entidade](#16-dtos-por-entidade)
17. [Validações por Campo](#17-validações-por-campo)
18. [Dados Iniciais (Seed)](#18-dados-iniciais-seed)

---

## 1. Visão Geral das Entidades

### 1.1 Mapa de Entidades

```
Familia (1)
  ├── Membro (N)
  ├── Conta (N)
  ├── Categoria* (N)  [* sistema ou família]
  │     └── Subcategoria (N)
  ├── Investimento (N)
  │     └── LancamentoInvestimento (N)
  ├── Meta (N)
  ├── ResumoMensal (N)
  └── Transacao (N)
        ├── → Membro
        ├── → Conta
        ├── → Categoria
        └── → Subcategoria (opcional)
```

### 1.2 Tabela de Entidades

| Entidade | Tabela | Descrição |
|---|---|---|
| `Familia` | `familia` | Unidade raiz. Isolamento de dados. |
| `Membro` | `membro` | Pessoa da família com acesso ao sistema. |
| `Categoria` | `categoria` | Classificação de transações (sistema ou personalizada). |
| `Subcategoria` | `subcategoria` | Subcategoria vinculada a uma categoria. |
| `Conta` | `conta` | Conta bancária, cartão ou carteira. |
| `Transacao` | `transacao` | Entrada ou saída financeira. Entidade central. |
| `Investimento` | `investimento` | Ativo financeiro da família. |
| `LancamentoInvestimento` | `lancamento_investimento` | Histórico imutável de movimentações de um investimento. |
| `Meta` | `meta` | Objetivo financeiro com progresso rastreado. |
| `ResumoMensal` | `resumo_mensal` | Snapshot calculado por período e família/membro. |

### 1.3 Convenções Aplicadas a Todas as Entidades

- `id`: `UUID`, gerado pela aplicação via `UUID.randomUUID()`. Nunca pelo banco.
- `dataCriacao`: `TIMESTAMPTZ`, preenchido automaticamente na criação.
- `dataAtualizacao`: `TIMESTAMPTZ`, atualizado automaticamente em cada `UPDATE`.
- `ativo`: `BOOLEAN DEFAULT TRUE`. Exclusão sempre lógica — nunca `DELETE` físico.
- Toda query filtra `ativo = true` por padrão, exceto consultas administrativas explícitas.
- Toda entidade vinculada a uma família carrega `familiaId`. Nenhuma query executa sem esse filtro.

---

## 2. Familia

### 2.1 Descrição

Unidade raiz de isolamento. Cada família representa um tenant. Na v1, existe apenas uma família (beta pessoal). A estrutura já suporta múltiplas famílias para evolução futura.

### 2.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `nome` | `nome` | `String` | `VARCHAR(100)` | sim | — | 2–100 caracteres |
| `email` | `email` | `String` | `VARCHAR(200)` | sim | — | Formato e-mail válido, único global |
| `plano` | `plano` | `PlanoFamilia` | `VARCHAR(20)` | sim | `BETA` | Enum válido |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |
| `dataAtualizacao` | `data_atualizacao` | `LocalDateTime` | `TIMESTAMPTZ` | não | — | — |

### 2.3 Regras Específicas

- O `email` é o identificador único global da família no sistema.
- `plano` evolui: `BETA` → `GRATIS` → `PRO` (v5+).
- Desativar uma família (`ativo = false`) bloqueia acesso de todos os membros.

### 2.4 DDL

```sql
CREATE TABLE familia (
    id               UUID          NOT NULL,
    nome             VARCHAR(100)  NOT NULL,
    email            VARCHAR(200)  NOT NULL,
    plano            VARCHAR(20)   NOT NULL DEFAULT 'BETA',
    ativo            BOOLEAN       NOT NULL DEFAULT TRUE,
    data_criacao     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT pk_familia PRIMARY KEY (id),
    CONSTRAINT uk_familia_email UNIQUE (email),
    CONSTRAINT ck_familia_plano CHECK (plano IN ('BETA', 'GRATIS', 'PRO'))
);
```

### 2.5 Classe Java

```java
@Entity
@Table(name = "familia")
public class Familia {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "nome", nullable = false, length = 100)
    @NotBlank
    @Size(min = 2, max = 100)
    private String nome;

    @Column(name = "email", nullable = false, length = 200, unique = true)
    @NotBlank
    @Email
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "plano", nullable = false, length = 20)
    @NotNull
    private PlanoFamilia plano = PlanoFamilia.BETA;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}
```

---

## 3. Membro

### 3.1 Descrição

Pessoa da família com acesso ao sistema. Na v1, sem autenticação (adicionada na v2). O `perfil` define o que o membro pode visualizar e operar.

### 3.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | sim | — | FK válida |
| `nome` | `nome` | `String` | `VARCHAR(100)` | sim | — | 2–100 caracteres |
| `email` | `email` | `String` | `VARCHAR(200)` | sim | — | Formato e-mail, único por família |
| `perfil` | `perfil` | `PerfilMembro` | `VARCHAR(20)` | sim | — | `ADMIN` ou `MEMBRO` |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |
| `dataAtualizacao` | `data_atualizacao` | `LocalDateTime` | `TIMESTAMPTZ` | não | — | — |

### 3.3 Regras Específicas

- `email` é único dentro da família (não globalmente).
- Deve existir sempre ao menos um membro com `perfil = ADMIN` e `ativo = true` por família.
- Membro inativo não pode ser selecionado em novos lançamentos.
- `ADMIN` visualiza dados de todos os membros; `MEMBRO` visualiza apenas os próprios.

### 3.4 DDL

```sql
CREATE TABLE membro (
    id               UUID         NOT NULL,
    familia_id       UUID         NOT NULL,
    nome             VARCHAR(100) NOT NULL,
    email            VARCHAR(200) NOT NULL,
    perfil           VARCHAR(20)  NOT NULL,
    ativo            BOOLEAN      NOT NULL DEFAULT TRUE,
    data_criacao     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT pk_membro           PRIMARY KEY (id),
    CONSTRAINT fk_membro_familia   FOREIGN KEY (familia_id) REFERENCES familia(id),
    CONSTRAINT uk_membro_email_familia UNIQUE (email, familia_id),
    CONSTRAINT ck_membro_perfil    CHECK (perfil IN ('ADMIN', 'MEMBRO'))
);

CREATE INDEX idx_membro_familia_id ON membro(familia_id);
```

### 3.5 Classe Java

```java
@Entity
@Table(name = "membro",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_membro_email_familia",
        columnNames = {"email", "familia_id"}
    )
)
public class Membro {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id", nullable = false, updatable = false)
    @NotNull
    private UUID familiaId;

    @Column(name = "nome", nullable = false, length = 100)
    @NotBlank
    @Size(min = 2, max = 100)
    private String nome;

    @Column(name = "email", nullable = false, length = 200)
    @NotBlank
    @Email
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "perfil", nullable = false, length = 20)
    @NotNull
    private PerfilMembro perfil;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}
```

---

## 4. Categoria

### 4.1 Descrição

Classifica uma transação. Pode ser do sistema (`familiaId = null`) ou personalizada por família. Categorias do sistema são somente leitura. Tipo define se classifica `DESPESA` ou `RECEITA`.

### 4.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | não | `null` | FK válida se preenchido |
| `nome` | `nome` | `String` | `VARCHAR(80)` | sim | — | 2–80 caracteres |
| `tipo` | `tipo` | `TipoTransacao` | `VARCHAR(20)` | sim | — | `DESPESA` ou `RECEITA` |
| `icone` | `icone` | `String` | `VARCHAR(50)` | não | — | Nome do ícone Material |
| `cor` | `cor` | `String` | `VARCHAR(7)` | não | — | Regex `^#[0-9A-Fa-f]{6}$` |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |

### 4.3 Regras Específicas

- `familiaId = null` → categoria do sistema → somente leitura, não pode ser editada ou desativada pela família.
- `familiaId` preenchido → categoria personalizada da família → pode ser editada ou desativada.
- Ao desativar, transações existentes são preservadas. Novos lançamentos não aceitam categorias inativas.
- A listagem para seleção deve mesclar: categorias do sistema + categorias ativas da família, ordenadas por `tipo` e `nome`.

### 4.4 DDL

```sql
CREATE TABLE categoria (
    id           UUID        NOT NULL,
    familia_id   UUID,
    nome         VARCHAR(80) NOT NULL,
    tipo         VARCHAR(20) NOT NULL,
    icone        VARCHAR(50),
    cor          VARCHAR(7),
    ativo        BOOLEAN     NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_categoria        PRIMARY KEY (id),
    CONSTRAINT fk_categoria_familia FOREIGN KEY (familia_id) REFERENCES familia(id),
    CONSTRAINT ck_categoria_tipo   CHECK (tipo IN ('DESPESA', 'RECEITA')),
    CONSTRAINT ck_categoria_cor    CHECK (cor IS NULL OR cor ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_categoria_familia_id ON categoria(familia_id);
CREATE INDEX idx_categoria_tipo       ON categoria(tipo);
```

### 4.5 Classe Java

```java
@Entity
@Table(name = "categoria")
public class Categoria {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id")
    private UUID familiaId;

    @Column(name = "nome", nullable = false, length = 80)
    @NotBlank
    @Size(min = 2, max = 80)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    @NotNull
    private TipoTransacao tipo;

    @Column(name = "icone", length = 50)
    private String icone;

    @Column(name = "cor", length = 7)
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato HEX (#RRGGBB)")
    private String cor;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    public boolean isDoSistema() {
        return this.familiaId == null;
    }

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }
}
```

---

## 5. Subcategoria

### 5.1 Descrição

Subdivisão de uma categoria. Opcional no lançamento de transações. Sempre pertence a uma única categoria e herda seu tipo implicitamente.

### 5.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `categoriaId` | `categoria_id` | `UUID` | `UUID` | sim | — | FK válida |
| `nome` | `nome` | `String` | `VARCHAR(80)` | sim | — | 2–80 caracteres |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |

### 5.3 Regras Específicas

- Não pode ser movida entre categorias.
- A lista de subcategorias é carregada dinamicamente ao selecionar uma categoria no formulário de transação.
- Subcategoria inativa não aparece na seleção de novos lançamentos.

### 5.4 DDL

```sql
CREATE TABLE subcategoria (
    id           UUID        NOT NULL,
    categoria_id UUID        NOT NULL,
    nome         VARCHAR(80) NOT NULL,
    ativo        BOOLEAN     NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_subcategoria           PRIMARY KEY (id),
    CONSTRAINT fk_subcategoria_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

CREATE INDEX idx_subcategoria_categoria_id ON subcategoria(categoria_id);
```

### 5.5 Classe Java

```java
@Entity
@Table(name = "subcategoria")
public class Subcategoria {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "categoria_id", nullable = false, updatable = false)
    @NotNull
    private UUID categoriaId;

    @Column(name = "nome", nullable = false, length = 80)
    @NotBlank
    @Size(min = 2, max = 80)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }
}
```

---

## 6. Conta

### 6.1 Descrição

Representa de onde saem ou para onde vão os recursos financeiros. Pode ser uma conta corrente, poupança, cartão de crédito, carteira física ou conta de investimento.

### 6.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | sim | — | FK válida |
| `nome` | `nome` | `String` | `VARCHAR(100)` | sim | — | 2–100 caracteres |
| `tipo` | `tipo` | `TipoConta` | `VARCHAR(30)` | sim | — | Enum válido |
| `saldoInicial` | `saldo_inicial` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `cor` | `cor` | `String` | `VARCHAR(7)` | não | — | Regex HEX |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |

### 6.3 Regras Específicas

- Saldo calculado dinamicamente: `saldoInicial + Σ(receitas efetivadas) - Σ(despesas efetivadas)` onde `ativo = true`.
- `CARTAO_CREDITO`: não tem saldo positivo; exibe a fatura (soma das despesas do ciclo atual).
- Conta inativa não pode ser selecionada em novos lançamentos.
- Nome único por família.

### 6.4 DDL

```sql
CREATE TABLE conta (
    id            UUID           NOT NULL,
    familia_id    UUID           NOT NULL,
    nome          VARCHAR(100)   NOT NULL,
    tipo          VARCHAR(30)    NOT NULL,
    saldo_inicial NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    cor           VARCHAR(7),
    ativo         BOOLEAN        NOT NULL DEFAULT TRUE,
    data_criacao  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_conta          PRIMARY KEY (id),
    CONSTRAINT fk_conta_familia  FOREIGN KEY (familia_id) REFERENCES familia(id),
    CONSTRAINT uk_conta_nome_familia UNIQUE (nome, familia_id),
    CONSTRAINT ck_conta_tipo     CHECK (tipo IN ('CORRENTE','POUPANCA','CARTAO_CREDITO','CARTEIRA','INVESTIMENTO')),
    CONSTRAINT ck_conta_saldo_inicial CHECK (saldo_inicial >= 0),
    CONSTRAINT ck_conta_cor      CHECK (cor IS NULL OR cor ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_conta_familia_id ON conta(familia_id);
```

### 6.5 Classe Java

```java
@Entity
@Table(name = "conta",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_conta_nome_familia",
        columnNames = {"nome", "familia_id"}
    )
)
public class Conta {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id", nullable = false, updatable = false)
    @NotNull
    private UUID familiaId;

    @Column(name = "nome", nullable = false, length = 100)
    @NotBlank
    @Size(min = 2, max = 100)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    @NotNull
    private TipoConta tipo;

    @Column(name = "saldo_inicial", nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin(value = "0.00", message = "Saldo inicial não pode ser negativo")
    private BigDecimal saldoInicial = BigDecimal.ZERO;

    @Column(name = "cor", length = 7)
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato HEX (#RRGGBB)")
    private String cor;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }
}
```

---

## 7. Transacao

### 7.1 Descrição

Entidade central do sistema. Representa qualquer movimentação financeira: despesa, receita ou transferência entre contas. Suporta lançamentos efetivados e agendados, além de recorrência automática.

### 7.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | sim | — | FK válida |
| `membroId` | `membro_id` | `UUID` | `UUID` | sim | — | FK válida, membro ativo |
| `contaId` | `conta_id` | `UUID` | `UUID` | sim | — | FK válida, conta ativa |
| `categoriaId` | `categoria_id` | `UUID` | `UUID` | sim | — | FK válida, categoria ativa |
| `subcategoriaId` | `subcategoria_id` | `UUID` | `UUID` | não | `null` | FK válida se preenchido |
| `tipo` | `tipo` | `TipoTransacao` | `VARCHAR(20)` | sim | — | Enum válido |
| `valor` | `valor` | `BigDecimal` | `NUMERIC(15,2)` | sim | — | > 0 |
| `descricao` | `descricao` | `String` | `VARCHAR(255)` | sim | — | 2–255 caracteres |
| `data` | `data` | `LocalDate` | `DATE` | sim | hoje | Data válida |
| `recorrente` | `recorrente` | `Boolean` | `BOOLEAN` | sim | `false` | — |
| `regraRecorrencia` | `regra_recorrencia` | `RegraRecorrencia` | `VARCHAR(50)` | cond. | `null` | Obrigatório se `recorrente = true` |
| `transacaoOrigemId` | `transacao_origem_id` | `UUID` | `UUID` | não | `null` | FK self-referencing |
| `efetivada` | `efetivada` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `observacao` | `observacao` | `String` | `VARCHAR(500)` | não | `null` | Máx. 500 caracteres |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `dataLancamento` | `data_lancamento` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |
| `dataAtualizacao` | `data_atualizacao` | `LocalDateTime` | `TIMESTAMPTZ` | não | — | — |

### 7.3 Regras de Validação de Negócio

| Regra | Condição | Erro |
|---|---|---|
| Valor positivo | `valor > 0` | "O valor da transação deve ser maior que zero" |
| Recorrência exige regra | `recorrente = true` e `regraRecorrencia = null` | "Informe a regra de recorrência" |
| Efetivada não futura | `efetivada = true` e `data > hoje` | "Transação efetivada não pode ter data futura" |
| Membro da família | `membro.familiaId == familiaId` | "Membro não pertence à família" |
| Conta da família | `conta.familiaId == familiaId` | "Conta não pertence à família" |
| Categoria compatível | `categoria.tipo == tipo` (para DESPESA/RECEITA) | "Categoria incompatível com o tipo da transação" |
| Transferência exige contas distintas | `tipo = TRANSFERENCIA` e `contaOrigemId == contaDestinoId` | "Conta de origem e destino devem ser diferentes" |

### 7.4 Comportamento de Recorrência

Ao criar transação com `recorrente = true`:
1. Salvar a transação-mãe normalmente.
2. Gerar automaticamente lançamentos futuros para os próximos 12 períodos conforme `regraRecorrencia`.
3. Cada lançamento gerado recebe: `transacaoOrigemId = id da mãe`, `efetivada = false`, `recorrente = false`.
4. Ao editar transação-mãe: perguntar ao usuário o escopo — `APENAS_ESTE` ou `ESTE_E_FUTUROS`.
5. `ESTE_E_FUTUROS`: atualiza a mãe e todos os filhos com `efetivada = false` e `data >= hoje`.

### 7.5 Comportamento de Transferência

Transação do tipo `TRANSFERENCIA` gera dois registros vinculados:
- Uma `DESPESA` na conta de origem.
- Uma `RECEITA` na conta de destino.
- Ambas com o mesmo `valor`, `data` e `descricao`.
- O campo `transacaoOrigemId` da `RECEITA` aponta para o `id` da `DESPESA`.
- Categoria usada: "Transferência" (categoria do sistema, tipo `DESPESA`/`RECEITA`).

### 7.6 DDL

```sql
CREATE TABLE transacao (
    id                  UUID           NOT NULL,
    familia_id          UUID           NOT NULL,
    membro_id           UUID           NOT NULL,
    conta_id            UUID           NOT NULL,
    categoria_id        UUID           NOT NULL,
    subcategoria_id     UUID,
    tipo                VARCHAR(20)    NOT NULL,
    valor               NUMERIC(15,2)  NOT NULL,
    descricao           VARCHAR(255)   NOT NULL,
    data                DATE           NOT NULL,
    recorrente          BOOLEAN        NOT NULL DEFAULT FALSE,
    regra_recorrencia   VARCHAR(50),
    transacao_origem_id UUID,
    efetivada           BOOLEAN        NOT NULL DEFAULT TRUE,
    observacao          VARCHAR(500),
    ativo               BOOLEAN        NOT NULL DEFAULT TRUE,
    data_lancamento     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_criacao        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_atualizacao    TIMESTAMPTZ,
    CONSTRAINT pk_transacao                PRIMARY KEY (id),
    CONSTRAINT fk_transacao_familia        FOREIGN KEY (familia_id)         REFERENCES familia(id),
    CONSTRAINT fk_transacao_membro         FOREIGN KEY (membro_id)          REFERENCES membro(id),
    CONSTRAINT fk_transacao_conta          FOREIGN KEY (conta_id)           REFERENCES conta(id),
    CONSTRAINT fk_transacao_categoria      FOREIGN KEY (categoria_id)       REFERENCES categoria(id),
    CONSTRAINT fk_transacao_subcategoria   FOREIGN KEY (subcategoria_id)    REFERENCES subcategoria(id),
    CONSTRAINT fk_transacao_origem         FOREIGN KEY (transacao_origem_id) REFERENCES transacao(id),
    CONSTRAINT ck_transacao_tipo           CHECK (tipo IN ('DESPESA','RECEITA','TRANSFERENCIA')),
    CONSTRAINT ck_transacao_valor_positivo CHECK (valor > 0),
    CONSTRAINT ck_transacao_recorrencia    CHECK (
        recorrente = FALSE OR regra_recorrencia IS NOT NULL
    )
);

CREATE INDEX idx_transacao_familia_id       ON transacao(familia_id);
CREATE INDEX idx_transacao_membro_id        ON transacao(membro_id);
CREATE INDEX idx_transacao_conta_id         ON transacao(conta_id);
CREATE INDEX idx_transacao_categoria_id     ON transacao(categoria_id);
CREATE INDEX idx_transacao_data             ON transacao(data);
CREATE INDEX idx_transacao_familia_data     ON transacao(familia_id, data);
CREATE INDEX idx_transacao_familia_ativo    ON transacao(familia_id, ativo);
CREATE INDEX idx_transacao_efetivada        ON transacao(efetivada);
CREATE INDEX idx_transacao_origem_id        ON transacao(transacao_origem_id);
```

### 7.7 Classe Java

```java
@Entity
@Table(name = "transacao")
public class Transacao {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id", nullable = false, updatable = false)
    @NotNull
    private UUID familiaId;

    @Column(name = "membro_id", nullable = false)
    @NotNull
    private UUID membroId;

    @Column(name = "conta_id", nullable = false)
    @NotNull
    private UUID contaId;

    @Column(name = "categoria_id", nullable = false)
    @NotNull
    private UUID categoriaId;

    @Column(name = "subcategoria_id")
    private UUID subcategoriaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    @NotNull
    private TipoTransacao tipo;

    @Column(name = "valor", nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin(value = "0.01", message = "O valor da transação deve ser maior que zero")
    private BigDecimal valor;

    @Column(name = "descricao", nullable = false, length = 255)
    @NotBlank
    @Size(min = 2, max = 255)
    private String descricao;

    @Column(name = "data", nullable = false)
    @NotNull
    private LocalDate data;

    @Column(name = "recorrente", nullable = false)
    private Boolean recorrente = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "regra_recorrencia", length = 50)
    private RegraRecorrencia regraRecorrencia;

    @Column(name = "transacao_origem_id")
    private UUID transacaoOrigemId;

    @Column(name = "efetivada", nullable = false)
    private Boolean efetivada = true;

    @Column(name = "observacao", length = 500)
    @Size(max = 500)
    private String observacao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_lancamento", nullable = false, updatable = false)
    private LocalDateTime dataLancamento;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataLancamento = LocalDateTime.now();
        this.dataCriacao = LocalDateTime.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now();
    }

    public boolean isGeradaPorRecorrencia() {
        return this.transacaoOrigemId != null && !this.recorrente;
    }
}
```

---

## 8. Investimento

### 8.1 Descrição

Representa um ativo financeiro da família. Agrega o histórico de lançamentos (aportes, resgates, rendimentos e snapshots) e mantém sempre a posição atual atualizada.

### 8.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | sim | — | FK válida |
| `nome` | `nome` | `String` | `VARCHAR(150)` | sim | — | 2–150 caracteres |
| `tipo` | `tipo` | `TipoInvestimento` | `VARCHAR(30)` | sim | — | Enum válido |
| `instituicao` | `instituicao` | `String` | `VARCHAR(100)` | sim | — | 2–100 caracteres |
| `valorAporte` | `valor_aporte` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `posicaoAtual` | `posicao_atual` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `dataInicio` | `data_inicio` | `LocalDate` | `DATE` | não | — | Data ≤ hoje |
| `ativo` | `ativo` | `Boolean` | `BOOLEAN` | sim | `true` | — |
| `observacao` | `observacao` | `String` | `VARCHAR(500)` | não | — | Máx. 500 |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |
| `dataAtualizacao` | `data_atualizacao` | `LocalDateTime` | `TIMESTAMPTZ` | não | — | — |

### 8.3 Regras Específicas

- `posicaoAtual` é atualizado após cada `LancamentoInvestimento`.
- `valorAporte` só é incrementado nos tipos `APORTE`; `SNAPSHOT` e `RENDIMENTO` não alteram `valorAporte`.
- A rentabilidade é calculada: `((posicaoAtual - valorAporte) / valorAporte) * 100`.

### 8.4 DDL

```sql
CREATE TABLE investimento (
    id               UUID           NOT NULL,
    familia_id       UUID           NOT NULL,
    nome             VARCHAR(150)   NOT NULL,
    tipo             VARCHAR(30)    NOT NULL,
    instituicao      VARCHAR(100)   NOT NULL,
    valor_aporte     NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    posicao_atual    NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    data_inicio      DATE,
    ativo            BOOLEAN        NOT NULL DEFAULT TRUE,
    observacao       VARCHAR(500),
    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT pk_investimento        PRIMARY KEY (id),
    CONSTRAINT fk_investimento_familia FOREIGN KEY (familia_id) REFERENCES familia(id),
    CONSTRAINT ck_investimento_tipo   CHECK (tipo IN (
        'RENDA_FIXA','RENDA_VARIAVEL','FUNDO','FII','CRIPTOMOEDA','PREVIDENCIA','OUTRO'
    )),
    CONSTRAINT ck_investimento_valor_aporte  CHECK (valor_aporte >= 0),
    CONSTRAINT ck_investimento_posicao_atual CHECK (posicao_atual >= 0)
);

CREATE INDEX idx_investimento_familia_id ON investimento(familia_id);
```

### 8.5 Classe Java

```java
@Entity
@Table(name = "investimento")
public class Investimento {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id", nullable = false, updatable = false)
    @NotNull
    private UUID familiaId;

    @Column(name = "nome", nullable = false, length = 150)
    @NotBlank
    @Size(min = 2, max = 150)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    @NotNull
    private TipoInvestimento tipo;

    @Column(name = "instituicao", nullable = false, length = 100)
    @NotBlank
    @Size(min = 2, max = 100)
    private String instituicao;

    @Column(name = "valor_aporte", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorAporte = BigDecimal.ZERO;

    @Column(name = "posicao_atual", nullable = false, precision = 15, scale = 2)
    private BigDecimal posicaoAtual = BigDecimal.ZERO;

    @Column(name = "data_inicio")
    private LocalDate dataInicio;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "observacao", length = 500)
    @Size(max = 500)
    private String observacao;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    public BigDecimal calcularRentabilidadePercentual() {
        if (valorAporte == null || valorAporte.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return posicaoAtual.subtract(valorAporte)
            .divide(valorAporte, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
    }

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}
```

---

## 9. LancamentoInvestimento

### 9.1 Descrição

Registro imutável de cada movimentação em um investimento. Histórico completo que não pode ser editado — erros são corrigidos com lançamento de estorno.

### 9.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `investimentoId` | `investimento_id` | `UUID` | `UUID` | sim | — | FK válida |
| `tipo` | `tipo` | `TipoLancamentoInvestimento` | `VARCHAR(20)` | sim | — | Enum válido |
| `valor` | `valor` | `BigDecimal` | `NUMERIC(15,2)` | sim | — | > 0 |
| `data` | `data` | `LocalDate` | `DATE` | sim | — | Data ≤ hoje |
| `posicaoApos` | `posicao_apos` | `BigDecimal` | `NUMERIC(15,2)` | sim | — | ≥ 0 |
| `observacao` | `observacao` | `String` | `VARCHAR(255)` | não | — | Máx. 255 |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |

**Sem `ativo` e sem `dataAtualizacao` — entidade imutável.**

### 9.3 Regras Específicas

- Após criar um lançamento, o `Investimento` é atualizado imediatamente:
  - `APORTE`: `valorAporte += valor`, `posicaoAtual = posicaoApos`.
  - `RESGATE`: `posicaoAtual = posicaoApos` (não altera `valorAporte`).
  - `RENDIMENTO`: `posicaoAtual = posicaoApos` (não altera `valorAporte`).
  - `SNAPSHOT`: `posicaoAtual = posicaoApos` (não altera `valorAporte`).
- Resgate não pode ser criado se `valor > investimento.posicaoAtual`.
- `posicaoApos` é calculado pela aplicação antes de persistir, nunca pelo cliente.

### 9.4 DDL

```sql
CREATE TABLE lancamento_investimento (
    id               UUID           NOT NULL,
    investimento_id  UUID           NOT NULL,
    tipo             VARCHAR(20)    NOT NULL,
    valor            NUMERIC(15,2)  NOT NULL,
    data             DATE           NOT NULL,
    posicao_apos     NUMERIC(15,2)  NOT NULL,
    observacao       VARCHAR(255),
    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_lancamento_investimento    PRIMARY KEY (id),
    CONSTRAINT fk_lancamento_investimento_id FOREIGN KEY (investimento_id) REFERENCES investimento(id),
    CONSTRAINT ck_lancamento_tipo            CHECK (tipo IN ('APORTE','RESGATE','RENDIMENTO','SNAPSHOT')),
    CONSTRAINT ck_lancamento_valor_positivo  CHECK (valor > 0),
    CONSTRAINT ck_lancamento_posicao         CHECK (posicao_apos >= 0)
);

CREATE INDEX idx_lancamento_investimento_id ON lancamento_investimento(investimento_id);
CREATE INDEX idx_lancamento_data            ON lancamento_investimento(data);
```

### 9.5 Classe Java

```java
@Entity
@Table(name = "lancamento_investimento")
public class LancamentoInvestimento {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "investimento_id", nullable = false, updatable = false)
    @NotNull
    private UUID investimentoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    @NotNull
    private TipoLancamentoInvestimento tipo;

    @Column(name = "valor", nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin(value = "0.01", message = "O valor do lançamento deve ser maior que zero")
    private BigDecimal valor;

    @Column(name = "data", nullable = false, updatable = false)
    @NotNull
    private LocalDate data;

    @Column(name = "posicao_apos", nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin(value = "0.00", message = "Posição após lançamento não pode ser negativa")
    private BigDecimal posicaoApos;

    @Column(name = "observacao", length = 255)
    @Size(max = 255)
    private String observacao;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }
}
```

---

## 10. Meta

### 10.1 Descrição

Objetivo financeiro com valor-alvo e acompanhamento de progresso. Pode representar uma reserva de emergência, fundo para viagem, entrada de imóvel ou qualquer outro objetivo da família.

### 10.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | sim | — | FK válida |
| `nome` | `nome` | `String` | `VARCHAR(150)` | sim | — | 2–150 caracteres |
| `descricao` | `descricao` | `String` | `VARCHAR(500)` | não | — | Máx. 500 |
| `valorAlvo` | `valor_alvo` | `BigDecimal` | `NUMERIC(15,2)` | sim | — | > 0 |
| `valorAtual` | `valor_atual` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `dataAlvo` | `data_alvo` | `LocalDate` | `DATE` | não | — | Data ≥ hoje (ao criar) |
| `situacao` | `situacao` | `SituacaoMeta` | `VARCHAR(20)` | sim | `EM_ANDAMENTO` | Enum válido |
| `dataCriacao` | `data_criacao` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |
| `dataAtualizacao` | `data_atualizacao` | `LocalDateTime` | `TIMESTAMPTZ` | não | — | — |

### 10.3 Regras Específicas

- `valorAtual` nunca é enviado pelo cliente — calculado pela aplicação via aportes.
- Ao atingir `valorAtual >= valorAlvo`, `situacao` muda automaticamente para `CONCLUIDA`.
- Meta `CONCLUIDA` ou `CANCELADA` não aceita novos aportes.
- Projeção de conclusão = `(valorAlvo - valorAtual) / mediaMensalAportes` (média dos últimos 3 meses).
- Percentual de progresso = `(valorAtual / valorAlvo) * 100`, limitado a 100%.

### 10.4 DDL

```sql
CREATE TABLE meta (
    id               UUID           NOT NULL,
    familia_id       UUID           NOT NULL,
    nome             VARCHAR(150)   NOT NULL,
    descricao        VARCHAR(500),
    valor_alvo       NUMERIC(15,2)  NOT NULL,
    valor_atual      NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    data_alvo        DATE,
    situacao         VARCHAR(20)    NOT NULL DEFAULT 'EM_ANDAMENTO',
    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT pk_meta          PRIMARY KEY (id),
    CONSTRAINT fk_meta_familia  FOREIGN KEY (familia_id) REFERENCES familia(id),
    CONSTRAINT ck_meta_situacao CHECK (situacao IN ('EM_ANDAMENTO','CONCLUIDA','PAUSADA','CANCELADA')),
    CONSTRAINT ck_meta_valor_alvo_positivo CHECK (valor_alvo > 0),
    CONSTRAINT ck_meta_valor_atual_nao_negativo CHECK (valor_atual >= 0)
);

CREATE INDEX idx_meta_familia_id ON meta(familia_id);
CREATE INDEX idx_meta_situacao   ON meta(situacao);
```

### 10.5 Classe Java

```java
@Entity
@Table(name = "meta")
public class Meta {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id", nullable = false, updatable = false)
    @NotNull
    private UUID familiaId;

    @Column(name = "nome", nullable = false, length = 150)
    @NotBlank
    @Size(min = 2, max = 150)
    private String nome;

    @Column(name = "descricao", length = 500)
    @Size(max = 500)
    private String descricao;

    @Column(name = "valor_alvo", nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin(value = "0.01", message = "O valor alvo deve ser maior que zero")
    private BigDecimal valorAlvo;

    @Column(name = "valor_atual", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorAtual = BigDecimal.ZERO;

    @Column(name = "data_alvo")
    private LocalDate dataAlvo;

    @Enumerated(EnumType.STRING)
    @Column(name = "situacao", nullable = false, length = 20)
    @NotNull
    private SituacaoMeta situacao = SituacaoMeta.EM_ANDAMENTO;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    public BigDecimal calcularPercentualProgresso() {
        if (valorAlvo.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        var percentual = valorAtual.divide(valorAlvo, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));
        return percentual.min(new BigDecimal("100"));
    }

    public boolean estaAtiva() {
        return situacao == SituacaoMeta.EM_ANDAMENTO || situacao == SituacaoMeta.PAUSADA;
    }

    public void registrarAporte(BigDecimal valor) {
        if (!estaAtiva()) {
            throw new RegraDeNegocioExcecao("Meta não aceita aportes na situação: " + situacao);
        }
        this.valorAtual = this.valorAtual.add(valor);
        if (this.valorAtual.compareTo(this.valorAlvo) >= 0) {
            this.situacao = SituacaoMeta.CONCLUIDA;
        }
    }

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}
```

---

## 11. ResumoMensal

### 11.1 Descrição

Snapshot calculado e armazenado por período e família (ou membro). Serve como base para o dashboard e relatórios. Nunca editado manualmente — sempre recalculado pelo sistema quando transações do período são modificadas.

### 11.2 Atributos

| Atributo | Coluna | Tipo Java | Tipo SQL | Obrigatório | Padrão | Validação |
|---|---|---|---|---|---|---|
| `id` | `id` | `UUID` | `UUID` | sim | gerado | — |
| `familiaId` | `familia_id` | `UUID` | `UUID` | sim | — | FK válida |
| `membroId` | `membro_id` | `UUID` | `UUID` | não | `null` | FK válida se preenchido |
| `periodo` | `periodo` | `String` | `VARCHAR(7)` | sim | — | Formato `AAAA-MM` |
| `totalReceitas` | `total_receitas` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `totalDespesas` | `total_despesas` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `saldo` | `saldo` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | Pode ser negativo |
| `totalInvestido` | `total_investido` | `BigDecimal` | `NUMERIC(15,2)` | sim | `0.00` | ≥ 0 |
| `dataCalculo` | `data_calculo` | `LocalDateTime` | `TIMESTAMPTZ` | sim | agora | — |

### 11.3 Regras Específicas

- `membroId = null` → resumo consolidado da família (todos os membros).
- `membroId` preenchido → resumo individual do membro.
- `saldo = totalReceitas - totalDespesas`.
- Considera apenas transações com `efetivada = true` e `ativo = true`.
- Constraint única: `(familia_id, membro_id, periodo)` — upsert ao recalcular.
- Recalculado via `@TransactionalEventListener` após qualquer modificação de transação no período.

### 11.4 DDL

```sql
CREATE TABLE resumo_mensal (
    id               UUID           NOT NULL,
    familia_id       UUID           NOT NULL,
    membro_id        UUID,
    periodo          VARCHAR(7)     NOT NULL,
    total_receitas   NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    total_despesas   NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    saldo            NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    total_investido  NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    data_calculo     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_resumo_mensal          PRIMARY KEY (id),
    CONSTRAINT fk_resumo_familia         FOREIGN KEY (familia_id) REFERENCES familia(id),
    CONSTRAINT fk_resumo_membro          FOREIGN KEY (membro_id)  REFERENCES membro(id),
    CONSTRAINT uk_resumo_familia_membro_periodo
        UNIQUE (familia_id, membro_id, periodo),
    CONSTRAINT ck_resumo_periodo_formato
        CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT ck_resumo_receitas_nao_negativo  CHECK (total_receitas >= 0),
    CONSTRAINT ck_resumo_despesas_nao_negativo  CHECK (total_despesas >= 0),
    CONSTRAINT ck_resumo_investido_nao_negativo CHECK (total_investido >= 0)
);

CREATE INDEX idx_resumo_familia_periodo ON resumo_mensal(familia_id, periodo);
CREATE INDEX idx_resumo_membro_periodo  ON resumo_mensal(membro_id, periodo);
```

### 11.5 Classe Java

```java
@Entity
@Table(name = "resumo_mensal",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_resumo_familia_membro_periodo",
        columnNames = {"familia_id", "membro_id", "periodo"}
    )
)
public class ResumoMensal {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "familia_id", nullable = false, updatable = false)
    @NotNull
    private UUID familiaId;

    @Column(name = "membro_id")
    private UUID membroId;

    @Column(name = "periodo", nullable = false, length = 7)
    @NotBlank
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Período deve estar no formato AAAA-MM")
    private String periodo;

    @Column(name = "total_receitas", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalReceitas = BigDecimal.ZERO;

    @Column(name = "total_despesas", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDespesas = BigDecimal.ZERO;

    @Column(name = "saldo", nullable = false, precision = 15, scale = 2)
    private BigDecimal saldo = BigDecimal.ZERO;

    @Column(name = "total_investido", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInvestido = BigDecimal.ZERO;

    @Column(name = "data_calculo", nullable = false)
    private LocalDateTime dataCalculo;

    public void recalcular(BigDecimal receitas, BigDecimal despesas, BigDecimal investido) {
        this.totalReceitas = receitas;
        this.totalDespesas = despesas;
        this.totalInvestido = investido;
        this.saldo = receitas.subtract(despesas);
        this.dataCalculo = LocalDateTime.now();
    }

    @PrePersist
    void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCalculo = LocalDateTime.now();
    }
}
```

---

## 12. Enumerações

### 12.1 PlanoFamilia

```java
public enum PlanoFamilia {
    BETA,
    GRATIS,
    PRO
}
```

### 12.2 PerfilMembro

```java
public enum PerfilMembro {
    ADMIN,
    MEMBRO
}
```

### 12.3 TipoTransacao

```java
/** Usado em Transacao e Categoria */
public enum TipoTransacao {
    DESPESA,
    RECEITA,
    TRANSFERENCIA
}
```

### 12.4 RegraRecorrencia

```java
public enum RegraRecorrencia {
    DIARIA,
    SEMANAL,
    QUINZENAL,
    MENSAL,
    ANUAL;

    /** Retorna o número de dias do intervalo para geração dos próximos lançamentos */
    public long intervaloDias() {
        return switch (this) {
            case DIARIA     -> 1;
            case SEMANAL    -> 7;
            case QUINZENAL  -> 15;
            case MENSAL     -> 30;
            case ANUAL      -> 365;
        };
    }
}
```

### 12.5 TipoConta

```java
public enum TipoConta {
    CORRENTE,
    POUPANCA,
    CARTAO_CREDITO,
    CARTEIRA,
    INVESTIMENTO
}
```

### 12.6 TipoInvestimento

```java
public enum TipoInvestimento {
    RENDA_FIXA,
    RENDA_VARIAVEL,
    FUNDO,
    FII,
    CRIPTOMOEDA,
    PREVIDENCIA,
    OUTRO
}
```

### 12.7 TipoLancamentoInvestimento

```java
public enum TipoLancamentoInvestimento {
    APORTE,
    RESGATE,
    RENDIMENTO,
    SNAPSHOT;

    public boolean alteraValorAporte() {
        return this == APORTE;
    }
}
```

### 12.8 SituacaoMeta

```java
public enum SituacaoMeta {
    EM_ANDAMENTO,
    CONCLUIDA,
    PAUSADA,
    CANCELADA;

    public boolean aceitaAportes() {
        return this == EM_ANDAMENTO || this == PAUSADA;
    }
}
```

---

## 13. Relacionamentos e Diagrama

### 13.1 Diagrama Entidade-Relacionamento (texto)

```
┌─────────────┐        ┌──────────────┐
│   familia   │1─────N│    membro    │
│─────────────│        │──────────────│
│ id (PK)     │        │ id (PK)      │
│ nome        │        │ familia_id   │
│ email       │        │ nome         │
│ plano       │        │ email        │
│ ativo       │        │ perfil       │
└─────────────┘        │ ativo        │
       │                └──────────────┘
       │                       │
       │                       │1
       │                       │
       │1               N┌─────┴─────────┐
       ├──────────────N─▶│  transacao    │
       │                 │───────────────│
       │                 │ id (PK)       │
       │                 │ familia_id    │
       │                 │ membro_id     │
       │                 │ conta_id      │
       │                 │ categoria_id  │
       │                 │ subcategoria_id│
       │                 │ tipo          │
       │                 │ valor         │
       │                 │ data          │
       │                 │ recorrente    │
       │                 │ efetivada     │
       │                 └───────────────┘
       │
       ├──────────────N─▶┌──────────────────┐
       │                 │     conta        │
       │                 │──────────────────│
       │                 │ id (PK)          │
       │                 │ familia_id       │
       │                 │ nome             │
       │                 │ tipo             │
       │                 │ saldo_inicial    │
       │                 └──────────────────┘
       │
       ├──────────────N─▶┌──────────────────────────────┐
       │                 │         categoria            │
       │                 │──────────────────────────────│
       │                 │ id (PK)                      │
       │                 │ familia_id (null=sistema)    │
       │                 │ nome                         │
       │                 │ tipo                         │
       │                 └─────────────┬────────────────┘
       │                               │1
       │                               │
       │                          N┌───┴──────────────┐
       │                           │  subcategoria    │
       │                           │──────────────────│
       │                           │ id (PK)          │
       │                           │ categoria_id     │
       │                           │ nome             │
       │                           └──────────────────┘
       │
       ├──────────────N─▶┌──────────────────────────────┐
       │                 │       investimento           │
       │                 │──────────────────────────────│
       │                 │ id (PK)                      │
       │                 │ familia_id                   │
       │                 │ nome                         │
       │                 │ tipo                         │
       │                 │ valor_aporte                 │
       │                 │ posicao_atual                │
       │                 └────────────┬─────────────────┘
       │                              │1
       │                         N┌───┴──────────────────────┐
       │                          │  lancamento_investimento │
       │                          │──────────────────────────│
       │                          │ id (PK)                  │
       │                          │ investimento_id          │
       │                          │ tipo                     │
       │                          │ valor                    │
       │                          │ posicao_apos             │
       │                          └──────────────────────────┘
       │
       ├──────────────N─▶┌──────────────────┐
       │                 │      meta        │
       │                 │──────────────────│
       │                 │ id (PK)          │
       │                 │ familia_id       │
       │                 │ nome             │
       │                 │ valor_alvo       │
       │                 │ valor_atual      │
       │                 │ situacao         │
       │                 └──────────────────┘
       │
       └──────────────N─▶┌──────────────────┐
                         │  resumo_mensal   │
                         │──────────────────│
                         │ id (PK)          │
                         │ familia_id       │
                         │ membro_id (null) │
                         │ periodo          │
                         │ total_receitas   │
                         │ total_despesas   │
                         │ saldo            │
                         └──────────────────┘
```

### 13.2 Cardinalidades

| Relação | Cardinalidade |
|---|---|
| Familia → Membro | 1 : N |
| Familia → Conta | 1 : N |
| Familia → Categoria (personalizada) | 1 : N |
| Familia → Investimento | 1 : N |
| Familia → Meta | 1 : N |
| Familia → ResumoMensal | 1 : N |
| Familia → Transacao | 1 : N |
| Membro → Transacao | 1 : N |
| Conta → Transacao | 1 : N |
| Categoria → Subcategoria | 1 : N |
| Categoria → Transacao | 1 : N |
| Subcategoria → Transacao | 1 : N (opcional) |
| Investimento → LancamentoInvestimento | 1 : N |
| Transacao → Transacao (recorrência) | 1 : N (self-ref) |

---

## 14. Mapeamento OpenAPI — Schemas

Fragmento do `especificacao-api.yaml` para os schemas das entidades v1:

```yaml
components:
  schemas:

    # ── FAMILIA ──────────────────────────────────────────
    FamiliaResposta:
      type: object
      properties:
        id:          { type: string, format: uuid }
        nome:        { type: string }
        email:       { type: string, format: email }
        plano:       { $ref: '#/components/schemas/PlanoFamilia' }
        ativo:       { type: boolean }
        dataCriacao: { type: string, format: date-time }

    # ── MEMBRO ───────────────────────────────────────────
    MembroResposta:
      type: object
      properties:
        id:        { type: string, format: uuid }
        familiaId: { type: string, format: uuid }
        nome:      { type: string }
        email:     { type: string, format: email }
        perfil:    { $ref: '#/components/schemas/PerfilMembro' }
        ativo:     { type: boolean }

    CriarMembroComando:
      type: object
      required: [nome, email, perfil]
      properties:
        nome:   { type: string, minLength: 2, maxLength: 100 }
        email:  { type: string, format: email }
        perfil: { $ref: '#/components/schemas/PerfilMembro' }

    # ── CATEGORIA ────────────────────────────────────────
    CategoriaResposta:
      type: object
      properties:
        id:        { type: string, format: uuid }
        familiaId: { type: string, format: uuid, nullable: true }
        nome:      { type: string }
        tipo:      { $ref: '#/components/schemas/TipoTransacao' }
        icone:     { type: string, nullable: true }
        cor:       { type: string, nullable: true }
        doSistema: { type: boolean }
        subcategorias:
          type: array
          items: { $ref: '#/components/schemas/SubcategoriaResposta' }

    SubcategoriaResposta:
      type: object
      properties:
        id:          { type: string, format: uuid }
        categoriaId: { type: string, format: uuid }
        nome:        { type: string }
        ativo:       { type: boolean }

    # ── CONTA ────────────────────────────────────────────
    ContaResposta:
      type: object
      properties:
        id:            { type: string, format: uuid }
        nome:          { type: string }
        tipo:          { $ref: '#/components/schemas/TipoConta' }
        saldoInicial:  { type: number, format: double }
        saldoAtual:    { type: number, format: double }
        cor:           { type: string, nullable: true }
        ativo:         { type: boolean }

    CriarContaComando:
      type: object
      required: [nome, tipo]
      properties:
        nome:         { type: string, minLength: 2, maxLength: 100 }
        tipo:         { $ref: '#/components/schemas/TipoConta' }
        saldoInicial: { type: number, format: double, default: 0.0 }
        cor:          { type: string, pattern: '^#[0-9A-Fa-f]{6}$' }

    # ── TRANSACAO ────────────────────────────────────────
    TransacaoResposta:
      type: object
      properties:
        id:               { type: string, format: uuid }
        membroId:         { type: string, format: uuid }
        membroNome:       { type: string }
        contaId:          { type: string, format: uuid }
        contaNome:        { type: string }
        categoriaId:      { type: string, format: uuid }
        categoriaNome:    { type: string }
        subcategoriaId:   { type: string, format: uuid, nullable: true }
        subcategoriaNome: { type: string, nullable: true }
        tipo:             { $ref: '#/components/schemas/TipoTransacao' }
        valor:            { type: number, format: double }
        descricao:        { type: string }
        data:             { type: string, format: date }
        recorrente:       { type: boolean }
        regraRecorrencia: { $ref: '#/components/schemas/RegraRecorrencia', nullable: true }
        efetivada:        { type: boolean }
        observacao:       { type: string, nullable: true }

    CriarTransacaoComando:
      type: object
      required: [membroId, contaId, categoriaId, tipo, valor, descricao, data]
      properties:
        membroId:         { type: string, format: uuid }
        contaId:          { type: string, format: uuid }
        categoriaId:      { type: string, format: uuid }
        subcategoriaId:   { type: string, format: uuid, nullable: true }
        tipo:             { $ref: '#/components/schemas/TipoTransacao' }
        valor:            { type: number, format: double, minimum: 0.01 }
        descricao:        { type: string, minLength: 2, maxLength: 255 }
        data:             { type: string, format: date }
        recorrente:       { type: boolean, default: false }
        regraRecorrencia: { $ref: '#/components/schemas/RegraRecorrencia', nullable: true }
        efetivada:        { type: boolean, default: true }
        observacao:       { type: string, maxLength: 500, nullable: true }

    # ── INVESTIMENTO ─────────────────────────────────────
    InvestimentoResposta:
      type: object
      properties:
        id:                       { type: string, format: uuid }
        nome:                     { type: string }
        tipo:                     { $ref: '#/components/schemas/TipoInvestimento' }
        instituicao:              { type: string }
        valorAporte:              { type: number, format: double }
        posicaoAtual:             { type: number, format: double }
        rentabilidadePercentual:  { type: number, format: double }
        dataInicio:               { type: string, format: date, nullable: true }
        ativo:                    { type: boolean }

    CriarLancamentoInvestimentoComando:
      type: object
      required: [tipo, valor, data]
      properties:
        tipo:       { $ref: '#/components/schemas/TipoLancamentoInvestimento' }
        valor:      { type: number, format: double, minimum: 0.01 }
        data:       { type: string, format: date }
        observacao: { type: string, maxLength: 255, nullable: true }

    # ── META ─────────────────────────────────────────────
    MetaResposta:
      type: object
      properties:
        id:                   { type: string, format: uuid }
        nome:                 { type: string }
        descricao:            { type: string, nullable: true }
        valorAlvo:            { type: number, format: double }
        valorAtual:           { type: number, format: double }
        percentualProgresso:  { type: number, format: double }
        dataAlvo:             { type: string, format: date, nullable: true }
        situacao:             { $ref: '#/components/schemas/SituacaoMeta' }
        projecaoConclusao:    { type: string, format: date, nullable: true }

    CriarMetaComando:
      type: object
      required: [nome, valorAlvo]
      properties:
        nome:      { type: string, minLength: 2, maxLength: 150 }
        descricao: { type: string, maxLength: 500, nullable: true }
        valorAlvo: { type: number, format: double, minimum: 0.01 }
        dataAlvo:  { type: string, format: date, nullable: true }

    # ── RESUMO MENSAL ────────────────────────────────────
    ResumoMensalResposta:
      type: object
      properties:
        periodo:        { type: string, example: "2025-01" }
        totalReceitas:  { type: number, format: double }
        totalDespesas:  { type: number, format: double }
        saldo:          { type: number, format: double }
        totalInvestido: { type: number, format: double }
        dataCalculo:    { type: string, format: date-time }

    # ── PAGINACAO ────────────────────────────────────────
    PaginaTransacaoResposta:
      type: object
      properties:
        conteudo:
          type: array
          items: { $ref: '#/components/schemas/TransacaoResposta' }
        pagina:        { type: integer }
        tamanho:       { type: integer }
        totalElementos:{ type: integer, format: int64 }
        totalPaginas:  { type: integer }
        ultima:        { type: boolean }

    # ── ERRO ─────────────────────────────────────────────
    ErroResposta:
      type: object
      properties:
        timestamp:  { type: string, format: date-time }
        status:     { type: integer }
        erro:       { type: string }
        mensagem:   { type: string }
        caminho:    { type: string }

    # ── ENUMERAÇÕES ──────────────────────────────────────
    PlanoFamilia:
      type: string
      enum: [BETA, GRATIS, PRO]

    PerfilMembro:
      type: string
      enum: [ADMIN, MEMBRO]

    TipoTransacao:
      type: string
      enum: [DESPESA, RECEITA, TRANSFERENCIA]

    TipoConta:
      type: string
      enum: [CORRENTE, POUPANCA, CARTAO_CREDITO, CARTEIRA, INVESTIMENTO]

    TipoInvestimento:
      type: string
      enum: [RENDA_FIXA, RENDA_VARIAVEL, FUNDO, FII, CRIPTOMOEDA, PREVIDENCIA, OUTRO]

    TipoLancamentoInvestimento:
      type: string
      enum: [APORTE, RESGATE, RENDIMENTO, SNAPSHOT]

    RegraRecorrencia:
      type: string
      enum: [DIARIA, SEMANAL, QUINZENAL, MENSAL, ANUAL]

    SituacaoMeta:
      type: string
      enum: [EM_ANDAMENTO, CONCLUIDA, PAUSADA, CANCELADA]
```

---

## 15. Mapeamento JPA — Anotações e Convenções

### 15.1 Classe Base de Auditoria

```java
@MappedSuperclass
public abstract class EntidadeBase {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    protected UUID id;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    protected LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    protected LocalDateTime dataAtualizacao;

    @Column(name = "ativo", nullable = false)
    protected Boolean ativo = true;

    @PrePersist
    protected void aoSalvar() {
        this.id = UUID.randomUUID();
        this.dataCriacao = LocalDateTime.now();
    }

    @PreUpdate
    protected void aoAtualizar() {
        this.dataAtualizacao = LocalDateTime.now();
    }
}
```

Entidades sem `ativo` ou `dataAtualizacao` (ex: `LancamentoInvestimento`) não herdam de `EntidadeBase` — declaram apenas os campos necessários.

### 15.2 Repositórios — Interface Padrão

```java
// Padrão para todo repositório da v1
@Repository
public interface TransacaoRepositorio extends JpaRepository<Transacao, UUID> {

    // Sempre filtrar por familiaId e ativo
    Page<Transacao> findByFamiliaIdAndAtivoTrue(UUID familiaId, Pageable pageable);

    // Consultas nomeadas em português
    @Query("""
        SELECT t FROM Transacao t
        WHERE t.familiaId = :familiaId
          AND t.ativo = true
          AND t.efetivada = true
          AND FUNCTION('TO_CHAR', t.data, 'YYYY-MM') = :periodo
        """)
    List<Transacao> buscarPorFamiliaEPeriodo(UUID familiaId, String periodo);
}
```

### 15.3 Configuração JPA

```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: validate        # Flyway gerencia o schema, nunca o Hibernate
    show-sql: false             # true apenas em perfil de desenvolvimento
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          time_zone: UTC
```

---

## 16. DTOs por Entidade

### 16.1 Convenção de Nomenclatura dos DTOs

| Sufixo | Uso |
|---|---|
| `Resposta` | Saída da API (response body) |
| `Comando` | Entrada da API (request body para criação/atualização) |
| `Filtro` | Parâmetros de consulta (query params) |
| `Resumo` | Versão simplificada para listagens |

### 16.2 Papel dos DTOs no Fluxo Claude Code + OpenSpec

O Claude Code lê dois artefatos para implementar qualquer endpoint:

1. **`openspec/specs/<funcionalidade>/spec.md`** — entende a intenção, regras de negócio e cenários de teste.
2. **`especificacao-api.yaml`** — entende o contrato HTTP: quais DTOs usar, quais campos são obrigatórios, quais status retornar.

Os DTOs listados na seção 16.3 são derivados diretamente dos `schemas` definidos no `especificacao-api.yaml`. O Claude Code cria as classes Java correspondentes alinhadas ao contrato — nenhum DTO é inventado fora do spec.

### 16.2.1 Mapeamento com MapStruct

```java
@Mapper(componentModel = "spring")
public interface TransacaoMapeador {

    TransacaoResposta paraResposta(Transacao transacao);

    @Mapping(target = "id",                ignore = true)
    @Mapping(target = "familiaId",         ignore = true)  // extraído do contexto
    @Mapping(target = "dataLancamento",    ignore = true)
    @Mapping(target = "dataCriacao",       ignore = true)
    @Mapping(target = "dataAtualizacao",   ignore = true)
    @Mapping(target = "ativo",             ignore = true)
    @Mapping(target = "transacaoOrigemId", ignore = true)
    Transacao paraEntidade(CriarTransacaoComando comando);
}
```

### 16.3 DTOs Completos por Entidade

| Entidade | Comando de Criação | Comando de Edição | Resposta | Resposta Resumo |
|---|---|---|---|---|
| Familia | — (criado via seed) | `EditarFamiliaComando` | `FamiliaResposta` | — |
| Membro | `CriarMembroComando` | `EditarMembroComando` | `MembroResposta` | `MembroResumoResposta` |
| Categoria | `CriarCategoriaComando` | `EditarCategoriaComando` | `CategoriaResposta` | — |
| Subcategoria | `CriarSubcategoriaComando` | `EditarSubcategoriaComando` | `SubcategoriaResposta` | — |
| Conta | `CriarContaComando` | `EditarContaComando` | `ContaResposta` | `ContaResumoResposta` |
| Transacao | `CriarTransacaoComando` | `EditarTransacaoComando` | `TransacaoResposta` | `TransacaoResumoResposta` |
| Investimento | `CriarInvestimentoComando` | `EditarInvestimentoComando` | `InvestimentoResposta` | — |
| LancamentoInvestimento | `CriarLancamentoInvestimentoComando` | — (imutável) | `LancamentoInvestimentoResposta` | — |
| Meta | `CriarMetaComando` | `EditarMetaComando` | `MetaResposta` | `MetaResumoResposta` |
| ResumoMensal | — (calculado) | — (calculado) | `ResumoMensalResposta` | — |

---

## 17. Validações por Campo

### 17.1 Resumo de Validações Críticas

| Campo | Entidade | Validação | Mensagem |
|---|---|---|---|
| `valor` | Transacao | `> 0` | "O valor da transação deve ser maior que zero" |
| `valor` | LancamentoInvestimento | `> 0` | "O valor do lançamento deve ser maior que zero" |
| `valorAlvo` | Meta | `> 0` | "O valor alvo da meta deve ser maior que zero" |
| `regraRecorrencia` | Transacao | Obrigatório se `recorrente = true` | "Informe a regra de recorrência" |
| `efetivada` + `data` | Transacao | `data <= hoje` se `efetivada = true` | "Transação efetivada não pode ter data futura" |
| `cor` | Categoria, Conta | Regex `^#[0-9A-Fa-f]{6}$` | "Cor deve estar no formato HEX (#RRGGBB)" |
| `periodo` | ResumoMensal | Regex `^\d{4}-(0[1-9]\|1[0-2])$` | "Período deve estar no formato AAAA-MM" |
| `email` | Familia, Membro | Formato e-mail + unicidade | "E-mail inválido" / "E-mail já cadastrado" |
| `subcategoriaId` | Transacao | `subcategoria.categoriaId == categoriaId` | "Subcategoria não pertence à categoria selecionada" |
| `membroId` | Transacao | `membro.familiaId == familiaId` | "Membro não pertence à família" |
| `contaId` | Transacao | `conta.familiaId == familiaId` | "Conta não pertence à família" |
| `posicaoApos` em resgate | LancamentoInvestimento | `investimento.posicaoAtual - valor >= 0` | "Valor do resgate excede a posição atual" |

### 17.2 Tratador Global de Exceções

```java
@RestControllerAdvice
public class TratadorGlobalDeExcecoes {

    @ExceptionHandler(RegraDeNegocioExcecao.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErroResposta tratarRegraDeNegocio(RegraDeNegocioExcecao ex,
                                              HttpServletRequest req) {
        return new ErroResposta(
            LocalDateTime.now(), 422,
            "Regra de negócio violada",
            ex.getMessage(),
            req.getRequestURI()
        );
    }

    @ExceptionHandler(RecursoNaoEncontradoExcecao.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErroResposta tratarNaoEncontrado(RecursoNaoEncontradoExcecao ex,
                                             HttpServletRequest req) {
        return new ErroResposta(
            LocalDateTime.now(), 404,
            "Recurso não encontrado",
            ex.getMessage(),
            req.getRequestURI()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErroResposta tratarValidacao(MethodArgumentNotValidException ex,
                                        HttpServletRequest req) {
        var erros = ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.joining("; "));
        return new ErroResposta(
            LocalDateTime.now(), 400,
            "Erro de validação",
            erros,
            req.getRequestURI()
        );
    }
}
```

---

## 18. Dados Iniciais (Seed)

### 18.1 Script Flyway — Categorias do Sistema

```sql
-- V2__inserir_categorias_padrao.sql
-- Categorias do sistema: familia_id = NULL

-- DESPESAS
INSERT INTO categoria (id, familia_id, nome, tipo, icone, cor, ativo) VALUES
  (gen_random_uuid(), NULL, 'Moradia',       'DESPESA', 'home',           '#E53935', TRUE),
  (gen_random_uuid(), NULL, 'Alimentação',   'DESPESA', 'restaurant',     '#FB8C00', TRUE),
  (gen_random_uuid(), NULL, 'Transporte',    'DESPESA', 'directions_car', '#F4511E', TRUE),
  (gen_random_uuid(), NULL, 'Saúde',         'DESPESA', 'local_hospital', '#D81B60', TRUE),
  (gen_random_uuid(), NULL, 'Educação',      'DESPESA', 'school',         '#8E24AA', TRUE),
  (gen_random_uuid(), NULL, 'Lazer',         'DESPESA', 'sports_esports', '#3949AB', TRUE),
  (gen_random_uuid(), NULL, 'Vestuário',     'DESPESA', 'checkroom',      '#00897B', TRUE),
  (gen_random_uuid(), NULL, 'Pets',          'DESPESA', 'pets',           '#43A047', TRUE),
  (gen_random_uuid(), NULL, 'Impostos',      'DESPESA', 'account_balance','#6D4C41', TRUE),
  (gen_random_uuid(), NULL, 'Transferência', 'DESPESA', 'swap_horiz',     '#546E7A', TRUE),
  (gen_random_uuid(), NULL, 'Outros Gastos', 'DESPESA', 'more_horiz',     '#757575', TRUE);

-- RECEITAS
INSERT INTO categoria (id, familia_id, nome, tipo, icone, cor, ativo) VALUES
  (gen_random_uuid(), NULL, 'Salário',        'RECEITA', 'work',          '#1E88E5', TRUE),
  (gen_random_uuid(), NULL, 'Investimentos',  'RECEITA', 'trending_up',   '#00ACC1', TRUE),
  (gen_random_uuid(), NULL, 'Transferência',  'RECEITA', 'swap_horiz',    '#546E7A', TRUE),
  (gen_random_uuid(), NULL, 'Outros Ganhos',  'RECEITA', 'attach_money',  '#7CB342', TRUE);
```

### 18.2 Script Flyway — Subcategorias

```sql
-- V3__inserir_subcategorias_padrao.sql

-- Moradia
WITH cat AS (SELECT id FROM categoria WHERE nome = 'Moradia' AND familia_id IS NULL)
INSERT INTO subcategoria (id, categoria_id, nome, ativo) VALUES
  (gen_random_uuid(), (SELECT id FROM cat), 'Aluguel',     TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Condomínio',  TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Energia',     TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Água',        TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Internet',    TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'IPTU',        TRUE);

-- Alimentação
WITH cat AS (SELECT id FROM categoria WHERE nome = 'Alimentação' AND familia_id IS NULL)
INSERT INTO subcategoria (id, categoria_id, nome, ativo) VALUES
  (gen_random_uuid(), (SELECT id FROM cat), 'Supermercado', TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Restaurante',  TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Delivery',     TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Padaria',      TRUE);

-- Transporte
WITH cat AS (SELECT id FROM categoria WHERE nome = 'Transporte' AND familia_id IS NULL)
INSERT INTO subcategoria (id, categoria_id, nome, ativo) VALUES
  (gen_random_uuid(), (SELECT id FROM cat), 'Combustível',          TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Transporte público',   TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Aplicativo',           TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Manutenção',           TRUE);

-- Saúde
WITH cat AS (SELECT id FROM categoria WHERE nome = 'Saúde' AND familia_id IS NULL)
INSERT INTO subcategoria (id, categoria_id, nome, ativo) VALUES
  (gen_random_uuid(), (SELECT id FROM cat), 'Plano de saúde', TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Farmácia',       TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Consulta',       TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Exame',          TRUE);

-- Salário
WITH cat AS (SELECT id FROM categoria WHERE nome = 'Salário' AND familia_id IS NULL)
INSERT INTO subcategoria (id, categoria_id, nome, ativo) VALUES
  (gen_random_uuid(), (SELECT id FROM cat), 'CLT',       TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'PJ',        TRUE),
  (gen_random_uuid(), (SELECT id FROM cat), 'Autônomo',  TRUE);
```

### 18.3 Script Flyway — Familia Beta e Membros Iniciais

```sql
-- V4__inserir_familia_beta.sql
-- Script para ambiente de desenvolvimento/beta
-- Em produção, substituir pelos dados reais

INSERT INTO familia (id, nome, email, plano, ativo) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Família Beta',
   'beta@familyfinance.com.br',
   'BETA',
   TRUE);

INSERT INTO membro (id, familia_id, nome, email, perfil, ativo) VALUES
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'Administrador',
   'admin@familyfinance.com.br',
   'ADMIN',
   TRUE);
```

---

*Este documento é lido em conjunto com `familyfinance-especificacao.md`.*
*Toda alteração de entidade deve ser refletida aqui e no `spec.md` do OpenSpec correspondente antes de ser implementada.*
