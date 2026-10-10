import { Pipe, PipeTransform } from '@angular/core';

const FORMATO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/** 53000 → "$53.000" (pesos colombianos, igual que el bot) */
@Pipe({ name: 'pesos' })
export class PesosPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor == null ? '—' : '$' + FORMATO.format(valor);
  }
}
