import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Iman as ImanType } from '../types';


interface Props {
    iman: ImanType;
}


export default function Iman({ iman }: Props) {
        const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: iman.id });


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
        border: '1px solid rgba(0,0,0,0.08)'
    };


    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <strong>{iman.materia}</strong> — {iman.docente} <em>({iman.rol})</em>
        </div>
    );
}