import { Injectable, inject, signal } from '@angular/core';

import { CategoriaServico } from '../servicos/categoria.servico';
import { Categoria } from '../../modelos/categoria.modelo';

@Injectable({ providedIn: 'root' })
export class CategoriaEstadoServico {
  private readonly categoriaServico = inject(CategoriaServico);

  readonly categorias = signal<Categoria[]>([]);
  readonly carregando = signal<boolean>(false);
  private _carregado = false;

  garantirCarregado(): void {
    if (this._carregado || this.carregando()) return;
    this.carregando.set(true);
    this.categoriaServico.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this._carregado = true;
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  recarregar(): void {
    this._carregado = false;
    this.garantirCarregado();
  }
}
