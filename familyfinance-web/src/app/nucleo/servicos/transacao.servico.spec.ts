import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TransacaoServico } from './transacao.servico';
import { ambiente } from '../../../ambientes/ambiente';
import { CriarTransacaoComando, EditarTransacaoComando, Transacao } from '../../modelos/transacao.modelo';

const urlBase = `${ambiente.urlApi}/transacoes`;

describe('TransacaoServico', () => {
  let servico: TransacaoServico;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransacaoServico, provideHttpClient(), provideHttpClientTesting()]
    });
    servico = TestBed.inject(TransacaoServico);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('deve criar o serviço', () => {
    expect(servico).toBeTruthy();
  });

  it('deve chamar GET /api/transacoes sem params quando filtros vazio', () => {
    servico.listar().subscribe();
    const req = httpMock.expectOne(urlBase);
    expect(req.request.method).toBe('GET');
    req.flush({ conteudo: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0, ultima: true });
  });

  it('deve incluir contaId nos query params quando fornecido', () => {
    servico.listar({ contaId: 'conta-abc' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === urlBase);
    expect(req.request.params.get('contaId')).toBe('conta-abc');
    req.flush({ conteudo: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0, ultima: true });
  });

  it('deve incluir tipo nos query params quando fornecido', () => {
    servico.listar({ tipo: 'DESPESA' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === urlBase);
    expect(req.request.params.get('tipo')).toBe('DESPESA');
    req.flush({ conteudo: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0, ultima: true });
  });

  // BUG-T-01: este teste FALHA — o serviço envia DD/MM/AAAA em vez de YYYY-MM-DD
  it('deve enviar dataInicio no formato YYYY-MM-DD', () => {
    servico.listar({ dataInicio: '2026-05-01' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === urlBase);
    expect(req.request.params.get('dataInicio')).toBe('2026-05-01');
    req.flush({ conteudo: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0, ultima: true });
  });

  // BUG-T-01: este teste FALHA — o serviço envia DD/MM/AAAA em vez de YYYY-MM-DD
  it('deve enviar dataFim no formato YYYY-MM-DD', () => {
    servico.listar({ dataFim: '2026-05-31' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === urlBase);
    expect(req.request.params.get('dataFim')).toBe('2026-05-31');
    req.flush({ conteudo: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0, ultima: true });
  });

  it('deve chamar PATCH /efetivar com { efetivada: true }', () => {
    servico.efetivar('tx-123', true).subscribe();
    const req = httpMock.expectOne(`${urlBase}/tx-123/efetivar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ efetivada: true });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('deve chamar PATCH /ativo com { ativo: false }', () => {
    servico.alterarSituacao('tx-123', false).subscribe();
    const req = httpMock.expectOne(`${urlBase}/tx-123/ativo`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ativo: false });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('buscarPorId() deve GET /api/transacoes/:id', () => {
    const transacaoMock = { id: 'tx-1' } as Transacao;
    let resultado: Transacao | undefined;
    servico.buscarPorId('tx-1').subscribe((r) => (resultado = r));
    const req = httpMock.expectOne(`${urlBase}/tx-1`);
    expect(req.request.method).toBe('GET');
    req.flush(transacaoMock);
    expect(resultado).toEqual(transacaoMock);
  });

  it('criar() deve POST /api/transacoes com o corpo correto', () => {
    const comando: CriarTransacaoComando = {
      contaId: 'c-1', categoriaId: null, descricao: 'Teste',
      valor: 100, tipo: 'DESPESA', dataLancamento: '2026-05-01', efetivada: true
    };
    servico.criar(comando).subscribe();
    const req = httpMock.expectOne(urlBase);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(comando);
    req.flush({ id: 'tx-new' });
  });

  it('atualizar() deve PUT /api/transacoes/:id com o corpo correto', () => {
    const comando: EditarTransacaoComando = {
      contaId: 'c-1', categoriaId: null, descricao: 'Teste atualizado',
      valor: 200, tipo: 'DESPESA', dataLancamento: '2026-05-02', efetivada: false
    };
    servico.atualizar('tx-1', comando).subscribe();
    const req = httpMock.expectOne(`${urlBase}/tx-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(comando);
    req.flush({ id: 'tx-1' });
  });
});
