import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { ContaEstadoServico } from './conta-estado.servico';
import { ContaServico } from '../servicos/conta.servico';
import { Conta } from '../../modelos/conta.modelo';

const contasMock: Conta[] = [
  { id: 'c-1', nome: 'Nubank', tipo: 'CORRENTE', saldoInicial: 0, saldoAtual: 100, ativo: true }
];

describe('ContaEstadoServico', () => {
  let servico: ContaEstadoServico;
  let contaServicoMock: Partial<ContaServico>;

  beforeEach(() => {
    contaServicoMock = { listar: vi.fn().mockReturnValue(of(contasMock)) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContaServico, useValue: contaServicoMock }
      ]
    });
    servico = TestBed.inject(ContaEstadoServico);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve iniciar com lista vazia e não carregando', () => {
    expect(servico.contas()).toEqual([]);
    expect(servico.carregando()).toBe(false);
  });

  it('deve carregar contas ao chamar garantirCarregado()', () => {
    servico.garantirCarregado();
    expect(contaServicoMock.listar).toHaveBeenCalledOnce();
    expect(servico.contas()).toEqual(contasMock);
    expect(servico.carregando()).toBe(false);
  });

  it('deve ignorar chamadas subsequentes quando já carregado', () => {
    servico.garantirCarregado();
    servico.garantirCarregado();
    expect(contaServicoMock.listar).toHaveBeenCalledOnce();
  });

  it('deve ignorar chamadas enquanto carregando', () => {
    const pendente$ = new Subject<Conta[]>();
    contaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    servico.garantirCarregado();
    servico.garantirCarregado();
    expect(contaServicoMock.listar).toHaveBeenCalledOnce();
    pendente$.complete();
  });

  it('deve recarregar mesmo se já carregado ao chamar recarregar()', () => {
    servico.garantirCarregado();
    vi.clearAllMocks();
    contaServicoMock.listar = vi.fn().mockReturnValue(of(contasMock));
    servico.recarregar();
    expect(contaServicoMock.listar).toHaveBeenCalledOnce();
  });

  it('deve parar spinner após erro', () => {
    const erro$ = new Subject<Conta[]>();
    contaServicoMock.listar = vi.fn().mockReturnValue(erro$.asObservable());
    servico.garantirCarregado();
    expect(servico.carregando()).toBe(true);
    erro$.error(new Error('falha'));
    expect(servico.carregando()).toBe(false);
  });
});
