# 🎓 UniBoard - Tu Compañera Universitaria

Una aplicación web completa para organizar tu vida universitaria, sincronizada entre Mac y iPhone.

## Características

- 📅 **Calendario** - Vista diaria, semanal y mensual
- 📚 **Asignaturas** - Profesor, notas, calculadora de nota final
- ✅ **Tareas** - Por prioridad, fecha límite, repetitivas
- 📝 **Exámenes** - Cuenta atrás, temario, plan de estudio
- 📖 **Planificador** - Sesiones de estudio, estadísticas
- ⏱️ **Temporizador Pomodoro** - Con música ambiente
- 📄 **Documentos** - Organizados por asignatura
- 💰 **Finanzas** - Control de gastos mensual
- 🎒 **Vida universitaria** - Horarios y enlaces
- 📊 **Progreso** - Créditos, nota media, predicciones
- 🎯 **Objetivos** - Metas semanales y hábitos
- 🔔 **Recordatorios** - Estudio, agua, entregas
- 👥 **Contactos** - Profesores, tutores, compañeros
- ⚙️ **Ajustes** - Temas (claro/oscuro/rosa), sincronización

## Configuración

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Ve a **Settings** > **General** > **Your apps** > **Web app**
4. Registra una nueva app web
5. Copia la configuración

### 2. Configurar Firestore

1. En Firebase Console, ve a **Firestore Database**
2. Crea una base de datos
3. Selecciona un location cercano
4. Comienza en **modo de prueba**

### 3. Configurar Authentication

1. En Firebase Console, ve to **Authentication**
2. Ve a **Sign-in method**
3. Habilita **Email/Password**

### 4. Actualizar configuración

Abre `js/firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};
```

### 5. Desplegar en GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Luego ve a **Settings** > **Pages** > selecciona la rama `main`.

## Uso en iPhone

1. Abre Safari en el iPhone
2. Ve a la URL de tu GitHub Pages
3. Toca el botón de compartir
4. Selecciona "Añadir a pantalla de inicio"

Ahora tienes la app en tu iPhone con sincronización automática.

## Tecnologías

- HTML5 / CSS3 / JavaScript vanilla
- Firebase (Auth + Firestore)
- PWA (Progressive Web App)
- Responsive design
