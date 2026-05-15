import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SubcategoriaServico } from './subcategoria.servico';
import { ambiente } from '../../../ambientes/ambiente';
import {
  CriarSubcategoriaComando,
  EditarSubcategoriaComando,
  RestaurarSubcategoriaComando,
  Subcategoria
} from '../../modelos/subcategoria.modelo';

const CAT_ID = 'cat-1';
const urlBase = `${ambiente.urlApi}/categorias/${CAT_ID}/subcategorias`;

const subcategoriaMock: Subcategoria = { id: 'sub-1', nome: 'Mercado', ativo: true };

describe('SubcategoriaServico', () => {
  let servico: SubcategoriaServico;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servico = TestBed.inject(SubcategoriaServico);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('listar() deve GET /api/categorias/:id/subcategorias', () => {
    let resultado: Subcategoria[] | undefined;
    servico.listar(CAT_ID).subscribe((r) => (resultado = r));
    const req = http.expectOne(urlBase);
    expect(req.request.method).toBe('GET');
    req.flush([subcategoriaMock]);
    expect(resultado).toEqual([subcategoriaMock]);
  });

  it('listarArquivadas() deve GET com ?situacao=ARQUIVADA (uppercase)', () => {
    let resultado: Subcategoria[] | undefined;
    servico.listarArquivadas(CAT_ID).subscribe((r) => (resultado = r));
    const req = http.expectOne(`${urlBase}?situacao=ARQUIVADA`);
    expect(req.request.method).toBe('GET');
    req.flush([subcategoriaMock]);
    expect(resultado).toEqual([subcategoriaMock]);
  });

  it('buscarPorId() deve GET /api/categorias/:id/subcategorias/:subId', () => {
    let resultado: Subcategoria | undefined;
    servico.buscarPorId(CAT_ID, 'sub-1').subscribe((r) => (resultado = r));
    const req = http.expectOne(`${urlBase}/sub-1`);
    expect(req.request.method).toBe('GET');
    req.flush(subcategoriaMock);
    expect(resultado).toEqual(subcategoriaMock);
  });

  it('criar() deve POST /api/categorias/:id/subcategorias com o corpo correto', () => {
    const comando: CriarSubcategoriaComando = { nome: 'Mercado' };
    servico.criar(CAT_ID, comando).subscribe();
    const req = http.expectOne(urlBase);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(comando);
    req.flush(subcategoriaMock);
  });

  it('atualizar() deve PUT /api/categorias/:id/subcategorias/:subId com o corpo correto', () => {
    const comando: EditarSubcategoriaComando = { nome: 'Mercado v2' };
    servico.atualizar(CAT_ID, 'sub-1', comando).subscribe();
    const req = http.expectOne(`${urlBase}/sub-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(comando);
    req.flush(subcategoriaMock);
  });

  it('arquivar() deve POST /api/categorias/:id/subcategorias/:subId/arquivar', () => {
    servico.arquivar(CAT_ID, 'sub-1').subscribe();
    const req = http.expectOne(`${urlBase}/sub-1/arquivar`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('restaurar() deve POST /api/categorias/:id/subcategorias/:subId/restaurar', () => {
    const comando: RestaurarSubcategoriaComando = { nome: 'Novo nome' };
    servico.restaurar(CAT_ID, 'sub-1', comando).subscribe();
    const req = http.expectOne(`${urlBase}/sub-1/restaurar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(comando);
    req.flush(subcategoriaMock);
  });
});
