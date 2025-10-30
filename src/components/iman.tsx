import { useState } from 'react';
import styles from './Iman.module.css';
import { useDraggable } from '@dnd-kit/core';
import type { Iman as ImanType } from '../types';
import { useTableroStore } from '../store/useTableroStore';

// Editor sencillo embebido para editar un imán
function ImanEditor({ iman, onCancel }: { iman: ImanType; onCancel: () => void }) {
    const updateIman = useTableroStore(s => s.updateIman);
    const [materia, setMateria] = useState(iman.materia);
    const [docente, setDocente] = useState(iman.docente);
    const [rol, setRol] = useState<ImanType['rol']>(iman.rol);
    const [docente2, setDocente2] = useState(iman.docente2 ?? '');
    const [modulos, setModulos] = useState(String(iman.modulos));
    const [color, setColor] = useState(iman.color ?? '#FDE68A');

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
            // primary role must be Titular or Provisional
            rol,
            // If there's a secondary teacher, it is always a Suplente
            docente2: docente2.trim() ? docente2.trim() : undefined,
            rol2: docente2.trim() ? 'Suplente' : undefined,
            modulos: Number(modulos) || 0,
            color: color || undefined,
        };
        updateIman(iman.id, patch);
        onCancel();
    };

    return (
        <div className={styles.editor}>
            <div className={styles.formGrid}>
                <input className={styles.input} value={materia} onChange={e => setMateria(e.target.value)} placeholder="Materia" />
                <input className={styles.input} value={modulos} onChange={e => setModulos(e.target.value)} placeholder="Módulos" />
                <input className={styles.input} value={docente} onChange={e => setDocente(e.target.value)} placeholder="Docente principal" />
                {/* primary role: only Titular or Provisional */}
                <select className={styles.input} value={rol} onChange={e => setRol(e.target.value as ImanType['rol'])}>
                    <option value="Titular">Titular</option>
                    <option value="Provisional">Provisional</option>
                </select>
            </div>

            <hr className={styles.hr} />

            <div className={styles.singleColumn}>
                <input className={styles.input} value={docente2} onChange={e => setDocente2(e.target.value)} placeholder="Suplente (opcional)" />
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
                <button onClick={onCancel} className={`${styles.btn} ${styles.btnNeutral}`}>Cancelar</button>
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
    const showSuplenteCompact = !!(iman.docente2 && iman.rol2 === 'Suplente');
    const teacherName = showSuplenteCompact ? iman.docente2! : iman.docente;
    const teacherRole = showSuplenteCompact ? iman.rol2 : iman.rol;

    return (
        <>
            <strong>{iman.materia}</strong> — {teacherName} <em>({teacherRole})</em>
            {typeof restantes === 'number' && (
                <span title="Módulos restantes" className={styles.restantes}>{restantes}</span>
            )}
        </>
    );
}

function ExpandedImanView({ iman, onEdit, onClose, onDelete, disableClose }: { iman: ImanType; restantes?: number; onEdit: () => void; onClose: () => void; onDelete?: () => void; disableClose?: boolean }) {
    return (
        <div className={styles.expandedInner}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                    <strong className={styles.title}>{iman.materia}</strong>
                    <div className={styles.meta}>{iman.docente} <em>({iman.rol})</em></div>
                    {iman.docente2 && (
                        <div className={styles.metaSecondary}>+ {iman.docente2} <em>({iman.rol2})</em></div>
                    )}
                </div>
                <div className={styles.actions}>
                    <button onClick={onEdit} className={`${styles.btn} ${styles.btnPrimary}`}>Editar</button>
                    {onDelete && (
                        <button onClick={onDelete} className={`${styles.btn} ${styles.btnNeutral}`} style={{ background: '#fee2e2', color: '#991b1b' }}>Eliminar</button>
                    )}
                    <button disabled={disableClose} onClick={onClose} className={`${styles.btn} ${styles.btnNeutral}`} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>{disableClose ? 'Cerrar (bloqueado)' : 'Cerrar'}</button>
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