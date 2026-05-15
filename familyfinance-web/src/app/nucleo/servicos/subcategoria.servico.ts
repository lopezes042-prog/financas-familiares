import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ambiente } from '../../../ambientes/ambiente';
import {
  CriarSubcategoriaComando,
  EditarSubcategoriaComando,
  RestaurarSubcategoriaComando,
  Subcategoria
} from '../../modelos/subcategoria.modelo';

@Injectable({ providedIn: 'root' })
export class SubcategoriaServico {
  private readonly http = inject(HttpClient);

  private urlBase(categoriaId: string): string {
    return `${ambiente.urlApi}/categorias/${categoriaId}/subcategorias`;
  }

  listar(categoriaId: string): Observable<Subcategoria[]> {
    return this.http.get<Subcategoria[]>(this.urlBase(categoriaId));
  }

  listarArquivadas(categoriaId: string): Observable<Subcategoria[]> {
    return this.http.get<Subcategoria[]>(this.urlBase(categoriaId), {
      params: { situacao: 'ARQUIVADA' }
    });
  }

  buscarPorId(categoriaId: string, id: string): Observable<Subcategoria> {
    return this.http.get<Subcategoria>(`${this.urlBase(categoriaId)}/${id}`);
  }

  criar(categoriaId: string, comando: CriarSubcategoriaComando): Observable<Subcategoria> {
    return this.http.post<Subcategoria>(this.urlBase(categoriaId), comando);
  }

  atualizar(categoriaId: string, id: string, comando: EditarSubcategoriaComando): Observable<Subcategoria> {
    return this.http.put<Subcategoria>(`${this.urlBase(categoriaId)}/${id}`, comando);
  }

  arquivar(categoriaId: string, id: string): Observable<void> {
    return this.http.post<void>(`${this.urlBase(categoriaId)}/${id}/arquivar`, {});
  }

  restaurar(categoriaId: string, id: string, comando: RestaurarSubcategoriaComando = {}): Observable<Subcategoria> {
    return this.http.post<Subcategoria>(`${this.urlBase(categoriaId)}/${id}/restaurar`, comando);
  }
}
