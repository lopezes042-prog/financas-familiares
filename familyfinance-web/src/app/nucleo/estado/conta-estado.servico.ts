import { Injectable, inject, signal } from '@angular/core';

import { ContaServico } from '../servicos/conta.servico';
import { Conta } from '../../modelos/conta.modelo';

@Injectable({ providedIn: 'root' })
export class ContaEstadoServico {
  private readonly contaServico = inject(ContaServico);

  readonly contas = signal<Conta[]>([]);
  readonly carregando = signal<boolean>(false);
  private _carregado = false;

  garantirCarregado(): void {
    if (this._carregado || this.carregando()) return;
    this.carregando.set(true);
    this.contaServico.listar().subscribe({
      next: (contas) => {
        this.contas.set(contas);
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
