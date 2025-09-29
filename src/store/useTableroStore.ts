import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Iman, Posicion, Dia, Bloque } from '../types';
import { IMANES_INICIALES } from '../data';


interface TableroState {
  imanes: Iman[];
  posiciones: Posicion[];
  reset: () => void;
  ubicarIman: (imanId: string, dia: Dia, bloque: Bloque) => { ok: boolean; reason?: string };
  removerImanEn: (dia: Dia, bloque: Bloque) => void;
  usadosDe: (imanId: string) => number;
  moverIman: (
    fromDia: Dia,
    fromBloque: Bloque,
    toDia: Dia,
    toBloque: Bloque
  ) => { ok: boolean; reason?: string };
}


export const useTableroStore = create<TableroState>()(
  persist(
    (set, get) => ({
      imanes: IMANES_INICIALES,
      posiciones: [],

      reset: () => set({ posiciones: [] }),

      usadosDe: (imanId) => {
        const { posiciones } = get();
        return posiciones.filter(p => p.imanId === imanId).length;
      },

      ubicarIman: (imanId, dia, bloque) => {
        const { posiciones, imanes, usadosDe } = get();
        const iman = imanes.find(i => i.id === imanId);
        if (!iman) return { ok: false, reason: 'Imán inexistente' };

        // Celda ya ocupada
        const yaOcupada = posiciones.find(p => p.dia === dia && p.bloque === bloque);
        if (yaOcupada) {
          return { ok: false, reason: `La celda ${dia} ${bloque} ya está ocupada` };
        }

        // Choque de docente
        const conflicto = posiciones.find(p => {
          const otroIman = imanes.find(i => i.id === p.imanId);
          return p.dia === dia && p.bloque === bloque && otroIman?.docente === iman.docente;
        });
        if (conflicto) {
          return { ok: false, reason: `Choque: ${iman.docente} ya está en ${dia} ${bloque}` };
        }

        // Validar cantidad de módulos usados
        const usados = usadosDe(imanId);
        if (usados >= iman.modulos) {
          return {
            ok: false,
            reason: `${iman.materia} – ${iman.docente} ya usó sus ${iman.modulos} módulo(s)`
          };
        }

        set({ posiciones: [...posiciones, { imanId, dia, bloque }] });
        return { ok: true };
      },

      removerImanEn: (dia, bloque) => {
        const { posiciones } = get();
        set({ posiciones: posiciones.filter(p => !(p.dia === dia && p.bloque === bloque)) });
      },

      moverIman: (fromDia, fromBloque, toDia, toBloque) => {
        const { posiciones, imanes } = get();

        const src = posiciones.find(p => p.dia === fromDia && p.bloque === fromBloque);
        if (!src) return { ok: false, reason: 'No hay imán en la celda de origen' };

        const dst = posiciones.find(p => p.dia === toDia && p.bloque === toBloque);
        if (dst) return { ok: false, reason: `La celda ${toDia} ${toBloque} ya está ocupada` };

        const iman = imanes.find(i => i.id === src.imanId);
        const choque = posiciones.find(p => {
          const otro = imanes.find(i => i.id === p.imanId);
          return p.dia === toDia && p.bloque === toBloque && otro?.docente === iman?.docente;
        });
        if (choque) return { ok: false, reason: `Choque con docente en ${toDia} ${toBloque}` };

        const sinOrigen = posiciones.filter(p => !(p.dia === fromDia && p.bloque === fromBloque));
        set({ posiciones: [...sinOrigen, { imanId: src.imanId, dia: toDia, bloque: toBloque }] });
        return { ok: true };
      }
    }),
    { name: 'tablero-imantado-v2' } // clave única para localStorage
  )
);
