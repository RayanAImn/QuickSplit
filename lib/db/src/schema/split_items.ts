import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { billsTable } from "./bills";

export const splitItemsTable = pgTable("split_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id").notNull().references(() => billsTable.id, { onDelete: "cascade" }),
  receiverName: text("receiver_name").notNull().default(""),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"),
  streampayProductId: text("streampay_product_id"),
  streampayPaymentLinkId: text("streampay_payment_link_id"),
  streampayPaymentLinkUrl: text("streampay_payment_link_url"),
  streampayRef: text("streampay_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSplitItemSchema = createInsertSchema(splitItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSplitItem = z.infer<typeof insertSplitItemSchema>;
export type SplitItem = typeof splitItemsTable.$inferSelect;
