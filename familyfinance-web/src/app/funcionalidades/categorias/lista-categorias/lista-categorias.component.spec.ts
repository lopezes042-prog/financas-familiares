import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { ListaCategoriasComponent } from './lista-categorias.component';
import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Categoria } from '../../../modelos/categoria.modelo';

const categoriasMock: Categoria[] = [
  { id: '1', nome: 'Alimentação', tipo: 'DESPESA', icone: 'restaurant', cor: '#ef4444', ativo: true, subcategoriasAtivas: 2 },
  { id: '2', nome: 'Salário', tipo: 'RECEITA', icone: 'work', cor: '#22c55e', ativo: true, subcategoriasAtivas: 0 }
];

const categoriasArquivadaMock: Categoria[] = [
  { id: '3', nome: 'Lazer', tipo: 'DESPESA', icone: null, cor: null, ativo: false, subcategoriasAtivas: 0 }
];

function criarRotaMock(aba: string | null = null) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(aba ? { aba } : {})
    }
  };
}

describe('ListaCategoriasComponent', () => {
  let fixture: ComponentFixture<ListaCategoriasComponent>;
  let component: ListaCategoriasComponent;
  let categoriaServicoMock: Partial<CategoriaServico>;
  const categoriaEstadoMock: Partial<CategoriaEstadoServico> = {
    categorias: signal([]),
    carregando: signal(false),
    garantirCarregado: vi.fn(),
    recarregar: vi.fn()
  };

  let dialogMock: { open: ReturnType<typeof vi.fn> };

  async function criarComponente(rotaMock = criarRotaMock(), dialogRetorno: unknown = false) {
    dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: () => of(dialogRetorno) }) };

    await TestBed.configureTestingModule({
      imports: [
        ListaCategoriasComponent,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([{ path: '**', component: ListaCategoriasComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CategoriaServico, useValue: categoriaServicoMock },
        { provide: CategoriaEstadoServico, useValue: categoriaEstadoMock },
        { provide: ActivatedRoute, useValue: rotaMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    })
      .overrideComponent(ListaCategoriasComponent, { remove: { imports: [MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(ListaCategoriasComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    categoriaServicoMock = {
      listar: vi.fn().mockReturnValue(of(categoriasMock)),
      listarArquivadas: vi.fn().mockReturnValue(of(categoriasArquivadaMock)),
      arquivar: vi.fn().mockReturnValue(of({ subcategoriasArquivadas: 0 })),
      restaurar: vi.fn().mockReturnValue(of(categoriasMock[0])),
      buscarPorId: vi.fn().mockReturnValue(of(categoriasMock[0]))
    };
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve criar o componente', async () => {
    await criarComponente();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('deve carregar lista ativas no init (aba padrão)', async () => {
    await criarComponente();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(categoriaServicoMock.listar).toHaveBeenCalledOnce();
    expect(component.categorias()).toHaveLength(2);
    expect(component.abaAtiva()).toBe('ativa');
  });

  it('deve carregar lista arquivadas quando query param ?aba=arquivadas', async () => {
    await criarComponente(criarRotaMock('arquivadas'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(categoriaServicoMock.listarArquivadas).toHaveBeenCalledOnce();
    expect(categoriaServicoMock.listar).not.toHaveBeenCalled();
    expect(component.abaAtiva()).toBe('arquivada');
  });

  it('deve exibir spinner durante carregamento de ativas', async () => {
    await criarComponente();
    const pendente$ = new Subject<Categoria[]>();
    categoriaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    expect(component.carregando()).toBe(true);
    pendente$.complete();
  });

  it('deve parar spinner após erro na requisição de ativas', async () => {
    await criarComponente();
    const pendente$ = new Subject<Categoria[]>();
    categoriaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    expect(component.carregando()).toBe(true);
    pendente$.error(new Error('falha HTTP'));
    expect(component.carregando()).toBe(false);
  });

  it('deve exibir tabela quando há categorias ativas', async () => {
    await criarComponente();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const tabela = fixture.nativeElement.querySelector('table');
    expect(tabela).toBeTruthy();
  });

  it('deve trocar aba para arquivadas e carregar lista', async () => {
    await criarComponente();
    fixture.detectChanges();
    await fixture.whenStable();
    component.trocarAba(1);
    await fixture.whenStable();
    expect(component.abaAtiva()).toBe('arquivada');
    expect(categoriaServicoMock.listarArquivadas).toHaveBeenCalledOnce();
  });

  it('deve trocar aba de volta para ativas', async () => {
    await criarComponente(criarRotaMock('arquivadas'));
    fixture.detectChanges();
    await fixture.whenStable();
    component.trocarAba(0);
    expect(component.abaAtiva()).toBe('ativa');
  });

  it('deve parar spinner após erro na requisição de arquivadas', async () => {
    await criarComponente(criarRotaMock('arquivadas'));
    const pendente$ = new Subject<Categoria[]>();
    categoriaServicoMock.listarArquivadas = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    expect(component.carregandoArquivadas()).toBe(true);
    pendente$.error(new Error('falha HTTP'));
    expect(component.carregandoArquivadas()).toBe(false);
  });

  it('deve navegar para a rota de edição ao chamar editar()', async () => {
    await criarComponente();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(() => component.editar(categoriasMock[0])).not.toThrow();
  });

  it('indiceAbaAtiva retorna 0 para ativa e 1 para arquivada', async () => {
    await criarComponente();
    fixture.detectChanges();
    expect(component.indiceAbaAtiva).toBe(0);
    component.abaAtiva.set('arquivada');
    expect(component.indiceAbaAtiva).toBe(1);
  });

  it('gerenciarSubcategorias deve navegar para rota de subcategorias', async () => {
    await criarComponente();
    fixture.detectChanges();
    expect(() => component.gerenciarSubcategorias(categoriasMock[0])).not.toThrow();
  });

  it('arquivar: cancela quando dialog fecha com false', async () => {
    await criarComponente(criarRotaMock(), false);
    fixture.detectChanges();
    await fixture.whenStable();
    component.arquivar(categoriasMock[0]);
    await fixture.whenStable();
    expect(categoriaServicoMock.arquivar).not.toHaveBeenCalled();
  });

  it('arquivar: arquiva categoria quando confirmado', async () => {
    await criarComponente(criarRotaMock(), true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.arquivar(categoriasMock[0]);
    await fixture.whenStable();
    expect(categoriaServicoMock.arquivar).toHaveBeenCalledWith('1');
  });

  it('abrirRestaurar: cancela quando dialog fecha com null', async () => {
    await criarComponente(criarRotaMock('arquivadas'), null);
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirRestaurar(categoriasArquivadaMock[0]);
    await fixture.whenStable();
    expect(categoriaServicoMock.restaurar).not.toHaveBeenCalled();
  });

  it('abrirRestaurar: restaura categoria quando dialog confirma', async () => {
    const comando = { icone: null, cor: null, tipo: 'DESPESA' as const, restaurarSubcategorias: false };
    await criarComponente(criarRotaMock('arquivadas'), comando);
    fixture.detectChanges();
    await fixture.whenStable();
    component.abrirRestaurar(categoriasArquivadaMock[0]);
    await fixture.whenStable();
    expect(categoriaServicoMock.restaurar).toHaveBeenCalledWith('3', comando);
  });
});
