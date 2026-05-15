export interface Subcategoria {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface CriarSubcategoriaComando {
  nome: string;
}

export interface EditarSubcategoriaComando {
  nome: string;
}

export interface RestaurarSubcategoriaComando {
  nome?: string;
}
