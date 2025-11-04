import { useState, useRef, useEffect } from 'react';
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
    const [showExportTeachers, setShowExportTeachers] = useState(false);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const [activeIman, setActiveIman] = useState<ImanModel | null>(null);
    const [showCreateAnio, setShowCreateAnio] = useState<Anio | null>(null);

    const ANIOS: Anio[] = [1, 2, 3, 4, 5, 6];
    const [search, setSearch] = useState('');
    const [trayOpen, setTrayOpen] = useState(true);

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

    // --- Teacher extraction & deduplication helpers -----------------
    const normalize = (s: string) => {
        return s
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const tokenSet = (s: string) => {
        const n = normalize(s);
        if (!n) return new Set<string>();
        return new Set(n.split(' ').filter(Boolean));
    };

    const jaccard = (a: Set<string>, b: Set<string>) => {
        if (a.size === 0 && b.size === 0) return 1;
        let inter = 0;
        a.forEach(x => { if (b.has(x)) inter++; });
        const uni = new Set([...a, ...b]).size;
        return uni === 0 ? 0 : inter / uni;
    };

    const isBlankName = (raw: string) => {
        const n = normalize(raw);
        if (!n) return true;
        const blacklist = ['nose','no se','n/a','sin','-','?','anonimo','desconocido'];
        return blacklist.includes(n);
    };

    const buildTeacherList = () => {
        // collect candidate names from imanes fields
        const candidates: string[] = [];
        imanes.forEach(i => {
            if (i.docente) candidates.push(i.docente);
            if (i.docente2) candidates.push(i.docente2);
        });

        // filter blanks
        const filtered = candidates.map(c => c?.trim()).filter(Boolean) as string[];

        // clustering using token Jaccard similarity
        const clusters: { reprTokens: Set<string>; names: string[] }[] = [];
        filtered.forEach(name => {
            if (isBlankName(name)) return;
            const toks = tokenSet(name);
            // try to find cluster with high similarity
            let placed = false;
            for (const cl of clusters) {
                const sim = jaccard(cl.reprTokens, toks);
                if (sim >= 0.75) {
                    cl.names.push(name);
                    // merge token sets
                    toks.forEach(t => cl.reprTokens.add(t));
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                clusters.push({ reprTokens: toks, names: [name] });
            }
        });

        // choose canonical name per cluster (longest, or most tokens)
        const canonical = clusters.map(cl => {
            const uniq = Array.from(new Set(cl.names));
            uniq.sort((a, b) => {
                const ta = tokenSet(a).size; const tb = tokenSet(b).size;
                if (ta !== tb) return tb - ta; // prefer more tokens
                return b.length - a.length; // then longer
            });
            return uniq[0];
        });

        canonical.sort((a, b) => a.localeCompare(b));
        return canonical;
    };

    const copyTeachersToClipboard = async () => {
        const list = buildTeacherList();
        const text = list.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setMensaje('Lista copiada al portapapeles');
        } catch (err) {
            setMensaje('No se pudo copiar; copiala manualmente');
        }
        setTimeout(() => setMensaje(null), 2000);
    };

    // Listen for global events dispatched from the header (App) to trigger print/export
    useEffect(() => {
        const onOpen = () => setShowExportTeachers(true);
        const onPrint = () => {
            setMensaje('Abriendo diálogo de impresión...');
            try {
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
            setTimeout(() => setMensaje(null), 2000);
        };

        const onToggle = () => setTrayOpen(s => !s);

        window.addEventListener('openExportTeachers', onOpen as EventListener);
        window.addEventListener('triggerPrint', onPrint as EventListener);
        window.addEventListener('toggleTray', onToggle as EventListener);
        return () => {
            window.removeEventListener('openExportTeachers', onOpen as EventListener);
            window.removeEventListener('triggerPrint', onPrint as EventListener);
            window.removeEventListener('toggleTray', onToggle as EventListener);
        };
    }, []);

    // group imanes by year for the left tray
    const grouped = new Map<Anio, ImanModel[]>();
    ANIOS.forEach(a => grouped.set(a, []));
    imanes.forEach(i => grouped.get((i.anio ?? 3) as Anio)?.push(i));

    const matchesSearch = (i: ImanModel) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (i.materia?.toLowerCase().includes(s) || (i.docente ?? '').toLowerCase().includes(s) || (i.docente2 ?? '').toLowerCase().includes(s));
    };

    return (
        <div className={tstyles.appRoot}>
            {mensaje && <div className={tstyles.message}>{mensaje}</div>}

            <div className={tstyles.layout}>
                <aside className={`${tstyles.leftTray} ${trayOpen ? '' : tstyles.leftTrayCollapsed}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <input className={tstyles.searchInput} placeholder="Buscar materia o docente" value={search} onChange={e => setSearch(e.target.value)} />
                        <button title={trayOpen ? 'Cerrar bandeja' : 'Abrir bandeja'} onClick={() => setTrayOpen(s => !s)} className={tstyles.trayToggle} style={{ marginLeft: 8 }}>
                            {trayOpen ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {ANIOS.map(anio => {
                        const list = (grouped.get(anio) ?? []).filter(i => matchesSearch(i));
                        if (list.length === 0) return (
                            <div key={`tray-empty-${anio}`} className={tstyles.trayGroup}>
                                <div className={tstyles.trayGroupTitle}>{anio}° año</div>
                                <div style={{ color: '#6b7280', fontSize: 13 }}>No hay imanes</div>
                            </div>
                        );
                        return (
                            <div key={`tray-${anio}`} className={tstyles.trayGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className={tstyles.trayGroupTitle}>{anio}° año</div>
                                    <div>
                                        <button onClick={() => setShowCreateAnio(s => s === anio ? null : anio)} style={{ fontSize: 13 }}>{showCreateAnio === anio ? 'Cancelar' : 'Crear'}</button>
                                    </div>
                                </div>
                                <div className={tstyles.trayList}>
                                    {list.map(i => (
                                        <Iman key={i.id} iman={i} restantes={0} draggable />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {showCreateAnio && (
                        <div className={tstyles.createBackdrop} onMouseDown={() => setShowCreateAnio(null)}>
                            <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className={tstyles.modal}>
                                <ImanEditor
                                    isNew
                                    onCancel={() => setShowCreateAnio(null)}
                                    onCreate={(data) => {
                                        const id = addIman({ ...data, anio: showCreateAnio as Anio });
                                        setMensaje(`Imán creado (${id})`);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </aside>

                                <main className={`${tstyles.rightContent} ${trayOpen ? tstyles.mainShifted : tstyles.mainCentered}`}>
                                        <div className={tstyles.boardsContainer}>
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
                                    <div style={{ marginBottom: 8 }}>
                                        <h3 className={tstyles.bandejaTitle}>{anio}° año</h3>
                                    </div>

                                    <div className={tstyles.grid} style={{ gridTemplateColumns: `70px repeat(${DIAS.length}, 1fr)`, marginTop: 8 }}>
                                        <div className={tstyles.headerCell}>{`${anio}° año`}</div>
                                        {DIAS.map((d) => (
                                            <div key={`${anio}-${d}`} className={tstyles.headerCell}>
                                                {d}
                                            </div>
                                        ))}

                                        {BLOQUES.map((b) => (
                                            <>
                                                <div key={`fila-${anio}-${b}`} className={tstyles.rowContents}>
                                                    <div className={tstyles.rowHeader}>
                                                        {/* show start and end time stacked and centered */}
                                                        {(() => {
                                                            const parts = String(b).split(/\s*a\s*/);
                                                            if (parts.length >= 2) {
                                                                return (
                                                                    <>
                                                                        <div>{parts[0]}</div>
                                                                        <div>{parts[1]}</div>
                                                                    </>
                                                                );
                                                            }
                                                            return <div>{b}</div>;
                                                        })()}
                                                    </div>
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
                                        </div>

                    {showExportTeachers && (
                        <div className={tstyles.createBackdrop} onMouseDown={() => setShowExportTeachers(false)}>
                            <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className={tstyles.modal}>
                                <div style={{ padding: 12, maxWidth: 520 }}>
                                    <h3>Docentes (únicos)</h3>
                                    <div style={{ maxHeight: 320, overflow: 'auto', marginBottom: 12 }}>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{buildTeacherList().join('\n')}</pre>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button onClick={() => copyTeachersToClipboard()}>Copiar</button>
                                        <button onClick={() => setShowExportTeachers(false)}>Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                </main>
            </div>
        </div>
    );
}
