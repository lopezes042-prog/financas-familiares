import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Params } from '@angular/router';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

export interface AcaoSnackbarDados {
  mensagem: string;
  rotulo: string;
  url: string;
  queryParams?: Params;
}

@Component({
  selector: 'ff-acao-snackbar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './acao-snackbar.component.html'
})
export class AcaoSnackbarComponent {
  readonly data: AcaoSnackbarDados = inject(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef);
  private readonly router = inject(Router);

  executarAcao(): void {
    this.router.navigate([this.data.url], { queryParams: this.data.queryParams });
    this.snackBarRef.dismiss();
  }
}
