# Proposta: Projeto Inicial do FamilyFinance Web

## Resumo

Criar o esqueleto funcional do frontend Angular do FamilyFinance: estrutura de projeto,
design system, layout de navegação, CRUD completo de Contas e infraestrutura HTTP.
O resultado é uma aplicação Angular 21 pronta para crescer com novas funcionalidades,
com a funcionalidade de Contas plenamente operacional e conectada ao backend Spring Boot.

## Motivação

O backend da v1 está pronto e expondo os endpoints de Contas. Este projeto cria a camada
de apresentação que permite o uso real do sistema — a primeira entrega funcional para a família.

Esta entrega também serve como base de treinamento para a Analista Júnior: o projeto
é gerado com **6 bugs intencionais** (documentados para o mentor), cobrindo erros comuns
de frontend Angular. A Júnior deve identificar e corrigir todos antes de considerar a
tarefa concluída.

## Escopo

### Inclui

- Projeto Angular 21 criado com `ng new`, standalone, strict mode, SCSS
- Dois ambientes configurados: desenvolvimento e produção (`src/ambientes/`)
- Design system completo: tokens, tipografia, tema Angular Material M2 dark "Halloween",
  utilitários, layout e overrides de componentes (`src/estilos/`)
- Componente de layout principal com sidenav fixo e `router-outlet`
- Funcionalidade **Contas**: listar, criar, editar, desativar (com confirmação)
- Serviço `ContaServico` consumindo todos os endpoints de `/contas`
- Interceptor global de erros HTTP com feedback via `MatSnackBar`
- Componente de diálogo de confirmação reutilizável
- Modelos TypeScript alinhados ao contrato da API
- Testes unitários para os componentes de Contas
- Configuração de qualidade: ESLint, Prettier, Husky + lint-staged, editorconfig

### Fora do Escopo

- Autenticação e autorização (entra na v2)
- Outras entidades: Transação, Investimento, Meta, Categoria, Membro
- Paginação (sem volume suficiente na v1)
- Internacionalização e modo escuro alternativo
- Testes E2E
- PWA / service workers
- Relatórios e gráficos

## Rotas após esta change

```
/ → redireciona para /contas
/contas                    → ListaContasComponent
/contas/nova               → FormularioContaComponent (modo criação)
/contas/:id/editar         → FormularioContaComponent (modo edição)
** → redireciona para /
```

## Bugs Intencionais (apenas para o mentor)

O projeto deve ser gerado **com os bugs abaixo presentes**, conforme especificado em
`familyfinance-web-projeto-inicial.md`. Não corrigir durante a geração.

| ID | Localização | Categoria |
|----|-------------|-----------|
| BUG-01 | `ContaServico.urlBase` | URL incorreta (`/conta` em vez de `/contas`) |
| BUG-02 | `ContaServico.atualizar()` | Método HTTP errado (`POST` em vez de `PUT`) |
| BUG-03 | `ListaContasComponent.carregarContas()` | Falta callback `error` no subscribe |
| BUG-04 | `FormularioContaComponent.formulario` | Falta `Validators.minLength(2)` no nome |
| BUG-05 | `FormularioContaComponent.atualizar()` | Envia `saldoInicial` no comando de edição |
| BUG-06 | `formulario-conta.component.html` | Botão salvar com `type="button"` em vez de `type="submit"` |

## Critérios de Aceite

- `npm start` sobe em `http://localhost:4200` sem erros de compilação
- `npm run build:prod` gera bundle sem warnings (com arquivo de ambiente de produção)
- `npm run lint` passa sem erros
- Layout exibe sidenav com opção "Contas"
- Lista de contas carrega do backend e exibe a tabela
- Criar, editar e desativar conta funcionam (após correção dos bugs pelos desenvolvedores)
- Erros do backend aparecem via snackbar com a mensagem de `erro.error.mensagem`
- Testes unitários passam com `npm test`
