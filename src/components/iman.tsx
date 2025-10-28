import type { CSSProperties } from 'react';
import { useState } from 'react';
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
        };
        updateIman(iman.id, patch);
        onCancel();
    };

    const inputStyle: CSSProperties = { width: '100%', padding: '8px 10px', marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' };

    return (
        <div style={{ padding: 16, width: 480 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10 }}>
                <input style={{ gridColumn: '1 / span 1', ...inputStyle }} value={materia} onChange={e => setMateria(e.target.value)} placeholder="Materia" />
                <input style={{ gridColumn: '2 / span 1', ...inputStyle }} value={modulos} onChange={e => setModulos(e.target.value)} placeholder="Módulos" />
                <input style={{ gridColumn: '1 / span 1', ...inputStyle }} value={docente} onChange={e => setDocente(e.target.value)} placeholder="Docente principal" />
                {/* primary role: only Titular or Provisional */}
                <select style={{ gridColumn: '2 / span 1', padding: '8px', borderRadius: 6, border: '1px solid #ddd' }} value={rol} onChange={e => setRol(e.target.value as ImanType['rol'])}>
                    <option value="Titular">Titular</option>
                    <option value="Provisional">Provisional</option>
                </select>
            </div>

            <hr style={{ margin: '12px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <input style={inputStyle} value={docente2} onChange={e => setDocente2(e.target.value)} placeholder="Suplente (opcional)" />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={save} style={{ flex: 1, padding: '10px 12px' }}>Guardar</button>
                <button onClick={onCancel} style={{ flex: 1, padding: '10px 12px' }}>Cancelar</button>
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
                <span
                    title="Módulos restantes"
                    style={{
                        marginLeft: 6,
                        fontSize: 12,
                        color: 'black',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        lineHeight: 1,
                    }}
                >
                    {restantes}
                </span>
            )}
        </>
    );
}

function ExpandedImanView({ iman, onEdit, onClose, disableClose }: { iman: ImanType; restantes?: number; onEdit: () => void; onClose: () => void; disableClose?: boolean }) {
    return (
        <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                    <strong style={{ fontSize: 16 }}>{iman.materia}</strong>
                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.7)' }}>{iman.docente} <em>({iman.rol})</em></div>
                    {iman.docente2 && (
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>+ {iman.docente2} <em>({iman.rol2})</em></div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onEdit} style={{ padding: '6px 10px' }}>Editar</button>
                    <button disabled={disableClose} onClick={onClose} style={{ padding: '6px 10px', opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>{disableClose ? 'Cerrar (bloqueado)' : 'Cerrar'}</button>
                </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>Módulos: {iman.modulos}</div>
        </div>
    );
}

export function ImanStatic({ iman, restantes }: BaseProps) {
    const style: CSSProperties = {
        padding: '8px 10px',
        borderRadius: 10,
        background: iman.color ?? '#e5e7eb',
        color: '#111827',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        userSelect: 'none',
        fontSize: 14,
        lineHeight: 1.1,
        border: '1px solid rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 1,
        gap: 8,
        alignItems: 'center',
        maxWidth: '100%',               // no se pasa del ancho de la celda
        overflow: 'hidden',             // corta exceso
        textOverflow: 'ellipsis',       // agrega “…” si no entra
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        whiteSpace: 'normal',
    };
    return <div style={style}><ImanContent iman={iman} restantes={restantes} /></div>;
}

function DraggableIman({ iman, restantes, dragId }: DraggableProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId ?? iman.id });

    const style: CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: 'grab',
        padding: '8px 10px',
        borderRadius: 10,
        background: iman.color ?? '#e5e7eb',
        color: '#111827',
        boxShadow: isDragging ? '0 6px 20px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.12)',
        userSelect: 'none',
        fontSize: 14,
        lineHeight: 1.1,
        border: '1px solid rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: isDragging ? 9999 : 1,
        gap: 8,
        alignItems: 'center',
        maxWidth: '100%',               // no se pasa del ancho de la celda
        overflow: 'hidden',             // corta exceso
        textOverflow: 'ellipsis',       // agrega “…” si no entra
        display: '-webkit-box',
        WebkitLineClamp: 2, 
        WebkitBoxOrient: 'vertical',
        whiteSpace: 'normal',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <ImanContent iman={iman} restantes={restantes} />
        </div>
    );
}

export default function Iman(props: BaseProps & { draggable?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    // evitar que el editor abra el drag; abrimos la vista expandida con doble-click
    const content = props.draggable ? <DraggableIman {...props} /> : <ImanStatic {...props} />;

    // Render compact label; on double-click open centered modal.
    return (
        <>
            <div style={{ position: 'relative' }} onDoubleClick={() => setExpanded(true)}>{content}</div>

            {(expanded || editing) && (
                // Backdrop covers full viewport. If editing is true, clicking backdrop does nothing.
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={() => { if (!editing) setExpanded(false); }}>
                    <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: 520, maxWidth: '92%', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
                        {editing ? (
                            // When the editor closes, also close the expanded preview for smoother UX
                            <ImanEditor iman={props.iman} onCancel={() => { setEditing(false); setExpanded(false); }} />
                        ) : (
                            <ExpandedImanView iman={props.iman} restantes={props.restantes} onEdit={() => setEditing(true)} onClose={() => { if (!editing) setExpanded(false); }} disableClose={editing} />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}