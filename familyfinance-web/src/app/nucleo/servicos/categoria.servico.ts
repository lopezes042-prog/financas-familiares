import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ambiente } from '../../../ambientes/ambiente';
import {
  ArquivamentoResposta,
  Categoria,
  CriarCategoriaComando,
  EditarCategoriaComando,
  RestaurarCategoriaComando
} from '../../modelos/categoria.modelo';

@Injectable({ providedIn: 'root' })
export class CategoriaServico {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${ambiente.urlApi}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.urlBase);
  }

  listarArquivadas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.urlBase, { params: { situacao: 'arquivada' } });
  }

  buscarPorId(id: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.urlBase}/${id}`);
  }

  criar(comando: CriarCategoriaComando): Observable<Categoria> {
    return this.http.post<Categoria>(this.urlBase, comando);
  }

  atualizar(id: string, comando: EditarCategoriaComando): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.urlBase}/${id}`, comando);
  }

  arquivar(id: string): Observable<ArquivamentoResposta> {
    return this.http.post<ArquivamentoResposta>(`${this.urlBase}/${id}/arquivar`, null);
  }

  restaurar(id: string, comando: RestaurarCategoriaComando): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.urlBase}/${id}/restaurar`, comando);
  }
}
