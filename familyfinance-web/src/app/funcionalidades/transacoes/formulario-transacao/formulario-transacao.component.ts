import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TransacaoServico } from '../../../nucleo/servicos/transacao.servico';
import { SubcategoriaServico } from '../../../nucleo/servicos/subcategoria.servico';
import { ContaEstadoServico } from '../../../nucleo/estado/conta-estado.servico';
import { CategoriaEstadoServico } from '../../../nucleo/estado/categoria-estado.servico';
import { Subcategoria } from '../../../modelos/subcategoria.modelo';
import {
  CriarTransacaoComando,
  EditarTransacaoComando,
  TipoTransacao
} from '../../../modelos/transacao.modelo';

@Component({
  selector: 'ff-formulario-transacao',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  providers: [MatNativeDateModule],
  templateUrl: './formulario-transacao.component.html',
  styleUrl: './formulario-transacao.component.scss'
})
export class FormularioTransacaoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly transacaoServico = inject(TransacaoServico);
  private readonly subcategoriaServico = inject(SubcategoriaServico);
  private readonly destroyRef = inject(DestroyRef);
  readonly contaEstado = inject(ContaEstadoServico);
  readonly categoriaEstado = inject(CategoriaEstadoServico);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly categoriasFiltradas = computed(() => {
    const tipo = this.formulario?.controls.tipo.value as TipoTransacao;
    return this.categoriaEstado.categorias().filter((c) => c.tipo === tipo);
  });

  readonly subcategorias = signal<Subcategoria[]>([]);
  readonly modoEdicao = signal<boolean>(false);
  readonly carregando = signal<boolean>(false);
  readonly idTransacao = signal<string | null>(null);

  readonly tiposTransacao: { valor: TipoTransacao; rotulo: string }[] = [
    { valor: 'RECEITA', rotulo: 'Receita' },
    { valor: 'DESPESA', rotulo: 'Despesa' }
  ];

  readonly formulario = this.fb.nonNullable.group({
    contaId: ['', [Validators.required]],
    tipo: ['DESPESA' as TipoTransacao, [Validators.required]],
    descricao: ['', [Validators.required, Validators.maxLength(200)]],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    dataLancamento: [new Date(), [Validators.required]],
    categoriaId: [null as string | null],
    subcategoriaId: [null as string | null],
    efetivada: [true]
  });

  ngOnInit(): void {
    this.carregarDados();

    this.formulario.controls.categoriaId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categoriaId) => {
        this.formulario.controls.subcategoriaId.setValue(null, { emitEvent: false });
        if (categoriaId) {
          this.subcategoriaServico.listar(categoriaId).subscribe((subs) => this.subcategorias.set(subs));
        } else {
          this.subcategorias.set([]);
        }
      });

    const id = this.rota.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao.set(true);
      this.idTransacao.set(id);
      this.carregarTransacao(id);
    }
  }

  private carregarDados(): void {
    this.contaEstado.garantirCarregado();
    this.categoriaEstado.garantirCarregado();
  }

  private carregarTransacao(id: string): void {
    this.carregando.set(true);
    this.transacaoServico.buscarPorId(id).subscribe({
      next: (transacao) => {
        this.formulario.patchValue({
          contaId: transacao.conta.id,
          tipo: transacao.tipo,
          descricao: transacao.descricao,
          valor: transacao.valor,
          dataLancamento: new Date(transacao.dataLancamento + 'T12:00:00'),
          categoriaId: transacao.categoria?.id ?? null,
          efetivada: transacao.efetivada
        }, { emitEvent: false });

        if (transacao.categoria?.id) {
          this.subcategoriaServico.listar(transacao.categoria.id).subscribe((subs) => {
            this.subcategorias.set(subs);
            this.formulario.controls.subcategoriaId.setValue(
              transacao.subcategoria?.id ?? null,
              { emitEvent: false }
            );
          });
        }

        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.router.navigate(['/transacoes']);
      }
    });
  }

  onTipoMudou(): void {
    this.formulario.controls.categoriaId.setValue(null);
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const dataLancamento = this.formatarData(valor.dataLancamento);

    if (this.modoEdicao()) {
      this.atualizar(valor, dataLancamento);
    } else {
      this.criar(valor, dataLancamento);
    }
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private criar(
    valor: ReturnType<typeof this.formulario.getRawValue>,
    dataLancamento: string
  ): void {
    const comando: CriarTransacaoComando = {
      contaId: valor.contaId,
      categoriaId: valor.categoriaId,
      subcategoriaId: valor.subcategoriaId,
      descricao: valor.descricao,
      valor: valor.valor,
      tipo: valor.tipo,
      dataLancamento,
      efetivada: valor.efetivada
    };

    this.transacaoServico.criar(comando).subscribe({
      next: () => {
        this.snackBar.open('Transação registrada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/transacoes']);
      }
    });
  }

  private atualizar(
    valor: ReturnType<typeof this.formulario.getRawValue>,
    dataLancamento: string
  ): void {
    const id = this.idTransacao();
    if (!id) return;

    const comando: EditarTransacaoComando = {
      contaId: valor.contaId,
      categoriaId: valor.categoriaId,
      subcategoriaId: valor.subcategoriaId,
      descricao: valor.descricao,
      valor: valor.valor,
      tipo: valor.tipo,
      dataLancamento,
      efetivada: valor.efetivada
    };

    this.transacaoServico.atualizar(id, comando).subscribe({
      next: () => {
        this.snackBar.open('Transação atualizada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/transacoes']);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/transacoes']);
  }
}
