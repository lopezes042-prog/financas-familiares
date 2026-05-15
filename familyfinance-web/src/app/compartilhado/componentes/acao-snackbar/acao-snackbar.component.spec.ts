import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { AcaoSnackbarComponent, AcaoSnackbarDados } from './acao-snackbar.component';

const dadosMock: AcaoSnackbarDados = {
  mensagem: 'Já existe uma categoria arquivada com esse nome.',
  rotulo: 'Ver Arquivadas',
  url: '/categorias',
  queryParams: { aba: 'arquivadas' }
};

describe('AcaoSnackbarComponent', () => {
  let fixture: ComponentFixture<AcaoSnackbarComponent>;
  let component: AcaoSnackbarComponent;
  let snackBarRefMock: { dismiss: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    snackBarRefMock = { dismiss: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AcaoSnackbarComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter([{ path: '**', component: AcaoSnackbarComponent }]),
        { provide: MAT_SNACK_BAR_DATA, useValue: dadosMock },
        { provide: MatSnackBarRef, useValue: snackBarRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AcaoSnackbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir a mensagem recebida', () => {
    const texto = fixture.nativeElement.querySelector('.ff-acao-snackbar__mensagem');
    expect(texto?.textContent).toContain(dadosMock.mensagem);
  });

  it('deve exibir o botão com o rotulo recebido', () => {
    const botao = fixture.nativeElement.querySelector('.ff-acao-snackbar__botao');
    expect(botao?.textContent?.trim()).toBe(dadosMock.rotulo);
  });

  it('deve navegar e fechar o snackbar ao executar ação', () => {
    const navegarSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.executarAcao();
    expect(navegarSpy).toHaveBeenCalledWith([dadosMock.url], { queryParams: dadosMock.queryParams });
    expect(snackBarRefMock.dismiss).toHaveBeenCalledOnce();
  });
});
