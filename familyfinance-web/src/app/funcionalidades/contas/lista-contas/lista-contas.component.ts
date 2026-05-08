import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { Conta } from '../../../modelos/conta.modelo';
import { ConfirmacaoDialogoComponent } from '../../../compartilhado/componentes/confirmacao-dialogo/confirmacao-dialogo.component';
import { TipoContaPipe } from '../../../compartilhado/pipes/tipo-conta.pipe';

@Component({
  selector: 'ff-lista-contas',
  standalone: true,
  imports: [
    CurrencyPipe,
    TipoContaPipe,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './lista-contas.component.html',
  styleUrl: './lista-contas.component.scss'
})
export class ListaContasComponent implements OnInit {
  private readonly contaServico = inject(ContaServico);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly contas = signal<Conta[]>([]);
  readonly carregando = signal<boolean>(false);
  readonly colunasExibidas = ['nome', 'tipo', 'saldoInicial', 'cor', 'acoes'];

  ngOnInit(): void {
    this.carregarContas();
  }

  carregarContas(): void {
    this.carregando.set(true);
    this.contaServico.listar().subscribe({
      next: (contas) => {
        this.contas.set(contas);
        this.carregando.set(false);
      }
      // 🐛 BUG-INTENCIONAL-03
      // O callback de erro está faltando aqui.
      // Sintoma esperado: quando a requisição falha, o spinner fica girando para sempre
      //   e a Júnior só percebe pelo snackbar do interceptor.
      // A Júnior deve adicionar o callback `error` que ao menos chama
      //   `this.carregando.set(false)`.
    });
  }

  editar(conta: Conta): void {
    this.router.navigate(['/contas', conta.id, 'editar']);
  }

  desativar(conta: Conta): void {
    const refDialog = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: {
        titulo: 'Desativar conta',
        mensagem: `Tem certeza que deseja desativar a conta "${conta.nome}"?`
      }
    });

    refDialog.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.contaServico.alterarSituacao(conta.id, false).subscribe({
        next: () => {
          this.snackBar.open('Conta desativada', 'Fechar', { duration: 3000 });
          this.carregarContas();
        }
      });
    });
  }
}
