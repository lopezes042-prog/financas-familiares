# FamilyFinance Web — Especificação do Projeto Inicial (v0.1)

> **Para quem:** Claude Code, ao gerar o projeto Angular inicial.
> **Acompanha:** `familyfinance-web-apostila-junior.md` (apostila de onboarding da Analista Júnior).
> **Backend:** Spring Boot rodando em `http://localhost:8080` (separado).
> **Idioma obrigatório:** Português BR em código, comentários, commits, mensagens, nomes de pastas/arquivos/variáveis. Termos técnicos universais (HTTP, JWT, UUID, CSS, etc.) ficam em inglês.
> **Atenção mentor:** este projeto contém **6 bugs propositais** marcados ao longo deste documento com o tag `🐛 BUG-INTENCIONAL-NN`. Eles existem para a Analista Júnior identificar e corrigir como exercício.

---

## Sumário

1. [Objetivo Desta Versão Inicial](#1-objetivo-desta-versão-inicial)
2. [Stack e Versões](#2-stack-e-versões)
3. [Comando de Criação do Projeto](#3-comando-de-criação-do-projeto)
4. [Pacotes Adicionais](#4-pacotes-adicionais)
5. [Estrutura de Pastas Final](#5-estrutura-de-pastas-final)
6. [Configurações de Build e Qualidade](#6-configurações-de-build-e-qualidade)
7. [Arquivos de Configuração Globais](#7-arquivos-de-configuração-globais)
8. [Modelos TypeScript](#8-modelos-typescript)
9. [Serviço de API: ContaServico](#9-serviço-de-api-contaservico)
10. [Interceptor de Erros](#10-interceptor-de-erros)
11. [Componente de Layout Principal](#11-componente-de-layout-principal)
12. [Componente de Lista de Contas](#12-componente-de-lista-de-contas)
13. [Componente de Formulário de Conta](#13-componente-de-formulário-de-conta)
14. [Estilos Globais e Tema](#14-estilos-globais-e-tema)
15. [README do Projeto](#15-readme-do-projeto)
16. [Resumo dos Bugs Intencionais](#16-resumo-dos-bugs-intencionais)
17. [Critérios de Aceite](#17-critérios-de-aceite)

---

## 1. Objetivo Desta Versão Inicial

Criar o **esqueleto funcional** do projeto Angular do FamilyFinance:

- Aplicação Angular 18 standalone, com routing e Angular Material.
- Layout principal com menu lateral fixo contendo apenas a opção **Contas**.
- CRUD completo da entidade **Conta** (listar, criar, editar, desativar) consumindo o backend Spring Boot em `http://localhost:8080`.
- Interceptor global de erros HTTP com feedback via snackbar.
- Estrutura de pastas pronta para crescer com novas funcionalidades.

**Fora do escopo desta versão:**

- Autenticação e autorização (entram na v2 do produto).
- Outras entidades (Transação, Investimento, Meta, etc.).
- Internacionalização.
- Modo escuro / temas dinâmicos.
- Testes E2E (apenas testes unitários nesta fase).

---

## 2. Stack e Versões

| Camada | Tecnologia | Versão |
|---|---|---|
| Linguagem | TypeScript | 5.4+ |
| Framework | Angular | 18.x |
| UI Components | Angular Material | 18.x |
| Estilo | SCSS | — |
| HTTP | `@angular/common/http` (HttpClient) | 18.x |
| Reatividade | RxJS + Signals | 7.x / nativo |
| Forms | Reactive Forms | nativo |
| Lint | ESLint + `@angular-eslint` | 18.x |
| Format | Prettier | 3.x |
| Pre-commit | Husky + lint-staged | 9.x / 15.x |
| Testes | Jasmine + Karma (padrão CLI) | nativo |
| Gerenciador de pacotes | npm | 10.x |
| Node.js | — | 20.x LTS |

---

## 3. Comando de Criação do Projeto

```bash
ng new familyfinance-web \
  --style=scss \
  --routing=true \
  --strict=true \
  --standalone=true \
  --ssr=false \
  --package-manager=npm \
  --skip-git=false
```

**Após a criação, ajustar as seguintes opções no `tsconfig.json`** (caso não venham já habilitadas):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

---

## 4. Pacotes Adicionais

```bash
cd familyfinance-web

# Angular Material com prompts
ng add @angular/material --theme=custom --typography=true --animations=enabled

# Husky + lint-staged
npm install --save-dev husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit

# Prettier
npm install --save-dev prettier
```

**Configurar `.prettierrc.json`:**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Adicionar em `package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,html,scss,json,md}": ["prettier --write"],
    "*.ts": ["eslint --fix"]
  }
}
```

---

## 5. Estrutura de Pastas Final

```
familyfinance-web/
├── .husky/
│   └── pre-commit
├── src/
│   ├── ambientes/
│   │   ├── ambiente.ts                              # desenvolvimento
│   │   └── ambiente.producao.ts                     # produção
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
│   ├── estilos/                                     # ← Design system completo
│   │   ├── _tokens.scss          # Design tokens: cores, espaços, sombras, bordas
│   │   ├── _tipografia.scss      # Escala tipográfica e classes de texto
│   │   ├── _tema.scss            # Tema Angular Material (dark Halloween)
│   │   ├── _utilitarios.scss     # Classes utilitárias single-purpose
│   │   ├── _layout.scss          # Mixins e classes de estrutura/grid
│   │   └── _componentes.scss     # Overrides Material + componentes ff-*
│   ├── index.html
│   ├── main.ts
│   └── styles.scss               # Entry point — importa tudo na ordem correta
├── .editorconfig
├── .eslintrc.json
├── .prettierrc.json
├── angular.json
├── package.json
├── README.md
└── tsconfig.json
```

---

## 6. Configurações de Build e Qualidade

### 6.1 `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

### 6.2 Scripts em `package.json`

```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration=production",
    "test": "ng test",
    "test:cobertura": "ng test --code-coverage --watch=false",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\""
  }
}
```

---

## 7. Arquivos de Configuração Globais

### 7.1 `src/ambientes/ambiente.ts`

```typescript
export const ambiente = {
  producao: false,
  urlApi: 'http://localhost:8080'
};
```

### 7.2 `src/ambientes/ambiente.producao.ts`

```typescript
export const ambiente = {
  producao: true,
  urlApi: 'https://api.familyfinance.com.br'
};
```

### 7.3 `src/main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((erro) => console.error(erro));
```

### 7.4 `src/app/app.config.ts`

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { rotas } from './app.routes';
import { erroHttpInterceptor } from './nucleo/interceptores/erro-http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(rotas, withComponentInputBinding()),
    provideHttpClient(withInterceptors([erroHttpInterceptor])),
    provideAnimations()
  ]
};
```

### 7.5 `src/app/app.component.ts`

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ff-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {}
```

### 7.6 `src/app/app.component.html`

```html
<router-outlet />
```

### 7.7 `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const rotas: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout-principal/layout-principal.component').then(
        (m) => m.LayoutPrincipalComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'contas',
        pathMatch: 'full'
      },
      {
        path: 'contas',
        loadComponent: () =>
          import('./funcionalidades/contas/lista-contas/lista-contas.component').then(
            (m) => m.ListaContasComponent
          )
      },
      {
        path: 'contas/nova',
        loadComponent: () =>
          import('./funcionalidades/contas/formulario-conta/formulario-conta.component').then(
            (m) => m.FormularioContaComponent
          )
      },
      {
        path: 'contas/:id/editar',
        loadComponent: () =>
          import('./funcionalidades/contas/formulario-conta/formulario-conta.component').then(
            (m) => m.FormularioContaComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

---

## 8. Modelos TypeScript

### 8.1 `src/app/modelos/conta.modelo.ts`

```typescript
export type TipoConta =
  | 'CORRENTE'
  | 'POUPANCA'
  | 'CARTAO_CREDITO'
  | 'CARTEIRA'
  | 'INVESTIMENTO';

export interface Conta {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;
  cor?: string;
  ativo: boolean;
}

export interface CriarContaComando {
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  cor?: string;
}

export interface EditarContaComando {
  nome: string;
  tipo: TipoConta;
  cor?: string;
}

export interface SaldoContaResposta {
  saldoAtual: number;
}

export const TIPOS_CONTA: { valor: TipoConta; rotulo: string }[] = [
  { valor: 'CORRENTE', rotulo: 'Conta corrente' },
  { valor: 'POUPANCA', rotulo: 'Poupança' },
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de crédito' },
  { valor: 'CARTEIRA', rotulo: 'Carteira' },
  { valor: 'INVESTIMENTO', rotulo: 'Investimento' }
];
```

---

## 9. Serviço de API: ContaServico

### 9.1 `src/app/nucleo/servicos/conta.servico.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ambiente } from '../../../ambientes/ambiente';
import {
  Conta,
  CriarContaComando,
  EditarContaComando,
  SaldoContaResposta
} from '../../modelos/conta.modelo';

@Injectable({ providedIn: 'root' })
export class ContaServico {
  private readonly http = inject(HttpClient);
  // 🐛 BUG-INTENCIONAL-01
  // O caminho correto definido no especificacao-api.yaml é "/contas".
  // Aqui está intencionalmente "/conta" (singular).
  // Sintoma esperado: a tela de listagem retorna 404 e mostra "Recurso não encontrado".
  // A Júnior deve abrir o Network do navegador, comparar com o Swagger UI e corrigir.
  private readonly urlBase = `${ambiente.urlApi}/conta`;

  listar(): Observable<Conta[]> {
    return this.http.get<Conta[]>(this.urlBase);
  }

  buscarPorId(id: string): Observable<Conta> {
    return this.http.get<Conta>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarContaComando): Observable<Conta> {
    return this.http.post<Conta>(this.urlBase, comando);
  }

  // 🐛 BUG-INTENCIONAL-02
  // O método HTTP correto para atualização total da conta é PUT (definido no contrato).
  // Aqui está intencionalmente POST.
  // Sintoma esperado: ao salvar uma edição, a requisição vai como POST para
  //   /contas/{id} e o backend retorna 405 Method Not Allowed.
  // A Júnior deve verificar o método correto no Swagger UI e corrigir.
  atualizar(id: string, comando: EditarContaComando): Observable<Conta> {
    return this.http.post<Conta>(`${this.urlBase}/${id}`, comando);
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

## 10. Interceptor de Erros

### 10.1 `src/app/nucleo/interceptores/erro-http.interceptor.ts`

```typescript
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const erroHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      const mensagem = obterMensagemAmigavel(erro);
      snackBar.open(mensagem, 'Fechar', {
        duration: 5000,
        panelClass: ['snackbar-erro']
      });
      return throwError(() => erro);
    })
  );
};

function obterMensagemAmigavel(erro: HttpErrorResponse): string {
  if (erro.error?.mensagem) {
    return erro.error.mensagem;
  }
  switch (erro.status) {
    case 0:
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    case 404:
      return 'Recurso não encontrado.';
    case 405:
      return 'Operação não permitida pelo servidor.';
    case 422:
      return 'Dados inválidos.';
    case 500:
      return 'Erro interno do servidor. Tente novamente em instantes.';
    default:
      return 'Ocorreu um erro inesperado.';
  }
}
```

---

## 11. Componente de Layout Principal

### 11.1 `src/app/layout/layout-principal/layout-principal.component.ts`

```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'ff-layout-principal',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule
  ],
  templateUrl: './layout-principal.component.html',
  styleUrl: './layout-principal.component.scss'
})
export class LayoutPrincipalComponent {}
```

### 11.2 `src/app/layout/layout-principal/layout-principal.component.html`

```html
<mat-sidenav-container class="container-layout">
  <mat-sidenav mode="side" opened class="menu-lateral">
    <div class="cabecalho-menu">
      <h2>FamilyFinance</h2>
      <small>Gestão financeira familiar</small>
    </div>

    <mat-nav-list>
      <a mat-list-item routerLink="/contas" routerLinkActive="ativo">
        <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
        <span matListItemTitle>Contas</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content class="area-conteudo">
    <router-outlet />
  </mat-sidenav-content>
</mat-sidenav-container>
```

### 11.3 `src/app/layout/layout-principal/layout-principal.component.scss`

```scss
.container-layout {
  height: 100vh;
}

.menu-lateral {
  width: 260px;
  background-color: #1a3a52;
  color: #ffffff;

  .cabecalho-menu {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
    }

    small {
      opacity: 0.7;
      font-size: 0.8rem;
    }
  }

  ::ng-deep .mat-mdc-list-item {
    color: #ffffff !important;

    &.ativo {
      background-color: rgba(255, 255, 255, 0.12);
    }

    .mat-icon {
      color: #ffffff;
    }
  }
}

.area-conteudo {
  padding: 24px 32px;
  background-color: #f5f5f5;
}
```

---

## 12. Componente de Lista de Contas

### 12.1 `src/app/funcionalidades/contas/lista-contas/lista-contas.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { Conta } from '../../../modelos/conta.modelo';
import { ConfirmacaoDialogoComponent } from '../../../compartilhado/componentes/confirmacao-dialogo/confirmacao-dialogo.component';

@Component({
  selector: 'ff-lista-contas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './lista-contas.component.html',
  styleUrl: './lista-contas.component.scss'
})
export class ListaContasComponent implements OnInit {
  private readonly contaServico = inject(ContaServico);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly contas = signal<Conta[]>([]);
  readonly carregando = signal<boolean>(false);
  readonly colunasExibidas = ['nome', 'tipo', 'saldoInicial', 'cor', 'acoes'];

  ngOnInit(): void {
    this.carregarContas();
  }

  carregarContas(): void {
    this.carregando.set(true);
    this.contaServico.listar().subscribe({
      next: (contas) => {
        this.contas.set(contas);
        this.carregando.set(false);
      },
      // 🐛 BUG-INTENCIONAL-03
      // O callback de erro está faltando aqui.
      // Sintoma esperado: quando a requisição falha, o spinner fica girando para sempre
      //   e a Júnior só percebe pelo snackbar do interceptor.
      // A Júnior deve adicionar o callback `error` que ao menos chama
      //   `this.carregando.set(false)`.
    });
  }

  editar(conta: Conta): void {
    this.router.navigate(['/contas', conta.id, 'editar']);
  }

  desativar(conta: Conta): void {
    const refDialog = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: {
        titulo: 'Desativar conta',
        mensagem: `Tem certeza que deseja desativar a conta "${conta.nome}"?`
      }
    });

    refDialog.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.contaServico.alterarSituacao(conta.id, false).subscribe({
        next: () => {
          this.snackBar.open('Conta desativada', 'Fechar', { duration: 3000 });
          this.carregarContas();
        }
      });
    });
  }
}
```

### 12.2 `src/app/funcionalidades/contas/lista-contas/lista-contas.component.html`

```html
<div class="cabecalho-pagina">
  <h1>Contas</h1>
  <a mat-raised-button color="primary" routerLink="/contas/nova">
    <mat-icon>add</mat-icon>
    Nova conta
  </a>
</div>

@if (carregando()) {
  <div class="area-carregando">
    <mat-spinner diameter="40" />
  </div>
} @else if (contas().length === 0) {
  <div class="estado-vazio">
    <mat-icon>account_balance_wallet</mat-icon>
    <p>Nenhuma conta cadastrada ainda.</p>
    <a mat-stroked-button color="primary" routerLink="/contas/nova">
      Cadastrar primeira conta
    </a>
  </div>
} @else {
  <table mat-table [dataSource]="contas()" class="tabela-contas">
    <ng-container matColumnDef="nome">
      <th mat-header-cell *matHeaderCellDef>Nome</th>
      <td mat-cell *matCellDef="let conta">{{ conta.nome }}</td>
    </ng-container>

    <ng-container matColumnDef="tipo">
      <th mat-header-cell *matHeaderCellDef>Tipo</th>
      <td mat-cell *matCellDef="let conta">{{ conta.tipo }}</td>
    </ng-container>

    <ng-container matColumnDef="saldoInicial">
      <th mat-header-cell *matHeaderCellDef>Saldo inicial</th>
      <td mat-cell *matCellDef="let conta">
        {{ conta.saldoInicial | currency: 'BRL':'symbol':'1.2-2':'pt-BR' }}
      </td>
    </ng-container>

    <ng-container matColumnDef="cor">
      <th mat-header-cell *matHeaderCellDef>Cor</th>
      <td mat-cell *matCellDef="let conta">
        @if (conta.cor) {
          <span class="amostra-cor" [style.background-color]="conta.cor"></span>
        }
      </td>
    </ng-container>

    <ng-container matColumnDef="acoes">
      <th mat-header-cell *matHeaderCellDef>Ações</th>
      <td mat-cell *matCellDef="let conta">
        <button mat-icon-button (click)="editar(conta)" aria-label="Editar conta">
          <mat-icon>edit</mat-icon>
        </button>
        <button
          mat-icon-button
          color="warn"
          (click)="desativar(conta)"
          aria-label="Desativar conta"
        >
          <mat-icon>delete_outline</mat-icon>
        </button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="colunasExibidas"></tr>
    <tr mat-row *matRowDef="let row; columns: colunasExibidas"></tr>
  </table>
}
```

### 12.3 `src/app/funcionalidades/contas/lista-contas/lista-contas.component.scss`

```scss
.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    margin: 0;
  }
}

.area-carregando {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.estado-vazio {
  text-align: center;
  padding: 64px 24px;
  background: #fff;
  border-radius: 8px;

  mat-icon {
    font-size: 48px;
    width: 48px;
    height: 48px;
    color: #999;
  }

  p {
    color: #666;
    margin: 16px 0 24px;
  }
}

.tabela-contas {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.amostra-cor {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #ddd;
}
```

---

## 13. Componente de Formulário de Conta

### 13.1 `src/app/funcionalidades/contas/formulario-conta/formulario-conta.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import {
  CriarContaComando,
  EditarContaComando,
  TIPOS_CONTA,
  TipoConta
} from '../../../modelos/conta.modelo';

@Component({
  selector: 'ff-formulario-conta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './formulario-conta.component.html',
  styleUrl: './formulario-conta.component.scss'
})
export class FormularioContaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contaServico = inject(ContaServico);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly tiposConta = TIPOS_CONTA;
  readonly modoEdicao = signal<boolean>(false);
  readonly carregando = signal<boolean>(false);
  readonly idConta = signal<string | null>(null);

  // 🐛 BUG-INTENCIONAL-04
  // O validador `Validators.minLength(2)` está faltando.
  // O contrato exige nome com 2-100 caracteres.
  // Sintoma esperado: a Júnior consegue salvar uma conta com nome "A" pelo frontend,
  //   mas o backend retorna 400 com a mensagem de validação.
  // Correção: adicionar Validators.minLength(2) na lista de validadores do nome.
  readonly formulario = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['CORRENTE' as TipoConta, [Validators.required]],
    saldoInicial: [0, [Validators.required, Validators.min(0)]],
    cor: ['']
  });

  ngOnInit(): void {
    const id = this.rota.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao.set(true);
      this.idConta.set(id);
      this.carregarConta(id);
    }
  }

  private carregarConta(id: string): void {
    this.carregando.set(true);
    this.contaServico.buscarPorId(id).subscribe({
      next: (conta) => {
        this.formulario.patchValue({
          nome: conta.nome,
          tipo: conta.tipo,
          saldoInicial: conta.saldoInicial,
          cor: conta.cor ?? ''
        });
        this.formulario.controls.saldoInicial.disable();
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.router.navigate(['/contas']);
      }
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();

    if (this.modoEdicao()) {
      this.atualizar(valor);
    } else {
      this.criar(valor);
    }
  }

  private criar(valor: ReturnType<typeof this.formulario.getRawValue>): void {
    const comando: CriarContaComando = {
      nome: valor.nome,
      tipo: valor.tipo,
      saldoInicial: valor.saldoInicial,
      cor: valor.cor || undefined
    };

    this.contaServico.criar(comando).subscribe({
      next: () => {
        this.snackBar.open('Conta criada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/contas']);
      }
    });
  }

  private atualizar(valor: ReturnType<typeof this.formulario.getRawValue>): void {
    const id = this.idConta();
    if (!id) return;

    // 🐛 BUG-INTENCIONAL-05
    // O comando de edição inclui `saldoInicial`, mas o contrato (EditarContaComando)
    //   não aceita esse campo — saldoInicial não é editável após criação.
    // Sintoma esperado: o backend retorna 400 com mensagem como "campo desconhecido"
    //   ou aceita silenciosamente sem efeito (a depender da configuração).
    // Correção: remover `saldoInicial` do objeto enviado.
    const comando = {
      nome: valor.nome,
      tipo: valor.tipo,
      saldoInicial: valor.saldoInicial,
      cor: valor.cor || undefined
    } as EditarContaComando;

    this.contaServico.atualizar(id, comando).subscribe({
      next: () => {
        this.snackBar.open('Conta atualizada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/contas']);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/contas']);
  }
}
```

### 13.2 `src/app/funcionalidades/contas/formulario-conta/formulario-conta.component.html`

```html
<div class="cabecalho-pagina">
  <h1>{{ modoEdicao() ? 'Editar conta' : 'Nova conta' }}</h1>
</div>

@if (carregando()) {
  <div class="area-carregando">
    <mat-spinner diameter="40" />
  </div>
} @else {
  <form [formGroup]="formulario" (ngSubmit)="salvar()" class="formulario">
    <mat-form-field appearance="outline">
      <mat-label>Nome</mat-label>
      <input matInput formControlName="nome" maxlength="100" />
      @if (
        formulario.controls.nome.hasError('required') && formulario.controls.nome.touched
      ) {
        <mat-error>O nome é obrigatório.</mat-error>
      }
      @if (formulario.controls.nome.hasError('minlength')) {
        <mat-error>O nome deve ter no mínimo 2 caracteres.</mat-error>
      }
      @if (formulario.controls.nome.hasError('maxlength')) {
        <mat-error>O nome deve ter no máximo 100 caracteres.</mat-error>
      }
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Tipo</mat-label>
      <mat-select formControlName="tipo">
        @for (tipo of tiposConta; track tipo.valor) {
          <mat-option [value]="tipo.valor">{{ tipo.rotulo }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Saldo inicial</mat-label>
      <input
        matInput
        type="number"
        formControlName="saldoInicial"
        step="0.01"
        min="0"
      />
      @if (formulario.controls.saldoInicial.hasError('min')) {
        <mat-error>O saldo inicial não pode ser negativo.</mat-error>
      }
      @if (modoEdicao()) {
        <mat-hint>O saldo inicial não pode ser alterado após a criação.</mat-hint>
      }
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Cor</mat-label>
      <input matInput type="color" formControlName="cor" />
    </mat-form-field>

    <div class="acoes">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <!--
        🐛 BUG-INTENCIONAL-06
        O atributo `type` está como "button". Em formulários, o botão de submit
          deve ser type="submit" para que pressionar Enter funcione e o evento ngSubmit
          dispare corretamente.
        Sintoma esperado: ao clicar no botão "Salvar", nada acontece (o método salvar()
          nunca é chamado por essa via). Funciona apenas pressionando Enter num input.
        Correção: alterar para type="submit".
      -->
      <button mat-raised-button color="primary" type="button">
        {{ modoEdicao() ? 'Atualizar' : 'Salvar' }}
      </button>
    </div>
  </form>
}
```

### 13.3 `src/app/funcionalidades/contas/formulario-conta/formulario-conta.component.scss`

```scss
.cabecalho-pagina {
  margin-bottom: 24px;

  h1 {
    margin: 0;
  }
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 540px;
  background: #fff;
  padding: 32px;
  border-radius: 8px;

  .acoes {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
}

.area-carregando {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
```

---

## 14. Estilos Globais e Tema

> Sistema de design completo com tema Halloween. Sete arquivos SCSS organizados em camadas:
> tokens → tipografia → tema Material → utilitários → layout → componentes → entry point.
> Veja `familyfinance-web-apostila-estilos.md` para explicação detalhada de cada decisão.

### 14.1 Estrutura da pasta `src/estilos/`

```
src/
├── estilos/
│   ├── _tokens.scss          # Design tokens: cores, espaçamentos, sombras, bordas
│   ├── _tipografia.scss      # Escala tipográfica e font-face
│   ├── _tema.scss            # Tema Angular Material (dark, Halloween)
│   ├── _utilitarios.scss     # Classes utilitárias (cores semânticas, flex, gap, etc.)
│   ├── _layout.scss          # Grid, containers, breakpoints responsivos
│   └── _componentes.scss     # Overrides globais de componentes Material + classes ff-*
└── styles.scss               # Entry point — importa tudo na ordem correta
```

---

### 14.2 `src/estilos/_tokens.scss`

```scss
// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — FamilyFinance · Tema Halloween
// Fonte única da verdade para todas as decisões visuais.
// NUNCA use valores hex/px/rem soltos nos componentes — sempre via token.
// ─────────────────────────────────────────────────────────────────────────────

// ── Paleta de cores brutas (não usar diretamente nos componentes) ─────────────
$_laranja-100: #ffedd5;
$_laranja-300: #fb923c;
$_laranja-500: #ff6b00;
$_laranja-700: #c2410c;
$_laranja-900: #431407;

$_roxo-100:    #f3e8ff;
$_roxo-300:    #c084fc;
$_roxo-500:    #a855f7;
$_roxo-700:    #6b21a8;
$_roxo-900:    #3b0764;

$_amarelo-400: #fbbf24;
$_amarelo-500: #f59e0b;

$_verde-400:   #4ade80;
$_verde-600:   #16a34a;

$_vermelho-400: #f87171;
$_vermelho-600: #dc2626;
$_vermelho-900: #450a0a;

$_neutro-50:   #fafaf9;
$_neutro-100:  #f5f5f4;
$_neutro-200:  #e7e5e4;
$_neutro-400:  #a8a29e;
$_neutro-600:  #57534e;
$_neutro-800:  #292524;
$_neutro-900:  #1c1917;
$_neutro-950:  #0c0a09;

$_preto-absoluto: #080608;

// ── Tokens de cor semântica ───────────────────────────────────────────────────

// Superfícies
$cor-fundo-app:         #0f0507;   // fundo geral da aplicação
$cor-fundo-sidenav:     #13020a;   // menu lateral
$cor-fundo-cartao:      #1a0c10;   // cards, tabelas, formulários
$cor-fundo-cartao-alt:  #1f1015;   // linhas alternadas em tabelas
$cor-fundo-input:       #150a0d;   // inputs e selects
$cor-fundo-overlay:     rgba(0, 0, 0, 0.72); // modais, backdrops
$cor-fundo-hover:       rgba(255, 107, 0, 0.08);
$cor-fundo-selecionado: rgba(255, 107, 0, 0.14);
$cor-fundo-code:        #0a0608;   // blocos de código

// Marca / primária
$cor-primaria:          $_laranja-500;   // #ff6b00 — ação principal, links ativos
$cor-primaria-hover:    $_laranja-300;   // hover em botões/links primários
$cor-primaria-escura:   $_laranja-700;   // pressed, foco
$cor-primaria-fundo:    $_laranja-900;   // badge, tag com fundo laranja

// Acento / secundária
$cor-acento:            $_roxo-500;      // #a855f7 — destaque secundário
$cor-acento-hover:      $_roxo-300;
$cor-acento-escura:     $_roxo-700;
$cor-acento-fundo:      $_roxo-900;

// Âmbar — destaque de conteúdo, avisos informacionais
$cor-ambar:             $_amarelo-400;
$cor-ambar-escuro:      $_amarelo-500;

// Texto
$cor-texto-primario:    #f5f0ec;   // texto principal (quase branco quente)
$cor-texto-secundario:  #c4b5ae;   // texto de suporte, labels
$cor-texto-desabilitado:#6b5e59;   // campos desabilitados, placeholders
$cor-texto-invertido:   $_preto-absoluto; // texto sobre fundo laranja

// Bordas e divisores
$cor-borda:             #3d1a14;   // bordas sutis
$cor-borda-input:       #5a2a20;   // borda de inputs em repouso
$cor-borda-foco:        $cor-primaria;
$cor-divisor:           #2a0f0a;   // <hr>, separadores de seções

// Feedback
$cor-sucesso:           $_verde-400;
$cor-sucesso-fundo:     #052e16;
$cor-aviso:             $_amarelo-400;
$cor-aviso-fundo:       #451a03;
$cor-erro:              $_vermelho-400;
$cor-erro-fundo:        $_vermelho-900;
$cor-info:              $_roxo-300;
$cor-info-fundo:        $_roxo-900;

// Domínio financeiro
$cor-receita:           $_verde-400;     // valores positivos
$cor-despesa:           $_vermelho-400;  // valores negativos
$cor-investimento:      $_roxo-300;      // ativos financeiros
$cor-meta:              $_amarelo-400;   // metas e objetivos
$cor-transferencia:     #94a3b8;         // movimentações neutras

// ── Tokens de espaçamento (escala de 4px) ────────────────────────────────────
$espaco-1:  4px;
$espaco-2:  8px;
$espaco-3:  12px;
$espaco-4:  16px;
$espaco-5:  20px;
$espaco-6:  24px;
$espaco-8:  32px;
$espaco-10: 40px;
$espaco-12: 48px;
$espaco-16: 64px;
$espaco-20: 80px;

// ── Tokens de tipografia ──────────────────────────────────────────────────────
$fonte-sans:  'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
$fonte-mono:  'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

$tamanho-xs:   0.75rem;   // 12px
$tamanho-sm:   0.875rem;  // 14px
$tamanho-base: 1rem;      // 16px
$tamanho-lg:   1.125rem;  // 18px
$tamanho-xl:   1.25rem;   // 20px
$tamanho-2xl:  1.5rem;    // 24px
$tamanho-3xl:  1.875rem;  // 30px
$tamanho-4xl:  2.25rem;   // 36px

$peso-regular: 400;
$peso-medio:   500;
$peso-semi:    600;
$peso-bold:    700;

$altura-linha-apertada: 1.25;
$altura-linha-normal:   1.5;
$altura-linha-relaxada: 1.75;

// ── Tokens de borda e raio ────────────────────────────────────────────────────
$raio-sm:   4px;
$raio-base: 8px;
$raio-md:   12px;
$raio-lg:   16px;
$raio-xl:   24px;
$raio-full: 9999px;

$borda-padrao: 1px solid $cor-borda;
$borda-input:  1px solid $cor-borda-input;
$borda-foco:   2px solid $cor-primaria;
$borda-acento: 1px solid $cor-acento-escura;

// ── Tokens de sombra ─────────────────────────────────────────────────────────
$sombra-sm:   0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4);
$sombra-base: 0 4px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.4);
$sombra-md:   0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.4);
$sombra-lg:   0 20px 25px rgba(0, 0, 0, 0.6), 0 8px 10px rgba(0, 0, 0, 0.5);
$sombra-brilho-laranja: 0 0 12px rgba(255, 107, 0, 0.25);
$sombra-brilho-roxo:    0 0 12px rgba(168, 85, 247, 0.2);

// ── Tokens de transição ───────────────────────────────────────────────────────
$transicao-rapida:  all 0.15s ease;
$transicao-padrao:  all 0.25s ease;
$transicao-lenta:   all 0.4s ease;

// ── Tokens de z-index ─────────────────────────────────────────────────────────
$z-base:       0;
$z-dropdown:   100;
$z-sticky:     200;
$z-overlay:    300;
$z-modal:      400;
$z-toast:      500;
$z-tooltip:    600;

// ── Breakpoints ───────────────────────────────────────────────────────────────
$bp-sm:  576px;
$bp-md:  768px;
$bp-lg:  1024px;
$bp-xl:  1280px;
$bp-2xl: 1536px;

// ── Dimensões fixas ───────────────────────────────────────────────────────────
$largura-sidenav:          260px;
$largura-sidenav-recolhida: 64px;
$altura-topbar:            64px;
$largura-conteudo-max:     1200px;
```

---

### 14.3 `src/estilos/_tipografia.scss`

```scss
// ─────────────────────────────────────────────────────────────────────────────
// TIPOGRAFIA — FamilyFinance · Tema Halloween
// Escala de fontes, hierarquia visual, estilos de texto reutilizáveis.
// ─────────────────────────────────────────────────────────────────────────────
@use 'tokens' as *;

// ── Google Fonts via @import (somente no entry point) ────────────────────────
// Inter: sans-serif moderna, excelente legibilidade em telas
// JetBrains Mono: monospace para blocos de código
// A importação real fica em styles.scss para não duplicar requests.

// ── Reset tipográfico base ────────────────────────────────────────────────────
html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: $fonte-sans;
  font-size: $tamanho-base;
  font-weight: $peso-regular;
  line-height: $altura-linha-normal;
  color: $cor-texto-primario;
}

// ── Hierarquia de headings ────────────────────────────────────────────────────
h1, h2, h3, h4, h5, h6 {
  font-family: $fonte-sans;
  font-weight: $peso-semi;
  line-height: $altura-linha-apertada;
  color: $cor-texto-primario;
  margin: 0 0 $espaco-4;
  letter-spacing: -0.01em;
}

h1 {
  font-size: $tamanho-3xl;
  font-weight: $peso-bold;
  color: $cor-texto-primario;
}

h2 {
  font-size: $tamanho-2xl;
  color: $cor-texto-primario;
}

h3 {
  font-size: $tamanho-xl;
  color: $cor-texto-secundario;
}

h4 {
  font-size: $tamanho-lg;
  color: $cor-texto-secundario;
}

p {
  margin: 0 0 $espaco-4;
  line-height: $altura-linha-relaxada;
  color: $cor-texto-secundario;
}

// ── Classes utilitárias de texto ──────────────────────────────────────────────
.ff-texto-xs       { font-size: $tamanho-xs; }
.ff-texto-sm       { font-size: $tamanho-sm; }
.ff-texto-base     { font-size: $tamanho-base; }
.ff-texto-lg       { font-size: $tamanho-lg; }
.ff-texto-xl       { font-size: $tamanho-xl; }

.ff-peso-regular   { font-weight: $peso-regular; }
.ff-peso-medio     { font-weight: $peso-medio; }
.ff-peso-semi      { font-weight: $peso-semi; }
.ff-peso-bold      { font-weight: $peso-bold; }

.ff-texto-primario   { color: $cor-texto-primario; }
.ff-texto-secundario { color: $cor-texto-secundario; }
.ff-texto-desabilitado { color: $cor-texto-desabilitado; }
.ff-texto-laranja    { color: $cor-primaria; }
.ff-texto-roxo       { color: $cor-acento; }
.ff-texto-ambar      { color: $cor-ambar; }

.ff-texto-receita    { color: $cor-receita; }
.ff-texto-despesa    { color: $cor-despesa; }
.ff-texto-investimento { color: $cor-investimento; }
.ff-texto-meta       { color: $cor-meta; }

.ff-mono {
  font-family: $fonte-mono;
  font-size: 0.9em;
  letter-spacing: 0.02em;
}

// ── Label de campo ────────────────────────────────────────────────────────────
.ff-label {
  display: block;
  font-size: $tamanho-xs;
  font-weight: $peso-medio;
  color: $cor-texto-secundario;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: $espaco-1;
}

// ── Texto de código inline ────────────────────────────────────────────────────
code {
  font-family: $fonte-mono;
  font-size: 0.875em;
  color: $cor-primaria;
  background: $cor-fundo-code;
  padding: 2px 6px;
  border-radius: $raio-sm;
  border: 1px solid $cor-borda;
}
```

---

### 14.4 `src/estilos/_tema.scss`

```scss
// ─────────────────────────────────────────────────────────────────────────────
// TEMA ANGULAR MATERIAL — FamilyFinance · Halloween (dark theme)
// Angular Material M2 com paletas personalizadas.
// ─────────────────────────────────────────────────────────────────────────────
@use '@angular/material' as mat;
@use 'tokens' as *;

// ── Paletas customizadas ──────────────────────────────────────────────────────
// M2 exige paletas com tons de 50 a 900 + contrast map.

$paleta-laranja: (
  50:  #fff3e0,
  100: #ffe0b2,
  200: #ffcc80,
  300: #ffb74d,
  400: #ffa726,
  500: #ff6b00,  // cor-primaria
  600: #f57c00,
  700: #c2410c,
  800: #6a1a00,
  900: #431407,
  A100: #ffb74d,
  A200: #ff9800,
  A400: #ff6b00,
  A700: #c2410c,
  contrast: (
    50:  #000,
    100: #000,
    200: #000,
    300: #000,
    400: #000,
    500: #fff,
    600: #fff,
    700: #fff,
    800: #fff,
    900: #fff,
    A100: #000,
    A200: #000,
    A400: #fff,
    A700: #fff,
  ),
);

$paleta-roxo: (
  50:  #faf5ff,
  100: #f3e8ff,
  200: #e9d5ff,
  300: #d8b4fe,
  400: #c084fc,
  500: #a855f7,  // cor-acento
  600: #9333ea,
  700: #6b21a8,
  800: #4c1d95,
  900: #3b0764,
  A100: #d8b4fe,
  A200: #c084fc,
  A400: #a855f7,
  A700: #6b21a8,
  contrast: (
    50:  #000,
    100: #000,
    200: #000,
    300: #000,
    400: #000,
    500: #fff,
    600: #fff,
    700: #fff,
    800: #fff,
    900: #fff,
    A100: #000,
    A200: #000,
    A400: #fff,
    A700: #fff,
  ),
);

$paleta-vermelho-escuro: (
  50:  #fff1f1,
  100: #ffd7d7,
  200: #ffb3b3,
  300: #ff8a8a,
  400: #f87171,
  500: #dc2626,
  600: #b91c1c,
  700: #991b1b,
  800: #7f1d1d,
  900: #450a0a,
  contrast: (
    50:  #000, 100: #000, 200: #000, 300: #000, 400: #000,
    500: #fff, 600: #fff, 700: #fff, 800: #fff, 900: #fff,
  ),
);

// ── Definição das paletas Material ────────────────────────────────────────────
$ff-primaria:  mat.m2-define-palette($paleta-laranja, 500, 300, 700);
$ff-acento:    mat.m2-define-palette($paleta-roxo, 500, 300, 700);
$ff-aviso:     mat.m2-define-palette($paleta-vermelho-escuro, 500, 300, 700);

// ── Tema escuro (dark) ────────────────────────────────────────────────────────
$ff-tema-dark: mat.m2-define-dark-theme(
  (
    color: (
      primary: $ff-primaria,
      accent:  $ff-acento,
      warn:    $ff-aviso,
    ),
    typography: mat.m2-define-typography-config(
      $font-family: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      $headline-1:   mat.m2-define-typography-level(2.25rem, 1.25, 700),
      $headline-2:   mat.m2-define-typography-level(1.875rem, 1.3, 600),
      $headline-3:   mat.m2-define-typography-level(1.5rem, 1.35, 600),
      $headline-4:   mat.m2-define-typography-level(1.25rem, 1.4, 600),
      $body-1:       mat.m2-define-typography-level(1rem, 1.5, 400),
      $body-2:       mat.m2-define-typography-level(0.875rem, 1.5, 400),
      $caption:      mat.m2-define-typography-level(0.75rem, 1.4, 400),
      $button:       mat.m2-define-typography-level(0.875rem, 1, 500),
    ),
    density: 0,
  )
);

// ── Aplicar o tema a todos os componentes ────────────────────────────────────
@include mat.all-component-themes($ff-tema-dark);

// ── Overrides de cor de fundo dos componentes Material ───────────────────────
// O dark theme do M2 usa tons de cinza escuro por padrão.
// Substituímos pelas superfícies do nosso tema Halloween.
.mat-mdc-card,
.mat-mdc-dialog-container .mdc-dialog__surface,
.mat-mdc-autocomplete-panel,
.mat-mdc-select-panel,
.mat-mdc-menu-panel {
  background-color: $cor-fundo-cartao !important;
  border: $borda-padrao;
}

.mat-mdc-table {
  background-color: $cor-fundo-cartao !important;
}

.mat-mdc-header-row {
  background-color: darken($cor-fundo-cartao, 3%) !important;
}

.mat-mdc-row:hover {
  background-color: $cor-fundo-hover !important;
}

.mat-mdc-form-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) {
  background-color: $cor-fundo-input;
}

.mat-mdc-snack-bar-container {
  &.snackbar-sucesso .mdc-snackbar__surface {
    background-color: $cor-sucesso-fundo;
    border-left: 3px solid $cor-sucesso;
    color: $cor-sucesso;
  }

  &.snackbar-erro .mdc-snackbar__surface {
    background-color: $cor-erro-fundo;
    border-left: 3px solid $cor-erro;
    color: $cor-erro;
  }

  &.snackbar-aviso .mdc-snackbar__surface {
    background-color: $cor-aviso-fundo;
    border-left: 3px solid $cor-aviso;
    color: $cor-aviso;
  }
}

// Cores de texto dos inputs no tema dark
.mat-mdc-input-element,
.mat-mdc-select-value-text {
  color: $cor-texto-primario !important;
}

.mat-mdc-form-field-hint,
.mat-mdc-form-field-label {
  color: $cor-texto-secundario !important;
}

// Cor de erro do Material alinhada ao nosso token
.mat-mdc-form-field-error {
  color: $cor-erro !important;
}
```

---

### 14.5 `src/estilos/_utilitarios.scss`

```scss
// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS — FamilyFinance · Tema Halloween
// Classes de uso único (single-purpose) para composição direta no template.
// Inspiradas em Tailwind, mas restritas ao vocabulário do design system.
// REGRA: se uma classe utilitária for usada 3+ vezes em contextos distintos,
//   ela vira um componente SCSS em _componentes.scss.
// ─────────────────────────────────────────────────────────────────────────────
@use 'tokens' as *;

// ── Display e Flex ────────────────────────────────────────────────────────────
.ff-flex           { display: flex; }
.ff-flex-col       { display: flex; flex-direction: column; }
.ff-flex-center    { display: flex; align-items: center; justify-content: center; }
.ff-flex-between   { display: flex; align-items: center; justify-content: space-between; }
.ff-flex-end       { display: flex; align-items: center; justify-content: flex-end; }
.ff-flex-wrap      { flex-wrap: wrap; }
.ff-flex-1         { flex: 1; }
.ff-flex-shrink-0  { flex-shrink: 0; }

.ff-items-center   { align-items: center; }
.ff-items-start    { align-items: flex-start; }
.ff-items-end      { align-items: flex-end; }

// ── Gap ───────────────────────────────────────────────────────────────────────
.ff-gap-1  { gap: $espaco-1; }
.ff-gap-2  { gap: $espaco-2; }
.ff-gap-3  { gap: $espaco-3; }
.ff-gap-4  { gap: $espaco-4; }
.ff-gap-6  { gap: $espaco-6; }
.ff-gap-8  { gap: $espaco-8; }

// ── Padding ───────────────────────────────────────────────────────────────────
.ff-p-0   { padding: 0; }
.ff-p-2   { padding: $espaco-2; }
.ff-p-4   { padding: $espaco-4; }
.ff-p-6   { padding: $espaco-6; }
.ff-p-8   { padding: $espaco-8; }
.ff-px-4  { padding-left: $espaco-4;  padding-right: $espaco-4; }
.ff-px-6  { padding-left: $espaco-6;  padding-right: $espaco-6; }
.ff-py-4  { padding-top: $espaco-4;   padding-bottom: $espaco-4; }
.ff-py-6  { padding-top: $espaco-6;   padding-bottom: $espaco-6; }

// ── Margin ────────────────────────────────────────────────────────────────────
.ff-m-0       { margin: 0; }
.ff-mb-0      { margin-bottom: 0; }
.ff-mb-2      { margin-bottom: $espaco-2; }
.ff-mb-4      { margin-bottom: $espaco-4; }
.ff-mb-6      { margin-bottom: $espaco-6; }
.ff-mb-8      { margin-bottom: $espaco-8; }
.ff-mt-4      { margin-top: $espaco-4; }
.ff-mt-6      { margin-top: $espaco-6; }
.ff-mt-auto   { margin-top: auto; }
.ff-ml-auto   { margin-left: auto; }

// ── Largura e altura ──────────────────────────────────────────────────────────
.ff-w-full    { width: 100%; }
.ff-h-full    { height: 100%; }
.ff-min-h-0   { min-height: 0; }

// ── Overflow ──────────────────────────────────────────────────────────────────
.ff-overflow-hidden   { overflow: hidden; }
.ff-overflow-auto     { overflow: auto; }
.ff-overflow-x-auto   { overflow-x: auto; }
.ff-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ── Posicionamento ────────────────────────────────────────────────────────────
.ff-relative { position: relative; }
.ff-absolute { position: absolute; }
.ff-inset-0  { inset: 0; }

// ── Cursor ────────────────────────────────────────────────────────────────────
.ff-cursor-pointer { cursor: pointer; }
.ff-cursor-default { cursor: default; }

// ── Visibilidade ─────────────────────────────────────────────────────────────
.ff-visivel    { visibility: visible; }
.ff-invisivel  { visibility: hidden; }
.ff-oculto     { display: none; }

// ── Cores de fundo semânticas ─────────────────────────────────────────────────
.ff-fundo-app        { background-color: $cor-fundo-app; }
.ff-fundo-cartao     { background-color: $cor-fundo-cartao; }
.ff-fundo-primaria   { background-color: $cor-primaria-fundo; }
.ff-fundo-acento     { background-color: $cor-acento-fundo; }
.ff-fundo-sucesso    { background-color: $cor-sucesso-fundo; }
.ff-fundo-erro       { background-color: $cor-erro-fundo; }
.ff-fundo-aviso      { background-color: $cor-aviso-fundo; }

// ── Bordas ────────────────────────────────────────────────────────────────────
.ff-borda          { border: $borda-padrao; }
.ff-borda-top      { border-top: $borda-padrao; }
.ff-borda-bottom   { border-bottom: $borda-padrao; }
.ff-borda-primaria { border: 1px solid $cor-primaria; }
.ff-borda-acento   { border: $borda-acento; }

.ff-raio-sm   { border-radius: $raio-sm; }
.ff-raio      { border-radius: $raio-base; }
.ff-raio-md   { border-radius: $raio-md; }
.ff-raio-lg   { border-radius: $raio-lg; }
.ff-raio-full { border-radius: $raio-full; }

// ── Sombras ───────────────────────────────────────────────────────────────────
.ff-sombra-sm  { box-shadow: $sombra-sm; }
.ff-sombra     { box-shadow: $sombra-base; }
.ff-sombra-md  { box-shadow: $sombra-md; }
.ff-sombra-brilho-laranja { box-shadow: $sombra-brilho-laranja; }
.ff-sombra-brilho-roxo    { box-shadow: $sombra-brilho-roxo; }

// ── Estados de feedback coloridos ─────────────────────────────────────────────
.ff-badge {
  display: inline-flex;
  align-items: center;
  padding: $espaco-1 $espaco-2;
  border-radius: $raio-full;
  font-size: $tamanho-xs;
  font-weight: $peso-medio;
  line-height: 1;
  white-space: nowrap;

  &--sucesso   { background: $cor-sucesso-fundo;  color: $cor-sucesso;  }
  &--erro      { background: $cor-erro-fundo;     color: $cor-erro;     }
  &--aviso     { background: $cor-aviso-fundo;    color: $cor-aviso;    }
  &--info      { background: $cor-info-fundo;     color: $cor-info;     }
  &--primaria  { background: $cor-primaria-fundo; color: $cor-primaria; }
  &--acento    { background: $cor-acento-fundo;   color: $cor-acento;   }
}

// ── Valor monetário (com cor semântica) ───────────────────────────────────────
.ff-valor-receita   { color: $cor-receita;   font-weight: $peso-medio; }
.ff-valor-despesa   { color: $cor-despesa;   font-weight: $peso-medio; }
.ff-valor-neutro    { color: $cor-transferencia; }
.ff-valor-destaque  {
  color: $cor-primaria;
  font-size: $tamanho-xl;
  font-weight: $peso-bold;
}

// ── Divisores ─────────────────────────────────────────────────────────────────
.ff-divisor {
  border: none;
  border-top: 1px solid $cor-divisor;
  margin: $espaco-6 0;
}
```

---

### 14.6 `src/estilos/_layout.scss`

```scss
// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT — FamilyFinance · Tema Halloween
// Estrutura geral: app shell, sidenav, área de conteúdo, grid de páginas.
// ─────────────────────────────────────────────────────────────────────────────
@use 'tokens' as *;

// ── Mixin de breakpoint ───────────────────────────────────────────────────────
@mixin tela-sm  { @media (max-width: #{$bp-sm})  { @content; } }
@mixin tela-md  { @media (max-width: #{$bp-md})  { @content; } }
@mixin tela-lg  { @media (max-width: #{$bp-lg})  { @content; } }
@mixin tela-xl  { @media (max-width: #{$bp-xl})  { @content; } }
@mixin acima-de($bp) { @media (min-width: $bp) { @content; } }

// ── App shell ─────────────────────────────────────────────────────────────────
.ff-app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: $cor-fundo-app;
}

// ── Sidenav (menu lateral) ────────────────────────────────────────────────────
.ff-sidenav {
  width: $largura-sidenav;
  flex-shrink: 0;
  background-color: $cor-fundo-sidenav;
  border-right: 1px solid $cor-borda;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width $transicao-padrao;

  &--recolhido {
    width: $largura-sidenav-recolhida;
  }

  @include tela-md {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: $z-overlay;
    transform: translateX(0);

    &--fechado {
      transform: translateX(-100%);
    }
  }
}

.ff-sidenav__cabecalho {
  padding: $espaco-6 $espaco-5;
  border-bottom: 1px solid $cor-borda;
  flex-shrink: 0;

  .ff-sidenav__logo {
    font-size: $tamanho-xl;
    font-weight: $peso-bold;
    color: $cor-primaria;
    white-space: nowrap;
    overflow: hidden;
  }

  .ff-sidenav__subtitulo {
    font-size: $tamanho-xs;
    color: $cor-texto-desabilitado;
    margin-top: $espaco-1;
    white-space: nowrap;
    overflow: hidden;
  }
}

.ff-sidenav__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: $espaco-4 0;

  // Scrollbar customizada
  scrollbar-width: thin;
  scrollbar-color: $cor-borda transparent;

  &::-webkit-scrollbar      { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: $cor-borda;
    border-radius: $raio-full;
  }
}

.ff-sidenav__grupo {
  padding: $espaco-4 0 $espaco-2;

  &-titulo {
    padding: 0 $espaco-5;
    font-size: $tamanho-xs;
    font-weight: $peso-medio;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $cor-texto-desabilitado;
    margin-bottom: $espaco-2;
  }
}

.ff-sidenav__item {
  display: flex;
  align-items: center;
  gap: $espaco-3;
  padding: $espaco-3 $espaco-5;
  color: $cor-texto-secundario;
  text-decoration: none;
  font-size: $tamanho-sm;
  font-weight: $peso-regular;
  border-left: 3px solid transparent;
  transition: $transicao-rapida;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;

  mat-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: $cor-texto-desabilitado;
    transition: color $transicao-rapida;
  }

  &:hover {
    background-color: $cor-fundo-hover;
    color: $cor-texto-primario;
    border-left-color: $cor-borda;

    mat-icon { color: $cor-texto-secundario; }
  }

  &.ativo {
    background-color: $cor-fundo-selecionado;
    color: $cor-primaria;
    font-weight: $peso-medio;
    border-left-color: $cor-primaria;
    box-shadow: inset 0 0 0 0 transparent;

    mat-icon { color: $cor-primaria; }
  }
}

.ff-sidenav__rodape {
  padding: $espaco-4 $espaco-5;
  border-top: 1px solid $cor-borda;
  flex-shrink: 0;
  font-size: $tamanho-xs;
  color: $cor-texto-desabilitado;
}

// ── Área de conteúdo principal ────────────────────────────────────────────────
.ff-conteudo-principal {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $cor-fundo-app;
}

// ── Topbar ────────────────────────────────────────────────────────────────────
.ff-topbar {
  height: $altura-topbar;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 $espaco-8;
  background-color: $cor-fundo-sidenav;
  border-bottom: 1px solid $cor-borda;
  gap: $espaco-4;
}

// ── Área de scroll da página ──────────────────────────────────────────────────
.ff-area-pagina {
  flex: 1;
  overflow-y: auto;
  padding: $espaco-8;

  scrollbar-width: thin;
  scrollbar-color: $cor-borda transparent;

  &::-webkit-scrollbar      { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: $cor-borda;
    border-radius: $raio-full;
  }

  @include tela-md {
    padding: $espaco-4;
  }
}

// ── Container de largura máxima ───────────────────────────────────────────────
.ff-container {
  width: 100%;
  max-width: $largura-conteudo-max;
  margin: 0 auto;
}

// ── Cabeçalho de página ───────────────────────────────────────────────────────
.ff-cabecalho-pagina {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $espaco-8;
  gap: $espaco-4;

  @include tela-sm {
    flex-direction: column;
    align-items: flex-start;
  }

  &__titulo {
    font-size: $tamanho-2xl;
    font-weight: $peso-bold;
    color: $cor-texto-primario;
    margin: 0;
  }

  &__subtitulo {
    font-size: $tamanho-sm;
    color: $cor-texto-secundario;
    margin-top: $espaco-1;
  }

  &__acoes {
    display: flex;
    align-items: center;
    gap: $espaco-3;
    flex-shrink: 0;
  }
}

// ── Grid de cards ─────────────────────────────────────────────────────────────
.ff-grid-cards {
  display: grid;
  gap: $espaco-6;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

  @include tela-sm {
    grid-template-columns: 1fr;
  }
}

// ── Estado vazio ──────────────────────────────────────────────────────────────
.ff-estado-vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $espaco-16 $espaco-8;
  text-align: center;
  background-color: $cor-fundo-cartao;
  border: $borda-padrao;
  border-radius: $raio-md;

  &__icone {
    font-size: 56px;
    width: 56px;
    height: 56px;
    color: $cor-texto-desabilitado;
    margin-bottom: $espaco-4;
  }

  &__titulo {
    font-size: $tamanho-lg;
    font-weight: $peso-semi;
    color: $cor-texto-primario;
    margin: 0 0 $espaco-2;
  }

  &__descricao {
    font-size: $tamanho-sm;
    color: $cor-texto-secundario;
    margin: 0 0 $espaco-6;
    max-width: 360px;
  }
}

// ── Estado de carregamento ────────────────────────────────────────────────────
.ff-area-carregando {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $espaco-12;
  gap: $espaco-4;
  color: $cor-texto-secundario;
  font-size: $tamanho-sm;
}
```

---

### 14.7 `src/estilos/_componentes.scss`

```scss
// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES — FamilyFinance · Tema Halloween
// Overrides de componentes Material + componentes visuais reutilizáveis ff-*.
// REGRA: todo override de Material usa ::ng-deep APENAS no estilos globais
//   (não nos arquivos de componente). Aqui é o único lugar legítimo.
// ─────────────────────────────────────────────────────────────────────────────
@use 'tokens' as *;
@use 'sass:color';

// ── Card ──────────────────────────────────────────────────────────────────────
.ff-card {
  background-color: $cor-fundo-cartao;
  border: $borda-padrao;
  border-radius: $raio-md;
  padding: $espaco-6;
  box-shadow: $sombra-sm;
  transition: box-shadow $transicao-rapida, border-color $transicao-rapida;

  &:hover {
    border-color: $cor-primaria;
    box-shadow: $sombra-brilho-laranja;
  }

  &--flat {
    box-shadow: none;
    &:hover { box-shadow: none; }
  }

  &--acento:hover {
    border-color: $cor-acento;
    box-shadow: $sombra-brilho-roxo;
  }

  &__titulo {
    font-size: $tamanho-base;
    font-weight: $peso-semi;
    color: $cor-texto-primario;
    margin: 0 0 $espaco-4;
    padding-bottom: $espaco-4;
    border-bottom: 1px solid $cor-divisor;
  }
}

// ── Tabela ────────────────────────────────────────────────────────────────────
.ff-tabela-container {
  background-color: $cor-fundo-cartao;
  border: $borda-padrao;
  border-radius: $raio-md;
  overflow: hidden;
  box-shadow: $sombra-sm;

  // Tabela interna (mat-table ou table padrão)
  table {
    width: 100%;
    border-collapse: collapse;
  }

  // Overflow horizontal em mobile
  overflow-x: auto;
}

// Cabeçalho da tabela
.mat-mdc-header-cell {
  font-size: $tamanho-xs !important;
  font-weight: $peso-semi !important;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $cor-texto-desabilitado !important;
  background-color: darken($cor-fundo-cartao, 2%) !important;
  border-bottom: 1px solid $cor-borda !important;
  padding: $espaco-3 $espaco-4 !important;
  white-space: nowrap;
}

// Células da tabela
.mat-mdc-cell {
  font-size: $tamanho-sm !important;
  color: $cor-texto-primario !important;
  border-bottom: 1px solid $cor-divisor !important;
  padding: $espaco-3 $espaco-4 !important;
  vertical-align: middle;
}

// Linhas pares — fundo alternado sutil
.mat-mdc-row:nth-child(even) {
  background-color: $cor-fundo-cartao-alt !important;
}

// Coluna de ações — centralizada
.ff-coluna-acoes {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

// ── Formulário ────────────────────────────────────────────────────────────────
.ff-formulario {
  display: flex;
  flex-direction: column;
  gap: $espaco-4;
  background-color: $cor-fundo-cartao;
  border: $borda-padrao;
  border-radius: $raio-md;
  padding: $espaco-8;
  box-shadow: $sombra-sm;
  max-width: 560px;

  &--largura-total {
    max-width: 100%;
  }

  &__acoes {
    display: flex;
    justify-content: flex-end;
    gap: $espaco-3;
    margin-top: $espaco-4;
    padding-top: $espaco-6;
    border-top: 1px solid $cor-divisor;
  }

  &__secao {
    display: flex;
    flex-direction: column;
    gap: $espaco-4;
    padding: $espaco-4 0;
    border-bottom: 1px solid $cor-divisor;

    &:last-child { border-bottom: none; }

    &-titulo {
      font-size: $tamanho-sm;
      font-weight: $peso-semi;
      color: $cor-texto-secundario;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  }
}

// ── Campos Material com tema Halloween ───────────────────────────────────────
.mat-mdc-form-field {
  width: 100%;

  // Borda do outline
  &.mat-form-field-appearance-outline {
    .mdc-notched-outline__leading,
    .mdc-notched-outline__notch,
    .mdc-notched-outline__trailing {
      border-color: $cor-borda-input !important;
    }

    &:hover .mdc-notched-outline__leading,
    &:hover .mdc-notched-outline__notch,
    &:hover .mdc-notched-outline__trailing {
      border-color: $cor-texto-desabilitado !important;
    }

    &.mat-focused .mdc-notched-outline__leading,
    &.mat-focused .mdc-notched-outline__notch,
    &.mat-focused .mdc-notched-outline__trailing {
      border-color: $cor-primaria !important;
      border-width: 2px !important;
    }
  }
}

// ── Botões ────────────────────────────────────────────────────────────────────
// O Material já estiliza os botões com a cor primária.
// Adicionamos micro-ajustes de hover e focus.
.mat-mdc-raised-button.mat-primary:not(:disabled) {
  &:hover {
    box-shadow: $sombra-brilho-laranja !important;
  }
  &:focus-visible {
    outline: 2px solid $cor-primaria;
    outline-offset: 2px;
  }
}

.mat-mdc-outlined-button.mat-primary:not(:disabled):hover {
  background-color: $cor-fundo-hover !important;
}

// ── Chip / Tag de tipo ────────────────────────────────────────────────────────
.ff-chip {
  display: inline-flex;
  align-items: center;
  gap: $espaco-1;
  padding: $espaco-1 $espaco-3;
  border-radius: $raio-full;
  font-size: $tamanho-xs;
  font-weight: $peso-medio;
  white-space: nowrap;
  border: 1px solid transparent;

  &--corrente     { background: rgba(168,85,247,0.15); color: $_roxo-300;   border-color: rgba(168,85,247,0.3); }
  &--poupanca     { background: rgba(74,222,128,0.15); color: $_verde-400;  border-color: rgba(74,222,128,0.3); }
  &--cartao       { background: rgba(251,191,36,0.15); color: $_amarelo-400;border-color: rgba(251,191,36,0.3); }
  &--carteira     { background: rgba(255,107,0,0.15);  color: $_laranja-300;border-color: rgba(255,107,0,0.3);  }
  &--investimento { background: rgba(96,165,250,0.15); color: #60a5fa;      border-color: rgba(96,165,250,0.3); }
}

// ── Amostra de cor ────────────────────────────────────────────────────────────
.ff-amostra-cor {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid $cor-borda;
  flex-shrink: 0;
  box-shadow: $sombra-sm;
}

// ── Diálogo de confirmação ────────────────────────────────────────────────────
.ff-dialogo-confirmacao {
  .mat-mdc-dialog-title {
    color: $cor-texto-primario;
    font-size: $tamanho-lg;
    font-weight: $peso-semi;
    padding: $espaco-6 $espaco-6 $espaco-4;
  }

  .mat-mdc-dialog-content {
    color: $cor-texto-secundario;
    font-size: $tamanho-sm;
    padding: 0 $espaco-6 $espaco-4;
  }

  .mat-mdc-dialog-actions {
    padding: $espaco-4 $espaco-6 $espaco-6;
    gap: $espaco-3;
    justify-content: flex-end;
    border-top: 1px solid $cor-divisor;
  }
}

// ── Spinner com cor do tema ───────────────────────────────────────────────────
.mat-mdc-progress-spinner circle {
  stroke: $cor-primaria !important;
}

// ── Scrollbar global ──────────────────────────────────────────────────────────
* {
  scrollbar-width: thin;
  scrollbar-color: $cor-borda transparent;

  &::-webkit-scrollbar       { width: 6px; height: 6px; }
  &::-webkit-scrollbar-track  { background: transparent; }
  &::-webkit-scrollbar-thumb  {
    background: $cor-borda;
    border-radius: $raio-full;

    &:hover { background: $cor-texto-desabilitado; }
  }
}

// ── Foco visível acessível ────────────────────────────────────────────────────
:focus-visible {
  outline: 2px solid $cor-primaria;
  outline-offset: 2px;
  border-radius: $raio-sm;
}

// Remover outline padrão do browser apenas quando não for teclado
:focus:not(:focus-visible) {
  outline: none;
}

// ── Seleção de texto ──────────────────────────────────────────────────────────
::selection {
  background-color: rgba(255, 107, 0, 0.3);
  color: $cor-texto-primario;
}
```

---

### 14.8 `src/styles.scss` — Entry Point

```scss
// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT GLOBAL — FamilyFinance Web
// Importar fontes → tokens → tema Material → tipografia → layout → utilitários → componentes
// A ORDEM IMPORTA: tokens devem vir antes de qualquer arquivo que os use.
// ─────────────────────────────────────────────────────────────────────────────

// ── Google Fonts ──────────────────────────────────────────────────────────────
// Inter: UI moderna e de alta legibilidade, padrão em sistemas corporativos.
// JetBrains Mono: monospace para blocos de código e valores técnicos.
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

// ── Ícones Material ───────────────────────────────────────────────────────────
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

// ── Camadas do design system (ordem obrigatória) ──────────────────────────────
@use 'estilos/tokens'      as *;   // 1. Variáveis — sem saída CSS
@use 'estilos/tema'        as *;   // 2. Tema Material — gera CSS do Material
@use 'estilos/tipografia'  as *;   // 3. Tipografia base — body, headings
@use 'estilos/layout'      as *;   // 4. Estrutura — shell, sidenav, grid
@use 'estilos/utilitarios' as *;   // 5. Utilitários — classes single-purpose
@use 'estilos/componentes' as *;   // 6. Componentes — overrides e classes ff-*

// ── Reset mínimo ──────────────────────────────────────────────────────────────
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: $cor-fundo-app;
  color: $cor-texto-primario;
  font-family: $fonte-sans;
}

// ── Transição de rota suave ───────────────────────────────────────────────────
router-outlet + * {
  animation: ff-fade-in 0.18s ease-out;
}

@keyframes ff-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

### 14.9 Atualização dos componentes — usar classes globais

Com o sistema de estilos global, os arquivos `.scss` dos componentes ficam
enxutos. Os estilos repetem-se **apenas** quando um componente tem alguma
particularidade que o design system não cobre.

**`layout-principal.component.scss`** (atualizado):

```scss
// Apenas o que é específico deste componente.
// Estrutura e cores vêm do design system via ff-sidenav / ff-area-pagina.
:host {
  display: block;
  height: 100vh;
}

.container-layout {
  height: 100vh;
}
```

**`lista-contas.component.scss`** (atualizado):

```scss
// Apenas o que o design system global não cobre.
.amostra-cor {
  @extend .ff-amostra-cor;
}
```

**`formulario-conta.component.scss`** (atualizado):

```scss
// Sem overrides necessários — usa ff-formulario e ff-formulario__acoes do global.
```

---

## 15. README do Projeto

### 15.1 `README.md`

```markdown
# FamilyFinance Web

Frontend Angular do sistema FamilyFinance — gestão financeira familiar.

## Pré-requisitos

- Node.js 20.x LTS
- npm 10.x
- Backend Spring Boot rodando em `http://localhost:8080`

## Instalação

\`\`\`bash
npm install
\`\`\`

## Comandos

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor de desenvolvimento em `http://localhost:4200` |
| `npm run build` | Build de desenvolvimento |
| `npm run build:prod` | Build de produção |
| `npm test` | Executa os testes em modo watch |
| `npm run test:cobertura` | Executa testes e gera relatório de cobertura |
| `npm run lint` | Executa o linter |
| `npm run format` | Formata os arquivos com Prettier |

## Estrutura

Veja a apostila de onboarding `familyfinance-web-apostila-junior.md` para detalhes
sobre estrutura de pastas, padrões e fluxo de desenvolvimento.

## Backend

O backend Java/Spring Boot deve estar rodando em `http://localhost:8080`.
Documentação interativa via Swagger UI em `http://localhost:8080/swagger-ui.html`.
```

---

## 16. Resumo dos Bugs Intencionais

Esta tabela é **apenas para o mentor**. Não compartilhar diretamente com a Júnior — ela deve descobrir os bugs durante o uso e a leitura do código. O mentor pode dar pistas progressivas conforme necessário.

| ID | Localização | O que está errado | Sintoma para a Júnior | Como descobrir | Correção |
|---|---|---|---|---|---|
| `BUG-INTENCIONAL-01` | `conta.servico.ts`, `urlBase` | URL "`/conta`" em vez de "`/contas`" | Lista de contas vazia, snackbar "Recurso não encontrado" | Abrir Network do navegador → ver requisição GET `/conta` retornando 404. Comparar com Swagger UI (`/contas`) | Trocar para `/contas` |
| `BUG-INTENCIONAL-02` | `conta.servico.ts`, método `atualizar` | Usa `POST` em vez de `PUT` | Ao salvar uma edição, snackbar "Operação não permitida" (HTTP 405) | Network mostra POST para `/contas/{id}`. Swagger UI mostra que o método correto é PUT | Trocar `this.http.post` para `this.http.put` |
| `BUG-INTENCIONAL-03` | `lista-contas.component.ts`, método `carregarContas` | Falta callback `error` no `subscribe` | Quando a API falha, spinner gira indefinidamente | A Júnior nota o spinner travado em cenários de erro. Inspeção do código revela só `next` | Adicionar callback `error` que ao menos chama `this.carregando.set(false)` |
| `BUG-INTENCIONAL-04` | `formulario-conta.component.ts`, controle `nome` | Falta `Validators.minLength(2)` | Frontend permite salvar nome com 1 caractere; backend rejeita com 400/422 | Tentar salvar conta com nome "A"; ler mensagem de erro vinda do backend | Adicionar `Validators.minLength(2)` |
| `BUG-INTENCIONAL-05` | `formulario-conta.component.ts`, método `atualizar` | Envia `saldoInicial` no comando de edição | Backend pode retornar erro de campo desconhecido ou ignorar; o saldo inicial não atualiza mesmo se mostrado no formulário | Comparar com `EditarContaComando` no `conta.modelo.ts` — `saldoInicial` não está lá. Comparar com Swagger UI | Remover `saldoInicial` do objeto enviado em `atualizar` |
| `BUG-INTENCIONAL-06` | `formulario-conta.component.html`, botão "Salvar" | `type="button"` em vez de `type="submit"` | Clicar no botão Salvar não dispara o submit do formulário | A Júnior tenta salvar pelo botão e nada acontece. Pressionando Enter dentro de um campo, funciona | Trocar para `type="submit"` |

### 16.1 Distribuição dos Bugs

A intenção é cobrir diferentes categorias de erros comuns em frontend Angular júnior:

| Categoria | Bug |
|---|---|
| Erro de URL/endpoint | BUG-01 |
| Método HTTP incorreto | BUG-02 |
| Tratamento incompleto de erros | BUG-03 |
| Validação faltando no formulário | BUG-04 |
| Payload incorreto | BUG-05 |
| Atributo HTML incorreto | BUG-06 |

---

## 17. Critérios de Aceite

A Analista Júnior pode considerar a primeira tarefa concluída quando:

- [ ] O comando `npm start` sobe o frontend em `http://localhost:4200` sem erros.
- [ ] A aplicação exibe o layout com menu lateral e a opção "Contas".
- [ ] Ao clicar em "Contas", a lista carrega do backend e exibe as contas existentes.
- [ ] É possível criar uma nova conta pelo formulário de "Nova conta".
- [ ] É possível editar uma conta existente.
- [ ] É possível desativar uma conta com confirmação prévia.
- [ ] Erros do backend são exibidos via snackbar com mensagem amigável.
- [ ] `npm run lint` passa sem erros.
- [ ] `npm run build` gera o build sem warnings.
- [ ] **Os 6 bugs intencionais foram identificados e corrigidos**, com PR descritivo para cada um (ou um único PR consolidado, conforme combinado com o mentor).

---

*Especificação consumida pelo Claude Code para gerar o projeto inicial. Após a geração, este documento serve também como referência para revisão pelo mentor antes de entregar à Analista Júnior.*
