# conta-gerenciar Specification

## Purpose

Permitir ao usuário visualizar, criar, editar e desativar contas financeiras (corrente, poupança,
cartão de crédito, carteira, investimento). As contas são a base para o lançamento de transações.

Contrato HTTP: `documentacao-inicial-frontend/contratos-frontend-projeto-inicial.md`
Backend: `GET|POST|PUT|PATCH /contas` e `GET /contas/{id}/saldo`

---

## Requirements

### Requirement: Listar contas ativas

The system SHALL display all active accounts loaded from the backend.

#### Scenario: Carregamento bem-sucedido

- GIVEN que o backend retorna uma lista de contas
- WHEN o componente de lista é inicializado
- THEN exibir spinner durante a requisição
- AND exibir a tabela com as contas ao receber a resposta
- AND mostrar: nome, tipo (rótulo em português), saldo inicial formatado em BRL, amostra de cor e ações

#### Scenario: Lista vazia

- GIVEN que o backend retorna lista vazia
- WHEN o componente de lista é inicializado
- THEN não exibir a tabela
- AND exibir estado vazio com mensagem e link para criar a primeira conta

#### Scenario: Erro de conexão

- GIVEN que o backend não está disponível (status 0)
- WHEN o componente de lista é inicializado
- THEN exibir snackbar com "Não foi possível conectar ao servidor. Verifique sua conexão."
- AND parar o spinner
- AND não exibir tabela nem estado vazio

---

### Requirement: Criar conta

The system SHALL allow creating a new account with name, type, initial balance and optional color.

#### Scenario: Criação bem-sucedida

- GIVEN que o formulário tem nome (≥ 2 chars), tipo selecionado e saldo inicial ≥ 0
- WHEN o usuário submete o formulário
- THEN chamar POST /contas com os campos válidos (sem saldoInicial se undefined)
- AND exibir snackbar "Conta criada com sucesso"
- AND navegar para /contas

#### Scenario: Nome ausente

- GIVEN que o campo nome está vazio
- WHEN o usuário tenta submeter o formulário
- THEN não chamar a API
- AND marcar o campo como tocado e exibir "O nome é obrigatório."

#### Scenario: Nome muito curto

- GIVEN que o campo nome tem menos de 2 caracteres
- WHEN o usuário tenta submeter o formulário
- THEN não chamar a API
- AND exibir "O nome deve ter no mínimo 2 caracteres."

#### Scenario: Nome duplicado (erro do backend)

- GIVEN que já existe uma conta com o mesmo nome na família
- WHEN o usuário submete o formulário com esse nome
- THEN o backend retorna 422 com `mensagem: "Já existe uma conta com este nome"`
- AND exibir o snackbar com a mensagem do backend

---

### Requirement: Editar conta

The system SHALL allow editing the name, type and color of an existing account.
The initial balance is immutable after creation.

#### Scenario: Carregamento dos dados para edição

- GIVEN que o usuário navega para /contas/:id/editar com um id válido
- WHEN o componente é inicializado
- THEN carregar os dados da conta via GET /contas/{id}
- AND preencher o formulário com nome, tipo e cor
- AND desabilitar o campo saldoInicial (imutável)

#### Scenario: Atualização bem-sucedida

- GIVEN que o formulário de edição está válido
- WHEN o usuário submete o formulário
- THEN chamar PUT /contas/{id} com nome, tipo e cor (sem saldoInicial)
- AND exibir snackbar "Conta atualizada com sucesso"
- AND navegar para /contas

#### Scenario: Conta não encontrada ao editar

- GIVEN que o id na URL não corresponde a nenhuma conta ativa
- WHEN o componente tenta carregar os dados
- THEN o backend retorna 404
- AND navegar automaticamente para /contas
- AND o interceptor exibe snackbar "Recurso não encontrado."

---

### Requirement: Desativar conta

The system SHALL allow deactivating an account after explicit confirmation.
Deactivation is logical (ativo = false) — historical data is preserved.

#### Scenario: Desativação confirmada

- GIVEN que o usuário clica em desativar e confirma no diálogo
- WHEN o diálogo fecha com `true`
- THEN chamar PATCH /contas/{id}/ativo com `{ ativo: false }`
- AND exibir snackbar "Conta desativada"
- AND recarregar a lista de contas

#### Scenario: Desativação cancelada

- GIVEN que o usuário clica em desativar mas cancela no diálogo
- WHEN o diálogo fecha com `false` ou sem valor
- THEN não chamar a API
- AND permanecer na lista sem alterações

---

### Requirement: Feedback de erros

The system SHALL display user-friendly error messages for all API failures.

#### Scenario: Erro de validação (400)

- GIVEN que o backend retorna 400 com campo `mensagem`
- WHEN qualquer requisição falha com esse status
- THEN exibir o conteúdo de `erro.error.mensagem` no snackbar

#### Scenario: Erro de regra de negócio (422)

- GIVEN que o backend retorna 422 com campo `mensagem`
- WHEN qualquer requisição falha com esse status
- THEN exibir o conteúdo de `erro.error.mensagem` no snackbar

#### Scenario: Erro sem mensagem do backend

- GIVEN que o backend retorna erro sem campo `mensagem`
- WHEN o interceptor trata o erro
- THEN exibir mensagem de fallback baseada no status HTTP
