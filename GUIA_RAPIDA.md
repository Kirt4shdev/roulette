# 🎯 GUÍA RÁPIDA: Actualizar Preguntas

## ⚡ Forma Más Fácil (3 pasos)

### 1️⃣ Edita el archivo
Abre: **`questions/test_questions.json`**

### 2️⃣ Ejecuta el comando
```bash
npm run update-questions
```

### 3️⃣ Refresca el navegador
Presiona **F5** en el dashboard

---

## 📝 Formato de Pregunta

```json
{
  "question": "¿Tu pregunta aquí?",
  "option_a": "Primera opción",
  "option_b": "Segunda opción",  
  "option_c": "Tercera opción",
  "option_d": "Cuarta opción",
  "correct": "B"
}
```

💡 **Tip:** `"correct"` debe ser la letra (A, B, C o D) de la respuesta correcta

---

## ✅ Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run update-questions` | Valida JSON, crea backup y actualiza BD |
| `npm run validate-json` | Solo valida que el JSON sea correcto |
| `docker-compose exec backend npm run seed` | Actualiza BD sin validar |

---

## 🆘 Problemas Comunes

### "Error: JSON inválido"
- Revisa que no falten **comas** entre preguntas
- Verifica que todas las **comillas** estén cerradas
- La última pregunta **NO** debe tener coma después

### "No se actualizan las preguntas"
```bash
docker-compose restart backend
npm run update-questions
```

### "Docker no está corriendo"
```bash
docker-compose up -d
```

---

## 📚 Documentación Completa

Ver **`ACTUALIZAR_PREGUNTAS.md`** para más detalles y opciones avanzadas.

