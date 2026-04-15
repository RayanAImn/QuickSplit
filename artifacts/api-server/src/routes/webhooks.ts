import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, splitItemsTable, billsTable, transactionsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/webhooks/streampay", async (req, res): Promise<void> => {
  const payload = req.body as { event?: string; data?: Record<string, unknown> };

  req.log.info({ event: payload.event }, "StreamPay webhook received");

  if (!payload.event || !payload.data) {
    res.status(400).json({ error: "Invalid webhook payload" });
    return;
  }

  const isPaidEvent =
    payload.event === "payment.completed" ||
    payload.event === "invoice.paid" ||
    payload.event === "payment_link.paid";

  if (!isPaidEvent) {
    req.log.info({ event: payload.event }, "Ignoring non-payment event");
    res.json({ received: true });
    return;
  }

  const metadata = (payload.data.custom_metadata ?? payload.data.metadata ?? {}) as Record<string, string>;
  const splitItemId = metadata.split_item_id;
  const billId = metadata.bill_id;

  const invoiceId = (payload.data.invoice_id ?? payload.data.id ?? "") as string;
  const amount = (payload.data.amount ?? payload.data.total ?? "0") as string;

  if (!splitItemId || !billId) {
    req.log.warn({ event: payload.event, data: payload.data }, "Webhook missing split_item_id or bill_id in metadata");
    res.json({ received: true });
    return;
  }

  const [splitItem] = await db
    .select()
    .from(splitItemsTable)
    .where(eq(splitItemsTable.id, splitItemId));

  if (!splitItem) {
    req.log.warn({ splitItemId }, "Split item not found for webhook");
    res.json({ received: true });
    return;
  }

  if (splitItem.status === "paid") {
    req.log.info({ splitItemId }, "Split item already paid, ignoring");
    res.json({ received: true });
    return;
  }

  await db
    .update(splitItemsTable)
    .set({
      status: "paid",
      streampayRef: invoiceId,
      paidAt: new Date(),
    })
    .where(eq(splitItemsTable.id, splitItemId));

  await db.insert(transactionsTable).values({
    splitItemId,
    streampayRef: invoiceId,
    amount: splitItem.amount,
    status: "completed",
    paidAt: new Date(),
  });

  req.log.info({ splitItemId, billId }, "Split item marked as paid");

  const allItems = await db
    .select()
    .from(splitItemsTable)
    .where(eq(splitItemsTable.billId, billId));

  const updatedPaid = allItems.filter((i) => i.id === splitItemId ? true : i.status === "paid").length;
  const allPaid = updatedPaid === allItems.length;
  const anyPaid = updatedPaid > 0;

  if (allPaid) {
    await db
      .update(billsTable)
      .set({ status: "settled" })
      .where(eq(billsTable.id, billId));
    req.log.info({ billId }, "Bill settled");
  } else if (anyPaid) {
    await db
      .update(billsTable)
      .set({ status: "pending" })
      .where(and(eq(billsTable.id, billId), eq(billsTable.status, "active")));
  }

  res.json({ received: true });
});

export default router;
