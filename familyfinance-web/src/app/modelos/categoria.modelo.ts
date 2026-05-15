export type TipoCategoria = 'RECEITA' | 'DESPESA';

export type SituacaoCategoria = 'ativa' | 'arquivada';

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  icone: string | null;
  cor: string | null;
  ativo: boolean;
  subcategoriasAtivas: number;
}

export interface ArquivamentoResposta {
  subcategoriasArquivadas: number;
}

export interface RestaurarCategoriaComando {
  icone?: string | null;
  cor?: string | null;
  tipo?: TipoCategoria | null;
  restaurarSubcategorias: boolean;
}

export interface CriarCategoriaComando {
  nome: string;
  tipo: TipoCategoria;
  icone?: string;
  cor?: string;
}

export interface EditarCategoriaComando {
  nome: string;
  tipo: TipoCategoria;
  icone?: string | null;
  cor?: string | null;
}

export const TIPOS_CATEGORIA: { valor: TipoCategoria; rotulo: string }[] = [
  { valor: 'RECEITA', rotulo: 'Receita' },
  { valor: 'DESPESA', rotulo: 'Despesa' }
];
