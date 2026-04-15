import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, billsTable, splitItemsTable } from "@workspace/db";
import {
  ListBillsQueryParams,
  CreateBillBody,
  GetBillParams,
  GetBillSummaryParams,
  GetPayerStatsQueryParams,
} from "@workspace/api-zod";
import { createOrGetConsumer, createProduct, createPaymentLink } from "../lib/streampay";

const router: IRouter = Router();

function getAppBaseUrl(req: Express.Request | import("express").Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

router.get("/bills", async (req, res): Promise<void> => {
  const parsed = ListBillsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const bills = await db
    .select()
    .from(billsTable)
    .where(eq(billsTable.payerPhone, parsed.data.payerPhone))
    .orderBy(desc(billsTable.createdAt));

  res.json(bills);
});

router.post("/bills", async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { payerName, payerPhone, description, totalAmount, members } = parsed.data;
  const numPeople = members.length;
  const amountPerPerson = Math.round((totalAmount / numPeople) * 100) / 100;
  const baseUrl = getAppBaseUrl(req);

  const [bill] = await db
    .insert(billsTable)
    .values({
      payerName,
      payerPhone,
      description,
      totalAmount: String(totalAmount),
      numPeople,
      amountPerPerson: String(amountPerPerson),
      status: "active",
    })
    .returning();

  req.log.info({ billId: bill.id }, "Bill created");

  let productId: string | null = null;
  try {
    const product = await createProduct({
      name: `${description} — حصة الدفع`,
      price: amountPerPerson,
    });
    productId = product.id;
  } catch (err) {
    req.log.error({ err }, "Failed to create StreamPay product");
  }

  const splitItems = await Promise.all(
    members.map(async (member) => {
      const [splitItem] = await db
        .insert(splitItemsTable)
        .values({
          billId: bill.id,
          amount: String(amountPerPerson),
          status: "unpaid",
          receiverName: member.name,
          receiverPhone: member.phone,
        })
        .returning();

      if (productId) {
        try {
          const consumer = await createOrGetConsumer({
            name: member.name,
            phoneNumber: member.phone,
            externalId: `quicksplit-${splitItem.id}`,
          });

          const paymentLink = await createPaymentLink({
            name: `${description}`,
            description: `حصتك: ${amountPerPerson.toFixed(2)} ريال`,
            productId,
            consumerId: consumer.id,
            successUrl: `${baseUrl}/pay/${bill.id}/success`,
            failureUrl: `${baseUrl}/pay/${bill.id}/failure`,
            metadata: {
              split_item_id: splitItem.id,
              bill_id: bill.id,
            },
          });

          const [updated] = await db
            .update(splitItemsTable)
            .set({
              streampayConsumerId: consumer.id,
              streampayPaymentLinkId: paymentLink.id,
              paymentLinkUrl: paymentLink.url,
            })
            .where(eq(splitItemsTable.id, splitItem.id))
            .returning();

          return updated;
        } catch (err) {
          req.log.error({ err, splitItemId: splitItem.id }, "Failed to create StreamPay payment link for member");
        }
      }

      return splitItem;
    })
  );

  res.status(201).json({ ...bill, splitItems });
});

router.get("/bills/:billId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.billId) ? req.params.billId[0] : req.params.billId;
  const params = GetBillParams.safeParse({ billId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bill] = await db
    .select()
    .from(billsTable)
    .where(eq(billsTable.id, params.data.billId));

  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }

  const items = await db
    .select()
    .from(splitItemsTable)
    .where(eq(splitItemsTable.billId, bill.id))
    .orderBy(splitItemsTable.createdAt);

  res.json({ ...bill, splitItems: items });
});

router.get("/bills/:billId/summary", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.billId) ? req.params.billId[0] : req.params.billId;
  const params = GetBillSummaryParams.safeParse({ billId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bill] = await db
    .select()
    .from(billsTable)
    .where(eq(billsTable.id, params.data.billId));

  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }

  const items = await db
    .select()
    .from(splitItemsTable)
    .where(eq(splitItemsTable.billId, bill.id));

  const numPaid = items.filter((i) => i.status === "paid").length;
  const numUnpaid = items.filter((i) => i.status === "unpaid").length;
  const amountPerPerson = parseFloat(bill.amountPerPerson);
  const amountCollected = amountPerPerson * numPaid;
  const amountRemaining = parseFloat(bill.totalAmount) - amountCollected;
  const progressPercent = bill.numPeople > 0 ? Math.round((numPaid / bill.numPeople) * 100) : 0;

  res.json({
    billId: bill.id,
    description: bill.description,
    totalAmount: bill.totalAmount,
    amountPerPerson: bill.amountPerPerson,
    numPeople: bill.numPeople,
    numPaid,
    numUnpaid,
    amountCollected: amountCollected.toFixed(2),
    amountRemaining: amountRemaining.toFixed(2),
    status: bill.status,
    progressPercent,
  });
});

router.get("/payer/stats", async (req, res): Promise<void> => {
  const parsed = GetPayerStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { payerPhone } = parsed.data;

  const bills = await db
    .select()
    .from(billsTable)
    .where(eq(billsTable.payerPhone, payerPhone))
    .orderBy(desc(billsTable.createdAt));

  const activeBills = bills.filter((b) => b.status === "active").length;
  const pendingBills = bills.filter((b) => b.status === "pending").length;
  const settledBills = bills.filter((b) => b.status === "settled").length;

  const allSplitItems = await db
    .select()
    .from(splitItemsTable)
    .where(
      sql`${splitItemsTable.billId} IN (SELECT id FROM bills WHERE payer_phone = ${payerPhone})`
    );

  const paidItems = allSplitItems.filter((i) => i.status === "paid");
  const totalCollected = paidItems.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const unpaidItems = allSplitItems.filter((i) => i.status === "unpaid");
  const totalOutstanding = unpaidItems.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  res.json({
    totalBills: bills.length,
    activeBills,
    pendingBills,
    settledBills,
    totalCollected: totalCollected.toFixed(2),
    totalOutstanding: totalOutstanding.toFixed(2),
    recentBills: bills.slice(0, 5),
  });
});

export default router;
