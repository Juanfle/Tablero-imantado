# 🧲 Tablero Imantado de Horarios

Una aplicación interactiva hecha en **React + TypeScript + Vite** que simula una **pizarra de horarios con imanes**, como las que se usan en escuelas para organizar clases, materias y docentes.  
Permite arrastrar bloques de docentes a una grilla de días y horas, detectar choques de horarios y guardar la configuración localmente.

---

## ✨ Funcionalidades

- ✅ Grilla de horarios (Días × Bloques horarios)
- ✅ "Imanes" con materia, docente y rol (titular, suplente, etc.)
- ✅ Drag & drop entre bandeja y grilla con `@dnd-kit`
- ✅ Validación de **choques de horario** por docente
- ✅ Guardado automático en `localStorage`
- ✅ Botón para exportar/importar como JSON
- ✅ Reset de posiciones rápido
- ✅ Visual moderno, adaptable

---

## 🛠️ Tecnologías

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [@dnd-kit/core](https://dndkit.com/) – sistema de drag & drop
- [Zustand](https://zustand-demo.pmnd.rs/) – manejo de estado con persistencia
- [CSS puro] – sin frameworks, fácil de adaptar

---

## 🚀 Cómo iniciar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tablero-horarios.git
cd tablero-horarios
```