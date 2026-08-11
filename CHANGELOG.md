# Changelog

Todas las changes notables de UniBoard se documentan aquí.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

## [1.0.0] - 2026-08-11

### Agregado
- Autenticación con Firebase (email, Google, Apple)
- Registro con @username único
- Cooldown de 30 días para cambios de nombre y username
- Dashboard con saludo, tareas próximas y eventos combinados
- Calendario con vistas mes/semana/día/Todos
- Eventos de múltiples días con barras horizontales
- Selector de rango de fechas personalizado
- Asignaturas con tabla de calificaciones por período
- Estudio con Pomodoro, sesiones y estadísticas
- Modo concentración con nombre de materia
- Documentos con carpetas por materia (archivos y enlaces)
- Página "Mi Universidad" (resumen/metas/horario/progreso)
- Links útiles con confirmación de enlace externo
- Ajustes con colores de acento/fondo, modo lectura, modo iconos
- Selector de color con rueda y recientes
- Perfil completo con banner, foto y recorte
- Sistema de amigos (amigos + solicitudes)
- Contactos personales
- Exámenes con campo de calificación
- Metas y hábitos
- Finanzas
- Recordatorios
- Modo oscuro/claro automático según sistema
- Iconos SVG con fallback a emojis
- Loading skeleton en todas las páginas
- Título del navegador se actualiza con la página

### Seguridad
- DOMPurify para sanitización HTML
- escapeHTML para protección XSS
- Validación de URLs (javascript:, data:, vbscript:)
- CSP (Content Security Policy) estricto
- Firestore rules con owner-only writes
- Firebase App Check (reCAPTCHA v3)
- Contraseñas: mínimo 8 caracteres con letra + número
- maxlength en todos los inputs
- Protección en handlers onclick con encodeURIComponent

### Mobile
- Touch targets mínimos de 44px
- Modal bottom-sheet con drag handle
- Safe areas para dispositivos con notch
- Scroll con momentum y overscroll-behavior
- Card shadows y active states (scale)
- Responsive grid layouts
- Sidebar colapsable en móvil
