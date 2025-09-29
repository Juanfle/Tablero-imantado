import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Iman, Posicion, Dia, Bloque } from '../types';
import { IMANES_INICIALES } from '../data';


interface TableroState {
imanes: Iman[]; // bandeja de imanes disponibles
posiciones: Posicion[]; // imanes ubicados en la grilla
// acciones
reset: () => void;
ubicarIman: (imanId: string, dia: Dia, bloque: Bloque) => { ok: boolean; reason?: string };
removerIman: (imanId: string) => void;
}


export const useTableroStore = create<TableroState>()(
persist(
(set, get) => ({
imanes: IMANES_INICIALES,
posiciones: [],


reset: () => set({ posiciones: [] }),


ubicarIman: (imanId, dia, bloque) => {
const { posiciones, imanes } = get();
const iman = imanes.find(i => i.id === imanId);
if (!iman) return { ok: false, reason: 'Imán inexistente' };


// Regla de choque: mismo docente no puede estar en el mismo día‑bloque
const conflicto = posiciones.find(p => {
const otroIman = imanes.find(i => i.id === p.imanId);
return p.dia === dia && p.bloque === bloque && otroIman?.docente === iman.docente && p.imanId !== imanId;
});
if (conflicto) {
return { ok: false, reason: `Choque: ${iman.docente} ya está en ${dia} ${bloque}` };
}


// Si el imán ya estaba en otro lugar, lo movemos; si estaba en el mismo, no cambia
const sinEse = posiciones.filter(p => p.imanId !== imanId);
set({ posiciones: [...sinEse, { imanId, dia, bloque }] });
return { ok: true };
},


removerIman: (imanId) => {
const { posiciones } = get();
set({ posiciones: posiciones.filter(p => p.imanId !== imanId) });
}
}),
{ name: 'tablero-imantado-v1' }
)
);