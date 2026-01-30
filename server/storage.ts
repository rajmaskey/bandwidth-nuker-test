import { type TestHistory, type InsertTestHistory } from "@shared/schema";

export interface IStorage {
  getHistory(): Promise<TestHistory[]>;
  createTestHistory(run: InsertTestHistory): Promise<TestHistory>;
  clearHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private history: Map<number, TestHistory>;
  private currentId: number;

  constructor() {
    this.history = new Map();
    this.currentId = 1;
  }

  async getHistory(): Promise<TestHistory[]> {
    return Array.from(this.history.values()).sort((a, b) => b.id - a.id);
  }

  async createTestHistory(insertRun: InsertTestHistory): Promise<TestHistory> {
    const id = this.currentId++;
    const run: TestHistory = { 
      ...insertRun, 
      id, 
      createdAt: new Date(),
      // Fill defaults if missing (though schema handles most)
      method: insertRun.method ?? "GET",
      concurrency: insertRun.concurrency ?? 1
    };
    this.history.set(id, run);
    return run;
  }

  async clearHistory(): Promise<void> {
    this.history.clear();
  }
}

export const storage = new MemStorage();
