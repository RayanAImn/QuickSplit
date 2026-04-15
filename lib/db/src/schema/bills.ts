import { pgTable, text, uuid, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billsTable = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  payerName: text("payer_name").notNull(),
  payerPhone: text("payer_phone").notNull(),
  description: text("description").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  numPeople: integer("num_people").notNull(),
  amountPerPerson: numeric("amount_per_person", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;
