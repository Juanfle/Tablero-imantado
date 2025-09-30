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

                const yaOcupada = posiciones.find(p => p.dia === dia && p.bloque === bloque);
                if (yaOcupada) {
                    return { ok: false, reason: `La celda ${dia} ${bloque} ya está ocupada` };
                }

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
                const { posiciones } = get();

                const src = posiciones.find(p => p.dia === fromDia && p.bloque === fromBloque);
                if (!src) return { ok: false, reason: 'No hay imán en la celda de origen' };

                const dst = posiciones.find(p => p.dia === toDia && p.bloque === toBloque);

                if (!dst) {
                    const sinOrigen = posiciones.filter(p => !(p.dia === fromDia && p.bloque === fromBloque));
                    set({ posiciones: [...sinOrigen, { imanId: src.imanId, dia: toDia, bloque: toBloque }] });
                    return { ok: true };
                }

                const nuevas = posiciones.map(p => {
                    if (p.dia === fromDia && p.bloque === fromBloque) {
                    return { imanId: dst.imanId, dia: fromDia, bloque: fromBloque };
                    }
                    if (p.dia === toDia && p.bloque === toBloque) {
                    return { imanId: src.imanId, dia: toDia, bloque: toBloque };
                    }
                    return p;
                });

                set({ posiciones: nuevas });
                return { ok: true };
            },

        }),
        { name: 'tablero-imantado-v2' }
    )
);
