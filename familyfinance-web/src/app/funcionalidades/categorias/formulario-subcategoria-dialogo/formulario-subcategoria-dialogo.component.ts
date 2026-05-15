import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  CriarSubcategoriaComando,
  EditarSubcategoriaComando,
  Subcategoria
} from '../../../modelos/subcategoria.modelo';

@Component({
  selector: 'ff-formulario-subcategoria-dialogo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './formulario-subcategoria-dialogo.component.html'
})
export class FormularioSubcategoriaDialogoComponent {
  readonly data: Subcategoria | null = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FormularioSubcategoriaDialogoComponent>);
  private readonly fb = inject(FormBuilder);

  readonly modoEdicao = this.data !== null;

  readonly formulario = this.fb.nonNullable.group({
    nome: [this.data?.nome ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
  });

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const comando: CriarSubcategoriaComando | EditarSubcategoriaComando = {
      nome: this.formulario.getRawValue().nome
    };
    this.dialogRef.close(comando);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
