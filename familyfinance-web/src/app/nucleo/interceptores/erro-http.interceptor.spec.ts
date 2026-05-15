import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { erroHttpInterceptor } from './erro-http.interceptor';
import { AcaoSnackbarComponent } from '../../compartilhado/componentes/acao-snackbar/acao-snackbar.component';

describe('erroHttpInterceptor', () => {
  let http: HttpClient;
  let httpTest: HttpTestingController;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroHttpInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTest = TestBed.inject(HttpTestingController);
    snackBar = TestBed.inject(MatSnackBar);
  });

  afterEach(() => {
    httpTest.verify();
    TestBed.resetTestingModule();
  });

  it('deve exibir snackbar padrão para erros 500', () => {
    const abrirSpy = vi.spyOn(snackBar, 'open');
    http.get('/api/teste').subscribe({ error: () => {} });
    httpTest.expectOne('/api/teste').flush({ mensagem: 'Erro interno' }, { status: 500, statusText: 'Internal Server Error' });
    expect(abrirSpy).toHaveBeenCalledOnce();
  });

  it('deve exibir snackbar padrão para erros 422', () => {
    const abrirSpy = vi.spyOn(snackBar, 'open');
    http.get('/api/teste').subscribe({ error: () => {} });
    httpTest.expectOne('/api/teste').flush({}, { status: 422, statusText: 'Unprocessable Entity' });
    expect(abrirSpy).toHaveBeenCalledOnce();
  });

  it('deve usar openFromComponent com AcaoSnackbarComponent para 409', () => {
    const abrirComponenteSpy = vi.spyOn(snackBar, 'openFromComponent');
    http.get('/api/teste').subscribe({ error: () => {} });
    httpTest.expectOne('/api/teste').flush(
      { mensagem: 'Já existe uma categoria arquivada com esse nome.' },
      { status: 409, statusText: 'Conflict' }
    );
    expect(abrirComponenteSpy).toHaveBeenCalledOnce();
    expect(abrirComponenteSpy.mock.calls[0][0]).toBe(AcaoSnackbarComponent);
  });

  it('não deve chamar snackBar.open padrão para 409', () => {
    const abrirSpy = vi.spyOn(snackBar, 'open');
    http.get('/api/teste').subscribe({ error: () => {} });
    httpTest.expectOne('/api/teste').flush(
      { mensagem: 'Conflito' },
      { status: 409, statusText: 'Conflict' }
    );
    expect(abrirSpy).not.toHaveBeenCalled();
  });
});
