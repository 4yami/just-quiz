// app/utils/sampleQuiz.ts

export const SAMPLE_QUIZ_JSON = {
  title: "World Capitals Quiz",
  description: "Test your geography knowledge!",
  questions: [
    {
      type: "single",
      text: "What is the capital of France?",
      choices: ["Paris", "London", "Berlin", "Madrid"],
      correctIndices: [0],
      explanation: "Paris is the capital of France."
    },
    {
      type: "multiple",
      text: "Which of the following are European countries?",
      choices: ["France", "Brazil", "Japan", "Germany"],
      correctIndices: [0, 3],
      explanation: "France and Germany are in Europe. Brazil is in South America, Japan is in Asia."
    },
    {
      type: "true_false",
      text: "The capital of Japan is Tokyo.",
      choices: ["True", "False"],
      correctIndices: [0],
      explanation: "Tokyo is indeed the capital of Japan."
    },
    {
      type: "short_answer",
      text: "What is the capital of Australia?",
      acceptedAnswers: ["Canberra", "canberra"],
      explanation: "Canberra is the capital of Australia, not Sydney."
    }
  ]
};

export const AI_PROMPT_TEMPLATE = `Create a quiz in raw JSON based on the notes at the end of this message.

Question count:
- If the notes say how many questions to make, match that number.
- Otherwise choose a sensible number yourself — enough to cover the main concepts.

Reply with ONLY the JSON object — nothing before it, nothing after it. No code fence, no intro, no outro, no document, no commentary, no explanation.

Fill in your content using EXACTLY this structure:

${JSON.stringify(SAMPLE_QUIZ_JSON, null, 2)}

Rules:
- Every question must include "type", "text", "correctIndices", and "explanation".
- "single" and "true_false": exactly one entry in correctIndices. "true_false" choices default to ["True", "False"].
- "multiple": two or more entries in correctIndices.
- "short_answer": include "acceptedAnswers" with several spelling/case variants, and no "choices".
- correctIndices are 0-based and must point to valid choice positions.

If you cannot follow these instructions, reply with exactly: FAIL

NOTES
[PASTE YOUR NOTES HERE]

Remember: your entire reply must be the JSON object and nothing else.`;
