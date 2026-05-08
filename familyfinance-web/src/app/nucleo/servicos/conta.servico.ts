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

  // v2: usado ao exibir saldo em tempo real após lançamento de transações
  consultarSaldo(id: string): Observable<SaldoContaResposta> {
    return this.http.get<SaldoContaResposta>(`${this.urlBase}/${id}/saldo`);
  }
}
