# FamilyFinance — Especificação Geral do Sistema

> **Documento vivo.** Atualizado a cada ciclo de desenvolvimento.
> Idioma: **Português BR** em todos os artefatos — documentos, código, variáveis, banco, mensagens, logs e commits.
> Tooling: **OpenSpec** (contexto persistente por funcionalidade) + **Claude Code** (execução) + **especificacao-api.yaml** (contrato HTTP).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Tooling de Desenvolvimento](#2-tooling-de-desenvolvimento)
3. [Domínio e Entidades](#3-domínio-e-entidades)
4. [Regras de Negócio](#4-regras-de-negócio)
5. [Regras de Persistência](#5-regras-de-persistência)
6. [Regras de Tela e UI/UX](#6-regras-de-tela-e-uiux)
7. [Versão 1 — Spring MVC + Angular + PostgreSQL](#7-versão-1--spring-mvc--angular--postgresql)
8. [Versão 2 — Login, Autenticação e Autorização](#8-versão-2--login-autenticação-e-autorização)
9. [Versão 3 — Microserviços, Kafka, Arquitetura Limpa e Hexagonal](#9-versão-3--microserviços-kafka-arquitetura-limpa-e-hexagonal)
10. [Versão 4 — Saga e Outbox](#10-versão-4--saga-e-outbox)
11. [Versões Futuras](#11-versões-futuras)
12. [Decisões Arquiteturais (ADRs)](#12-decisões-arquiteturais-adrs)
13. [Padrões de Desenvolvimento](#13-padrões-de-desenvolvimento)

---

## 1. Visão Geral

### 1.1 Propósito

FamilyFinance é um sistema web para gestão financeira familiar. Oferece controle de gastos, renda, investimentos e reservas, com foco em clareza, disciplina e evolução progressiva.

O sistema nasce como **beta pessoal** para uso da família do criador e evolui, incorporando feedback real, até se tornar um **SaaS multi-inquilino hospedado na AWS**, oferecido por assinatura.

### 1.2 Objetivos por Horizonte

| Horizonte | Objetivo |
|---|---|
| **Beta familiar (v1–v2)** | Sistema funcional de uso real, sem complexidade desnecessária |
| **Produto (v3–v4)** | Escalabilidade técnica, resiliência e isolamento entre famílias |
| **SaaS (v5+)** | Multi-inquilino, cobrança por assinatura, integrações externas |

### 1.3 Princípios Não Negociáveis

- **Português BR**: todo artefato sem exceção — nomes de classes, variáveis, colunas de banco, mensagens de erro, logs, comentários, commits.
- **Escalabilidade desde o início**: decisões de modelo de dados e arquitetura não geram dívida técnica ao crescer.
- **OOP + SOLID**: toda classe tem responsabilidade única e clara. Dependências invertidas. Código aberto para extensão, fechado para modificação.
- **Clean Code**: nomes revelam intenção. Funções pequenas. Sem comentários desnecessários. Código autodocumentado.
- **TDD**: testes escritos antes da implementação. Cobertura mínima de 80% nas regras de negócio.
- **Spec-driven com OpenSpec**: cada funcionalidade tem um `spec.md` com intenção, requisitos e cenários. O Claude Code lê esse spec antes de qualquer implementação — o contexto não se perde entre sessões.
- **Contrato HTTP explícito**: o `especificacao-api.yaml` define o contrato entre backend e frontend, lido pelo Claude Code junto ao spec da funcionalidade.

---

## 2. Tooling de Desenvolvimento

### 2.1 Visão Geral

O desenvolvimento usa três instrumentos que trabalham juntos:

```
OpenSpec (specs por funcionalidade)
  └── fornece: intenção, requisitos, cenários, contexto persistente entre sessões
        │
        ▼
  Claude Code (agente de execução)
        │
        ├── lê: openspec/specs/<funcionalidade>/spec.md   ← O QUÊ e POR QUÊ
        ├── lê: especificacao-api.yaml                    ← COMO (HTTP)
        ├── escreve: testes a partir dos cenários (TDD)
        ├── implementa: serviços, controllers, componentes
        └── atualiza: spec.md quando o comportamento é refinado

  especificacao-api.yaml (contrato HTTP)
  └── define: endpoints, parâmetros, schemas, status codes
```

### 2.2 OpenSpec

**OpenSpec** (`openspec.dev`) é um framework leve de especificação orientada por funcionalidade. As specs vivem no repositório, versionadas junto ao código, e são a **memória persistente do sistema** — o que o código *deve* fazer, não apenas o que ele *faz*.

**Por que OpenSpec neste projeto:**

- O Claude Code não retém contexto entre sessões. O `spec.md` garante que o agente entende o comportamento esperado antes de tocar no código — toda sessão começa com o mesmo nível de contexto.
- Specs capturam *intenção* — regras de negócio, cenários de uso, decisões de design — que não ficam evidentes apenas lendo o código.
- Mudanças de requisito ficam rastreáveis: o `spec.md` é atualizado antes da implementação, e o diff do spec é revisado junto ao diff do código no PR.
- Funciona como documentação viva — novas sessões do Claude Code entendem uma funcionalidade lendo o spec, não o código.

**Instalação:**

```bash
npm install -g @fission-ai/openspec@latest
```

**Estrutura de specs no projeto:**

```
openspec/
└── specs/
    ├── transacao-criar/
    │   └── spec.md
    ├── transacao-recorrencia/
    │   └── spec.md
    ├── transacao-transferencia/
    │   └── spec.md
    ├── transacao-efetivar/
    │   └── spec.md
    ├── investimento-lancamento/
    │   └── spec.md
    ├── investimento-posicao/
    │   └── spec.md
    ├── meta-progresso/
    │   └── spec.md
    ├── meta-projecao/
    │   └── spec.md
    ├── conta-saldo/
    │   └── spec.md
    ├── categoria-personalizada/
    │   └── spec.md
    ├── relatorio-resumo-mensal/
    │   └── spec.md
    ├── autenticacao-login/          # v2
    │   └── spec.md
    └── autenticacao-recuperacao/    # v2
        └── spec.md
```

**Anatomia de um spec.md:**

```markdown
# transacao-criar Specification

## Purpose
Registrar uma nova movimentação financeira (despesa, receita ou transferência)
vinculada a um membro, conta e categoria da família.

## Requirements

### Requirement: Valor obrigatório e positivo
The system SHALL reject transactions with value equal to or less than zero.

#### Scenario: Valor zero rejeitado
- GIVEN um comando de criação com valor 0.00
- WHEN o serviço processar o comando
- THEN lançar RegraDeNegocioExcecao
- AND a mensagem deve ser "O valor da transação deve ser maior que zero"

#### Scenario: Valor negativo rejeitado
- GIVEN um comando de criação com valor -50.00
- WHEN o serviço processar o comando
- THEN lançar RegraDeNegocioExcecao

### Requirement: Membro pertence à família
The system SHALL reject transactions where the member does not belong to the family.

#### Scenario: Membro de outra família
- GIVEN um membroId pertencente a uma família diferente
- WHEN o serviço processar o comando
- THEN lançar RegraDeNegocioExcecao
- AND a mensagem deve ser "Membro não pertence à família"

### Requirement: Transação efetivada não pode ter data futura
The system SHALL reject confirmed transactions with a future date.

#### Scenario: Data futura com efetivada = true
- GIVEN data posterior a hoje e efetivada = true
- WHEN o serviço processar o comando
- THEN lançar RegraDeNegocioExcecao
```

**Comandos no Claude Code:**

```bash
# Criar proposta de mudança antes de qualquer código
/openspec:proposal Adicionar suporte a comprovante anexado na transação

# Revisar alinhamento entre spec e implementação atual
/openspec:review transacao-criar

# Atualizar spec após refinamento durante implementação
/openspec:spec transacao-criar
```

**Fluxo de uma mudança com OpenSpec:**

```
1. /openspec:proposal → gera automaticamente:
   openspec/changes/<id-da-mudanca>/
   ├── proposal.md   ← descreve a mudança
   ├── design.md     ← decisões técnicas
   ├── tasks.md      ← tarefas de implementação
   └── specs/        ← deltas dos specs afetados

2. Revisar e aprovar o plano antes de qualquer código

3. Claude Code executa as tasks lendo o spec como contexto principal

4. spec.md é atualizado no mesmo commit que o código

5. PR inclui diff do spec + diff do código
   → revisão de intenção (spec) e de implementação (código) juntas
```

### 2.3 Claude Code

Agente de execução. Em cada sessão recebe:

1. O `spec.md` da funcionalidade em desenvolvimento — via OpenSpec.
2. O trecho do `especificacao-api.yaml` referente ao endpoint envolvido.
3. Os arquivos relevantes do projeto.

**O que o Claude Code faz a partir desses contextos:**

| Tarefa | Contexto principal |
|---|---|
| Escrever testes (TDD) | `spec.md` — cada cenário GIVEN/WHEN/THEN vira um caso de teste |
| Implementar serviço de aplicação | `spec.md` (regras) + `especificacao-api.yaml` (contrato) |
| Implementar controller | `especificacao-api.yaml` — path, parâmetros, schemas, status codes |
| Criar DTOs e mapeamentos | `especificacao-api.yaml` — schemas de request/response |
| Implementar componente Angular | `spec.md` (comportamento) + schemas do `especificacao-api.yaml` |
| Atualizar spec após refinamento | `spec.md` existente + descrição do comportamento refinado |

### 2.4 especificacao-api.yaml

Contrato HTTP entre backend e frontend. Define endpoints, parâmetros, request bodies, response schemas e códigos de status.

- **Localização:** `familyfinance-api/src/main/resources/especificacao-api.yaml`
- **Formato:** OpenAPI 3.1
- **Papel:** complementar ao `spec.md` — o spec diz *o que* e *por que*, o yaml diz *como* via HTTP
- **Uso pelo Claude Code:** lido em toda sessão que envolva implementação de endpoints
- **Uso pelo springdoc-openapi:** gera Swagger UI automaticamente em `/swagger-ui.html`

**Distinção clara entre os dois artefatos:**

| Artefato | Define | Exemplo |
|---|---|---|
| `spec.md` | Intenção, regras de negócio, cenários | "Sistema deve rejeitar valor zero com mensagem X" |
| `especificacao-api.yaml` | Contrato HTTP | `POST /transacoes` → 201 Created, body: `TransacaoResposta` |

### 2.5 Como os Três Trabalham Juntos

```
Cenário: Implementar "criar transação recorrente"

spec.md (transacao-recorrencia):
  → Define: o que é recorrência, quais regras se aplicam,
    quais erros devem ser lançados, quais cenários testar

especificacao-api.yaml:
  → Define: POST /transacoes, campos recorrente e regraRecorrencia,
    schemas de CriarTransacaoComando e TransacaoResposta

Claude Code (sessão):
  1. Lê openspec/specs/transacao-recorrencia/spec.md
  2. Lê especificacao-api.yaml (path /transacoes)
  3. Escreve RecorrenciaServicoTeste.java com os cenários do spec (TDD)
  4. Implementa RecorrenciaServico.java até os testes passarem
  5. Implementa controller alinhado ao contrato do yaml
  6. Atualiza spec.md se algum comportamento foi refinado
  7. Commita spec.md + código juntos
```

---

## 3. Domínio e Entidades

### 3.1 Mapa do Domínio

```
Familia
  └── Membro (1..N)
        └── Transacao (1..N)
              ├── Categoria → Subcategoria
              └── Conta
  └── Investimento (1..N)
        └── LancamentoInvestimento (1..N)
  └── Meta (1..N)
  └── ResumoMensal (1..N)
```

### 3.2 Familia

Unidade raiz de isolamento. No beta, uma única família. Na evolução SaaS, cada família é um inquilino isolado.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `nome` | String(100) | Obrigatório |
| `email` | String(200) | Único no sistema |
| `plano` | Enum(`BETA`, `GRATIS`, `PRO`) | Padrão: `BETA` |
| `ativo` | Boolean | Padrão: `true` |
| `dataCriacao` | LocalDateTime | Gerado automaticamente |
| `dataAtualizacao` | LocalDateTime | Atualizado automaticamente |

### 3.3 Membro

Pessoa da família com acesso ao sistema.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | FK → Familia, obrigatório |
| `nome` | String(100) | Obrigatório |
| `email` | String(200) | Único por família |
| `perfil` | Enum(`ADMIN`, `MEMBRO`) | Obrigatório |
| `ativo` | Boolean | Padrão: `true` |
| `dataCriacao` | LocalDateTime | Gerado automaticamente |
| `dataAtualizacao` | LocalDateTime | Atualizado automaticamente |

**Perfis:**
- `ADMIN`: acesso total — todos os membros, categorias, metas, investimentos.
- `MEMBRO`: acesso restrito — apenas suas próprias transações; resumos da família somente leitura.

### 3.4 Categoria

Classificação de transações. Pré-definidas pelo sistema (`familiaId = null`) ou personalizadas por família.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | `null` = sistema; preenchido = personalizada |
| `nome` | String(80) | Obrigatório |
| `tipo` | Enum(`DESPESA`, `RECEITA`) | Obrigatório |
| `icone` | String(50) | Nome do ícone Material |
| `cor` | String(7) | Código HEX, ex: `#E53935` |
| `ativo` | Boolean | Padrão: `true` |

**Subcategoria:**

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `categoriaId` | UUID | FK → Categoria, obrigatório |
| `nome` | String(80) | Obrigatório |
| `ativo` | Boolean | Padrão: `true` |

**Categorias pré-definidas:**

| Categoria | Tipo | Subcategorias |
|---|---|---|
| Moradia | DESPESA | Aluguel, Condomínio, Energia, Água, Internet, IPTU |
| Alimentação | DESPESA | Supermercado, Restaurante, Delivery, Padaria |
| Transporte | DESPESA | Combustível, Transporte público, Aplicativo, Manutenção |
| Saúde | DESPESA | Plano de saúde, Farmácia, Consulta, Exame |
| Educação | DESPESA | Escola, Curso, Material, Livros |
| Lazer | DESPESA | Viagem, Cinema, Streaming, Eventos |
| Vestuário | DESPESA | Roupas, Calçados, Acessórios |
| Pets | DESPESA | Ração, Veterinário, Banho |
| Impostos | DESPESA | IR, IPVA, Outros |
| Outros Gastos | DESPESA | Diversos |
| Salário | RECEITA | CLT, PJ, Autônomo |
| Investimentos | RECEITA | Dividendos, Rendimentos, Resgate |
| Outros Ganhos | RECEITA | Freelance, Aluguel recebido, Presente |

### 3.5 Conta

Origem ou destino dos recursos financeiros.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | FK → Familia, obrigatório |
| `nome` | String(100) | Obrigatório, único por família |
| `tipo` | Enum(`CORRENTE`, `POUPANCA`, `CARTAO_CREDITO`, `CARTEIRA`, `INVESTIMENTO`) | Obrigatório |
| `saldoInicial` | BigDecimal | Padrão: 0.00 |
| `cor` | String(7) | Código HEX |
| `ativo` | Boolean | Padrão: `true` |

### 3.6 Transacao

Entidade central. Qualquer movimentação financeira da família.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | FK → Familia, obrigatório |
| `membroId` | UUID | FK → Membro, obrigatório |
| `contaId` | UUID | FK → Conta, obrigatório |
| `categoriaId` | UUID | FK → Categoria, obrigatório |
| `subcategoriaId` | UUID | FK → Subcategoria, opcional |
| `tipo` | Enum(`DESPESA`, `RECEITA`, `TRANSFERENCIA`) | Obrigatório |
| `valor` | BigDecimal | Obrigatório, > 0 |
| `descricao` | String(255) | Obrigatório |
| `data` | LocalDate | Obrigatório |
| `recorrente` | Boolean | Padrão: `false` |
| `regraRecorrencia` | Enum(`DIARIA`, `SEMANAL`, `QUINZENAL`, `MENSAL`, `ANUAL`) | Obrigatório se recorrente |
| `transacaoOrigemId` | UUID | FK self-ref — preenchido se gerada por recorrência |
| `efetivada` | Boolean | Padrão: `true` |
| `observacao` | String(500) | Opcional |
| `ativo` | Boolean | Padrão: `true` |
| `dataLancamento` | LocalDateTime | Gerado automaticamente |
| `dataCriacao` | LocalDateTime | Gerado automaticamente |
| `dataAtualizacao` | LocalDateTime | Atualizado automaticamente |

### 3.7 Investimento

Ativo financeiro da família.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | FK → Familia, obrigatório |
| `nome` | String(150) | Obrigatório |
| `tipo` | Enum(`RENDA_FIXA`, `RENDA_VARIAVEL`, `FUNDO`, `FII`, `CRIPTOMOEDA`, `PREVIDENCIA`, `OUTRO`) | Obrigatório |
| `instituicao` | String(100) | Obrigatório |
| `valorAporte` | BigDecimal | Soma dos aportes, padrão: 0.00 |
| `posicaoAtual` | BigDecimal | Valor atual da posição, padrão: 0.00 |
| `dataInicio` | LocalDate | Opcional |
| `ativo` | Boolean | Padrão: `true` |
| `observacao` | String(500) | Opcional |

### 3.8 LancamentoInvestimento

Histórico **imutável** de movimentações de um investimento.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `investimentoId` | UUID | FK → Investimento, obrigatório |
| `tipo` | Enum(`APORTE`, `RESGATE`, `RENDIMENTO`, `SNAPSHOT`) | Obrigatório |
| `valor` | BigDecimal | Obrigatório, > 0 |
| `data` | LocalDate | Obrigatório |
| `posicaoApos` | BigDecimal | Calculado pela aplicação |
| `observacao` | String(255) | Opcional |
| `dataCriacao` | LocalDateTime | Gerado automaticamente |

### 3.9 Meta

Objetivo financeiro com progresso rastreado.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | FK → Familia, obrigatório |
| `nome` | String(150) | Obrigatório |
| `descricao` | String(500) | Opcional |
| `valorAlvo` | BigDecimal | Obrigatório, > 0 |
| `valorAtual` | BigDecimal | Calculado pela aplicação, padrão: 0.00 |
| `dataAlvo` | LocalDate | Opcional |
| `situacao` | Enum(`EM_ANDAMENTO`, `CONCLUIDA`, `PAUSADA`, `CANCELADA`) | Padrão: `EM_ANDAMENTO` |
| `dataCriacao` | LocalDateTime | Gerado automaticamente |
| `dataAtualizacao` | LocalDateTime | Atualizado automaticamente |

### 3.10 ResumoMensal

Snapshot calculado por período e família/membro.

| Atributo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Gerado automaticamente |
| `familiaId` | UUID | FK → Familia, obrigatório |
| `membroId` | UUID | `null` = resumo da família; preenchido = individual |
| `periodo` | String(7) | Formato `AAAA-MM` |
| `totalReceitas` | BigDecimal | Soma das receitas efetivadas |
| `totalDespesas` | BigDecimal | Soma das despesas efetivadas |
| `saldo` | BigDecimal | `totalReceitas - totalDespesas` |
| `totalInvestido` | BigDecimal | Soma dos aportes no período |
| `dataCalculo` | LocalDateTime | Gerado automaticamente |

---

## 4. Regras de Negócio

### 4.1 Família e Membros

- `RN-01` — Toda entidade pertence a uma família. Nenhuma operação executa sem `familiaId` resolvido.
- `RN-02` — Apenas `ADMIN` pode criar, editar ou desativar membros.
- `RN-03` — Deve existir sempre ao menos um `ADMIN` ativo por família.
- `RN-04` — Membro inativo não pode lançar transações.

### 4.2 Transações

- `RN-10` — Valor deve ser positivo e maior que zero.
- `RN-11` — `DESPESA` debita; `RECEITA` credita; `TRANSFERENCIA` debita de uma conta e credita em outra.
- `RN-12` — `TRANSFERENCIA` exige contas de origem e destino distintas.
- `RN-13` — `efetivada = false` não entra no saldo real, apenas no saldo projetado.
- `RN-14` — Transação recorrente gera lançamentos futuros dos próximos 12 períodos com `efetivada = false`.
- `RN-15` — Lançamentos gerados por recorrência têm `transacaoOrigemId` preenchido.
- `RN-16` — Ao editar transação-mãe: escopo `APENAS_ESTE` ou `ESTE_E_FUTUROS`.
- `RN-17` — Exclusão sempre lógica (`ativo = false`). Histórico preservado.
- `RN-18` — Transação com `efetivada = true` não pode ter data futura.

### 4.3 Categorias

- `RN-20` — Categorias do sistema (`familiaId = null`) são somente leitura.
- `RN-21` — Família pode criar categorias personalizadas.
- `RN-22` — Desativar categoria preserva transações existentes; novos lançamentos não usam categoria inativa.
- `RN-23` — Subcategoria não pode ser movida entre categorias.

### 4.4 Contas

- `RN-30` — Saldo: `saldoInicial + Σ(receitas efetivadas) - Σ(despesas efetivadas)`.
- `RN-31` — `CARTAO_CREDITO` exibe fatura (soma das despesas do ciclo), não saldo positivo.
- `RN-32` — Conta inativa não aceita novos lançamentos.

### 4.5 Investimentos

- `RN-40` — `LancamentoInvestimento` é imutável. Erros corrigidos com estorno.
- `RN-41` — `posicaoAtual` do `Investimento` atualizado após cada lançamento.
- `RN-42` — Resgate não pode exceder `posicaoAtual`.
- `RN-43` — `SNAPSHOT` atualiza `posicaoAtual` sem alterar `valorAporte`.

### 4.6 Metas

- `RN-50` — `valorAtual` calculado pela aplicação a cada aporte.
- `RN-51` — `valorAtual >= valorAlvo` → situação muda automaticamente para `CONCLUIDA`.
- `RN-52` — Meta `CONCLUIDA` ou `CANCELADA` não aceita novos aportes.
- `RN-53` — Projeção de conclusão = média dos aportes dos últimos 3 meses.

### 4.7 Resumo Mensal

- `RN-60` — Recalculado sempre que transação do período é criada, editada ou desativada.
- `RN-61` — Considera apenas `efetivada = true` e `ativo = true`.
- `RN-62` — `membroId = null` → resumo da família. Preenchido → resumo individual.

---

## 5. Regras de Persistência

### 5.1 Convenções Gerais

- Nomes de tabelas e colunas em **português BR**, snake_case.
- Toda tabela tem `id UUID PRIMARY KEY`, gerado pela aplicação via `UUID.randomUUID()`.
- Toda tabela tem `data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- Tabelas com mutação têm `data_atualizacao TIMESTAMPTZ`.
- Exclusão sempre lógica via `ativo BOOLEAN NOT NULL DEFAULT TRUE`. Nunca `DELETE` físico.
- Toda query filtra `ativo = true` por padrão.
- Chaves estrangeiras: `fk_<tabela>_<referencia>`. Índices: `idx_<tabela>_<coluna>`. Únicas: `uk_<tabela>_<colunas>`.

### 5.2 Estratégia Multi-Inquilino

- v1 e v2: schema único, isolamento por `familia_id` em todas as tabelas.
- **Toda query deve incluir filtro por `familia_id`** — validado por testes de integração.
- v5+: migração para schema-por-inquilino ou RLS no PostgreSQL.

### 5.3 Migrações com Flyway

- Scripts em `src/main/resources/db/migration/`.
- Nomenclatura: `V{versao}__{descricao_em_portugues}.sql`.
- Nunca alterar scripts já aplicados em produção. Sempre criar novo script.

### 5.4 DDL Completo

```sql
CREATE TABLE familia (
    id               UUID          PRIMARY KEY,
    nome             VARCHAR(100)  NOT NULL,
    email            VARCHAR(200)  NOT NULL,
    plano            VARCHAR(20)   NOT NULL DEFAULT 'BETA',
    ativo            BOOLEAN       NOT NULL DEFAULT TRUE,
    data_criacao     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT uk_familia_email UNIQUE (email)
);

CREATE TABLE membro (
    id               UUID          PRIMARY KEY,
    familia_id       UUID          NOT NULL REFERENCES familia(id),
    nome             VARCHAR(100)  NOT NULL,
    email            VARCHAR(200)  NOT NULL,
    perfil           VARCHAR(20)   NOT NULL,
    ativo            BOOLEAN       NOT NULL DEFAULT TRUE,
    data_criacao     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT uk_membro_email_familia UNIQUE (email, familia_id),
    CONSTRAINT ck_membro_perfil CHECK (perfil IN ('ADMIN','MEMBRO'))
);
CREATE INDEX idx_membro_familia_id ON membro(familia_id);

CREATE TABLE categoria (
    id           UUID         PRIMARY KEY,
    familia_id   UUID         REFERENCES familia(id),
    nome         VARCHAR(80)  NOT NULL,
    tipo         VARCHAR(20)  NOT NULL,
    icone        VARCHAR(50),
    cor          VARCHAR(7),
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_categoria_tipo CHECK (tipo IN ('DESPESA','RECEITA'))
);
CREATE INDEX idx_categoria_familia_id ON categoria(familia_id);

CREATE TABLE subcategoria (
    id           UUID         PRIMARY KEY,
    categoria_id UUID         NOT NULL REFERENCES categoria(id),
    nome         VARCHAR(80)  NOT NULL,
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subcategoria_categoria_id ON subcategoria(categoria_id);

CREATE TABLE conta (
    id            UUID           PRIMARY KEY,
    familia_id    UUID           NOT NULL REFERENCES familia(id),
    nome          VARCHAR(100)   NOT NULL,
    tipo          VARCHAR(30)    NOT NULL,
    saldo_inicial NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    cor           VARCHAR(7),
    ativo         BOOLEAN        NOT NULL DEFAULT TRUE,
    data_criacao  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_conta_nome_familia UNIQUE (nome, familia_id),
    CONSTRAINT ck_conta_tipo CHECK (
        tipo IN ('CORRENTE','POUPANCA','CARTAO_CREDITO','CARTEIRA','INVESTIMENTO')
    )
);
CREATE INDEX idx_conta_familia_id ON conta(familia_id);

CREATE TABLE transacao (
    id                  UUID           PRIMARY KEY,
    familia_id          UUID           NOT NULL REFERENCES familia(id),
    membro_id           UUID           NOT NULL REFERENCES membro(id),
    conta_id            UUID           NOT NULL REFERENCES conta(id),
    categoria_id        UUID           NOT NULL REFERENCES categoria(id),
    subcategoria_id     UUID           REFERENCES subcategoria(id),
    tipo                VARCHAR(20)    NOT NULL,
    valor               NUMERIC(15,2)  NOT NULL,
    descricao           VARCHAR(255)   NOT NULL,
    data                DATE           NOT NULL,
    recorrente          BOOLEAN        NOT NULL DEFAULT FALSE,
    regra_recorrencia   VARCHAR(50),
    transacao_origem_id UUID           REFERENCES transacao(id),
    efetivada           BOOLEAN        NOT NULL DEFAULT TRUE,
    observacao          VARCHAR(500),
    ativo               BOOLEAN        NOT NULL DEFAULT TRUE,
    data_lancamento     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_criacao        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_atualizacao    TIMESTAMPTZ,
    CONSTRAINT ck_transacao_tipo CHECK (tipo IN ('DESPESA','RECEITA','TRANSFERENCIA')),
    CONSTRAINT ck_transacao_valor CHECK (valor > 0),
    CONSTRAINT ck_transacao_recorrencia CHECK (
        recorrente = FALSE OR regra_recorrencia IS NOT NULL
    )
);
CREATE INDEX idx_transacao_familia_id   ON transacao(familia_id);
CREATE INDEX idx_transacao_membro_id    ON transacao(membro_id);
CREATE INDEX idx_transacao_familia_data ON transacao(familia_id, data);
CREATE INDEX idx_transacao_efetivada    ON transacao(efetivada);
CREATE INDEX idx_transacao_origem_id    ON transacao(transacao_origem_id);

CREATE TABLE investimento (
    id               UUID           PRIMARY KEY,
    familia_id       UUID           NOT NULL REFERENCES familia(id),
    nome             VARCHAR(150)   NOT NULL,
    tipo             VARCHAR(30)    NOT NULL,
    instituicao      VARCHAR(100)   NOT NULL,
    valor_aporte     NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    posicao_atual    NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    data_inicio      DATE,
    ativo            BOOLEAN        NOT NULL DEFAULT TRUE,
    observacao       VARCHAR(500),
    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ
);
CREATE INDEX idx_investimento_familia_id ON investimento(familia_id);

CREATE TABLE lancamento_investimento (
    id               UUID           PRIMARY KEY,
    investimento_id  UUID           NOT NULL REFERENCES investimento(id),
    tipo             VARCHAR(20)    NOT NULL,
    valor            NUMERIC(15,2)  NOT NULL,
    data             DATE           NOT NULL,
    posicao_apos     NUMERIC(15,2)  NOT NULL,
    observacao       VARCHAR(255),
    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_lancamento_tipo CHECK (tipo IN ('APORTE','RESGATE','RENDIMENTO','SNAPSHOT')),
    CONSTRAINT ck_lancamento_valor CHECK (valor > 0)
);
CREATE INDEX idx_lancamento_investimento_id ON lancamento_investimento(investimento_id);

CREATE TABLE meta (
    id               UUID           PRIMARY KEY,
    familia_id       UUID           NOT NULL REFERENCES familia(id),
    nome             VARCHAR(150)   NOT NULL,
    descricao        VARCHAR(500),
    valor_alvo       NUMERIC(15,2)  NOT NULL,
    valor_atual      NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    data_alvo        DATE,
    situacao         VARCHAR(20)    NOT NULL DEFAULT 'EM_ANDAMENTO',
    data_criacao     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    data_atualizacao TIMESTAMPTZ,
    CONSTRAINT ck_meta_situacao CHECK (
        situacao IN ('EM_ANDAMENTO','CONCLUIDA','PAUSADA','CANCELADA')
    ),
    CONSTRAINT ck_meta_valor_alvo CHECK (valor_alvo > 0)
);
CREATE INDEX idx_meta_familia_id ON meta(familia_id);

CREATE TABLE resumo_mensal (
    id               UUID           PRIMARY KEY,
    familia_id       UUID           NOT NULL REFERENCES familia(id),
    membro_id        UUID           REFERENCES membro(id),
    periodo          VARCHAR(7)     NOT NULL,
    total_receitas   NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    total_despesas   NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    saldo            NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    total_investido  NUMERIC(15,2)  NOT NULL DEFAULT 0.00,
    data_calculo     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_resumo_familia_membro_periodo UNIQUE (familia_id, membro_id, periodo),
    CONSTRAINT ck_resumo_periodo CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$')
);
CREATE INDEX idx_resumo_familia_periodo ON resumo_mensal(familia_id, periodo);
```

---

## 6. Regras de Tela e UI/UX

### 6.1 Princípios de Interface

- Interface em **português BR** — sem termos em inglês visíveis ao usuário.
- Design responsivo: funcional em desktop (prioridade), tablet e celular.
- Paleta: verde para receitas, vermelho para despesas, azul para investimentos, âmbar para metas.
- Feedback visual imediato: `snackbar` de sucesso ou erro após operações.
- Confirmação explícita para ações destrutivas.
- Carregamento com skeleton/spinner — sem telas em branco.
- Validação em tempo real nos formulários.
- Datas: `DD/MM/AAAA`. Valores: `R$ 0.000,00`.

### 6.2 Estrutura de Navegação

```
/ (Painel Principal)
├── /transacoes
│     ├── /transacoes/nova
│     └── /transacoes/:id/editar
├── /investimentos
│     ├── /investimentos/novo
│     └── /investimentos/:id
├── /metas
│     ├── /metas/nova
│     └── /metas/:id
├── /contas
│     ├── /contas/nova
│     └── /contas/:id
├── /relatorios
│     ├── /relatorios/fluxo-caixa
│     ├── /relatorios/por-categoria
│     └── /relatorios/evolucao-patrimonio
└── /configuracoes
      ├── /configuracoes/categorias
      └── /configuracoes/membros
```

### 6.3 Painel Principal

| Widget | Descrição |
|---|---|
| Saldo do mês | Receitas − Despesas efetivadas. Variação vs. mês anterior. |
| Gastos por categoria | Top 5 categorias com barra de progresso colorida. |
| Fluxo dos últimos 6 meses | Gráfico de barras agrupadas (receitas vs. despesas). |
| Resumo de investimentos | Total aportado, posição atual, variação percentual. |
| Progresso das metas | Cards compactos com percentual e barra de progresso. |
| Últimas transações | Lista das 10 mais recentes com ícone, categoria, valor e data. |

### 6.4 Tela de Transações

**Lista:** tabela paginada (20/página), filtros por período/tipo/categoria/membro/conta/efetivada, busca com debounce 400ms, ordenação por data/valor/descrição, totalizadores no rodapé, ação rápida de efetivar.

**Formulário:** tipo (seleção visual), valor, data, descrição, categoria, subcategoria (dinâmica), conta, membro, recorrente (toggle), regra de recorrência (visível se recorrente), efetivada (toggle), observação. Para `TRANSFERENCIA`: campo "conta destino" aparece, "categoria" some.

### 6.5 Tela de Investimentos

**Lista:** cards com nome, tipo, instituição, valor aportado, posição atual, rentabilidade %.

**Detalhe:** histórico de lançamentos cronológico, gráfico de evolução, botões: Novo Aporte / Resgate / Atualizar Posição / Rendimento.

### 6.6 Tela de Metas

**Lista:** cards com nome, barra de progresso, percentual, data alvo, situação.

**Detalhe:** histórico de aportes, projeção de conclusão, botão Registrar Aporte.

### 6.7 Relatórios

| Relatório | Visualização |
|---|---|
| Fluxo de caixa | Tabela + gráfico de barras mês a mês. Exportação CSV. |
| Por categoria | Gráfico de pizza + tabela com valor e percentual. |
| Evolução do patrimônio | Gráfico de linha: saldo acumulado + posição de investimentos. |

---

## 7. Versão 1 — Spring MVC + Angular + PostgreSQL

### 7.1 Escopo

Versão funcional completa para uso real da família. Sem autenticação (rede interna). Uma única família (beta), `familia_id` presente em todas as tabelas desde o início.

### 7.2 Stack

| Camada | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 3.x, Spring MVC, Spring Data JPA, Hibernate |
| Banco de dados | PostgreSQL 16 |
| Migrações | Flyway |
| Mapeamento | MapStruct |
| Validação | Bean Validation (Jakarta) |
| Testes backend | JUnit 5, Mockito, Testcontainers (PostgreSQL) |
| Frontend | Angular 18, TypeScript 5, Angular Material 3 |
| Gráficos | Chart.js com ng2-charts |
| Estado | NgRx Signals |
| Testes frontend | Jest, Angular Testing Library |
| Build | Maven (backend), Angular CLI (frontend) |
| Contrato HTTP | OpenAPI 3.1 — `especificacao-api.yaml` |
| Documentação interativa | springdoc-openapi → `/swagger-ui.html` |
| Contexto persistente | **OpenSpec** — `openspec/specs/` |
| Agente de desenvolvimento | **Claude Code** |
| Contêineres | Docker + Docker Compose |

### 7.3 Specs OpenSpec da v1

```
openspec/specs/
├── transacao-criar/spec.md
├── transacao-editar/spec.md
├── transacao-recorrencia/spec.md
├── transacao-transferencia/spec.md
├── transacao-efetivar/spec.md
├── investimento-lancamento/spec.md
├── investimento-posicao/spec.md
├── meta-progresso/spec.md
├── meta-projecao/spec.md
├── conta-saldo/spec.md
├── categoria-personalizada/spec.md
└── relatorio-resumo-mensal/spec.md
```

### 7.4 Estrutura do Projeto Backend

```
familyfinance-api/
├── openspec/specs/                      # Specs OpenSpec — contexto para Claude Code
├── src/
│   ├── main/
│   │   ├── java/br/com/familyfinance/
│   │   │   ├── api/                     # Controllers
│   │   │   ├── dominio/                 # Entidades JPA e enumerações
│   │   │   ├── aplicacao/               # Serviços de casos de uso
│   │   │   ├── infraestrutura/          # Repositórios e configurações
│   │   │   └── compartilhado/           # Exceções e utilitários
│   │   └── resources/
│   │       ├── especificacao-api.yaml   # Contrato HTTP — lido pelo Claude Code
│   │       ├── application.yml
│   │       └── db/migration/
│   └── test/
└── pom.xml
```

### 7.5 Estrutura do Projeto Frontend

```
familyfinance-web/
├── openspec/specs/                  # Specs OpenSpec (mesmos do backend via symlink ou cópia)
├── src/
│   ├── app/
│   │   ├── nucleo/
│   │   │   ├── interceptores/
│   │   │   └── servicos/            # Serviços HTTP alinhados ao especificacao-api.yaml
│   │   ├── compartilhado/
│   │   │   ├── componentes/
│   │   │   └── pipes/
│   │   └── funcionalidades/
│   │       ├── painel/
│   │       ├── transacoes/
│   │       ├── investimentos/
│   │       ├── metas/
│   │       ├── relatorios/
│   │       └── configuracoes/
│   └── estilos/
└── angular.json
```

### 7.6 Contrato HTTP — Estrutura do especificacao-api.yaml

```yaml
openapi: "3.1.0"
info:
  title: "FamilyFinance API"
  version: "1.0.0"

paths:
  /transacoes:             # GET (filtros + paginação), POST
  /transacoes/{id}:        # GET, PUT, DELETE (lógico)
  /transacoes/{id}/efetivar: # PATCH

  /investimentos:          # GET, POST
  /investimentos/{id}:     # GET, PUT
  /investimentos/{id}/lancamentos: # POST

  /metas:                  # GET, POST
  /metas/{id}:             # GET, PUT
  /metas/{id}/situacao:    # PATCH

  /contas:                 # GET, POST
  /contas/{id}:            # GET, PUT
  /contas/{id}/saldo:      # GET

  /categorias:             # GET, POST
  /categorias/{id}:        # PUT, PATCH (ativo)
  /categorias/{id}/subcategorias: # GET, POST

  /relatorios/resumo-mensal:        # GET
  /relatorios/fluxo-caixa:          # GET
  /relatorios/por-categoria:        # GET
  /relatorios/evolucao-patrimonio:  # GET
```

### 7.7 Ambiente Local

```yaml
# compose.yaml
services:
  banco:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: familyfinance
      POSTGRES_USER: familyfinance
      POSTGRES_PASSWORD: familyfinance
    ports: ["5432:5432"]

  api:
    build: ./familyfinance-api
    depends_on: [banco]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://banco:5432/familyfinance
    ports: ["8080:8080"]

  web:
    build: ./familyfinance-web
    depends_on: [api]
    ports: ["4200:80"]
```

---

## 8. Versão 2 — Login, Autenticação e Autorização

### 8.1 Escopo

Autenticação segura com JWT, autorização por perfil. Sistema acessível pela internet.

### 8.2 O que Muda

**Backend:** Spring Security 6 + JWT. Endpoints `/autenticacao/entrar`, `/autenticacao/renovar`, `/autenticacao/sair`. `familiaId` e `membroId` sempre extraídos do token, nunca do cliente.

**Campos adicionados em Membro:**

| Atributo | Tipo | Regra |
|---|---|---|
| `senhaHash` | String | BCrypt custo 12, nunca exposto |
| `ultimoAcesso` | LocalDateTime | Atualizado a cada login |
| `tentativasFalhas` | Integer | Bloqueio após 5 tentativas |
| `bloqueadoAte` | LocalDateTime | Bloqueio de 15 minutos |
| `tokenRecuperacao` | String | UUID para reset de senha |
| `tokenExpiracao` | LocalDateTime | Expira em 1 hora |

**Frontend:** `AutenticacaoGuarda`, `TokenInterceptor`, interceptor de renovação automática. Telas: `/entrar`, `/esqueci-senha`, `/redefinir-senha`.

**Novos specs OpenSpec:**
```
openspec/specs/
├── autenticacao-login/spec.md
├── autenticacao-renovar-token/spec.md
└── autenticacao-recuperacao-senha/spec.md
```

### 8.3 Regras de Segurança

- `RS-01` — Toda rota exceto `/autenticacao/**` exige JWT válido.
- `RS-02` — `MEMBRO` acessa apenas seus dados. `ADMIN` acessa todos.
- `RS-03` — `familiaId` sempre extraído do token, nunca informado pelo cliente.
- `RS-04` — 5 tentativas falhas bloqueiam por 15 minutos.
- `RS-05` — Token de recuperação expira em 1 hora.
- `RS-06` — Refresh token em `HttpOnly cookie` — nunca em `localStorage`.

---

## 9. Versão 3 — Microserviços, Kafka, Arquitetura Limpa e Hexagonal

### 9.1 Escopo

Decomposição em microserviços com arquitetura limpa e hexagonal. Comunicação assíncrona com Kafka. Resiliência, observabilidade e idempotência.

### 9.2 Microserviços

| Serviço | Responsabilidade |
|---|---|
| `servico-familia` | Famílias e membros |
| `servico-transacao` | Transações e recorrência |
| `servico-investimento` | Investimentos e lançamentos |
| `servico-meta` | Metas e progresso |
| `servico-relatorio` | Resumos e relatórios (read model) |
| `servico-notificacao` | E-mails e push |
| `api-gateway` | Roteamento, auth JWT, rate limiting |

### 9.3 Arquitetura por Serviço

```
servico-transacao/
├── dominio/               # Núcleo puro — zero dependências externas
│   ├── modelo/
│   ├── servico/
│   └── porta/
│       ├── entrada/       # Interfaces de casos de uso
│       └── saida/         # Interfaces de repositório e mensageria
├── aplicacao/             # Orquestração
└── infraestrutura/
    ├── entrada/
    │   ├── http/          # Adaptador REST
    │   └── mensageria/    # Adaptador Kafka consumer
    └── saida/
        ├── persistencia/  # Adaptador JPA
        └── mensageria/    # Adaptador Kafka producer
```

### 9.4 Tópicos Kafka

| Tópico | Produzido por | Consumido por |
|---|---|---|
| `transacao.criada` | servico-transacao | servico-relatorio, servico-notificacao |
| `transacao.efetivada` | servico-transacao | servico-relatorio |
| `investimento.atualizado` | servico-investimento | servico-relatorio |
| `meta.concluida` | servico-meta | servico-notificacao |

### 9.5 Resiliência e Observabilidade

**Resiliência (Resilience4j):** Circuit Breaker, Retry, Fallback, Timeout em chamadas HTTP entre serviços. Idempotência via tabela `evento_processado` em todo consumidor Kafka.

**Observabilidade:** Logs estruturados JSON com `traceId`, `familiaId`, `servicoNome`. Rastreamento distribuído com Micrometer Tracing + Zipkin. Métricas com Prometheus + Grafana.

---

## 10. Versão 4 — Saga e Outbox

### 10.1 Transactional Outbox

Garante que evento Kafka é publicado se e somente se a transação no banco foi confirmada.

```sql
CREATE TABLE caixa_saida (
    id              UUID        PRIMARY KEY,
    tipo_agregado   VARCHAR(100) NOT NULL,
    id_agregado     UUID        NOT NULL,
    tipo_evento     VARCHAR(100) NOT NULL,
    payload         JSONB       NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE',
    tentativas      INTEGER      NOT NULL DEFAULT 0,
    data_criacao    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    data_publicacao TIMESTAMPTZ,
    CONSTRAINT ck_caixa_status CHECK (status IN ('PENDENTE','PUBLICADO','FALHA'))
);
```

### 10.2 Saga por Coreografia

```
1. servico-transacao  → publica: TransacaoCriadaEvento
2. servico-meta       → consome → atualiza meta → publica: MetaAtualizadaEvento
3. servico-relatorio  → consome ambos → atualiza resumo
4. servico-notificacao → consome: MetaConcluidaEvento → envia notificação

Compensação (falha):
  → AtualizacaoMetaFalhouEvento → servico-transacao decide desfazer ou escalar
```

---

## 11. Versões Futuras

| Versão | Possível Foco |
|---|---|
| v5 | Multi-inquilino real: onboarding, planos Free/Pro, Stripe |
| v6 | Importação de extratos OFX/CSV |
| v7 | Open Finance (PIX e APIs de bancos) |
| v8 | Aplicativo móvel (Angular + Capacitor ou Flutter) |
| v9 | Análise preditiva e sugestões com IA |
| v10 | Integração com corretoras |

---

## 12. Decisões Arquiteturais (ADRs)

### ADR-01 — Português BR em todo o projeto
**Decisão:** Todo artefato usa português BR sem exceção. Termos técnicos universais (`UUID`, `JWT`, `HTTP`) permanecem em inglês.
**Motivo:** Consistência total elimina tradução mental e melhora leitura dos specs pelo Claude Code.

### ADR-02 — OpenSpec como camada de contexto persistente
**Decisão:** Cada funcionalidade tem `openspec/specs/<funcionalidade>/spec.md`. O Claude Code lê o spec antes de qualquer implementação. Toda mudança começa com `/openspec:proposal`. Spec e código são commitados juntos.
**Motivo:** O Claude Code não retém contexto entre sessões. O spec garante que o agente parte sempre com a intenção correta, independente de quando a sessão foi iniciada.

### ADR-03 — especificacao-api.yaml como contrato HTTP
**Decisão:** Define endpoints, parâmetros e schemas. Lido pelo Claude Code junto ao spec. Gera Swagger UI via springdoc-openapi.
**Distinção:** `spec.md` = *o que* e *por que*. `especificacao-api.yaml` = *como* via HTTP. Os dois são complementares — nenhum substitui o outro.

### ADR-04 — UUID gerado pela aplicação
**Decisão:** `UUID.randomUUID()` na aplicação, nunca pelo banco.
**Motivo:** IDs globalmente únicos sem coordenação — prepara para microserviços.

### ADR-05 — Exclusão lógica universal
**Decisão:** Nunca `DELETE` físico. Sempre `ativo = false`. Toda query filtra `ativo = true`.
**Motivo:** Histórico financeiro é auditável e irreversível.

### ADR-06 — TDD com cenários do spec.md
**Decisão:** Cenários GIVEN/WHEN/THEN do `spec.md` → casos de teste → implementação. Cobertura mínima de 80% em `aplicacao/`.
**Motivo:** O spec é a fonte dos casos de teste — garante que o que foi especificado está testado.

### ADR-07 — Idempotência em consumidores Kafka (v3+)
**Decisão:** Verificar `eventoId` em `evento_processado` antes de processar.
**Motivo:** Kafka garante "at-least-once". Sem idempotência, reprocessamentos duplicam dados financeiros.

---

## 13. Padrões de Desenvolvimento

### 13.1 Nomenclatura

| Artefato | Padrão | Exemplo |
|---|---|---|
| Classe Java | PascalCase, português | `TransacaoServico`, `ContaRepositorio` |
| Método Java | camelCase, verbo português | `criarTransacao()`, `buscarPorPeriodo()` |
| Variável Java | camelCase, português | `valorTotal`, `dataVencimento` |
| Constante Java | UPPER_SNAKE_CASE, português | `LIMITE_TENTATIVAS_LOGIN` |
| Tabela banco | snake_case, singular, português | `transacao`, `lancamento_investimento` |
| Coluna banco | snake_case, português | `familia_id`, `data_criacao` |
| Tópico Kafka | dominio.evento, português | `transacao.criada`, `meta.concluida` |
| Endpoint REST | kebab-case, português | `/transacoes`, `/relatorios/fluxo-caixa` |
| Spec OpenSpec | kebab-case, português | `transacao-criar`, `meta-progresso` |
| Componente Angular | kebab-case | `lista-transacoes`, `formulario-transacao` |
| Branch Git | kebab-case | `feat/criar-transacao`, `fix/calculo-saldo` |
| Commit | Imperativo, português | `Adiciona validação de valor negativo em transações` |

### 13.2 Fluxo Completo: OpenSpec + Claude Code

```
1. PLANEJAR (antes de qualquer código)
   /openspec:proposal <descrição da mudança>
   → Gera: proposal.md, design.md, tasks.md, deltas dos specs

2. REVISAR
   Aprovar proposal.md e design.md
   Ajustar spec.md se necessário

3. INICIAR SESSÃO DO CLAUDE CODE
   Claude Code lê:
   a. openspec/specs/<funcionalidade>/spec.md   ← intenção + cenários
   b. especificacao-api.yaml (endpoint relevante) ← contrato HTTP
   c. Arquivos existentes relacionados

4. IMPLEMENTAR (TDD obrigatório)
   a. Escrever testes a partir dos cenários do spec (red)
   b. Implementar até os testes passarem (green)
   c. Refatorar mantendo verde (refactor)

5. COMMITAR (spec + código juntos)
   git add openspec/specs/<funcionalidade>/spec.md
   git add src/...
   git commit -m "Implementa <funcionalidade>"

6. REVISAR NO PR
   Diff do spec = revisão de intenção
   Diff do código = revisão de implementação
```

### 13.3 Tratamento de Erros da API

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 422,
  "erro": "Regra de negócio violada",
  "mensagem": "O valor da transação deve ser maior que zero",
  "caminho": "/transacoes"
}
```

| Situação | Status |
|---|---|
| Recurso não encontrado | 404 |
| Regra de negócio violada | 422 |
| Validação de campos | 400 |
| Não autenticado (v2+) | 401 |
| Sem permissão (v2+) | 403 |
| Erro interno | 500 |

---

*Documento mantido no repositório. Toda mudança de arquitetura ou regra de negócio é refletida aqui e no `spec.md` correspondente antes de ser implementada.*
