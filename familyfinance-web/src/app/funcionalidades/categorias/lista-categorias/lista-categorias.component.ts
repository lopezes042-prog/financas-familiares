import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import { Categoria } from '../../../modelos/categoria.modelo';
import { ConfirmacaoDialogoComponent } from '../../../compartilhado/componentes/confirmacao-dialogo/confirmacao-dialogo.component';

@Component({
  selector: 'ff-lista-categorias',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './lista-categorias.component.html',
  styleUrl: './lista-categorias.component.scss'
})
export class ListaCategoriasComponent implements OnInit {
  private readonly categoriaServico = inject(CategoriaServico);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly categorias = signal<Categoria[]>([]);
  readonly carregando = signal<boolean>(false);
  readonly colunasExibidas = ['nome', 'tipo', 'icone', 'cor', 'acoes'];

  ngOnInit(): void {
    this.carregarCategorias();
  }

  carregarCategorias(): void {
    this.carregando.set(true);
    this.categoriaServico.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  editar(categoria: Categoria): void {
    this.router.navigate(['/categorias', categoria.id, 'editar']);
  }

  desativar(categoria: Categoria): void {
    const refDialog = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: {
        titulo: 'Desativar categoria',
        mensagem: `Tem certeza que deseja desativar a categoria "${categoria.nome}"?`
      }
    });

    refDialog.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.categoriaServico.alterarSituacao(categoria.id, false).subscribe({
        next: () => {
          this.snackBar.open('Categoria desativada', 'Fechar', { duration: 3000 });
          this.carregarCategorias();
        }
      });
    });
  }
}
