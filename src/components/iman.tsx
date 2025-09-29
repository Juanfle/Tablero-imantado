import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Iman as ImanType } from '../types';

interface BaseProps {
  iman: ImanType;
  restantes?: number;
  dragId?: string;
}
interface DraggableProps extends BaseProps {}

function ImanContent({ iman, restantes }: BaseProps) {
  return (
    <>
      <strong>{iman.materia}</strong> — {iman.docente} <em>({iman.rol})</em>
      {typeof restantes === 'number' && (
        <span
          title="Módulos restantes"
          style={{
            marginLeft: 6,
            fontSize: 12,
            background: '#111827',
            color: '#fff',
            borderRadius: 999,
            padding: '2px 6px',
            lineHeight: 1,
          }}
        >
          {restantes}
        </span>
      )}
    </>
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
    display: 'inline-flex',
    gap: 8,
    alignItems: 'center',
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
    display: 'inline-flex',
    gap: 8,
    alignItems: 'center',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <ImanContent iman={iman} restantes={restantes} />
    </div>
  );
}

export default function Iman(props: BaseProps & { draggable?: boolean }) {
  return props.draggable ? <DraggableIman {...props} /> : <ImanStatic {...props} />;
}