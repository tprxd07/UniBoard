# UniBoard

Planificador universitario Progressive Web App (PWA) construido con vanilla JavaScript y Firebase.

## Funcionalidades

- **Dashboard** — Saludo personalizado, tareas próximas, eventos combinados
- **Calendario** — Vistas mes, semana, día y Todos; eventos de múltiples días
- **Asignaturas** — Gestión de materias con tabla de calificaciones por período
- **Estudio** — Pomodoro con seguimiento por materia, sesiones y estadísticas
- **Documentos** — Archivos y enlaces organizados por materia
- **Mi Universidad** — Resumen, metas, horario y progreso
- **Exámenes** — Registro con campo de calificación
- **Metas y Hábitos** — Seguimiento de objetivos diarios
- **Finanzas** — Control de gastos e ingresos
- **Recordatorios** — Alertas personalizables
- **Perfil** — Banner, foto con recorte, información personal
- **Amigos** — Sistema de amistad con solicitudes
- **Ajustes** — Colores de tema, modo lectura, modo iconos

## Stack Tecnológico

- **Frontend:** Vanilla JavaScript (sin framework)
- **Backend:** Firebase (Auth + Firestore)
- **Hosting:** GitHub Pages
- **PWA:** Service Worker para offline
- **Seguridad:** DOMPurify, CSP, Firestore rules, App Check

## Estructura del Proyecto

```
uni-guide-app/
├── index.html              # Entry point
├── css/
│   ├── main.css            # Layout, sidebar, modals, responsive
│   ├── pages.css           # Estilos de páginas específicas
│   └── components.css      # Componentes reutilizables
├── js/
│   ├── app.js              # Inicialización, navegación, reloj
│   ├── auth.js             # Autenticación Firebase
│   ├── db.js               # CRUD Firestore
│   ├── utils.js            # Utilidades (sanitize, escape, validación)
│   ├── icons.js            # Sistema dual SVG/emojis
│   ├── firebase-config.js  # Configuración Firebase
│   └── pages/
│       ├── dashboard.js    # Inicio
│       ├── calendar.js     # Calendario
│       ├── subjects.js     # Asignaturas
│       ├── study.js        # Estudio/Pomodoro
│       ├── documents.js    # Documentos
│       ├── uni-life.js     # Mi Universidad
│       ├── exams.js        # Exámenes
│       ├── tasks.js        # Tareas
│       ├── activities.js   # Actividades
│       ├── goals.js        # Metas y hábitos
│       ├── finances.js     # Finanzas
│       ├── reminders.js    # Recordatorios
│       ├── friends.js      # Amigos
│       ├── contacts.js     # Contactos
│       ├── profile.js      # Perfil
│       ├── progress.js     # Progreso
│       └── settings.js     # Ajustes
├── sw.js                   # Service Worker
├── manifest.json           # PWA manifest
└── firestore.rules         # Reglas de seguridad Firestore
```

## Despliegue

### Requisitos

- Cuenta de Firebase (proyecto `uniguide7878`)
- GitHub repository `tprxd07/UniBoard`
- GitHub Pages activado

### Configuración Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password, Google, Apple)
3. Crear Firestore Database
4. Habilitar App Check con reCAPTCHA v3
5. Configurar hosting (opcional, se usa GitHub Pages)

### Ramas

- **`main`** → Producción estable → `https://tprxd07.github.io/UniBoard/`
- **`beta`** → Testing → `https://tprxd07.github.io/UniBoard/beta/`

La rama `beta` tiene control de acceso: solo usuarios autorizados pueden usarla.

### Deploy

```bash
# Estable
git push origin main

# Beta
git push origin beta
```

GitHub Actions despliega automáticamente a GitHub Pages.

## Versiones

- **Estable** (`main`): Versión pública, probada
- **Beta** (`beta`): En desarrollo, solo para testers autorizados

## Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/nueva-feature`)
3. Commit (`git commit -m 'Add nueva feature'`)
4. Push (`git push origin feature/nueva-feature`)
5. Abrir Pull Request

## Licencia

Uso personal. No distribuir sin permiso.
