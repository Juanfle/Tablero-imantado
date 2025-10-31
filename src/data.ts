import type { Iman, Dia, Bloque } from './types';


export const DIAS: Dia[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
export const BLOQUES: Bloque[] = [
    '7:20 a 8:20',
    '8:30 a 9:30',
    '9:40 a 10:40',
    '10:50 a 11:50',
    '12:00 a 13:00',
    '13:00 a 14:00',
];


export const IMANES_INICIALES: Iman[] = [
    { id: 'hist-lago', materia: 'Historia',   docente: 'Luciano Lago', rol: 'Tit',     color: '#F59E0B', modulos: 2 },
    { id: 'mat-garcia', materia: 'Matemática', docente: 'Ana García',  rol: 'Tit',     color: '#3B82F6', modulos: 3 },
    { id: 'leng-perez', materia: 'Lengua',     docente: 'Sofía Pérez', rol: 'Sup',    color: '#10B981', modulos: 2 },
    { id: 'geo-ruiz',   materia: 'Geografía',  docente: 'Marcos Ruiz', rol: 'Prov', color: '#EC4899', modulos: 1 },
];