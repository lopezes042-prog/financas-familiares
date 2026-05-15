import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { RestaurarSubcategoriaComando, Subcategoria } from '../../../modelos/subcategoria.modelo';

@Component({
  selector: 'ff-restaurar-subcategoria-dialogo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './restaurar-subcategoria-dialogo.component.html'
})
export class RestaurarSubcategoriaDialogoComponent {
  readonly data: Subcategoria = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RestaurarSubcategoriaDialogoComponent>);
  private readonly fb = inject(FormBuilder);

  readonly formulario = this.fb.nonNullable.group({
    nome: [this.data.nome, [Validators.maxLength(100)]]
  });

  restaurar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.getRawValue().nome.trim();
    const comando: RestaurarSubcategoriaComando = {
      nome: valor || undefined
    };
    this.dialogRef.close(comando);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
