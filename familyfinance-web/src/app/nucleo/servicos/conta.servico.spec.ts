import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ContaServico } from './conta.servico';
import { ambiente } from '../../../ambientes/ambiente';
import { Conta, CriarContaComando, EditarContaComando } from '../../modelos/conta.modelo';

const urlBase = `${ambiente.urlApi}/contas`;

const contaMock: Conta = {
  id: 'c-1', nome: 'Nubank', tipo: 'CORRENTE', saldoInicial: 1000, saldoAtual: 1200, ativo: true
};

describe('ContaServico', () => {
  let servico: ContaServico;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servico = TestBed.inject(ContaServico);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('listar() deve GET /api/contas', () => {
    let resultado: Conta[] | undefined;
    servico.listar().subscribe((r) => (resultado = r));
    const req = http.expectOne(urlBase);
    expect(req.request.method).toBe('GET');
    req.flush([contaMock]);
    expect(resultado).toEqual([contaMock]);
  });

  it('buscarPorId() deve GET /api/contas/:id', () => {
    let resultado: Conta | undefined;
    servico.buscarPorId('c-1').subscribe((r) => (resultado = r));
    const req = http.expectOne(`${urlBase}/c-1`);
    expect(req.request.method).toBe('GET');
    req.flush(contaMock);
    expect(resultado).toEqual(contaMock);
  });

  it('criar() deve POST /api/contas com o corpo correto', () => {
    const comando: CriarContaComando = { nome: 'Nubank', tipo: 'CORRENTE', saldoInicial: 1000 };
    servico.criar(comando).subscribe();
    const req = http.expectOne(urlBase);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(comando);
    req.flush(contaMock);
  });

  it('atualizar() deve PUT /api/contas/:id com o corpo correto', () => {
    const comando: EditarContaComando = { nome: 'Nubank v2', tipo: 'CORRENTE' };
    servico.atualizar('c-1', comando).subscribe();
    const req = http.expectOne(`${urlBase}/c-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(comando);
    req.flush(contaMock);
  });

  it('alterarSituacao() deve PATCH /api/contas/:id/ativo', () => {
    servico.alterarSituacao('c-1', false).subscribe();
    const req = http.expectOne(`${urlBase}/c-1/ativo`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ativo: false });
    req.flush(null);
  });

  it('consultarSaldo() deve GET /api/contas/:id/saldo', () => {
    servico.consultarSaldo('c-1').subscribe();
    const req = http.expectOne(`${urlBase}/c-1/saldo`);
    expect(req.request.method).toBe('GET');
    req.flush({ saldoAtual: 1200 });
  });
});
