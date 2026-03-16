import { GoogleGenAI } from "@google/genai";
import { Message, UserProfile, Exercise, ExamQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTutorResponse(
  userProfile: UserProfile,
  history: Message[],
  currentSubject: string
) {
  const systemInstruction = `
    Você é um tutor de estudos especializado em concursos públicos e ENEM.
    O aluno se chama ${userProfile.name} e está estudando para ${userProfile.targetExam}.
    A matéria atual é ${currentSubject}. O nível do aluno nesta matéria é ${userProfile.subjects.find(s => s.name === currentSubject)?.level || 'iniciante'}.

    Sua missão:
    1. Explique conceitos de forma clara e adaptada ao nível do aluno.
    2. Gere exercícios de múltipla escolha (4 opções) frequentemente para validar o aprendizado.
    3. Dê feedback detalhado após as respostas do aluno.
    4. Seja motivador e focado em aprovação.

    Sempre que gerar um exercício, use o formato JSON no final da sua resposta para que a interface possa renderizá-lo:
    [EXERCISE_START]
    {
      "question": "pergunta aqui",
      "options": ["opção 0", "opção 1", "opção 2", "opção 3"],
      "correctAnswer": 0,
      "explanation": "explicação detalhada aqui"
    }
    [EXERCISE_END]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    config: {
      systemInstruction,
    }
  });

  return response.text || "Desculpe, não consegui processar sua mensagem.";
}

export async function generateSimulatedExam(
  userProfile: UserProfile,
  subject: string
): Promise<ExamQuestion[]> {
  const prompt = `
    Gere 10 questões de múltipla escolha para um simulado de ${subject} focado em ${userProfile.targetExam}.
    O nível deve ser ${userProfile.subjects.find(s => s.name === subject)?.level || 'intermediário'}.
    Retorne APENAS um array JSON com o seguinte formato:
    [
      {
        "id": "1",
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctAnswer": 0,
        "explanation": "..."
      },
      ...
    ]
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  const text = result.text || "";
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    console.error("Failed to parse simulated exam JSON", e);
    return [];
  }
}
