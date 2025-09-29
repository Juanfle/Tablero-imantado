import type { Iman, Dia, Bloque } from './types';


export const DIAS: Dia[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
export const BLOQUES: Bloque[] = ['1º', '2º', '3º', '4º', '5º', '6º'];


export const IMANES_INICIALES: Iman[] = [
  { id: 'hist-lago', materia: 'Historia',   docente: 'Luciano Lago', rol: 'Titular',     color: '#F59E0B', modulos: 2 },
  { id: 'mat-garcia', materia: 'Matemática', docente: 'Ana García',  rol: 'Titular',     color: '#3B82F6', modulos: 3 },
  { id: 'leng-perez', materia: 'Lengua',     docente: 'Sofía Pérez', rol: 'Suplente',    color: '#10B981', modulos: 2 },
  { id: 'geo-ruiz',   materia: 'Geografía',  docente: 'Marcos Ruiz', rol: 'Provisional', color: '#EC4899', modulos: 1 },
];