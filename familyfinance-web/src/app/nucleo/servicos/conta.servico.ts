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
  private readonly urlBase = `${ambiente.urlApi}/contas`;

  listar(): Observable<Conta[]> {
    return this.http.get<Conta[]>(this.urlBase);
  }

  buscarPorId(id: string): Observable<Conta> {
    return this.http.get<Conta>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarContaComando): Observable<Conta> {
    return this.http.post<Conta>(this.urlBase, comando);
  }

  atualizar(id: string, comando: EditarContaComando): Observable<Conta> {
    return this.http.put<Conta>(`${this.urlBase}/${id}`, comando);
  }

  alterarSituacao(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/ativo`, { ativo });
  }

  // v2: usado ao exibir saldo em tempo real após lançamento de transações
  consultarSaldo(id: string): Observable<SaldoContaResposta> {
    return this.http.get<SaldoContaResposta>(`${this.urlBase}/${id}/saldo`);
  }
}
