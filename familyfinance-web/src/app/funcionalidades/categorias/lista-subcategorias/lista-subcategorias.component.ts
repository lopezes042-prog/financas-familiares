import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { SubcategoriaServico } from '../../../nucleo/servicos/subcategoria.servico';
import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Subcategoria } from '../../../modelos/subcategoria.modelo';
import { ConfirmacaoDialogoComponent } from '../../../compartilhado/componentes/confirmacao-dialogo/confirmacao-dialogo.component';
import { FormularioSubcategoriaDialogoComponent } from '../formulario-subcategoria-dialogo/formulario-subcategoria-dialogo.component';
import { RestaurarSubcategoriaDialogoComponent } from '../restaurar-subcategoria-dialogo/restaurar-subcategoria-dialogo.component';
import {
  CriarSubcategoriaComando,
  EditarSubcategoriaComando,
  RestaurarSubcategoriaComando
} from '../../../modelos/subcategoria.modelo';

@Component({
  selector: 'ff-lista-subcategorias',
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
  templateUrl: './lista-subcategorias.component.html'
})
export class ListaSubcategoriasComponent implements OnInit {
  private readonly subcategoriaServico = inject(SubcategoriaServico);
  private readonly categoriaServico = inject(CategoriaServico);
  private readonly categoriaEstado = inject(CategoriaEstadoServico);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly categoriaId = signal<string>('');
  readonly nomeCategoria = signal<string>('');
  readonly subcategorias = signal<Subcategoria[]>([]);
  readonly subcategoriasArquivadas = signal<Subcategoria[]>([]);
  readonly carregando = signal<boolean>(false);
  readonly carregandoArquivadas = signal<boolean>(false);
  readonly abaAtiva = signal<'ativa' | 'arquivada'>('ativa');

  readonly colunasAtivas = ['nome', 'acoes'];
  readonly colunasArquivadas = ['nome', 'acoes'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('categoriaId') ?? '';
    this.categoriaId.set(id);

    this.categoriaServico.buscarPorId(id).subscribe({
      next: (categoria) => this.nomeCategoria.set(categoria.nome)
    });

    const aba = this.route.snapshot.queryParamMap.get('aba');
    if (aba === 'arquivadas') {
      this.abaAtiva.set('arquivada');
      this.carregarArquivadas();
    } else {
      this.carregarSubcategorias();
    }
  }

  carregarSubcategorias(): void {
    this.carregando.set(true);
    this.subcategoriaServico.listar(this.categoriaId()).subscribe({
      next: (lista) => {
        this.subcategorias.set(lista);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  carregarArquivadas(): void {
    this.carregandoArquivadas.set(true);
    this.subcategoriaServico.listarArquivadas(this.categoriaId()).subscribe({
      next: (lista) => {
        this.subcategoriasArquivadas.set(lista);
        this.carregandoArquivadas.set(false);
      },
      error: () => this.carregandoArquivadas.set(false)
    });
  }

  trocarAba(indice: number): void {
    const aba = indice === 1 ? 'arquivadas' : null;
    const novaAba: 'ativa' | 'arquivada' = indice === 1 ? 'arquivada' : 'ativa';
    this.abaAtiva.set(novaAba);
    this.router.navigate([], { queryParams: { aba }, queryParamsHandling: 'merge' });
    if (novaAba === 'arquivada' && this.subcategoriasArquivadas().length === 0) {
      this.carregarArquivadas();
    } else if (novaAba === 'ativa' && this.subcategorias().length === 0) {
      this.carregarSubcategorias();
    }
  }

  novaSubcategoria(): void {
    const ref = this.dialog.open(FormularioSubcategoriaDialogoComponent, { data: null });
    ref.afterClosed().subscribe((comando: CriarSubcategoriaComando | null) => {
      if (!comando) return;
      this.subcategoriaServico.criar(this.categoriaId(), comando).subscribe({
        next: () => {
          this.snackBar.open('Subcategoria criada.', 'Fechar', { duration: 3000 });
          this.categoriaEstado.recarregar();
          this.carregarSubcategorias();
        }
      });
    });
  }

  editar(subcategoria: Subcategoria): void {
    const ref = this.dialog.open(FormularioSubcategoriaDialogoComponent, { data: subcategoria });
    ref.afterClosed().subscribe((comando: EditarSubcategoriaComando | null) => {
      if (!comando) return;
      this.subcategoriaServico.atualizar(this.categoriaId(), subcategoria.id, comando).subscribe({
        next: () => {
          this.snackBar.open('Subcategoria atualizada.', 'Fechar', { duration: 3000 });
          this.carregarSubcategorias();
        }
      });
    });
  }

  arquivar(subcategoria: Subcategoria): void {
    const ref = this.dialog.open(ConfirmacaoDialogoComponent, {
      data: { titulo: 'Arquivar subcategoria', mensagem: `Arquivar "${subcategoria.nome}"?` }
    });
    ref.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.subcategoriaServico.arquivar(this.categoriaId(), subcategoria.id).subscribe({
        next: () => {
          this.snackBar.open('Subcategoria arquivada.', 'Fechar', { duration: 3000 });
          this.categoriaEstado.recarregar();
          this.subcategorias.set(this.subcategorias().filter((s) => s.id !== subcategoria.id));
        }
      });
    });
  }

  restaurar(subcategoria: Subcategoria): void {
    const ref = this.dialog.open(RestaurarSubcategoriaDialogoComponent, { data: subcategoria });
    ref.afterClosed().subscribe((comando: RestaurarSubcategoriaComando | null) => {
      if (!comando) return;
      this.subcategoriaServico.restaurar(this.categoriaId(), subcategoria.id, comando).subscribe({
        next: () => {
          this.snackBar.open('Subcategoria restaurada.', 'Fechar', { duration: 3000 });
          this.categoriaEstado.recarregar();
          this.router.navigate([], { queryParams: { aba: null }, queryParamsHandling: 'merge' });
          this.abaAtiva.set('ativa');
          this.carregarSubcategorias();
          this.subcategoriasArquivadas.set(
            this.subcategoriasArquivadas().filter((s) => s.id !== subcategoria.id)
          );
        }
      });
    });
  }

  get indiceAbaAtiva(): number {
    return this.abaAtiva() === 'arquivada' ? 1 : 0;
  }
}
