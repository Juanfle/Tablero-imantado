export type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';
export type Bloque = '1º' | '2º' | '3º' | '4º' | '5º' | '6º';

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