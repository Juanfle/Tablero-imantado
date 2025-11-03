import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
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
import type { Dia, Bloque, Iman as ImanModel, Anio } from '../types';
import { useTableroStore } from '../store/useTableroStore';
import Iman, { ImanEditor } from './iman';

function Celda({
    anio,
    dia,
    bloque,
    children,
}: {
    anio: Anio;
    dia: Dia;
    bloque: Bloque;
    children?: React.ReactNode;
}) {
    const id = `${anio}|${dia}|${bloque}`;
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

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const [activeIman, setActiveIman] = useState<ImanModel | null>(null);
    const [showCreateAnio, setShowCreateAnio] = useState<Anio | null>(null);

    const ANIOS: Anio[] = [1, 2, 3, 4, 5, 6];

    const onDragStart = (e: DragStartEvent) => {
        const activeId = String(e.active.id);
        let imanId: string;
        if (activeId.startsWith('placed:')) {
            const payload = activeId.slice('placed:'.length); // payload: imanId|anio|dia|bloque
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

        // overId format: `${anio}|${dia}|${bloque}`
        const [anioStr, toDia, toBloque] = overId.split('|') as [string, Dia, Bloque];
        const toAnio = Number(anioStr) as Anio;

        if (!activeId.startsWith('placed:')) {
            // placing from bandeja -> pass target anio
            const { ok, reason } = ubicarIman(activeId, toDia, toBloque, toAnio);
            setMensaje(ok ? null : reason ?? null);
            return;
        }

        // moving existing placed item. payload: imanId|anio|fromDia|fromBloque
        const payload = activeId.slice('placed:'.length);
    const [, fromAnioStr, fromDia, fromBloque] = payload.split('|') as [string, string, Dia, Bloque];
        const fromAnio = Number(fromAnioStr) as Anio;

        // disallow cross-year move: fromAnio must equal toAnio
        if (fromAnio !== toAnio) {
            setMensaje('No se puede mover un imán entre años distintos');
            return;
        }

        const { ok, reason } = moverIman(fromDia, fromBloque, toDia, toBloque, toAnio);
        setMensaje(ok ? null : reason ?? null);
    };

    const printRef = useRef<HTMLDivElement | null>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Horarios',
        copyStyles: true,
    });

    const printViaTemporaryWrapper = () => {
        const content = printRef.current;
        if (!content) {
            window.print();
            return;
        }

        // create wrapper and style that hides everything except the wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'temp-print-wrapper';
        wrapper.setAttribute('data-temp-print', '1');
        wrapper.appendChild(content.cloneNode(true));

        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-temp-print-style', '1');
        styleEl.textContent = `
            body > *:not(.temp-print-wrapper) { display: none !important; }
            .temp-print-wrapper { display: block !important; }
            @page { size: A4 landscape; margin: 8mm; }
        `;

        document.head.appendChild(styleEl);
        document.body.appendChild(wrapper);

        // give browser a tick to render the new DOM
        setTimeout(() => {
            try {
                window.print();
            } finally {
                // cleanup after a short delay to ensure print dialog has captured content
                setTimeout(() => {
                    try { wrapper.remove(); } catch (e) {}
                    try { styleEl.remove(); } catch (e) {}
                }, 500);
            }
        }, 60);
    };

    return (
        <div className={tstyles.appRoot}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={tstyles.title}>Pizarras por año</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            // show a short UI hint so we know the click fired
                            setMensaje('Abriendo diálogo de impresión...');
                            try {
                                // prefer react-to-print, but for Edge use the wrapper fallback
                                const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                                const isEdge = ua.includes('Edg') || ua.includes('Edge');
                                if (isEdge) {
                                    printViaTemporaryWrapper();
                                } else if (typeof handlePrint === 'function') {
                                    handlePrint();
                                } else {
                                    window.print();
                                }
                            } catch (err) {
                                window.print();
                            }
                            // clear hint after a short delay
                            setTimeout(() => setMensaje(null), 2000);
                        }}
                        className={tstyles.noPrint}
                    >Imprimir todos</button>
                    
                </div>
            </div>

            {mensaje && (
                <div className={tstyles.message}>{mensaje}</div>
            )}

            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                {ANIOS.map((anio) => {
                    const imanesForYear = imanes.filter(i => (i.anio ?? 3) === anio);
                    const posicionesForYear = posiciones.filter(p => p.anio === anio);

                    const usadosMap = new Map<string, number>();
                    posicionesForYear.forEach((p) => usadosMap.set(p.imanId, (usadosMap.get(p.imanId) ?? 0) + 1));

                    const restantesDe = (imanId: string) => {
                        const iman = imanesForYear.find(i => i.id === imanId) ?? imanes.find(i => i.id === imanId);
                        if (!iman) return 0;
                        const usados = usadosMap.get(imanId) ?? 0;
                        return Math.max(iman.modulos - usados, 0);
                    };

                    return (
                        <section key={`anio-${anio}`} style={{ marginBottom: 28 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <h3 className={tstyles.bandejaTitle}>{anio}° año</h3>
                                <div>
                                    <button onClick={() => setShowCreateAnio(s => s === anio ? null : anio)} style={{ marginRight: 8 }}>{showCreateAnio === anio ? 'Cancelar' : 'Crear imán'}</button>
                                </div>
                            </div>

                            <div className={tstyles.bandejaList} style={{ marginBottom: 8 }}>
                                {imanesForYear.filter(i => restantesDe(i.id) > 0).map((iman) => (
                                    <Iman key={iman.id} iman={iman} restantes={restantesDe(iman.id)} draggable />
                                ))}
                            </div>

                            {showCreateAnio === anio && (
                                <div className={tstyles.createBackdrop} onMouseDown={() => setShowCreateAnio(null)}>
                                    <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className={tstyles.modal}>
                                        <ImanEditor
                                            isNew
                                            onCancel={() => setShowCreateAnio(null)}
                                            onCreate={(data) => {
                                                // caller provides data without `anio` — add it here
                                                const id = addIman({ ...data, anio });
                                                setMensaje(`Imán creado (${id})`);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={tstyles.grid} style={{ gridTemplateColumns: `120px repeat(${DIAS.length}, 1fr)`, marginTop: 8 }}>
                                <div className={tstyles.headerCell}>{`${anio}°`}</div>
                                {DIAS.map((d) => (
                                    <div key={`${anio}-${d}`} className={tstyles.headerCell}>
                                        {d}
                                    </div>
                                ))}

                                {BLOQUES.map((b) => (
                                    <>
                                        <div key={`fila-${anio}-${b}`} className={tstyles.rowContents}>
                                            <div className={tstyles.rowHeader}>{b}</div>
                                            {DIAS.map((d) => {
                                                const pos = posicionesForYear.find((p) => p.dia === d && p.bloque === b && p.anio === anio);
                                                const iman = pos ? imanesForYear.find((i) => i.id === pos.imanId) : undefined;
                                                return (
                                                    <Celda key={`${anio}-${d}-${b}`} anio={anio} dia={d} bloque={b}>
                                                        {iman && (
                                                            <>
                                                                <Iman
                                                                    iman={iman}
                                                                    restantes={restantesDe(iman.id)}
                                                                    draggable
                                                                    dragId={`placed:${iman.id}|${anio}|${d}|${b}`}
                                                                />
                                                                <button onClick={() => removerImanEn(d as Dia, b as Bloque, anio)} title="Quitar" className={tstyles.removeBtn}>×</button>
                                                            </>
                                                        )}
                                                    </Celda>
                                                );
                                            })}
                                        </div>
                                        {b === '10:50 a 11:50' && (
                                            <div key={`sep-${anio}-${b}`} className={tstyles.separator} aria-hidden="true">COMEDOR</div>
                                        )}
                                    </>
                                ))}
                            </div>
                        </section>
                    );
                })}

                <DragOverlay dropAnimation={null}>
                    {activeIman ? (
                        <div className={tstyles.dragOverlay}>
                            <Iman iman={activeIman} restantes={0} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* print-only area: one table per page (monochrome). Hidden on screen, visible on print via CSS */}
            <div ref={printRef} className={tstyles.printArea} aria-hidden="true">
                {ANIOS.map((anio) => {
                    const imanesForYear = imanes.filter(i => (i.anio ?? 3) === anio);
                    const posicionesForYear = posiciones.filter(p => p.anio === anio);
                    return (
                        <div key={`print-${anio}`} className={tstyles.printPage}>
                            <div className={tstyles.printHeader}>{`${anio}° año`}</div>
                            <table className={tstyles.printTable}>
                                <thead>
                                    <tr>
                                        <th className={tstyles.printBloc}></th>
                                        {DIAS.map(d => (<th key={`h-${anio}-${d}`}>{d}</th>))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {BLOQUES.map(b => (
                                        <tr key={`r-${anio}-${b}`}>
                                            <td className={tstyles.printBloc}>{b}</td>
                                            {DIAS.map(d => {
                                                const pos = posicionesForYear.find(p => p.dia === d && p.bloque === b);
                                                const iman = pos ? imanesForYear.find(i => i.id === pos.imanId) : undefined;
                                                if (!iman) return <td key={`${anio}-${b}-${d}`}><div className="printCellInner"></div></td>;
                                                const teacher = iman.docente2 && iman.rol2 === 'Sup' ? iman.docente2 : iman.docente;
                                                return (
                                                    <td key={`${anio}-${b}-${d}`}>
                                                        <div className="printCellInner">
                                                            <div className="printSubject"><strong>{iman.materia}</strong></div>
                                                            <div className="printTeacher">{teacher}</div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
