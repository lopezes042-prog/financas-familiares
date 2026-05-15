import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Categoria } from '../../../modelos/categoria.modelo';
import { ConfirmacaoDialogoComponent } from '../../../compartilhado/componentes/confirmacao-dialogo/confirmacao-dialogo.component';
import { RestaurarCategoriaDialogoComponent } from '../restaurar-categoria-dialogo/restaurar-categoria-dialogo.component';
import { RestaurarCategoriaComando } from '../../../modelos/categoria.modelo';


@Component({
  selector: 'ff-lista-categorias',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTabsModule
  ],
  templateUrl: './lista-categorias.component.html',
  styleUrl: './lista-categorias.component.scss'
})
export class ListaCategoriasComponent implements OnInit {
  private readonly categoriaServico = inject(CategoriaServico);
  private readonly categoriaEstado = inject(CategoriaEstadoServico);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly categorias = signal<Categoria[]>([]);
  readonly categoriasArquivadas = signal<Categoria[]>([]);
  readonly carregando = signal<boolean>(false);
  readonly carregandoArquivadas = signal<boolean>(false);
  readonly abaAtiva = signal<'ativa' | 'arquivada'>('ativa');

  readonly colunasAtivas = ['nome', 'tipo', 'subcategoriasAtivas', 'icone', 'cor', 'acoes'];
  readonly colunasArquivadas = ['nome', 'tipo', 'icone', 'cor', 'acoes'];

  ngOnInit(): void {
    const aba = this.route.snapshot.queryParamMap.get('aba');
    if (aba === 'arquivadas') {
      this.abaAtiva.set('arquivada');
      this.carregarArquivadas();
    } else {
      this.carregarCategorias();
    }
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

  carregarArquivadas(): void {
    this.carregandoArquivadas.set(true);
    this.categoriaServico.listarArquivadas().subscribe({
      next: (categorias) => {
        this.categoriasArquivadas.set(categorias);
        this.carregandoArquivadas.set(false);
      },
      error: () => this.carregandoArquivadas.set(false)
    });
  }

  trocarAba(indice: number): void {
    const aba = indice === 1 ? 'arquivadas' : null;
    const novaAba: 'ativa' | 'arquivada' = indice === 1 ? 'arquivada' : 'ativa';
    this.abaAtiva.set(novaAba);
    this.router.navigate([], {
      queryParams: { aba },
      queryParamsHandling: 'merge'
    });
    if (novaAba === 'arquivada' && this.categoriasArquivadas().length === 0) {
      this.carregarArquivadas();
    } else if (novaAba === 'ativa' && this.categorias().length === 0) {
      this.carregarCategorias();
    }
  }

  editar(categoria: Categoria): void {
    this.router.navigate(['/categorias', categoria.id, 'editar']);
  }

  arquivar(categoria: Categoria): void {
    const temSubcategorias = categoria.subcategoriasAtivas > 0;
    const mensagem = temSubcategorias
      ? `Arquivar "${categoria.nome}"? ${categoria.subcategoriasAtivas} subcategoria(s) também serão arquivadas.`
      : `Arquivar "${categoria.nome}"?`;

    const refDialog = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: { titulo: 'Arquivar categoria', mensagem }
    });

    refDialog.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.categoriaServico.arquivar(categoria.id).subscribe({
        next: (resposta) => {
          const extra = resposta.subcategoriasArquivadas > 0
            ? ` ${resposta.subcategoriasArquivadas} subcategoria(s) arquivada(s).`
            : '';
          this.snackBar.open(`Categoria arquivada.${extra}`, 'Fechar', { duration: 4000 });
          this.categoriaEstado.recarregar();
          this.carregarCategorias();
        }
      });
    });
  }

  abrirRestaurar(categoria: Categoria): void {
    const refDialog = this.dialog.open(RestaurarCategoriaDialogoComponent, {
      data: categoria,
      width: '480px'
    });

    refDialog.afterClosed().subscribe((comando: RestaurarCategoriaComando | null) => {
      if (!comando) return;
      this.categoriaServico.restaurar(categoria.id, comando).subscribe({
        next: () => {
          this.snackBar.open('Categoria restaurada.', 'Fechar', { duration: 3000 });
          this.categoriaEstado.recarregar();
          this.router.navigate([], { queryParams: { aba: null }, queryParamsHandling: 'merge' });
          this.abaAtiva.set('ativa');
          this.carregarCategorias();
          this.categoriasArquivadas.set(
            this.categoriasArquivadas().filter((c) => c.id !== categoria.id)
          );
        }
      });
    });
  }

  gerenciarSubcategorias(categoria: Categoria): void {
    this.router.navigate(['/categorias', categoria.id, 'subcategorias']);
  }

  get indiceAbaAtiva(): number {
    return this.abaAtiva() === 'arquivada' ? 1 : 0;
  }
}
