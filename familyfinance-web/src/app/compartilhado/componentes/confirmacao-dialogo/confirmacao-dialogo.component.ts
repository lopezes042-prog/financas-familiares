import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DadosConfirmacaoDialogo {
  titulo: string;
  mensagem: string;
}

@Component({
  selector: 'ff-confirmacao-dialogo',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirmacao-dialogo.component.html',
  styleUrl: './confirmacao-dialogo.component.scss'
})
export class ConfirmacaoDialogoComponent {
  readonly dados = inject<DadosConfirmacaoDialogo>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmacaoDialogoComponent>);

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}
