import Dexie, { type Table } from "dexie";
import type { Quiz } from "~/types/quiz";

export class QuizAppDatabase extends Dexie {
  quizzes!: Table<Quiz>;

  constructor() {
    super("QuizAppDB");

    // Primary key 'id', indexed with 'title' and 'createdAt' for searching/sorting
    this.version(1).stores({
      quizzes: "id, title, createdAt",
    });
  }
}

export const db = new QuizAppDatabase();