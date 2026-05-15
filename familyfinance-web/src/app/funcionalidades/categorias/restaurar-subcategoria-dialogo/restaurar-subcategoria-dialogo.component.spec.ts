import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { RestaurarSubcategoriaDialogoComponent } from './restaurar-subcategoria-dialogo.component';
import { Subcategoria } from '../../../modelos/subcategoria.modelo';

const subcategoriaMock: Subcategoria = { id: 'sub-1', nome: 'Mercado', ativo: false };

async function criarComponente(data: Subcategoria = subcategoriaMock) {
  const dialogRefMock = { close: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [RestaurarSubcategoriaDialogoComponent, NoopAnimationsModule],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialogRefMock }
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(RestaurarSubcategoriaDialogoComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, dialogRefMock };
}

describe('RestaurarSubcategoriaDialogoComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('deve criar o componente', async () => {
    const { component } = await criarComponente();
    expect(component).toBeTruthy();
  });

  it('deve pré-preencher nome com o nome da subcategoria', async () => {
    const { component } = await criarComponente();
    expect(component.formulario.getRawValue().nome).toBe('Mercado');
  });

  it('deve fechar com { nome } ao restaurar mantendo o nome original', async () => {
    const { component, dialogRefMock } = await criarComponente();
    component.restaurar();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ nome: 'Mercado' });
  });

  it('deve fechar com { nome: novo } ao restaurar com renome', async () => {
    const { component, dialogRefMock } = await criarComponente();
    component.formulario.controls.nome.setValue('Supermercado');
    component.restaurar();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ nome: 'Supermercado' });
  });

  it('deve fechar com { nome: undefined } quando nome é vazio', async () => {
    const { component, dialogRefMock } = await criarComponente();
    component.formulario.controls.nome.setValue('');
    component.restaurar();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ nome: undefined });
  });

  it('deve fechar com null ao cancelar', async () => {
    const { component, dialogRefMock } = await criarComponente();
    component.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });
});
