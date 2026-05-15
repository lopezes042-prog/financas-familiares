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
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./funcionalidades/categorias/lista-categorias/lista-categorias.component').then(
            (m) => m.ListaCategoriasComponent
          )
      },
      {
        path: 'categorias/nova',
        loadComponent: () =>
          import('./funcionalidades/categorias/formulario-categoria/formulario-categoria.component').then(
            (m) => m.FormularioCategoriaComponent
          )
      },
      {
        path: 'categorias/:id/editar',
        loadComponent: () =>
          import('./funcionalidades/categorias/formulario-categoria/formulario-categoria.component').then(
            (m) => m.FormularioCategoriaComponent
          )
      },
      {
        path: 'categorias/:categoriaId/subcategorias',
        loadComponent: () =>
          import('./funcionalidades/categorias/lista-subcategorias/lista-subcategorias.component').then(
            (m) => m.ListaSubcategoriasComponent
          )
      },
      {
        path: 'transacoes',
        loadComponent: () =>
          import('./funcionalidades/transacoes/extrato-transacoes/extrato-transacoes.component').then(
            (m) => m.ExtratoTransacoesComponent
          )
      },
      {
        path: 'transacoes/nova',
        loadComponent: () =>
          import('./funcionalidades/transacoes/formulario-transacao/formulario-transacao.component').then(
            (m) => m.FormularioTransacaoComponent
          )
      },
      {
        path: 'transacoes/:id/editar',
        loadComponent: () =>
          import('./funcionalidades/transacoes/formulario-transacao/formulario-transacao.component').then(
            (m) => m.FormularioTransacaoComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
