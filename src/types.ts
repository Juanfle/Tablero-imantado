export type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';
export type Bloque = '1º' | '2º' | '3º' | '4º' | '5º' | '6º';

export interface Iman {
  id: string;
  materia: string;
  docente: string;
  rol: 'Titular' | 'Provisional' | 'Suplente';
  color?: string;
  modulos: number; // ← NUEVO: cantidad total disponible
}

export interface Posicion {
  imanId: string;
  dia: Dia;
  bloque: Bloque;
  aula?: string;
}