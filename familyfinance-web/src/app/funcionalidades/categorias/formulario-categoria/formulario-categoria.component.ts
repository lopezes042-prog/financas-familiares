import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import {
  CriarCategoriaComando,
  EditarCategoriaComando,
  TIPOS_CATEGORIA,
  TipoCategoria
} from '../../../modelos/categoria.modelo';

@Component({
  selector: 'ff-formulario-categoria',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './formulario-categoria.component.html',
  styleUrl: './formulario-categoria.component.scss'
})
export class FormularioCategoriaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriaServico = inject(CategoriaServico);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly tiposCategoria = TIPOS_CATEGORIA;
  readonly modoEdicao = signal<boolean>(false);
  readonly carregando = signal<boolean>(false);
  readonly idCategoria = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    tipo: ['DESPESA' as TipoCategoria, [Validators.required]],
    icone: ['', [Validators.maxLength(50)]],
    cor: ['']
  });

  ngOnInit(): void {
    const id = this.rota.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao.set(true);
      this.idCategoria.set(id);
      this.carregarCategoria(id);
    }
  }

  private carregarCategoria(id: string): void {
    this.carregando.set(true);
    this.categoriaServico.buscarPorId(id).subscribe({
      next: (categoria) => {
        this.formulario.patchValue({
          nome: categoria.nome,
          tipo: categoria.tipo,
          icone: categoria.icone ?? '',
          cor: categoria.cor ?? ''
        });
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.router.navigate(['/categorias']);
      }
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();

    if (this.modoEdicao()) {
      this.atualizar(valor);
    } else {
      this.criar(valor);
    }
  }

  private criar(valor: ReturnType<typeof this.formulario.getRawValue>): void {
    const comando: CriarCategoriaComando = {
      nome: valor.nome,
      tipo: valor.tipo,
      icone: valor.icone || undefined,
      cor: valor.cor || undefined
    };

    this.categoriaServico.criar(comando).subscribe({
      next: () => {
        this.snackBar.open('Categoria criada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/categorias']);
      }
    });
  }

  private atualizar(valor: ReturnType<typeof this.formulario.getRawValue>): void {
    const id = this.idCategoria();
    if (!id) return;

    const comando: EditarCategoriaComando = {
      nome: valor.nome,
      tipo: valor.tipo,
      icone: valor.icone || null,
      cor: valor.cor || null
    };

    this.categoriaServico.atualizar(id, comando).subscribe({
      next: () => {
        this.snackBar.open('Categoria atualizada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/categorias']);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/categorias']);
  }
}
