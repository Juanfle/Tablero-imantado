export type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';
export type Bloque = '1º' | '2º' | '3º' | '4º' | '5º' | '6º';


export interface Iman {
    id: string; // ej: "hist-lago"
    materia: string; // ej: "Historia"
    docente: string; // ej: "Luciano Lago"
    rol: 'Titular' | 'Provisional' | 'Suplente';
    color?: string; // opcional para destacar
}


export interface Posicion {
    imanId: string;
    dia: Dia;
    bloque: Bloque;
    aula?: string;
}