import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { billsTable } from "./bills";

export const splitItemsTable = pgTable("split_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id").notNull().references(() => billsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"),
  receiverName: text("receiver_name"),
  receiverPhone: text("receiver_phone"),
  paymentLinkUrl: text("payment_link_url"),
  streampayConsumerId: text("streampay_consumer_id"),
  streampayPaymentLinkId: text("streampay_payment_link_id"),
  streampayRef: text("streampay_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSplitItemSchema = createInsertSchema(splitItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSplitItem = z.infer<typeof insertSplitItemSchema>;
export type SplitItem = typeof splitItemsTable.$inferSelect;
