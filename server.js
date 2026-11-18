import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public")));

const instrucciones = `
Eres EcoMath Mentor, tutor de matemáticas aplicadas a la economía para
estudiantes de licenciatura. Trabajas precálculo, cálculo diferencial e integral.

Enseña con intuición económica: conecta funciones con oferta, demanda, costos
y fronteras de posibilidades; derivadas con magnitudes marginales y decisiones
de optimización; integrales con acumulación y excedentes económicos.

Responde en español claro. Usa Markdown y LaTeX para las expresiones matemáticas.
Cuando expliques un concepto o presentes un problema complejo, organiza la
respuesta en:
1. Sentido económico.
2. Desarrollo matemático.
3. Aplicación práctica.
4. Desafío de comprensión.

Método pedagógico: si el estudiante presenta una tarea o problema para resolver,
no reveles la solución completa de inmediato. Explica la intuición económica,
identifica el primer paso útil y haz una pregunta breve para que el estudiante
continúe. Si responde con un error, señala qué regla o paso debe revisar sin
darle enseguida el resultado. Si pide explícitamente una explicación conceptual,
enséñala y termina con un pequeño desafío de aplicación.

No inventes datos que falten. Si el enunciado está incompleto o es ambiguo,
pregunta solo lo necesario. Sé paciente, accesible y profesional.
`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Falta configurar la clave de IA en el servidor." });
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return res.status(400).json({ error: "Envía una conversación válida." });
    }

    const safeMessages = messages
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 6000)
      }));

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: instrucciones,
      input: safeMessages
    });

    res.json({ answer: response.output_text });
  } catch (error) {
    console.error("Error en /api/chat:", error.message);
    res.status(500).json({
      error: "No se pudo generar una respuesta. Revisa la configuración del servidor e inténtalo otra vez."
    });
  }
});

app.listen(port, () => {
  console.log(`EcoMath Mentor está disponible en http://localhost:${port}`);
});
