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

import { ListaSubcategoriasComponent } from './lista-subcategorias.component';
import { SubcategoriaServico } from '../../../nucleo/servicos/subcategoria.servico';
import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Subcategoria } from '../../../modelos/subcategoria.modelo';
import { Categoria } from '../../../modelos/categoria.modelo';

const categoriaMock: Categoria = {
  id: 'cat-1', nome: 'Alimentação', tipo: 'DESPESA', icone: null, cor: null, ativo: true, subcategoriasAtivas: 2
};

const subcategoriasMock: Subcategoria[] = [
  { id: 'sub-1', nome: 'Mercado', ativo: true },
  { id: 'sub-2', nome: 'Restaurante', ativo: true }
];

const subcategoriasArquivadaMock: Subcategoria[] = [
  { id: 'sub-3', nome: 'Padaria', ativo: false }
];

function criarRotaMock(aba: string | null = null) {
  return {
    snapshot: {
      paramMap: convertToParamMap({ categoriaId: 'cat-1' }),
      queryParamMap: convertToParamMap(aba ? { aba } : {})
    }
  };
}

describe('ListaSubcategoriasComponent', () => {
  let fixture: ComponentFixture<ListaSubcategoriasComponent>;
  let component: ListaSubcategoriasComponent;
  let subcategoriaServicoMock: Partial<SubcategoriaServico>;
  let categoriaServicoMock: Partial<CategoriaServico>;
  const categoriaEstadoMock: Partial<CategoriaEstadoServico> = {
    categorias: signal([]),
    carregando: signal(false),
    garantirCarregado: vi.fn(),
    recarregar: vi.fn()
  };

  let dialogMock: { open: ReturnType<typeof vi.fn> };

  async function criarComponente(rotaMock = criarRotaMock(), dialogRetorno: unknown = null) {
    dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: () => of(dialogRetorno) }) };

    await TestBed.configureTestingModule({
      imports: [
        ListaSubcategoriasComponent,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([{ path: '**', component: ListaSubcategoriasComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SubcategoriaServico, useValue: subcategoriaServicoMock },
        { provide: CategoriaServico, useValue: categoriaServicoMock },
        { provide: CategoriaEstadoServico, useValue: categoriaEstadoMock },
        { provide: ActivatedRoute, useValue: rotaMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    })
      .overrideComponent(ListaSubcategoriasComponent, { remove: { imports: [MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(ListaSubcategoriasComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    subcategoriaServicoMock = {
      listar: vi.fn().mockReturnValue(of(subcategoriasMock)),
      listarArquivadas: vi.fn().mockReturnValue(of(subcategoriasArquivadaMock)),
      criar: vi.fn().mockReturnValue(of(subcategoriasMock[0])),
      atualizar: vi.fn().mockReturnValue(of(subcategoriasMock[0])),
      arquivar: vi.fn().mockReturnValue(of(undefined)),
      restaurar: vi.fn().mockReturnValue(of(subcategoriasMock[0]))
    };
    categoriaServicoMock = {
      buscarPorId: vi.fn().mockReturnValue(of(categoriaMock))
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
    expect(subcategoriaServicoMock.listar).toHaveBeenCalledWith('cat-1');
    expect(component.subcategorias()).toHaveLength(2);
    expect(component.abaAtiva()).toBe('ativa');
  });

  it('deve carregar nome da categoria no init', async () => {
    await criarComponente();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(categoriaServicoMock.buscarPorId).toHaveBeenCalledWith('cat-1');
    expect(component.nomeCategoria()).toBe('Alimentação');
  });

  it('deve carregar lista arquivadas quando query param ?aba=arquivadas', async () => {
    await criarComponente(criarRotaMock('arquivadas'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(subcategoriaServicoMock.listarArquivadas).toHaveBeenCalledWith('cat-1');
    expect(subcategoriaServicoMock.listar).not.toHaveBeenCalled();
    expect(component.abaAtiva()).toBe('arquivada');
  });

  it('deve exibir spinner durante carregamento de ativas', async () => {
    await criarComponente();
    const pendente$ = new Subject<Subcategoria[]>();
    subcategoriaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    expect(component.carregando()).toBe(true);
    pendente$.complete();
  });

  it('deve parar spinner após erro na requisição de ativas', async () => {
    await criarComponente();
    const pendente$ = new Subject<Subcategoria[]>();
    subcategoriaServicoMock.listar = vi.fn().mockReturnValue(pendente$.asObservable());
    fixture.detectChanges();
    expect(component.carregando()).toBe(true);
    pendente$.error(new Error('falha HTTP'));
    expect(component.carregando()).toBe(false);
  });

  it('deve trocar aba para arquivadas e carregar lista', async () => {
    await criarComponente();
    fixture.detectChanges();
    await fixture.whenStable();
    component.trocarAba(1);
    await fixture.whenStable();
    expect(component.abaAtiva()).toBe('arquivada');
    expect(subcategoriaServicoMock.listarArquivadas).toHaveBeenCalledOnce();
  });

  it('deve trocar aba de volta para ativas', async () => {
    await criarComponente(criarRotaMock('arquivadas'));
    fixture.detectChanges();
    await fixture.whenStable();
    component.trocarAba(0);
    expect(component.abaAtiva()).toBe('ativa');
  });

  it('indiceAbaAtiva retorna 0 para ativa e 1 para arquivada', async () => {
    await criarComponente();
    fixture.detectChanges();
    expect(component.indiceAbaAtiva).toBe(0);
    component.abaAtiva.set('arquivada');
    expect(component.indiceAbaAtiva).toBe(1);
  });

  it('categoriaId deve ser preenchido do route param', async () => {
    await criarComponente();
    fixture.detectChanges();
    expect(component.categoriaId()).toBe('cat-1');
  });

  it('novaSubcategoria: cancela quando dialog fecha com null', async () => {
    await criarComponente(criarRotaMock(), null);
    fixture.detectChanges();
    await fixture.whenStable();
    component.novaSubcategoria();
    await fixture.whenStable();
    expect(subcategoriaServicoMock.criar).not.toHaveBeenCalled();
  });

  it('novaSubcategoria: cria subcategoria quando dialog confirma', async () => {
    await criarComponente(criarRotaMock(), { nome: 'Novo' });
    fixture.detectChanges();
    await fixture.whenStable();
    component.novaSubcategoria();
    await fixture.whenStable();
    expect(subcategoriaServicoMock.criar).toHaveBeenCalledWith('cat-1', { nome: 'Novo' });
  });

  it('editar: cancela quando dialog fecha com null', async () => {
    await criarComponente(criarRotaMock(), null);
    fixture.detectChanges();
    await fixture.whenStable();
    component.editar(subcategoriasMock[0]);
    await fixture.whenStable();
    expect(subcategoriaServicoMock.atualizar).not.toHaveBeenCalled();
  });

  it('editar: atualiza subcategoria quando dialog confirma', async () => {
    await criarComponente(criarRotaMock(), { nome: 'Editado' });
    fixture.detectChanges();
    await fixture.whenStable();
    component.editar(subcategoriasMock[0]);
    await fixture.whenStable();
    expect(subcategoriaServicoMock.atualizar).toHaveBeenCalledWith('cat-1', 'sub-1', { nome: 'Editado' });
  });

  it('arquivar: cancela quando dialog fecha com false', async () => {
    await criarComponente(criarRotaMock(), false);
    fixture.detectChanges();
    await fixture.whenStable();
    component.arquivar(subcategoriasMock[0]);
    await fixture.whenStable();
    expect(subcategoriaServicoMock.arquivar).not.toHaveBeenCalled();
  });

  it('arquivar: arquiva subcategoria quando confirmado', async () => {
    await criarComponente(criarRotaMock(), true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.arquivar(subcategoriasMock[0]);
    await fixture.whenStable();
    expect(subcategoriaServicoMock.arquivar).toHaveBeenCalledWith('cat-1', 'sub-1');
  });

  it('restaurar: cancela quando dialog fecha com null', async () => {
    await criarComponente(criarRotaMock('arquivadas'), null);
    fixture.detectChanges();
    await fixture.whenStable();
    component.restaurar(subcategoriasArquivadaMock[0]);
    await fixture.whenStable();
    expect(subcategoriaServicoMock.restaurar).not.toHaveBeenCalled();
  });

  it('restaurar: restaura subcategoria quando dialog confirma', async () => {
    const comando = { nome: 'Renomeado' };
    await criarComponente(criarRotaMock('arquivadas'), comando);
    fixture.detectChanges();
    await fixture.whenStable();
    component.restaurar(subcategoriasArquivadaMock[0]);
    await fixture.whenStable();
    expect(subcategoriaServicoMock.restaurar).toHaveBeenCalledWith('cat-1', 'sub-3', comando);
  });
});
