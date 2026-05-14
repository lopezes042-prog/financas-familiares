## Why

Os 6 bugs intencionais deixados como exercício de treinamento foram concluídos pela analista júnior e precisam ser aplicados na branch `desenvolvimento` para desbloquear a implementação de novas features. Sem essas correções, operações básicas de listagem, criação e edição de contas estão quebradas.

## What Changes

- **BUG-01** — `ContaServico.urlBase`: `/conta` → `/contas` (endpoint correto da API)
- **BUG-02** — `ContaServico.atualizar()`: `http.post` → `http.put` (método HTTP correto para atualização)
- **BUG-03** — `ListaContasComponent.carregarContas()`: adiciona callback `error` no subscribe para parar o spinner em caso de falha HTTP
- **BUG-04** — `FormularioContaComponent`: adiciona `Validators.minLength(2)` no campo `nome` para alinhar com o contrato da API (2–100 chars)
- **BUG-05** — `FormularioContaComponent.atualizar()`: remove `saldoInicial` do payload enviado, que não é aceito por `EditarContaComando`
- **BUG-06** — template `formulario-conta.component.html`: botão "Salvar" de `type="button"` para `type="submit"` para que o clique dispare o formulário
- **Limpeza** — remoção de todos os comentários `🐛 BUG-INTENCIONAL-XX` dos arquivos corrigidos
- **Teste** — adição de caso de teste em `lista-contas.component.spec.ts` cobrindo `carregando() === false` após erro (conforme nota já existente no spec)

## Capabilities

### New Capabilities

Nenhuma. Esta change não introduz capacidades novas.

### Modified Capabilities

- `conta-gerenciar`: os requisitos de comportamento não mudam — a mudança corrige a implementação para que o comportamento especificado passe a funcionar de fato. Nenhum delta de spec necessário.

## Impact

**Arquivos alterados:**
- `familyfinance-web/src/app/nucleo/servicos/conta.servico.ts` (BUG-01, BUG-02)
- `familyfinance-web/src/app/funcionalidades/contas/lista-contas/lista-contas.component.ts` (BUG-03)
- `familyfinance-web/src/app/funcionalidades/contas/lista-contas/lista-contas.component.spec.ts` (BUG-03 — novo teste + remoção de comentário)
- `familyfinance-web/src/app/funcionalidades/contas/formulario-conta/formulario-conta.component.ts` (BUG-04, BUG-05)
- `familyfinance-web/src/app/funcionalidades/contas/formulario-conta/formulario-conta.component.html` (BUG-06)

**APIs:** nenhuma mudança de contrato — alinha o frontend ao contrato já existente.

**Rotas/navegação:** sem impacto.

**Dependências:** sem novas dependências.

## Fora do Escopo

- Melhorias de UX além das necessárias para as correções (ex: proteção contra duplo-submit)
- Qualquer nova feature de contas
- Correção de outros arquivos não listados acima

## Critérios de Aceite

- `npm test` passa com todos os testes (incluindo o novo caso de BUG-03)
- A listagem de contas envia `GET /api/contas` (não `/api/conta`)
- Editar conta envia `PUT /api/contas/{id}` (não POST)
- O spinner para após erro HTTP na listagem
- O formulário rejeita `nome` com menos de 2 caracteres antes de chamar a API
- O payload de edição não contém o campo `saldoInicial`
- Clicar no botão "Salvar" chama `salvar()` via submit do formulário
- Nenhum comentário `🐛 BUG-INTENCIONAL-XX` permanece nos arquivos
