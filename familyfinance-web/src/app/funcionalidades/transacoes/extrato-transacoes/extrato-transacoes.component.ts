import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';

import { TransacaoServico } from '../../../nucleo/servicos/transacao.servico';
import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { Transacao, TipoTransacao } from '../../../modelos/transacao.modelo';
import { Conta } from '../../../modelos/conta.modelo';
import { ConfirmacaoDialogoComponent } from '../../../compartilhado/componentes/confirmacao-dialogo/confirmacao-dialogo.component';

@Component({
  selector: 'ff-extrato-transacoes',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule
  ],
  templateUrl: './extrato-transacoes.component.html',
  styleUrl: './extrato-transacoes.component.scss'
})
export class ExtratoTransacoesComponent implements OnInit {
  private readonly transacaoServico = inject(TransacaoServico);
  private readonly contaServico = inject(ContaServico);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly contas = signal<Conta[]>([]);
  readonly contaSelecionada = signal<Conta | null>(null);
  readonly transacoes = signal<Transacao[]>([]);
  readonly carregando = signal<boolean>(false);
  readonly carregandoContas = signal<boolean>(false);
  // BUG-T-08: tipoFiltro é atualizado mas nunca incluído nos FiltrosTransacao enviados ao serviço
  readonly tipoFiltro = signal<TipoTransacao | null>(null);

  readonly colunasExibidas = ['status', 'dataLancamento', 'descricao', 'categoria', 'valor', 'acoes'];

  readonly totalTransacoes = signal<number>(0);

  ngOnInit(): void {
    this.carregarContas();
  }

  carregarContas(): void {
    this.carregandoContas.set(true);
    this.contaServico.listar().subscribe({
      next: (contas) => {
        this.contas.set(contas);
        this.carregandoContas.set(false);
      },
      error: () => this.carregandoContas.set(false)
    });
  }

  selecionarConta(conta: Conta | null): void {
    this.contaSelecionada.set(conta);
    if (conta) {
      this.carregarTransacoes();
    } else {
      this.transacoes.set([]);
    }
  }

  filtrarPorTipo(tipo: TipoTransacao | null): void {
    this.tipoFiltro.set(tipo);
    if (this.contaSelecionada()) {
      this.carregarTransacoes();
    }
  }

  carregarTransacoes(): void {
    const conta = this.contaSelecionada();
    if (!conta) return;

    this.carregando.set(true);
    // BUG-T-08: tipoFiltro é ignorado — o filtro de tipo não é enviado ao backend
    this.transacaoServico.listar({ contaId: conta.id, tamanho: 50 }).subscribe({
      next: (pagina) => {
        this.transacoes.set(pagina.conteudo);
        this.totalTransacoes.set(pagina.totalItens);
        this.carregando.set(false);
      },
      // BUG-T-06: callback error ausente — spinner não para em caso de falha
      complete: () => {}
    });
  }

  recarregarContaAtual(): void {
    const conta = this.contaSelecionada();
    if (!conta) return;
    this.contaServico.buscarPorId(conta.id).subscribe({
      next: (contaAtualizada) => {
        this.contaSelecionada.set(contaAtualizada);
        this.contas.update((lista) =>
          lista.map((c) => (c.id === contaAtualizada.id ? contaAtualizada : c))
        );
      }
    });
  }

  efetivar(transacao: Transacao): void {
    this.transacaoServico.efetivar(transacao.id, true).subscribe({
      next: () => {
        this.snackBar.open('Transação efetivada', 'Fechar', { duration: 3000 });
        this.carregarTransacoes();
        this.recarregarContaAtual();
      }
    });
  }

  desefetivar(transacao: Transacao): void {
    const refDialog = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: {
        titulo: 'Desfazer efetivação',
        mensagem: `Tem certeza que deseja reverter a efetivação de "${transacao.descricao}"? O saldo da conta será ajustado.`
      }
    });

    refDialog.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.transacaoServico.efetivar(transacao.id, false).subscribe({
        next: () => {
          this.snackBar.open('Efetivação desfeita', 'Fechar', { duration: 3000 });
          this.carregarTransacoes();
          this.recarregarContaAtual();
        }
      });
    });
  }

  desativar(transacao: Transacao): void {
    const refDialog = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: {
        titulo: 'Excluir transação',
        mensagem: `Tem certeza que deseja excluir "${transacao.descricao}"?`
      }
    });

    refDialog.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.transacaoServico.alterarSituacao(transacao.id, false).subscribe({
        next: () => {
          this.snackBar.open('Transação excluída', 'Fechar', { duration: 3000 });
          this.carregarTransacoes();
          this.recarregarContaAtual();
        }
      });
    });
  }

  editar(transacao: Transacao): void {
    this.router.navigate(['/transacoes', transacao.id, 'editar']);
  }
}
