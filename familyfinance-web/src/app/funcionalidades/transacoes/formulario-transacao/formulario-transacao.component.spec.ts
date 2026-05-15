import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { FormularioTransacaoComponent } from './formulario-transacao.component';
import { TransacaoServico } from '../../../nucleo/servicos/transacao.servico';
import { SubcategoriaServico } from '../../../nucleo/servicos/subcategoria.servico';
import { ContaEstadoServico } from '../../../nucleo/estado/conta-estado.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Conta } from '../../../modelos/conta.modelo';
import { Categoria } from '../../../modelos/categoria.modelo';
import { Transacao } from '../../../modelos/transacao.modelo';
import { Subcategoria } from '../../../modelos/subcategoria.modelo';

const contasMock: Conta[] = [
  { id: 'conta-1', nome: 'Nubank', tipo: 'CORRENTE', saldoInicial: 1000, saldoAtual: 1500, ativo: true }
];

const categoriasMock: Categoria[] = [
  { id: 'cat-1', nome: 'Alimentação', tipo: 'DESPESA', icone: null, cor: null, ativo: true, subcategoriasAtivas: 0 },
  { id: 'cat-2', nome: 'Salário', tipo: 'RECEITA', icone: null, cor: null, ativo: true, subcategoriasAtivas: 0 }
];

const subcategoriasMock: Subcategoria[] = [
  { id: 'sub-1', nome: 'Mercado', ativo: true },
  { id: 'sub-2', nome: 'Restaurante', ativo: true }
];

const transacaoMock: Transacao = {
  id: 'tx-1',
  conta: { id: 'conta-1', nome: 'Nubank' },
  categoria: { id: 'cat-1', nome: 'Alimentação' },
  subcategoria: { id: 'sub-1', nome: 'Mercado' },
  descricao: 'Mercado',
  valor: 200,
  tipo: 'DESPESA',
  dataLancamento: '2026-05-01',
  efetivada: true,
  ativo: true
};

const rotaVazia = {
  snapshot: { paramMap: { get: () => null } }
};

const rotaComId = {
  snapshot: { paramMap: { get: () => 'tx-1' } }
};

