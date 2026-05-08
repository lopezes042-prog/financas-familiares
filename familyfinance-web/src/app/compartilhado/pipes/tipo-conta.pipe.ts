import { Pipe, PipeTransform } from '@angular/core';

import { TIPOS_CONTA, TipoConta } from '../../modelos/conta.modelo';

@Pipe({ name: 'tipoContaLabel', standalone: true, pure: true })
export class TipoContaPipe implements PipeTransform {
  transform(tipo: TipoConta): string {
    return TIPOS_CONTA.find((t) => t.valor === tipo)?.rotulo ?? tipo;
  }
}
