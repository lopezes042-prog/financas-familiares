export type TipoTransacao = 'RECEITA' | 'DESPESA';

export interface ContaResumo {
  id: string;
  nome: string;
}

export interface CategoriaResumo {
  id: string;
  nome: string;
}

export interface Transacao {
  id: string;
  conta: ContaResumo;
  categoria: CategoriaResumo | null;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;
  efetivada: boolean;
  ativo: boolean;
}

export interface PaginaResposta<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  ultima: boolean;
}

export interface CriarTransacaoComando {
  contaId: string;
  categoriaId?: string | null;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;
  efetivada: boolean;
}

export interface EditarTransacaoComando {
  contaId: string;
  categoriaId?: string | null;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  dataLancamento: string;
  efetivada: boolean;
}

export interface EfetivarTransacaoComando {
  efetivada: boolean;
}

export interface FiltrosTransacao {
  contaId?: string;
  categoriaId?: string;
  efetivada?: boolean;
  tipo?: TipoTransacao;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  tamanho?: number;
}
