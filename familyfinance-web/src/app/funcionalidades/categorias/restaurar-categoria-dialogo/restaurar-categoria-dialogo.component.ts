import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { Categoria, RestaurarCategoriaComando, TIPOS_CATEGORIA } from '../../../modelos/categoria.modelo';

// TODO(D-01): exibir contagem de subcategorias arquivadas no checkbox
// quando backend adicionar campo subcategoriasArquivadas à resposta de GET /categorias?situacao=arquivada
// Ver: openspec/changes/contratos-frontend-duvidas.md#D-01

@Component({
  selector: 'ff-restaurar-categoria-dialogo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './restaurar-categoria-dialogo.component.html'
})
export class RestaurarCategoriaDialogoComponent {
  readonly data: Categoria = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RestaurarCategoriaDialogoComponent>);
  private readonly fb = inject(FormBuilder);

  readonly tiposCategoria = TIPOS_CATEGORIA;

  readonly formulario = this.fb.nonNullable.group({
    icone: [this.data.icone ?? '', [Validators.maxLength(50)]],
    cor: [this.data.cor ?? ''],
    tipo: [this.data.tipo, [Validators.required]],
    restaurarSubcategorias: [false]
  });

  restaurar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.getRawValue();
    const comando: RestaurarCategoriaComando = {
      icone: valor.icone || null,
      cor: valor.cor || null,
      tipo: valor.tipo,
      restaurarSubcategorias: valor.restaurarSubcategorias
    };
    this.dialogRef.close(comando);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
