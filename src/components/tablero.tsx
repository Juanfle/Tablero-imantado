import type { CSSProperties } from 'react';
import { useState } from 'react';
import{
    DndContext,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { BLOQUES, DIAS } from '../data';
import type { Dia, Bloque } from '../types';
import { useTableroStore } from '../store/useTableroStore';
import Iman from './iman';

function Celda({ dia, bloque, children }: { dia: Dia; bloque: Bloque; children?: React.ReactNode }) {
  const id = `${dia}|${bloque}`;
  const { setNodeRef, isOver } = useDroppable({ id });

  const style: CSSProperties = {
    minHeight: 86,
    border: '1px solid #e5e7eb',
    background: isOver ? '#fef3c7' : '#fff',
    padding: 8,
    position: 'relative',
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
  const { imanes, posiciones, ubicarIman, removerIman } = useTableroStore();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const imanId = String(e.active.id);
    const overId = e.over?.id as string | undefined;
    if (!overId) return;

    const [dia, bloque] = overId.split('|') as [Dia, Bloque];
    const { ok, reason } = ubicarIman(imanId, dia, bloque);
    setMensaje(ok ? null : reason ?? null);
  };

  const imanesUbicados = new Map<string, string>();
  posiciones.forEach((p) => imanesUbicados.set(p.imanId, `${p.dia}|${p.bloque}`));
  const bandeja = imanes.filter((i) => !imanesUbicados.has(i.id));

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

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {/* Bandeja */}
        <section style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '10px 0' }}>Imanes disponibles</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {bandeja.map((iman) => (
              <Iman key={iman.id} iman={iman} />
            ))}
          </div>
        </section>

        {/* Grilla */}
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

          {/* Celdas */}
          {BLOQUES.map((b) => (
            <>
              <div
                key={`lbl-${b}`}
                style={{ background: '#f9fafb', padding: 10, fontWeight: 500 }}
              >
                {b}
              </div>
              {DIAS.map((d) => {
                const pos = posiciones.find((p) => p.dia === d && p.bloque === b);
                const iman = pos ? imanes.find((i) => i.id === pos.imanId) : undefined;
                return (
                  <Celda key={`${d}-${b}`} dia={d} bloque={b}>
                    {iman && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Iman iman={iman} />
                        <button
                          onClick={() => removerIman(iman.id)}
                          style={{
                            border: '1px solid #e5e7eb',
                            background: '#fff',
                            borderRadius: 8,
                            padding: '6px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </Celda>
                );
              })}
            </>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
