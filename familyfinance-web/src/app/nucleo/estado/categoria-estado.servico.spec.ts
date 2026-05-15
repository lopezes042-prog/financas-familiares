import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { CategoriaEstadoServico } from './categoria-estado.servico';
import { CategoriaServico } from '../servicos/categoria.servico';
import { Categoria } from '../../modelos/categoria.modelo';

const categoriasMock: Categoria[] = [
  { id: 'cat-1', nome: 'Alimentação', tipo: 'DESPESA', icone: null, cor: null, ativo: true, subcategoriasAtivas: 0 }
];

describe('CategoriaEstadoServico', () => {
  let servico: CategoriaEstadoServico;
  let categoriaServicoMock: Partial<CategoriaServico>;

  beforeEach(() => {
    categoriaServicoMock = { listar: vi.fn().mockReturnValue(of(categoriasMock)) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CategoriaServico, useValue: categoriaServicoMock }
      ]
    });
    servico = TestBed.inject(CategoriaEstadoServico);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve iniciar com lista vazia e não carregando', () => {
    expect(servico.categorias()).toEqual([]);
    expect(servico.carregando()).toBe(false);
  });

  it('deve carregar categorias ao chamar garantirCarregado()', () => {
    servico.garantirCarregado();
    expect(categoriaServicoMock.listar).toHaveBeenCalledOnce();
    expect(servico.categorias()).toEqual(categoriasMock);
    expect(servico.carregando()).toBe(false);
  });

  it('deve ignorar chamadas subsequentes quando já carregado', () => {
    servico.garantirCarregado();
    servico.garantirCarregado();
    expect(categoriaServicoMock.listar).toHaveBeenCalledOnce();
  });

  it('deve ignorar chamadas enquanto carregando', () => {
    const pendente$ = new Subject<Categoria[]>();
    categoriaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    servico.garantirCarregado();
    servico.garantirCarregado();
    expect(categoriaServicoMock.listar).toHaveBeenCalledOnce();
    pendente$.complete();
  });

  it('deve recarregar mesmo se já carregado ao chamar recarregar()', () => {
    servico.garantirCarregado();
    vi.clearAllMocks();
    categoriaServicoMock.listar = vi.fn().mockReturnValue(of(categoriasMock));
    servico.recarregar();
    expect(categoriaServicoMock.listar).toHaveBeenCalledOnce();
  });

  it('deve parar spinner após erro', () => {
    const erro$ = new Subject<Categoria[]>();
    categoriaServicoMock.listar = vi.fn().mockReturnValue(erro$.asObservable());
    servico.garantirCarregado();
    expect(servico.carregando()).toBe(true);
    erro$.error(new Error('falha'));
    expect(servico.carregando()).toBe(false);
  });
});
