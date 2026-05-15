import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { RestaurarCategoriaDialogoComponent } from './restaurar-categoria-dialogo.component';
import { Categoria, RestaurarCategoriaComando } from '../../../modelos/categoria.modelo';

const categoriaMock: Categoria = {
  id: 'cat-1',
  nome: 'Alimentação',
  tipo: 'DESPESA',
  icone: 'restaurant',
  cor: '#ef4444',
  ativo: false,
  subcategoriasAtivas: 0
};

describe('RestaurarCategoriaDialogoComponent', () => {
  let fixture: ComponentFixture<RestaurarCategoriaDialogoComponent>;
  let component: RestaurarCategoriaDialogoComponent;
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefMock = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [
        RestaurarCategoriaDialogoComponent,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: categoriaMock },
        { provide: MatDialogRef, useValue: dialogRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurarCategoriaDialogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve pré-preencher formulário com dados da categoria', () => {
    expect(component.formulario.value.icone).toBe('restaurant');
    expect(component.formulario.value.cor).toBe('#ef4444');
    expect(component.formulario.value.tipo).toBe('DESPESA');
    expect(component.formulario.value.restaurarSubcategorias).toBe(false);
  });

  it('deve retornar RestaurarCategoriaComando ao confirmar', () => {
    component.formulario.patchValue({ restaurarSubcategorias: true });
    component.restaurar();

    const comando: RestaurarCategoriaComando = dialogRefMock.close.mock.calls[0][0];
    expect(dialogRefMock.close).toHaveBeenCalledOnce();
    expect(comando.restaurarSubcategorias).toBe(true);
    expect(comando.tipo).toBe('DESPESA');
  });

  it('deve retornar null ao cancelar', () => {
    component.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
