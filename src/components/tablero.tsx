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
import Iman, { ImanEditor } from './iman';

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
    // Estados para crear nuevo imán (usaremos modal con ImanEditor)
    const [showCreate, setShowCreate] = useState(false);

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

                    <div className={tstyles.bandejaList}>
                        {bandeja.map((iman) => (
                            <Iman key={iman.id} iman={iman} restantes={restantesDe(iman.id)} draggable />
                        ))}
                    </div>
                </section>

                {/* When showCreate is true, open the shared editor modal to create a new iman */}
                {showCreate && (
                    <div className={tstyles.createBackdrop} onMouseDown={() => setShowCreate(false)}>
                        <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className={tstyles.modal}>
                            <ImanEditor
                                isNew
                                onCancel={() => setShowCreate(false)}
                                onCreate={(data) => {
                                    const id = addIman(data);
                                    setMensaje(`Imán creado (${id})`);
                                }}
                            />
                        </div>
                    </div>
                )}

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
                        <>
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
                        {/* insert separator after the 4th bloque (index 3) to mark comedor between 10:50-11:50 and 12:00-13:00 */}
                        {b === '10:50 a 11:50' && (
                            <div key={`sep-${b}`} className={tstyles.separator} aria-hidden="true">COMEDOR</div>
                        )}
                        </>
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
