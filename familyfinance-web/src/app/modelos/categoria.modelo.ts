export type TipoCategoria = 'RECEITA' | 'DESPESA';

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  icone: string | null;
  cor: string | null;
  ativo: boolean;
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
