import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

import {
  AcaoSnackbarComponent
} from '../../compartilhado/componentes/acao-snackbar/acao-snackbar.component';

export const erroHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 409) {
        snackBar.openFromComponent(AcaoSnackbarComponent, {
          data: {
            mensagem: erro.error?.mensagem ?? 'Já existe um registro arquivado com esse nome.',
            rotulo: 'Ver Arquivadas',
            url: '/categorias',
            queryParams: { aba: 'arquivadas' }
          },
          duration: 6000,
          panelClass: ['snackbar-erro']
        });
        return throwError(() => erro);
      }

      const mensagem = obterMensagemAmigavel(erro);
      snackBar.open(mensagem, 'Fechar', {
        duration: 5000,
        panelClass: ['snackbar-erro']
      });
      return throwError(() => erro);
    })
  );
};

function obterMensagemAmigavel(erro: HttpErrorResponse): string {
  if (erro.error?.mensagem) {
    return erro.error.mensagem;
  }
  switch (erro.status) {
    case 0:
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    case 404:
      return 'Recurso não encontrado.';
    case 405:
      return 'Operação não permitida pelo servidor.';
    case 422:
      return 'Dados inválidos.';
    case 500:
      return 'Erro interno do servidor. Tente novamente em instantes.';
    default:
      return 'Ocorreu um erro inesperado.';
  }
}
