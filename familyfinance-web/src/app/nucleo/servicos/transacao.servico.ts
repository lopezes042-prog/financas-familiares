import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ambiente } from '../../../ambientes/ambiente';
import {
  CriarTransacaoComando,
  EditarTransacaoComando,
  FiltrosTransacao,
  PaginaResposta,
  Transacao
} from '../../modelos/transacao.modelo';

@Injectable({ providedIn: 'root' })
export class TransacaoServico {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${ambiente.urlApi}/transacoes`;

  listar(filtros: FiltrosTransacao = {}): Observable<PaginaResposta<Transacao>> {
    const paramsObj: Record<string, string> = {};
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null) {
        paramsObj[chave] = String(valor);
      }
    });
    return this.http.get<PaginaResposta<Transacao>>(this.urlBase, {
      params: new HttpParams({ fromObject: paramsObj })
    });
  }

  buscarPorId(id: string): Observable<Transacao> {
    return this.http.get<Transacao>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarTransacaoComando): Observable<Transacao> {
    return this.http.post<Transacao>(this.urlBase, comando);
  }

  atualizar(id: string, comando: EditarTransacaoComando): Observable<Transacao> {
    return this.http.put<Transacao>(`${this.urlBase}/${id}`, comando);
  }

  alterarSituacao(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/ativo`, { ativo });
  }

  efetivar(id: string, efetivada: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/efetivar`, { efetivada });
  }
}
