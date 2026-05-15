import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CategoriaServico } from './categoria.servico';
import { ambiente } from '../../../ambientes/ambiente';
import {
  ArquivamentoResposta,
  Categoria,
  CriarCategoriaComando,
  EditarCategoriaComando,
  RestaurarCategoriaComando
} from '../../modelos/categoria.modelo';

const urlBase = `${ambiente.urlApi}/categorias`;

const categoriaMock: Categoria = {
  id: 'cat-1', nome: 'Alimentação', tipo: 'DESPESA', icone: 'restaurant', cor: '#ef4444',
  ativo: true, subcategoriasAtivas: 0
};

describe('CategoriaServico', () => {
  let servico: CategoriaServico;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servico = TestBed.inject(CategoriaServico);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('listar() deve GET /api/categorias', () => {
    let resultado: Categoria[] | undefined;
    servico.listar().subscribe((r) => (resultado = r));
    const req = http.expectOne(urlBase);
    expect(req.request.method).toBe('GET');
    req.flush([categoriaMock]);
    expect(resultado).toEqual([categoriaMock]);
  });

  it('listarArquivadas() deve GET /api/categorias?situacao=arquivada', () => {
    let resultado: Categoria[] | undefined;
    servico.listarArquivadas().subscribe((r) => (resultado = r));
    const req = http.expectOne(`${urlBase}?situacao=arquivada`);
    expect(req.request.method).toBe('GET');
    req.flush([categoriaMock]);
    expect(resultado).toEqual([categoriaMock]);
  });

  it('buscarPorId() deve GET /api/categorias/:id', () => {
    let resultado: Categoria | undefined;
    servico.buscarPorId('cat-1').subscribe((r) => (resultado = r));
    const req = http.expectOne(`${urlBase}/cat-1`);
    expect(req.request.method).toBe('GET');
    req.flush(categoriaMock);
    expect(resultado).toEqual(categoriaMock);
  });

  it('criar() deve POST /api/categorias com o corpo correto', () => {
    const comando: CriarCategoriaComando = { nome: 'Alimentação', tipo: 'DESPESA' };
    servico.criar(comando).subscribe();
    const req = http.expectOne(urlBase);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(comando);
    req.flush(categoriaMock);
  });

  it('atualizar() deve PUT /api/categorias/:id com o corpo correto', () => {
    const comando: EditarCategoriaComando = { nome: 'Alimentação v2', tipo: 'DESPESA', icone: null, cor: null };
    servico.atualizar('cat-1', comando).subscribe();
    const req = http.expectOne(`${urlBase}/cat-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(comando);
    req.flush(categoriaMock);
  });

  it('arquivar() deve POST /api/categorias/:id/arquivar', () => {
    const resposta: ArquivamentoResposta = { subcategoriasArquivadas: 2 };
    let resultado: ArquivamentoResposta | undefined;
    servico.arquivar('cat-1').subscribe((r) => (resultado = r));
    const req = http.expectOne(`${urlBase}/cat-1/arquivar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(resposta);
    expect(resultado).toEqual(resposta);
  });

  it('restaurar() deve POST /api/categorias/:id/restaurar com o corpo correto', () => {
    const comando: RestaurarCategoriaComando = { restaurarSubcategorias: true };
    servico.restaurar('cat-1', comando).subscribe();
    const req = http.expectOne(`${urlBase}/cat-1/restaurar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(comando);
    req.flush(categoriaMock);
  });
});
