export type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';
export type Bloque =
    | '7:20 a 8:20'
    | '8:30 a 9:30'
    | '9:40 a 10:40'
    | '10:50 a 11:50'
    | '12:00 a 13:00'
    | '13:00 a 14:00';

export interface Iman {
    id: string;
    materia: string;
    docente: string;
    rol: 'Titular' | 'Provisional' | 'Suplente';
    // opcional: segundo profesor relacionado (ej: suplente)
    docente2?: string;
    rol2?: 'Titular' | 'Provisional' | 'Suplente';
    color?: string;
    modulos: number;
}

export interface Posicion {
    imanId: string;
    dia: Dia;
    bloque: Bloque;
    aula?: string;
}