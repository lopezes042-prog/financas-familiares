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

import { ContaServico } from '../../../nucleo/servicos/conta.servico';
import { ContaEstadoServico } from '../../../nucleo/estado/conta-estado.servico';
import {
  CriarContaComando,
  EditarContaComando,
  TIPOS_CONTA,
  TipoConta
} from '../../../modelos/conta.modelo';

@Component({
  selector: 'ff-formulario-conta',
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
  templateUrl: './formulario-conta.component.html',
  styleUrl: './formulario-conta.component.scss'
})
export class FormularioContaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contaServico = inject(ContaServico);
  private readonly contaEstado = inject(ContaEstadoServico);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly tiposConta = TIPOS_CONTA;
  readonly modoEdicao = signal<boolean>(false);
  readonly carregando = signal<boolean>(false);
  readonly idConta = signal<string | null>(null);

  readonly formulario = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    tipo: ['CORRENTE' as TipoConta, [Validators.required]],
    saldoInicial: [0, [Validators.required, Validators.min(0)]],
    cor: ['']
  });

  ngOnInit(): void {
    const id = this.rota.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicao.set(true);
      this.idConta.set(id);
      this.carregarConta(id);
    }
  }

  private carregarConta(id: string): void {
    this.carregando.set(true);
    this.contaServico.buscarPorId(id).subscribe({
      next: (conta) => {
        this.formulario.patchValue({
          nome: conta.nome,
          tipo: conta.tipo,
          saldoInicial: conta.saldoInicial,
          cor: conta.cor ?? ''
        });
        this.formulario.controls.saldoInicial.disable();
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.router.navigate(['/contas']);
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
    const comando: CriarContaComando = {
      nome: valor.nome,
      tipo: valor.tipo,
      saldoInicial: valor.saldoInicial,
      cor: valor.cor || undefined
    };

    this.contaServico.criar(comando).subscribe({
      next: () => {
        this.contaEstado.recarregar();
        this.snackBar.open('Conta criada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/contas']);
      }
    });
  }

  private atualizar(valor: ReturnType<typeof this.formulario.getRawValue>): void {
    const id = this.idConta();
    if (!id) return;

    const comando: EditarContaComando = {
      nome: valor.nome,
      tipo: valor.tipo,
      cor: valor.cor || undefined
    };

    this.contaServico.atualizar(id, comando).subscribe({
      next: () => {
        this.contaEstado.recarregar();
        this.snackBar.open('Conta atualizada com sucesso', 'Fechar', { duration: 3000 });
        this.router.navigate(['/contas']);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/contas']);
  }
}
