# FamilyFinance Web

Frontend Angular do sistema FamilyFinance — gestão financeira familiar.

## Pré-requisitos

- Node.js 20.x LTS
- npm 10.x
- Backend Spring Boot rodando em `http://localhost:8080`

## Instalação

```bash
npm install
```

## Comandos

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor de desenvolvimento em `http://localhost:4200` |
| `npm run build` | Build de desenvolvimento |
| `npm run build:prod` | Build de produção (usa `ambiente.producao.ts`) |
| `npm test` | Executa os testes em modo watch |
| `npm run test:cobertura` | Executa testes e gera relatório de cobertura |
| `npm run lint` | Executa o linter |
| `npm run format` | Formata os arquivos com Prettier |

## Estrutura

```
src/
├── ambientes/          # Configurações de ambiente (dev e produção)
├── app/
│   ├── nucleo/         # Interceptores e serviços HTTP
│   ├── compartilhado/  # Componentes reutilizáveis
│   ├── funcionalidades/# Features: contas/, (futuro: transacoes/, metas/, etc.)
│   ├── layout/         # Layout principal com sidenav
│   └── modelos/        # Interfaces e tipos TypeScript
└── estilos/            # Design system SCSS (tema Halloween dark)
```

## Backend

O backend Java/Spring Boot deve estar rodando em `http://localhost:8080`.
Documentação interativa via Swagger UI em `http://localhost:8080/swagger-ui.html`.

## Stack

- Angular 21, TypeScript 5, Angular Material 21 (M3 dark)
- RxJS 7, Signals, Reactive Forms
- Vitest (testes unitários)

---

> Projeto em desenvolvimento — v1 (beta familiar). Sem autenticação nesta versão.
