import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { ExtratoTransacoesComponent } from './extrato-transacoes.component';
import { TransacaoServico } from '../../../nucleo/servicos/transacao.servico';
import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { ContaEstadoServico } from '../../../nucleo/estado/conta-estado.servico';
import { Conta } from '../../../modelos/conta.modelo';
import { PaginaResposta, Transacao } from '../../../modelos/transacao.modelo';

registerLocaleData(localePt, 'pt-BR');

const contasMock: Conta[] = [
  { id: 'conta-1', nome: 'Nubank', tipo: 'CORRENTE', saldoInicial: 1000, saldoAtual: 1500, ativo: true }
];

const paginaVazia: PaginaResposta<Transacao> = {
  conteudo: [], pagina: 0, tamanho: 50, totalItens: 0, totalPaginas: 0, ultima: true
};

const transacoesMock: Transacao[] = [
  {
    id: 'tx-1', conta: { id: 'conta-1', nome: 'Nubank' }, categoria: null, subcategoria: null,
    descricao: 'Salário', valor: 5000, tipo: 'RECEITA',
    dataLancamento: '2026-05-01', efetivada: true, ativo: true
  },
  {
    id: 'tx-2', conta: { id: 'conta-1', nome: 'Nubank' }, categoria: { id: 'cat-1', nome: 'Alimentação' }, subcategoria: null,
    descricao: 'Mercado', valor: 200, tipo: 'DESPESA',
    dataLancamento: '2026-05-02', efetivada: false, ativo: true
  }
];

describe('ExtratoTransacoesComponent', () => {
  let fixture: ComponentFixture<ExtratoTransacoesComponent>;
  let component: ExtratoTransacoesComponent;
  let transacaoServicoMock: Partial<TransacaoServico>;
  let contaServicoMock: Partial<ContaServico>;
  let contaEstadoMock: Partial<ContaEstadoServico>;

  beforeEach(async () => {
    transacaoServicoMock = {
      listar: vi.fn().mockReturnValue(of(paginaVazia)),
      efetivar: vi.fn().mockReturnValue(of(undefined)),
      alterarSituacao: vi.fn().mockReturnValue(of(undefined))
    };
    contaServicoMock = {
      buscarPorId: vi.fn().mockReturnValue(of(contasMock[0]))
    };
    contaEstadoMock = {
      contas: signal(contasMock),
      carregando: signal(false),
      garantirCarregado: vi.fn(),
      recarregar: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ExtratoTransacoesComponent,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([{ path: '**', component: ExtratoTransacoesComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TransacaoServico, useValue: transacaoServicoMock },
        { provide: ContaServico, useValue: contaServicoMock },
        { provide: ContaEstadoServico, useValue: contaEstadoMock },
        { provide: LOCALE_ID, useValue: 'pt-BR' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExtratoTransacoesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve criar o componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('deve chamar garantirCarregado() no ngOnInit', () => {
    fixture.detectChanges();
    expect(contaEstadoMock.garantirCarregado).toHaveBeenCalledOnce();
  });

  it('deve exibir spinner enquanto carrega transações', () => {
    const pendente$ = new Subject<PaginaResposta<Transacao>>();
    transacaoServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    component.selecionarConta(contasMock[0]);
    expect(component.carregando()).toBe(true);
    pendente$.complete();
  });

  it('deve parar spinner após erro na requisição de transações', () => {
    const pendente$ = new Subject<PaginaResposta<Transacao>>();
    transacaoServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    component.selecionarConta(contasMock[0]);
    expect(component.carregando()).toBe(true);
    pendente$.error(new Error('falha HTTP'));
    expect(component.carregando()).toBe(false);
  });

  it('deve exibir estado vazio sem conta selecionada', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const estadoVazio = fixture.nativeElement.querySelector('.estado-vazio');
    expect(estadoVazio).toBeTruthy();
  });

  it('deve chamar listar() ao selecionar uma conta', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.selecionarConta(contasMock[0]);
    expect(transacaoServicoMock.listar).toHaveBeenCalledWith(
      expect.objectContaining({ contaId: 'conta-1' })
    );
  });

  it('deve incluir filtro tipo no request ao chamar filtrarPorTipo()', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.selecionarConta(contasMock[0]);
    vi.clearAllMocks();
    transacaoServicoMock.listar = vi.fn().mockReturnValue(of(paginaVazia));

    component.filtrarPorTipo('DESPESA');

    expect(transacaoServicoMock.listar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'DESPESA' })
    );
  });

  it('deve exibir ícone check_circle para transação efetivada', async () => {
    transacaoServicoMock.listar = vi.fn().mockReturnValue(
      of({ ...paginaVazia, conteudo: [transacoesMock[0]], totalItens: 1 })
    );
    fixture.detectChanges();
    component.selecionarConta(contasMock[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    const icones = fixture.nativeElement.querySelectorAll('mat-icon.icone-efetivada');
    expect(icones.length).toBeGreaterThan(0);
  });

  it('deve exibir ícone schedule para transação pendente', async () => {
    transacaoServicoMock.listar = vi.fn().mockReturnValue(
      of({ ...paginaVazia, conteudo: [transacoesMock[1]], totalItens: 1 })
    );
    fixture.detectChanges();
    component.selecionarConta(contasMock[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    const icones = fixture.nativeElement.querySelectorAll('mat-icon.icone-pendente');
    expect(icones.length).toBeGreaterThan(0);
  });

  it('RECEITA deve renderizar com classe ff-valor-receita', async () => {
    transacaoServicoMock.listar = vi.fn().mockReturnValue(
      of({ ...paginaVazia, conteudo: [transacoesMock[0]], totalItens: 1 })
    );
    fixture.detectChanges();
    component.selecionarConta(contasMock[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    const spans = fixture.nativeElement.querySelectorAll('span.ff-valor-receita');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('DESPESA deve renderizar com classe ff-valor-despesa', async () => {
    transacaoServicoMock.listar = vi.fn().mockReturnValue(
      of({ ...paginaVazia, conteudo: [transacoesMock[1]], totalItens: 1 })
    );
    fixture.detectChanges();
    component.selecionarConta(contasMock[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    const spans = fixture.nativeElement.querySelectorAll('span.ff-valor-despesa');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('deve chamar efetivar(id, true) diretamente ao clicar Efetivar', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.efetivar(transacoesMock[1]);
    expect(transacaoServicoMock.efetivar).toHaveBeenCalledWith('tx-2', true);
  });

  it('deve chamar recarregar() ao recarregar conta atual', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.selecionarConta(contasMock[0]);
    component.recarregarContaAtual();
    expect(contaEstadoMock.recarregar).toHaveBeenCalledOnce();
  });
});
