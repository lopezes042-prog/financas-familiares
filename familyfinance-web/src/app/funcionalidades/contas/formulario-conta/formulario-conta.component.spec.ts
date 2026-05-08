import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { FormularioContaComponent } from './formulario-conta.component';
import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { Conta } from '../../../modelos/conta.modelo';

const contaMock: Conta = {
  id: 'abc-123',
  nome: 'Nubank',
  tipo: 'CORRENTE',
  saldoInicial: 1000,
  saldoAtual: 1200,
  cor: '#ff6b00',
  ativo: true
};

const rotasParaTeste = [
  { path: 'contas', component: FormularioContaComponent },
  { path: '**', redirectTo: 'contas' }
];

describe('FormularioContaComponent', () => {
  let fixture: ComponentFixture<FormularioContaComponent>;
  let component: FormularioContaComponent;
  let contaServicoMock: Partial<ContaServico>;

  async function criarComponente(params: Record<string, string> = {}): Promise<void> {
    contaServicoMock = {
      buscarPorId: vi.fn().mockReturnValue(of(contaMock)),
      criar: vi.fn().mockReturnValue(of(contaMock)),
      atualizar: vi.fn().mockReturnValue(of(contaMock))
    };

    await TestBed.configureTestingModule({
      imports: [FormularioContaComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter(rotasParaTeste),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContaServico, useValue: contaServicoMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => params[k] ?? null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioContaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => TestBed.resetTestingModule());

  describe('modo criação (sem :id)', () => {
    beforeEach(async () => criarComponente());

    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve iniciar em modo criação', () => {
      expect(component.modoEdicao()).toBe(false);
    });

    it('deve iniciar com formulário vazio', () => {
      expect(component.formulario.controls.nome.value).toBe('');
      expect(component.formulario.controls.tipo.value).toBe('CORRENTE');
      expect(component.formulario.controls.saldoInicial.value).toBe(0);
    });

    it('não deve chamar buscarPorId', () => {
      expect(contaServicoMock.buscarPorId).not.toHaveBeenCalled();
    });

    it('deve marcar campos como tocados ao submeter formulário inválido', () => {
      component.salvar();
      expect(component.formulario.controls.nome.touched).toBe(true);
    });

    it('não deve chamar criar quando o formulário está inválido', () => {
      component.formulario.controls.nome.setValue('');
      component.salvar();
      expect(contaServicoMock.criar).not.toHaveBeenCalled();
    });

    it('deve chamar criar quando o formulário está válido', () => {
      component.formulario.controls.nome.setValue('Nubank');
      component.salvar();
      expect(contaServicoMock.criar).toHaveBeenCalledOnce();
    });
  });

  describe('modo edição (com :id)', () => {
    beforeEach(async () => criarComponente({ id: 'abc-123' }));

    it('deve iniciar em modo edição', () => {
      expect(component.modoEdicao()).toBe(true);
    });

    it('deve chamar buscarPorId com o id da rota', () => {
      expect(contaServicoMock.buscarPorId).toHaveBeenCalledWith('abc-123');
    });

    it('deve preencher o formulário com dados da conta', () => {
      expect(component.formulario.controls.nome.value).toBe('Nubank');
      expect(component.formulario.controls.tipo.value).toBe('CORRENTE');
    });

    it('deve desabilitar o campo saldoInicial', () => {
      expect(component.formulario.controls.saldoInicial.disabled).toBe(true);
    });

    it('deve chamar atualizar quando o formulário está válido', () => {
      component.salvar();
      expect(contaServicoMock.atualizar).toHaveBeenCalledOnce();
    });

    it('não deve chamar criar em modo edição', () => {
      component.salvar();
      expect(contaServicoMock.criar).not.toHaveBeenCalled();
    });
  });
});
