import { useMemo, useState } from 'react';
import tstyles from './Tablero.module.css';
import {
    DndContext,
    useDroppable,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { BLOQUES, DIAS } from '../data';
import type { Dia, Bloque, Iman as ImanModel } from '../types';
import { useTableroStore } from '../store/useTableroStore';
import Iman from './iman';

function Celda({
    dia,
    bloque,
    children,
}: {
    dia: Dia;
    bloque: Bloque;
    children?: React.ReactNode;
}) {
    const id = `${dia}|${bloque}`;
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={`${tstyles.celda} ${isOver ? tstyles.celdaHover : ''}`}>
            {children}
            <div className={tstyles.celdaLabel}>{bloque}</div>
        </div>
    );
}

export default function Tablero() {
    const { imanes, posiciones, ubicarIman, removerImanEn, moverIman, addIman } = useTableroStore();
    const [mensaje, setMensaje] = useState<string | null>(null);
    // Etiqueta del año que aparecerá en la celda superior-izquierda
    const ANIO_LABEL = '1° año';

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const usadosMap = useMemo(() => {
        const m = new Map<string, number>();
        posiciones.forEach((p) => m.set(p.imanId, (m.get(p.imanId) ?? 0) + 1));
        return m;
    }, [posiciones]);

    const restantesDe = (imanId: string) => {
        const iman = imanes.find((i) => i.id === imanId);
        if (!iman) return 0;
        const usados = usadosMap.get(imanId) ?? 0;
        return Math.max(iman.modulos - usados, 0);
    };

    const bandeja = imanes.filter((i) => restantesDe(i.id) > 0);
    const [activeIman, setActiveIman] = useState<ImanModel | null>(null);
    // Estados para crear nuevo imán
    const [showCreate, setShowCreate] = useState(false);
    const [newMateria, setNewMateria] = useState('');
    const [newDocente, setNewDocente] = useState('');
    const [newModulos, setNewModulos] = useState('1');
    const [newRol, setNewRol] = useState<ImanModel['rol']>('Titular');
    const [newColor, setNewColor] = useState('#FDE68A');

    const onDragStart = (e: DragStartEvent) => {
        const activeId = String(e.active.id);
        let imanId: string;
        if (activeId.startsWith('placed:')) {
            const payload = activeId.slice('placed:'.length); // preserve any ':' inside the bloque
            imanId = payload.split('|')[0];
        } else {
            imanId = activeId;
        }

        const iman = imanes.find(i => i.id === imanId) ?? null;
        setActiveIman(iman);
    };

        const onDragEnd = (e: DragEndEvent) => {
        setActiveIman(null);
        const activeId = String(e.active.id);
        const overId = e.over?.id as string | undefined;
        if (!overId) return;

        if (!activeId.startsWith('placed:')) {
            const [dia, bloque] = overId.split('|') as [Dia, Bloque];
            const { ok, reason } = ubicarIman(activeId, dia, bloque);
            setMensaje(ok ? null : reason ?? null);
            return;
        }

        // when id is like `placed:<imanId>|<dia>|<bloque>` we must only strip the first `placed:` prefix
        // and NOT split by ':' because the bloque contains ':' (times). Use slice to preserve payload intact.
        const payload = activeId.slice('placed:'.length);
        const [/*imanId*/, fromDia, fromBloque] = payload.split('|') as [string, Dia, Bloque];
        const [toDia, toBloque] = overId.split('|') as [Dia, Bloque];
        const { ok, reason } = moverIman(fromDia, fromBloque, toDia, toBloque);
        setMensaje(ok ? null : reason ?? null);
    };

    // gridTemplateColumns remains dynamic, other visual styles come from CSS module

    return (
        <div>
            <h2 className={tstyles.title}>Pizarra de horarios</h2>

            {mensaje && (
                <div className={tstyles.message}>{mensaje}</div>
            )}

        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                {/* Bandeja de imanes con módulos restantes */}
                <section className={tstyles.bandejaSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className={tstyles.bandejaTitle}>Imanes disponibles</h3>
                        <div>
                            <button onClick={() => setShowCreate(s => !s)} style={{ marginRight: 8 }}>{showCreate ? 'Cancelar' : 'Nuevo imán'}</button>
                        </div>
                    </div>

                    {showCreate && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                            <input placeholder="Materia" value={newMateria} onChange={e => setNewMateria(e.target.value)} style={{ padding: 6 }} />
                            <input placeholder="Docente" value={newDocente} onChange={e => setNewDocente(e.target.value)} style={{ padding: 6 }} />
                            <input placeholder="Módulos" value={newModulos} onChange={e => setNewModulos(e.target.value)} style={{ width: 72, padding: 6 }} />
                            <select value={newRol} onChange={e => setNewRol(e.target.value as any)} style={{ padding: 6 }}>
                                <option value="Titular">Titular</option>
                                <option value="Provisional">Provisional</option>
                                <option value="Suplente">Suplente</option>
                            </select>
                            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} title="Color" style={{ width: 44, height: 36, border: 'none', padding: 0 }} />
                            <button onClick={() => {
                                if (!newMateria.trim()) { setMensaje('La materia no puede estar vacía'); return; }
                                const id = addIman({ materia: newMateria.trim(), docente: newDocente.trim() || '---', rol: newRol, modulos: Number(newModulos) || 1, color: newColor });
                                setMensaje(`Imán creado (${id})`);
                                setNewMateria(''); setNewDocente(''); setNewModulos('1'); setShowCreate(false);
                            }}>Agregar</button>
                        </div>
                    )}

                    <div className={tstyles.bandejaList}>
                        {bandeja.map((iman) => (
                            <Iman key={iman.id} iman={iman} restantes={restantesDe(iman.id)} draggable />
                        ))}
                    </div>
                </section>

                {/* Grilla Días × Bloques */}
                <div className={tstyles.grid} style={{ gridTemplateColumns: `120px repeat(${DIAS.length}, 1fr)` }}>
                    {/* Header */}
                    <div className={tstyles.headerCell}>{ANIO_LABEL}</div>
                    {DIAS.map((d) => (
                        <div key={d} className={tstyles.headerCell}>
                            {d}
                        </div>
                    ))}

                    {/* Filas */}
                    {BLOQUES.map((b) => (
                        <div key={`fila-${b}`} className={tstyles.rowContents}>
                            <div className={tstyles.rowHeader}>{b}</div>
                            {DIAS.map((d) => {
                                const pos = posiciones.find((p) => p.dia === d && p.bloque === b);
                                const iman = pos ? imanes.find((i) => i.id === pos.imanId) : undefined;
                                return (
                                    <Celda key={`${d}-${b}`} dia={d} bloque={b}>
                                        {iman && (
                                            <>
                                            <Iman
                                                iman={iman}
                                                restantes={restantesDe(iman.id)}
                                                draggable
                                                dragId={`placed:${iman.id}|${d}|${b}`}
                                            />
                                           <button onClick={() => removerImanEn(d as Dia, b as Bloque)} title="Quitar" className={tstyles.removeBtn}>×</button>
                                            </>
                                        )}
                                    </Celda>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <DragOverlay dropAnimation={null}>
                {activeIman ? (
                    <div className={tstyles.dragOverlay}>
                        <Iman iman={activeIman} restantes={restantesDe(activeIman.id)} />
                    </div>
                ) : null}
            </DragOverlay>
            </DndContext>
        </div>
    );
}
