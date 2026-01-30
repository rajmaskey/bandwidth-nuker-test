import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const testHistory = pgTable("test_history", {
  id: serial("id").primaryKey(),
  targetUrl: text("target_url").notNull(),
  method: text("method").notNull().default("GET"),
  concurrency: integer("concurrency").notNull().default(1),
  durationSeconds: integer("duration_seconds").notNull(),
  totalRequests: integer("total_requests").notNull(),
  successCount: integer("success_count").notNull(),
  errorCount: integer("error_count").notNull(),
  totalBytes: integer("total_bytes").notNull(), // Approximate
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestHistorySchema = createInsertSchema(testHistory).omit({ 
  id: true, 
  createdAt: true 
});

export type TestHistory = typeof testHistory.$inferSelect;
export type InsertTestHistory = z.infer<typeof insertTestHistorySchema>;
