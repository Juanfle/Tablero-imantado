import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Iman, Posicion, Dia, Bloque, Anio } from '../types';
import { IMANES_INICIALES } from '../data';


interface TableroState {
    imanes: Iman[];
    posiciones: Posicion[];
    reset: () => void;
    addIman: (iman: Omit<Iman, 'id'>) => string;
    ubicarIman: (imanId: string, dia: Dia, bloque: Bloque, anio: Anio) => { ok: boolean; reason?: string };
    removerImanEn: (dia: Dia, bloque: Bloque, anio: Anio) => void;
    usadosDe: (imanId: string) => number;
    moverIman: (
        fromDia: Dia,
        fromBloque: Bloque,
        toDia: Dia,
        toBloque: Bloque,
        anio: Anio
    ) => { ok: boolean; reason?: string };
    updateIman: (imanId: string, patch: Partial<Iman>) => void;
    deleteIman: (imanId: string) => void;
}

export const useTableroStore = create<TableroState>()(
    persist(
        (set, get) => ({
            // Ensure initial data has anio set (migration for initial dataset)
            imanes: IMANES_INICIALES.map(i => ({ ...i, anio: (i as any).anio ?? 3 })),
            posiciones: [],

            reset: () => set({ posiciones: [] }),

            usadosDe: (imanId) => {
                const { posiciones } = get();
                return posiciones.filter(p => p.imanId === imanId).length;
            },

            ubicarIman: (imanId, dia, bloque, anio) => {
                const { posiciones, imanes, usadosDe } = get();
                const iman = imanes.find(i => i.id === imanId);
                if (!iman) return { ok: false };

                // ensure iman belongs to this year
                if ((iman.anio ?? 3) !== anio) return { ok: false };

                const yaOcupada = posiciones.find(p => p.dia === dia && p.bloque === bloque && p.anio === anio);

                const usados = usadosDe(imanId);
                if (usados >= iman.modulos) {
                    return { ok: false };
                }

                if (yaOcupada) {
                    // Replace occupant: remove existing position for that cell and place the new iman
                    const sinEsa = posiciones.filter(p => !(p.dia === dia && p.bloque === bloque && p.anio === anio));
                    set({ posiciones: [...sinEsa, { imanId, dia, bloque, anio }] });
                    return { ok: true };
                }

                set({ posiciones: [...posiciones, { imanId, dia, bloque, anio }] });
                return { ok: true };
            },

            removerImanEn: (dia, bloque, anio) => {
                const { posiciones } = get();
                set({ posiciones: posiciones.filter(p => !(p.dia === dia && p.bloque === bloque && p.anio === anio)) });
            },

            moverIman: (fromDia, fromBloque, toDia, toBloque, anio) => {
                const { posiciones } = get();

                const src = posiciones.find(p => p.dia === fromDia && p.bloque === fromBloque && p.anio === anio);
                if (!src) return { ok: false };

                const dst = posiciones.find(p => p.dia === toDia && p.bloque === toBloque && p.anio === anio);

                if (!dst) {
                    const sinOrigen = posiciones.filter(p => !(p.dia === fromDia && p.bloque === fromBloque && p.anio === anio));
                    set({ posiciones: [...sinOrigen, { imanId: src.imanId, dia: toDia, bloque: toBloque, anio }] });
                    return { ok: true };
                }

                const nuevas = posiciones.map(p => {
                    if (p.dia === fromDia && p.bloque === fromBloque && p.anio === anio) {
                        return { imanId: dst.imanId, dia: fromDia, bloque: fromBloque, anio };
                    }
                    if (p.dia === toDia && p.bloque === toBloque && p.anio === anio) {
                        return { imanId: src.imanId, dia: toDia, bloque: toBloque, anio };
                    }
                    return p;
                });

                set({ posiciones: nuevas });
                return { ok: true };
            },

            updateIman: (imanId, patch) => {
                const { imanes } = get();
                const siguientes = imanes.map(i => (i.id === imanId ? { ...i, ...patch } : i));
                set({ imanes: siguientes });
            },

            addIman: (iman) => {
                const { imanes } = get();
                // generar id simple y único
                const slug = (iman.materia || 'iman').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const id = `${slug}-${Date.now()}`;
                const nuevo: Iman = { id, ...iman, anio: (iman as any).anio ?? 1 } as Iman;
                set({ imanes: [...imanes, nuevo] });
                return id;
            },

            deleteIman: (imanId) => {
                const { imanes, posiciones } = get();
                set({ imanes: imanes.filter(i => i.id !== imanId), posiciones: posiciones.filter(p => p.imanId !== imanId) });
            },

        }),
        {
            name: 'tablero-imantado-v2',
            version: 1,
            migrate: (persistedState: any) => {
                if (!persistedState) return persistedState;
                const imanes = (persistedState.imanes || []).map((i: any) => ({ ...i, anio: (i && i.anio) ?? 3 }));
                const posiciones = (persistedState.posiciones || []).map((p: any) => ({ ...p, anio: (p && p.anio) ?? 3 }));
                return { ...persistedState, imanes, posiciones };
            }
        }
    )
);
