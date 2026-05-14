# Delta: conta-gerenciar

Nenhum requisito muda. O spec em `openspec/specs/conta-gerenciar/spec.md` já descreve
o comportamento correto — inclusive "parar o spinner" no cenário de erro de conexão
(Requirement: Listar contas ativas / Scenario: Erro de conexão).

Esta change corrige a implementação para que ela passe a satisfazer os requisitos
já especificados.
