import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ambiente } from '../../../ambientes/ambiente';
import {
  Categoria,
  CriarCategoriaComando,
  EditarCategoriaComando
} from '../../modelos/categoria.modelo';

@Injectable({ providedIn: 'root' })
export class CategoriaServico {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${ambiente.urlApi}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.urlBase);
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

  alterarSituacao(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.urlBase}/${id}/ativo`, { ativo });
  }
}
