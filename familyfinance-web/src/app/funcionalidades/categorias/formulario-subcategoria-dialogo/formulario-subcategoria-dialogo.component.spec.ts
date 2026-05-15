import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { FormularioSubcategoriaDialogoComponent } from './formulario-subcategoria-dialogo.component';
import { Subcategoria } from '../../../modelos/subcategoria.modelo';

const subcategoriaMock: Subcategoria = { id: 'sub-1', nome: 'Mercado', ativo: true };

async function criarComponente(data: Subcategoria | null) {
  const dialogRefMock = { close: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [FormularioSubcategoriaDialogoComponent, NoopAnimationsModule],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialogRefMock }
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(FormularioSubcategoriaDialogoComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, dialogRefMock };
}

describe('FormularioSubcategoriaDialogoComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('deve criar em modo criar (sem dados)', async () => {
    const { component } = await criarComponente(null);
    expect(component).toBeTruthy();
    expect(component.modoEdicao).toBe(false);
    expect(component.formulario.getRawValue().nome).toBe('');
  });

  it('deve pré-preencher nome em modo editar', async () => {
    const { component } = await criarComponente(subcategoriaMock);
    expect(component.modoEdicao).toBe(true);
    expect(component.formulario.getRawValue().nome).toBe('Mercado');
  });

  it('deve fechar com comando ao salvar com dados válidos', async () => {
    const { component, dialogRefMock } = await criarComponente(null);
    component.formulario.controls.nome.setValue('Novo Item');
    component.salvar();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ nome: 'Novo Item' });
  });

  it('deve marcar campos como tocados ao salvar com formulário inválido', async () => {
    const { component, dialogRefMock } = await criarComponente(null);
    component.formulario.controls.nome.setValue('');
    component.salvar();
    expect(dialogRefMock.close).not.toHaveBeenCalled();
    expect(component.formulario.controls.nome.touched).toBe(true);
  });

  it('deve fechar com null ao cancelar', async () => {
    const { component, dialogRefMock } = await criarComponente(null);
    component.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
