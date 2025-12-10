# 📝 Sistema de Actualización de Preguntas y Premios

Este documento explica cómo actualizar las preguntas y premios del quiz de forma fácil y rápida.

## 🚀 Método Rápido (Recomendado)

### Actualizar TODO con un solo comando

Después de editar los archivos JSON, simplemente ejecuta:

```bash
docker compose up -d --build
```

✅ **¡Listo!** Las preguntas y premios se actualizan automáticamente.

---

## 📁 Archivos de Configuración

### Preguntas: `questions/test_questions.json`

**Formato de cada pregunta:**
```json
{
  "question": "¿Cuál es la pregunta?",
  "option_a": "Primera respuesta",
  "option_b": "Segunda respuesta",
  "option_c": "Tercera respuesta",
  "option_d": "Cuarta respuesta",
  "correct": "A"
}
```

- `question`: El texto de la pregunta
- `option_a`, `option_b`, `option_c`, `option_d`: Las 4 opciones de respuesta
- `correct`: La letra de la respuesta correcta (A, B, C o D)

### Premios: `questions/prizes.json`

**Formato de cada premio:**
```json
{
  "name": "Cesta de Navidad",
  "type": "cesta",
  "units": 17,
  "priority": 1
}
```

- `name`: Nombre del premio que se muestra
- `type`: Identificador interno del tipo de premio
- `units`: Cantidad de unidades disponibles
- `priority`: Prioridad de asignación (1 = más alta)

---

## 🔄 Actualización Manual (Alternativa)

Si solo quieres actualizar sin reconstruir:

```bash
docker compose restart backend
```

Esto reinicia el backend y ejecuta el seed con los archivos actuales.

---

## 📋 Método desde CSV

Si tienes las preguntas en un archivo CSV como `preguntasconcurso.csv`, usa el script de generación:

### 1. Crear el script de generación

Crea un archivo `update-questions.js` en la raíz del proyecto:

```javascript
const fs = require('fs');

// Tus preguntas aquí
const questions = [
  {
    question: "¿Pregunta 1?",
    correct: "Respuesta correcta",
    false: ["Falsa 1", "Falsa 2", "Falsa 3"]
  },
  // ... más preguntas
];

// Generar el JSON
const output = questions.map(item => {
  const allAnswers = [item.correct, ...item.false];
  const shuffled = allAnswers.sort(() => Math.random() - 0.5);
  const correctIndex = shuffled.indexOf(item.correct);
  const correctLetter = String.fromCharCode(65 + correctIndex);
  
  return {
    question: item.question,
    option_a: shuffled[0],
    option_b: shuffled[1],
    option_c: shuffled[2],
    option_d: shuffled[3],
    correct: correctLetter
  };
});

fs.writeFileSync('questions/test_questions.json', JSON.stringify(output, null, 2));
console.log(`✓ Generadas ${output.length} preguntas`);
```

### 2. Ejecutar el script y actualizar

```bash
node update-questions.js
docker compose restart backend
```

---

## 🎯 Ejemplos de Uso

### Agregar una nueva pregunta

Abre `questions/test_questions.json` y agrega al final del array (antes del `]`):

```json
,
{
  "question": "¿Nueva pregunta?",
  "option_a": "Opción A",
  "option_b": "Opción B",
  "option_c": "Respuesta Correcta",
  "option_d": "Opción D",
  "correct": "C"
}
```

### Modificar una pregunta existente

Busca la pregunta en el JSON y edita los campos que necesites:

```json
{
  "question": "¿Pregunta modificada?",  ← Cambiar aquí
  "option_a": "Nueva opción A",         ← O aquí
  "option_b": "Nueva opción B",
  "option_c": "Nueva respuesta correcta",
  "option_d": "Nueva opción D",
  "correct": "C"                        ← Asegúrate que coincida
}
```

### Eliminar una pregunta

Simplemente borra el bloque completo de la pregunta del JSON (incluyendo las llaves `{}`).

---

## ⚠️ Notas Importantes

1. **Validar el JSON**: Asegúrate de que el archivo JSON sea válido. Puedes usar:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('questions/test_questions.json'));console.log('✓ JSON válido')"
   ```

2. **Respaldar antes de editar**: Haz una copia del archivo antes de hacer cambios grandes:
   ```bash
   cp questions/test_questions.json questions/test_questions.backup.json
   ```

3. **Reconstruir si es necesario**: Si cambias el formato o hay problemas, reconstruye los contenedores:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

4. **Verificar en la aplicación**: Después de actualizar, revisa que las estadísticas en el dashboard muestren el número correcto de preguntas.

---

## 🔧 Solución de Problemas

### El contador de preguntas no se actualiza

El dashboard carga las estadísticas al iniciar. Refresca la página (F5) después de ejecutar el seed.

### Error al ejecutar el seed

Verifica que los contenedores estén corriendo:
```bash
docker-compose ps
```

Si alguno no está corriendo:
```bash
docker-compose up -d
```

### JSON inválido

Si obtienes un error de JSON inválido, revisa:
- Todas las llaves `{}` y corchetes `[]` están cerrados
- No hay comas extras al final del último elemento
- Todas las comillas están bien cerradas
- No hay caracteres especiales sin escapar

---

## 📊 Estructura del Proyecto

```
roulette/
├── questions/
│   ├── test_questions.json          ← Archivo principal de preguntas
│   ├── prizes.json                  ← Configuración de premios
│   └── preguntasconcurso.csv        ← CSV original (referencia)
├── backend/
│   └── src/
│       └── models/
│           └── seed.js               ← Script que carga preguntas y premios
└── update-questions.js              ← Script opcional para generar JSON
```

---

## 💡 Tips

- **Usa un editor con validación JSON** como VS Code para evitar errores de sintaxis
- **Mezcla las respuestas** manualmente si quieres control sobre el orden
- **Agrupa preguntas por temas** usando comentarios (aunque los comentarios no son válidos en JSON, puedes usar un campo `"category"`)
- **Mantén backups** de las versiones anteriores del JSON

---

¿Necesitas ayuda? Revisa los logs con:
```bash
docker-compose logs backend
```

