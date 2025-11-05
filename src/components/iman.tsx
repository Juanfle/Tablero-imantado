import { useState } from 'react';
import styles from './Iman.module.css';
import { useDraggable } from '@dnd-kit/core';
import type { Iman as ImanType } from '../types';
import { useTableroStore } from '../store/useTableroStore';

// Editor sencillo embebido para editar un imán
export function ImanEditor({ iman, onCancel, isNew, onCreate }: { iman?: ImanType; onCancel: () => void; isNew?: boolean; onCreate?: (data: Omit<ImanType, 'id' | 'anio'>) => void }) {
    const updateIman = useTableroStore(s => s.updateIman);
    const [materia, setMateria] = useState(iman?.materia ?? '');
    const [docente, setDocente] = useState(iman?.docente ?? '');
    const [rol, setRol] = useState<ImanType['rol']>(iman?.rol ?? 'Tit');
    const [docente2, setDocente2] = useState(iman?.docente2 ?? '');
    const [modulos, setModulos] = useState(String(iman?.modulos ?? 1));
    const [color, setColor] = useState(iman?.color ?? '#FDE68A');

    // Paleta de colores pastel
    const PALETTE = [
        '#FDE68A', // amarillo pastel
        '#FBCFE8', // rosa pastel
        '#C7F9CC', // verde pastel
        '#BFDBFE', // celeste pastel
        '#FECACA', // salmón claro
        '#E6E6FA', // lavanda
        '#FFE7C7', // durazno claro
        '#D1FAE5', // verde suave
        '#FFD6E8', // rosa bebé
        '#B5EAD7', // verde menta fría
        '#FFDFBA', // durazno pastel más cálido
        '#C6E2FF', // azul cielo pálido
        '#E0BBE4', // violeta suave medio
        '#F9E2AF', // amarillo crema
        '#D7E3FC', // azul lavanda claro
        '#E2F0CB'  // verde lima apagado
    ];

    const save = () => {
        const patch: Partial<ImanType> = {
            materia: materia.trim(),
            docente: docente.trim(),
            // primary role must be Tit or Prov
            rol,
            // If there's a secondary teacher, it is always a Suplente
            docente2: docente2.trim() ? docente2.trim() : undefined,
            rol2: docente2.trim() ? 'Sup' : undefined,
            modulos: Number(modulos) || 0,
            color: color || undefined,
        };
        if (isNew && onCreate) {
            const data: Omit<ImanType, 'id' | 'anio'> = {
                materia: patch.materia ?? '',
                docente: patch.docente ?? '',
                rol: (patch.rol as ImanType['rol']) ?? 'Tit',
                docente2: patch.docente2,
                rol2: patch.rol2,
                modulos: patch.modulos ?? 1,
                color: patch.color,
            };
            onCreate(data);
            onCancel();
            return;
        }

        if (iman) {
            updateIman(iman.id, patch);
        }
        onCancel();
    };

    return (
        <div className={styles.editor}>
            <div className={styles.formGrid}>
                <div>
                    <label className={styles.label}>Materia</label>
                    <input className={styles.input} value={materia} onChange={e => setMateria(e.target.value)} placeholder="Materia" />
                </div>

                <div>
                    <label className={styles.label}>Módulos</label>
                    <input className={styles.input} value={modulos} onChange={e => setModulos(e.target.value)} placeholder="Módulos" />
                </div>

                <div>
                    <label className={styles.label}>Docente</label>
                    <input className={styles.input} value={docente} onChange={e => setDocente(e.target.value)} placeholder="Docente" />
                </div>

                <div>
                    <label className={styles.label}>Situación de revista</label>
                    {/* primary role: only Tit or Prov */}
                    <select className={styles.input} value={rol} onChange={e => setRol(e.target.value as ImanType['rol'])}>
                        <option value="Tit">Titular</option>
                        <option value="Prov">Provisional</option>
                    </select>
                </div>
            </div>

            <hr className={styles.hr} />

            <div className={styles.singleColumn}>
                <label className={styles.label}>Suplente (opcional)</label>
                <input className={styles.input} value={docente2} onChange={e => setDocente2(e.target.value)} placeholder="Sup (opcional)" />
            </div>

            {/* Palette */}
            <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={styles.paletteLabel}>Color:</div>
                    <div className={styles.palette}>
                        {PALETTE.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`${styles.swatch} ${color === c ? styles.swatchSelected : ''}`}
                                onClick={() => setColor(c)}
                                style={{ background: c }}
                                aria-label={`Seleccionar color ${c}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

                <div className={styles.actions}>
                    <button onClick={save} className={`${styles.btn} ${styles.btnPrimary}`}>Guardar</button>
                    <button onClick={onCancel} className={`${styles.btn} ${styles.btnOutline}`}>Cancelar</button>
                </div>
        </div>
    );
}

interface BaseProps {
    iman: ImanType;
    restantes?: number;
    dragId?: string;
}
interface DraggableProps extends BaseProps {}

function ImanContent({ iman, restantes }: BaseProps) {
    // Compact display: if there's a secondary teacher with role 'Suplente',
    // show the suplente only in the compact label. Otherwise show the primary teacher (as before).
    const showSuplenteCompact = !!(iman.docente2 && iman.rol2 === 'Sup');
    const teacherName = showSuplenteCompact ? iman.docente2! : iman.docente;
    const teacherRole = showSuplenteCompact ? iman.rol2 : iman.rol;

    const TRUNCATE_LEN = 12; // configurable: número máximo de caracteres para mostrar en la vista compacta
    const truncate = (s: string, n = TRUNCATE_LEN) => (s.length > n ? s.slice(0, n).trimEnd() + '...' : s);
    const displayMateria = truncate(iman.materia, TRUNCATE_LEN);
    const displayTeacher = truncate(teacherName, TRUNCATE_LEN);

    return (
        <>
            <strong title={iman.materia}>{displayMateria}</strong> — <span title={teacherName}>{displayTeacher}</span> <em>({teacherRole})</em>
            {typeof restantes === 'number' && (
                <span title="Módulos restantes" className={styles.restantes}>{restantes}</span>
            )}
        </>
    );
}

function ExpandedImanView({ iman, onEdit, onClose, onDelete, disableClose }: { iman: ImanType; restantes?: number; onEdit: () => void; onClose: () => void; onDelete?: () => void; disableClose?: boolean }) {
    return (
        <div className={styles.expandedInner}>
            <div className={styles.expandedHeader}>
                {/* trash icon button on the left */}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className={styles.trashButton}
                        aria-label="Eliminar imán"
                        title="Eliminar"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                <div style={{ flex: 1 }}>
                    <strong className={styles.title}>{iman.materia}</strong>
                    <div className={styles.meta}>{iman.docente} <em>({iman.rol})</em></div>
                    {iman.docente2 && (
                        <div className={styles.metaSecondary}>+ {iman.docente2} <em>({iman.rol2})</em></div>
                    )}
                </div>
                <div className={styles.actions}>
                    <button onClick={onEdit} className={`${styles.btn} ${styles.btnPrimary}`}>Editar</button>
                    <button disabled={disableClose} onClick={onClose} className={`${styles.btn} ${styles.btnOutline}`} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>{disableClose ? 'Cerrar (bloqueado)' : 'Cerrar'}</button>
                </div>
            </div>
            <div className={styles.modules}>Módulos: {iman.modulos}</div>
        </div>
    );
}

export function ImanStatic({ iman, restantes }: BaseProps) {
    return <div className={styles.iman} style={{ ['--bg' as any]: iman.color ?? '#e5e7eb' }}><ImanContent iman={iman} restantes={restantes} /></div>;
}

function DraggableIman({ iman, restantes, dragId }: DraggableProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId ?? iman.id });
    const transformStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    const overlayStyle = {
        zIndex: isDragging ? 9999 : 1,
        boxShadow: isDragging ? '0 6px 20px rgba(0,0,0,0.2)' : undefined,
        cursor: 'grab',
        opacity: isDragging ? 0 : 1,
    } as React.CSSProperties;

    return (
        <div ref={setNodeRef} style={{ ...transformStyle, ...overlayStyle, ['--bg' as any]: iman.color ?? '#e5e7eb' }} className={styles.iman} {...listeners} {...attributes}>
            <ImanContent iman={iman} restantes={restantes} />
        </div>
    );
}

export default function Iman(props: BaseProps & { draggable?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const deleteIman = useTableroStore(s => s.deleteIman);
    // evitar que el editor abra el drag; abrimos la vista expandida con doble-click
    const content = props.draggable ? <DraggableIman {...props} /> : <ImanStatic {...props} />;

    const handleDelete = () => {
        if (!props.iman) return;
        const ok = window.confirm(`Eliminar imán "${props.iman.materia}"? Esta acción quitará el imán y todas sus ubicaciones.`);
        if (!ok) return;
        deleteIman(props.iman.id);
        setExpanded(false);
        setEditing(false);
    };

    // Render compact label; on double-click open centered modal.
    return (
        <>
            <div className={styles.root} onDoubleClick={() => setExpanded(true)}>{content}</div>

            {(expanded || editing) && (
                // Backdrop covers full viewport. If editing is true, clicking backdrop does nothing.
                <div className={styles.backdrop} onMouseDown={() => { if (!editing) setExpanded(false); }}>
                    <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className={styles.modal}>
                        {editing ? (
                            // When the editor closes, also close the expanded preview for smoother UX
                            <ImanEditor iman={props.iman} onCancel={() => { setEditing(false); setExpanded(false); }} />
                        ) : (
                            <ExpandedImanView iman={props.iman} restantes={props.restantes} onEdit={() => setEditing(true)} onClose={() => { if (!editing) setExpanded(false); }} onDelete={handleDelete} disableClose={editing} />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}