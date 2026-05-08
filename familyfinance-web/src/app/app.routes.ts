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
