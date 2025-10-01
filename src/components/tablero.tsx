import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
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

    const CELL_HEIGHT = 86; // ajustá si querés

    const style: CSSProperties = {
        height: CELL_HEIGHT,          // <- altura fija
        border: '1px solid #e5e7eb',
        background: isOver ? '#fef3c7' : '#fff',
        padding: 8,
        position: 'relative',
        overflow: 'hidden',           // <- NO permite que el contenido la agrande
        display: 'flex',              // <- para centrar contenido
        alignItems: 'center'
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children}
            <div
                style={{
                    position: 'absolute',
                    right: 6,
                    bottom: 4,
                    fontSize: 10,
                    color: '#9ca3af',
                }}
            >
            {bloque}
            </div>
        </div>
    );
}

export default function Tablero() {
    const { imanes, posiciones, ubicarIman, removerImanEn, moverIman } = useTableroStore();
    const [mensaje, setMensaje] = useState<string | null>(null);

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

    const gridStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `120px repeat(${DIAS.length}, 1fr)`,
        gap: 0,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
    };

    return (
        <div>
            <h2 style={{ marginBottom: 10 }}>Pizarra de horarios</h2>

            {mensaje && (
                <div
                style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    padding: '8px 10px',
                    borderRadius: 8,
                    marginBottom: 10,
                }}
                >
                {mensaje}
                </div>
            )}

        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                {/* Bandeja de imanes con módulos restantes */}
                <section style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: '10px 0' }}>Imanes disponibles</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {bandeja.map((iman) => (
                            <Iman key={iman.id} iman={iman} restantes={restantesDe(iman.id)} draggable />
                        ))}
                    </div>
                </section>

                {/* Grilla Días × Bloques */}
                <div style={gridStyle}>
                    {/* Header */}
                    <div style={{ background: '#f9fafb', padding: 10, fontWeight: 600 }}>Bloque</div>
                    {DIAS.map((d) => (
                        <div
                        key={d}
                        style={{
                            background: '#f9fafb',
                            padding: 10,
                            fontWeight: 600,
                            textAlign: 'center',
                        }}
                        >
                        {d}
                        </div>
                    ))}

                    {/* Filas */}
                    {BLOQUES.map((b) => (
                        <div key={`fila-${b}`} style={{ display: 'contents' }}>
                            <div style={{ background: '#f9fafb', padding: 10, fontWeight: 500 }}>{b}</div>
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
                                           <button
                                            onClick={() => removerImanEn(d as Dia, b as Bloque)}
                                            title="Quitar"
                                            style={{
                                                position: 'absolute',
                                                top: 6,
                                                right: 6,
                                                width: 18,
                                                height: 18,
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#9ca3af', // gris clarito
                                                fontSize: 14,
                                                fontWeight: 'bold',
                                                lineHeight: '14px',
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                            >
                                            ×
                                            </button>
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
                    <div style={{ zIndex: 99999, pointerEvents: 'none' }}>
                        <Iman iman={activeIman} restantes={restantesDe(activeIman.id)} />
                    </div>
                ) : null}
            </DragOverlay>
            </DndContext>
        </div>
    );
}
