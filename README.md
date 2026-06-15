# FitTrack Pro

Una agenda de entrenamiento minimalista, aesthetic y altamente personalizable.

## Características
- **Gamificación**: Seguimiento de rachas (streak) con indicador visual.
- **Inteligente**: Calcula duración del entreno por día.
- **Categorización**: Visualiza en qué zonas musculares te enfocas más.
- **Estética**: Diseño minimalista estilo iOS.
- **Offline First**: Tus datos se guardan en el almacenamiento local de tu navegador.

## Cómo usar
1. Abre la app en tu navegador móvil.
2. Ve a la pestaña de **Ajustes** (icono de engranaje).
3. Pega tu rutina en formato JSON (puedes generar el JSON con Gemini o ChatGPT).
4. Guarda y comienza tu entrenamiento.

## Formato JSON soportado
```json
[
  {
    "nombre": "Press de Banca",
    "descripcion": "...",
    "imagen": "URL_IMAGEN",
    "dias": ["Lunes"],
    "series": "4x10",
    "descanso": "90s",
    "duracion_min": 15,
    "categoria": "Pecho"
  }
]
