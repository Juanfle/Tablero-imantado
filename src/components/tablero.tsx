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
    const { imanes, posiciones, ubicarIman, removerImanEn, moverIman } = useTableroStore();
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

    const onDragStart = (e: DragStartEvent) => {
        const activeId = String(e.active.id);
        const imanId = activeId.startsWith('placed:')
            ? activeId.split(':')[1].split('|')[0]
            : activeId;

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

        const [, payload] = activeId.split(':');
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
                    <h3 className={tstyles.bandejaTitle}>Imanes disponibles</h3>
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
