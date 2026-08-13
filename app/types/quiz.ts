export type QuestionType = 'single' | 'multiple' | 'true_false' | 'short_answer';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string; // Optional explanation shown after answering
  
  // For 'single', 'multiple', and 'true_false'
  choices?: string[];
  correctIndices?: number[]; // e.g., [1] for single choice, [0, 2] for multiple choice
  
  // For 'short_answer'
  acceptedAnswers?: string[]; // e.g., ["Paris", "paris", "city of paris"]
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  questions: Question[];
}