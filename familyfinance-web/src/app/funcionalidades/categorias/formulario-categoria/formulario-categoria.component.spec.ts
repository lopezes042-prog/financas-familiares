import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { FormularioCategoriaComponent } from './formulario-categoria.component';
import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Categoria } from '../../../modelos/categoria.modelo';

const categoriaMock: Categoria = {
  id: 'cat-123',
  nome: 'Alimentação',
  tipo: 'DESPESA',
  icone: 'restaurant',
  cor: '#ef4444',
  ativo: true,
  subcategoriasAtivas: 0
};

const rotasParaTeste = [
  { path: 'categorias', component: FormularioCategoriaComponent },
  { path: '**', redirectTo: 'categorias' }
];

describe('FormularioCategoriaComponent', () => {
  let fixture: ComponentFixture<FormularioCategoriaComponent>;
  let component: FormularioCategoriaComponent;
  let categoriaServicoMock: Partial<CategoriaServico>;
  const categoriaEstadoMock: Partial<CategoriaEstadoServico> = {
    categorias: signal([]),
    carregando: signal(false),
    garantirCarregado: vi.fn(),
    recarregar: vi.fn()
  };

  async function criarComponente(params: Record<string, string> = {}): Promise<void> {
    categoriaServicoMock = {
      buscarPorId: vi.fn().mockReturnValue(of(categoriaMock)),
      criar: vi.fn().mockReturnValue(of(categoriaMock)),
      atualizar: vi.fn().mockReturnValue(of(categoriaMock))
    };

    await TestBed.configureTestingModule({
      imports: [FormularioCategoriaComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter(rotasParaTeste),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CategoriaServico, useValue: categoriaServicoMock },
        { provide: CategoriaEstadoServico, useValue: categoriaEstadoMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => params[k] ?? null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioCategoriaComponent);
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
      expect(component.formulario.controls.tipo.value).toBe('DESPESA');
    });

    it('não deve chamar buscarPorId', () => {
      expect(categoriaServicoMock.buscarPorId).not.toHaveBeenCalled();
    });

    it('deve marcar campos como tocados ao submeter formulário inválido', () => {
      component.salvar();
      expect(component.formulario.controls.nome.touched).toBe(true);
    });

    it('não deve chamar criar() com formulário inválido', () => {
      component.formulario.controls.nome.setValue('');
      component.salvar();
      expect(categoriaServicoMock.criar).not.toHaveBeenCalled();
    });

    it('deve chamar criar() com formulário válido', () => {
      component.formulario.controls.nome.setValue('Alimentação');
      component.salvar();
      expect(categoriaServicoMock.criar).toHaveBeenCalledOnce();
    });
  });

  describe('modo edição (com :id)', () => {
    beforeEach(async () => criarComponente({ id: 'cat-123' }));

    it('deve iniciar em modo edição', () => {
      expect(component.modoEdicao()).toBe(true);
    });

    it('deve chamar buscarPorId com o id da rota', () => {
      expect(categoriaServicoMock.buscarPorId).toHaveBeenCalledWith('cat-123');
    });

    it('deve preencher o formulário com dados da categoria', () => {
      expect(component.formulario.controls.nome.value).toBe('Alimentação');
      expect(component.formulario.controls.tipo.value).toBe('DESPESA');
    });

    it('deve chamar atualizar() ao salvar em modo edição', () => {
      component.salvar();
      expect(categoriaServicoMock.atualizar).toHaveBeenCalledOnce();
    });

    it('não deve chamar criar() em modo edição', () => {
      component.salvar();
      expect(categoriaServicoMock.criar).not.toHaveBeenCalled();
    });
  });
});
