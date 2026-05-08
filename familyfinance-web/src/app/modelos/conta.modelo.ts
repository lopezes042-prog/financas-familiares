export type TipoConta =
  | 'CORRENTE'
  | 'POUPANCA'
  | 'CARTAO_CREDITO'
  | 'CARTEIRA'
  | 'INVESTIMENTO';

export interface Conta {
  id: string;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;
  cor?: string;
  ativo: boolean;
}

export interface CriarContaComando {
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  cor?: string;
}

export interface EditarContaComando {
  nome: string;
  tipo: TipoConta;
  cor?: string | null;
}

export interface SaldoContaResposta {
  saldoAtual: number;
}

export const TIPOS_CONTA: { valor: TipoConta; rotulo: string }[] = [
  { valor: 'CORRENTE', rotulo: 'Conta corrente' },
  { valor: 'POUPANCA', rotulo: 'Poupança' },
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de crédito' },
  { valor: 'CARTEIRA', rotulo: 'Carteira' },
  { valor: 'INVESTIMENTO', rotulo: 'Investimento' }
];
