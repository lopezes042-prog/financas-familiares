import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LOCALE_ID } from '@angular/core';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { ListaContasComponent } from './lista-contas.component';
import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { Conta } from '../../../modelos/conta.modelo';

registerLocaleData(localePt, 'pt-BR');

const contasMock: Conta[] = [
  {
    id: '1',
    nome: 'Nubank',
    tipo: 'CORRENTE',
    saldoInicial: 1000,
    saldoAtual: 1200,
    cor: '#ff6b00',
    ativo: true
  },
  {
    id: '2',
    nome: 'Poupança',
    tipo: 'POUPANCA',
    saldoInicial: 5000,
    saldoAtual: 5100,
    ativo: true
  }
];

describe('ListaContasComponent', () => {
  let fixture: ComponentFixture<ListaContasComponent>;
  let component: ListaContasComponent;
  let contaServicoMock: Partial<ContaServico>;

  beforeEach(async () => {
    contaServicoMock = {
      listar: vi.fn().mockReturnValue(of(contasMock)),
      alterarSituacao: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [
        ListaContasComponent,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([{ path: '**', component: ListaContasComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContaServico, useValue: contaServicoMock },
        { provide: LOCALE_ID, useValue: 'pt-BR' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaContasComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('deve carregar contas no ngOnInit', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(contaServicoMock.listar).toHaveBeenCalledOnce();
    expect(component.contas()).toHaveLength(2);
  });

  it('deve exibir spinner durante carregamento', () => {
    const pendente$ = new Subject<Conta[]>();
    contaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());

    fixture.detectChanges();

    expect(component.carregando()).toBe(true);
    pendente$.complete();
  });

  it('deve parar o spinner após carregamento bem-sucedido', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.carregando()).toBe(false);
  });

  it('deve exibir estado vazio quando não há contas', async () => {
    contaServicoMock.listar = vi.fn().mockReturnValue(of([]));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.contas()).toHaveLength(0);
    const estadoVazio = fixture.nativeElement.querySelector('.estado-vazio');
    expect(estadoVazio).toBeTruthy();
  });

  it('deve exibir a tabela quando há contas', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tabela = fixture.nativeElement.querySelector('table');
    expect(tabela).toBeTruthy();
  });

  it('deve exibir spinner enquanto a requisição está pendente', () => {
    // Verifica que carregando=true durante o intervalo entre a chamada e a resposta.
    // Nota BUG-03: o callback error está ausente no subscribe de carregarContas().
    // Quando o BUG-03 for corrigido, adicionar teste que verifica carregando=false após erro.
    const pendente$ = new Subject<Conta[]>();
    contaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());

    fixture.detectChanges();

    expect(component.carregando()).toBe(true);
    pendente$.complete();
  });
});
