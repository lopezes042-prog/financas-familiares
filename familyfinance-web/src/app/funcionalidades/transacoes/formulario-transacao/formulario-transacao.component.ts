import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { CategoriaServico } from '../../../nucleo/servicos/categoria.servico';
import {
  CriarTransacaoComando,
  EditarTransacaoComando,
  TipoTransacao
} from '../../../modelos/transacao.modelo';
import { Conta } from '../../../modelos/conta.modelo';
import { Categoria } from '../../../modelos/categoria.modelo';

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
  private readonly contaServico = inject(ContaServico);
  private readonly categoriaServico = inject(CategoriaServico);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly contas = signal<Conta[]>([]);
  readonly todasCategorias = signal<Categoria[]>([]);
  readonly categoriasFiltradas = computed(() => {
    const tipo = this.formulario?.controls.tipo.value as TipoTransacao;
    return this.todasCategorias().filter((c) => c.tipo === tipo);
  });

  readonly modoEdicao = signal<boolean>(false);
  readonly carregando = signal<boolean>(false);
  readonly carregandoDados = signal<boolean>(false);
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
    efetivada: [true]
  });

  ngOnInit(): void {
    this.carregarDados();
    const id = this.rota.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao.set(true);
      this.idTransacao.set(id);
      this.carregarTransacao(id);
    }
  }

  private carregarDados(): void {
    this.carregandoDados.set(true);
    this.contaServico.listar().subscribe({
      next: (contas) => this.contas.set(contas)
    });
    this.categoriaServico.listar().subscribe({
      next: (categorias) => {
        this.todasCategorias.set(categorias);
        this.carregandoDados.set(false);
      },
      error: () => this.carregandoDados.set(false)
    });
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
        });
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
