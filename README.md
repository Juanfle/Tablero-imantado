# 🧲 Tablero Imantado de Horarios

> Planificador visual de horarios escolares con imanes digitales, drag & drop fluido, línea de tiempo en vivo y modo oscuro. Desarrollado mayormente con asistencia de IA (programación asistida / pair programming inteligente).

## 📌 Descripción
Esta aplicación reproduce la experiencia de una pizarra física con imanes: materias y docentes se arrastran a una grilla de días y bloques horarios. Incluye validaciones, persistencia local, impresión optimizada y herramientas para analizar docentes únicos.

## ✨ Principales funcionalidades

| Categoría | Funciones |
|-----------|-----------|
| Interfaz | Bandeja lateral plegable, modo oscuro, scrollbar sutil, modales centrados |
| Horarios | Grilla por año (1º–6º), bloques configurados, swapping de imanes sobre una celda ocupada |
| Drag & Drop | Arrastre desde bandeja a tablero y entre celdas, overlay limpio, sin jitter |
| Docentes | Detección y merge de nombres similares (normalización + Jaccard), listado único exportable, búsqueda rápida |
| Validaciones | Impide mover imanes entre años distintos, controla módulos restantes, reemplazo controlado |
| Línea temporal | Línea discontinua indicando posición actual dentro del bloque horario activo |
| Impresión | Vista exclusivamente para imprimir (A4 horizontal), un año por página, formatos simplificados |
| Persistencia | Estado en `localStorage`, recuperación automática |
| UX mínima | Mensajes discretos (solo errores relevantes), botones con iconos SVG puros |
| Temas | Toggle claro / oscuro con recuerdo (localStorage) y auto-detección de preferencia del sistema |

## 🛠️ Stack técnico

- React + TypeScript + Vite
- Zustand (estado + persistencia)
- @dnd-kit/core (drag & drop altamente configurable)
- CSS Modules + estilos propios (sin Tailwind/BEM pesado)
- react-to-print (impresión controlada con fallback manual para Edge)

## 📂 Estructura rápida

```
src/
	components/        # Tablero, imán, estilos CSS Modules
	store/             # Zustand: imanes, posiciones, lógica de swapping
	data.ts            # Días y bloques horarios iniciales
	types.ts           # Tipos (Iman, Bloque, Dia, etc.)
```

## 🚀 Puesta en marcha

```bash
# Clonar
git clone https://github.com/tu-usuario/tablero-horarios.git
cd tablero-horarios

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Compilar producción
npm run build

# Previsualizar build
npm run preview
```

Accedé normalmente en: `http://localhost:5173` (o el puerto asignado por Vite).

## ⏱ Línea de tiempo actual
Cada 30 segundos recalcula la posición de una línea discontinua dentro del bloque horario vigente según la hora local. Si la hora cae fuera de cualquier bloque no se muestra, para evitar ruido visual.

## 🧲 Imanes y módulos
- Cada imán representa una materia (y hasta dos docentes). 
- Los módulos restantes se calculan dinámicamente según las ubicaciones colocadas.
- Al arrastrar sobre una celda ocupada se reemplaza el imán anterior (liberando su módulo).

## 👩‍🏫 Gestión de docentes
La ventana de “Docentes únicos” normaliza nombres (diacríticos, signos) y agrupa variantes similares usando similitud de Jaccard sobre tokens. Permite copiar la lista filtrada al portapapeles.

## 🖨️ Impresión
La vista de impresión genera una página por año (A4 horizontal) con formato simplificado (materia + docente). Para Edge se aplica un wrapper temporal que oculta el resto del DOM para asegurar fidelidad.

## 💾 Persistencia
Zustand guarda estado en `localStorage` (imanes y posiciones). No hay backend; ideal para uso offline o prototipado rápido. Para multiusuario real o sincronización centralizada se podría migrar a una API.

## 🧪 Posibles mejoras futuras
- Edición masiva de bloques.
- Importación CSV / Excel.
- Bloques flexibles (no solo horas predefinidas).
- Indicadores de sobrecarga de docente.
- Multi-perfil (distintas escuelas / turnos).

## 🤖 Asistencia de IA
Este proyecto fue desarrollado mayormente con ayuda de un asistente de IA para:
- Refactorizaciones rápidas.
- Generación de componentes y estilos.
- Optimización incremental de UX (scrollbar, bandeja, swapping, línea temporal, modo oscuro).

Decisiones finales, validaciones y ajustes de diseño fueron revisados manualmente. Se recomienda siempre auditar la lógica antes de usar en producción.

## 🧩 Convenciones de código
- Tipos y lógica de dominio en `store/` y `types.ts`.
- Evitar “magic numbers”: se usan variables CSS (p.ej. `--tray-width`, `--header-height`).
- Drag IDs con prefijos (`placed:`) para distinguir origen.

## � Licencia
Si no se especifica otra en el repositorio, se asume intención educativa / personal. Podés adaptar una licencia MIT añadiendo un archivo `LICENSE`:

```
MIT License © Autor original
```

## 🙌 Créditos
- Autor original del concepto y datos.
- Asistente de IA (pair programming) por soporte en generación y mejoras.

## 📣 Feedback
¿Ideas, mejoras o bugs? Abrí un issue o comenta propuestas. Iterar es parte del proceso.

---
> “La mejor herramienta es la que hace que el trabajo se sienta liviano.”