describe('FormularioTransacaoComponent — modo criação', () => {
  let fixture: ComponentFixture<FormularioTransacaoComponent>;
  let component: FormularioTransacaoComponent;
  let transacaoServicoMock: Partial<TransacaoServico>;
  let subcategoriaServicoMock: Partial<SubcategoriaServico>;
  let contaEstadoMock: Partial<ContaEstadoServico>;
  let categoriaEstadoMock: Partial<CategoriaEstadoServico>;

  beforeEach(async () => {
    transacaoServicoMock = {
      criar: vi.fn().mockReturnValue(of(transacaoMock))
    };
    subcategoriaServicoMock = {
      listar: vi.fn().mockReturnValue(of(subcategoriasMock))
    };
    contaEstadoMock = {
      contas: signal(contasMock),
      carregando: signal(false),
      garantirCarregado: vi.fn(),
      recarregar: vi.fn()
    };
    categoriaEstadoMock = {
      categorias: signal(categoriasMock),
      carregando: signal(false),
      garantirCarregado: vi.fn(),
      recarregar: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [FormularioTransacaoComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: rotaVazia },
        { provide: TransacaoServico, useValue: transacaoServicoMock },
        { provide: SubcategoriaServico, useValue: subcategoriaServicoMock },
        { provide: ContaEstadoServico, useValue: contaEstadoMock },
        { provide: CategoriaEstadoServico, useValue: categoriaEstadoMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioTransacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve chamar garantirCarregado() nos dois serviços de estado no ngOnInit', () => {
    expect(contaEstadoMock.garantirCarregado).toHaveBeenCalledOnce();
    expect(categoriaEstadoMock.garantirCarregado).toHaveBeenCalledOnce();
  });

  it('deve iniciar em modo criação', () => {
    expect(component.modoEdicao()).toBe(false);
  });

  it('deve filtrar categorias pelo tipo padrão (DESPESA)', () => {
    const filtradas = component.categoriasFiltradas();
    expect(filtradas.every((c) => c.tipo === 'DESPESA')).toBe(true);
    expect(filtradas.length).toBe(1);
  });

  it('deve redefinir categoriaId ao mudar o tipo', () => {
    component.formulario.controls.categoriaId.setValue('cat-1');
    component.onTipoMudou();
    expect(component.formulario.controls.categoriaId.value).toBeNull();
  });

  it('deve carregar subcategorias ao selecionar categoriaId', async () => {
    component.formulario.controls.categoriaId.setValue('cat-1');
    await fixture.whenStable();
    expect(subcategoriaServicoMock.listar).toHaveBeenCalledWith('cat-1');
    expect(component.subcategorias()).toHaveLength(2);
  });

  it('deve limpar subcategorias e subcategoriaId ao limpar categoriaId', async () => {
    component.formulario.controls.categoriaId.setValue('cat-1');
    await fixture.whenStable();
    component.formulario.controls.subcategoriaId.setValue('sub-1');
    component.formulario.controls.categoriaId.setValue(null);
    await fixture.whenStable();
    expect(component.subcategorias()).toHaveLength(0);
    expect(component.formulario.controls.subcategoriaId.value).toBeNull();
  });

  it('deve marcar campos como touched ao tentar salvar formulário inválido', () => {
    component.formulario.controls.descricao.setValue('');
    component.salvar();
    expect(component.formulario.controls.descricao.touched).toBe(true);
  });

  it('deve chamar transacaoServico.criar() com subcategoriaId ao salvar', () => {
    component.formulario.patchValue({
      contaId: 'conta-1',
      tipo: 'DESPESA',
      descricao: 'Compra mercado',
      valor: 150,
      dataLancamento: new Date('2026-05-01'),
      categoriaId: 'cat-1',
      subcategoriaId: 'sub-1',
      efetivada: true
    });
    component.salvar();
    expect(transacaoServicoMock.criar).toHaveBeenCalledWith(
      expect.objectContaining({ subcategoriaId: 'sub-1' })
    );
  });

  it('deve enviar subcategoriaId null quando não selecionada', () => {
    component.formulario.patchValue({
      contaId: 'conta-1',
      tipo: 'DESPESA',
      descricao: 'Compra mercado',
      valor: 150,
      dataLancamento: new Date('2026-05-01'),
      categoriaId: null,
      subcategoriaId: null,
      efetivada: true
    });
    component.salvar();
    expect(transacaoServicoMock.criar).toHaveBeenCalledWith(
      expect.objectContaining({ subcategoriaId: null })
    );
  });
});

describe('FormularioTransacaoComponent — modo edição', () => {
  let fixture: ComponentFixture<FormularioTransacaoComponent>;
  let component: FormularioTransacaoComponent;
  let transacaoServicoMock: Partial<TransacaoServico>;
  let subcategoriaServicoMock: Partial<SubcategoriaServico>;
  let contaEstadoMock: Partial<ContaEstadoServico>;
  let categoriaEstadoMock: Partial<CategoriaEstadoServico>;

  beforeEach(async () => {
    transacaoServicoMock = {
      buscarPorId: vi.fn().mockReturnValue(of(transacaoMock)),
      atualizar: vi.fn().mockReturnValue(of(transacaoMock))
    };
    subcategoriaServicoMock = {
      listar: vi.fn().mockReturnValue(of(subcategoriasMock))
    };
    contaEstadoMock = {
      contas: signal(contasMock),
      carregando: signal(false),
      garantirCarregado: vi.fn(),
      recarregar: vi.fn()
    };
    categoriaEstadoMock = {
      categorias: signal(categoriasMock),
      carregando: signal(false),
      garantirCarregado: vi.fn(),
      recarregar: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [FormularioTransacaoComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: ActivatedRoute, useValue: rotaComId },
        { provide: TransacaoServico, useValue: transacaoServicoMock },
        { provide: SubcategoriaServico, useValue: subcategoriaServicoMock },
        { provide: ContaEstadoServico, useValue: contaEstadoMock },
        { provide: CategoriaEstadoServico, useValue: categoriaEstadoMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioTransacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve entrar em modo edição quando há id na rota', () => {
    expect(component.modoEdicao()).toBe(true);
  });

  it('deve chamar buscarPorId() e preencher o formulário', async () => {
    await fixture.whenStable();
    expect(transacaoServicoMock.buscarPorId).toHaveBeenCalledWith('tx-1');
    expect(component.formulario.controls.descricao.value).toBe('Mercado');
    expect(component.formulario.controls.valor.value).toBe(200);
  });

  it('deve pré-selecionar subcategoriaId em modo edição', async () => {
    await fixture.whenStable();
    expect(subcategoriaServicoMock.listar).toHaveBeenCalledWith('cat-1');
    expect(component.formulario.controls.subcategoriaId.value).toBe('sub-1');
  });

  it('deve chamar transacaoServico.atualizar() ao salvar em modo edição', async () => {
    await fixture.whenStable();
    component.salvar();
    expect(transacaoServicoMock.atualizar).toHaveBeenCalledWith(
      'tx-1',
      expect.objectContaining({ descricao: 'Mercado' })
    );
  });
});
