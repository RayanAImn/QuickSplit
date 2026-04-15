import { logger } from "./logger";

const STREAMPAY_BASE_URL = process.env.STREAMPAY_BASE_URL ?? "https://stream-app-service.streampay.sa";
const STREAMPAY_API_KEY = process.env.STREAMPAY_API_KEY ?? "";
const STREAMPAY_SECRET_KEY = process.env.STREAMPAY_SECRET_KEY ?? "";

function getAuthHeader(): string {
  const token = Buffer.from(`${STREAMPAY_API_KEY}:${STREAMPAY_SECRET_KEY}`).toString("base64");
  return `Basic ${token}`;
}

async function streampayFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${STREAMPAY_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getAuthHeader(),
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    logger.error({ status: response.status, path, data }, "StreamPay API error");
    throw new Error(`StreamPay API error ${response.status}: ${text}`);
  }

  return data;
}

export interface StreamPayConsumer {
  id: string;
  name: string;
  phone_number: string;
}

export async function createOrGetConsumer(params: {
  name: string;
  phoneNumber: string;
  externalId?: string;
}): Promise<StreamPayConsumer> {
  try {
    const consumer = await streampayFetch("/api/v2/consumers", {
      method: "POST",
      body: JSON.stringify({
        name: params.name,
        phone_number: params.phoneNumber,
        external_id: params.externalId,
        communication_methods: ["WHATSAPP"],
        preferred_language: "ar",
      }),
    }) as StreamPayConsumer;
    logger.info({ consumerId: consumer.id }, "StreamPay consumer created");
    return consumer;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("DUPLICATE_CONSUMER")) {
      const existingConsumers = await listConsumers(params.phoneNumber);
      if (existingConsumers.length > 0) {
        logger.info({ consumerId: existingConsumers[0].id }, "StreamPay consumer already exists, reusing");
        return existingConsumers[0];
      }
    }
    throw err;
  }
}

async function listConsumers(phoneNumber: string): Promise<StreamPayConsumer[]> {
  const data = await streampayFetch(`/api/v2/consumers?phone_number=${encodeURIComponent(phoneNumber)}`) as { items?: StreamPayConsumer[] };
  return data.items ?? [];
}

export interface StreamPayProduct {
  id: string;
  name: string;
  price: string;
}

export async function createProduct(params: {
  name: string;
  price: number;
}): Promise<StreamPayProduct> {
  const product = await streampayFetch("/api/v2/products", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      price: params.price.toFixed(2),
      currency: "SAR",
      type: "ONE_TIME",
    }),
  }) as StreamPayProduct;
  logger.info({ productId: product.id }, "StreamPay product created");
  return product;
}

export interface StreamPayPaymentLink {
  id: string;
  url: string;
  status: string;
  amount: string;
}

export async function createPaymentLink(params: {
  name: string;
  description: string;
  productId: string;
  consumerId: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, string>;
}): Promise<StreamPayPaymentLink> {
  const link = await streampayFetch("/api/v2/payment_links", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      items: [{ product_id: params.productId, quantity: 1 }],
      contact_information_type: "PHONE",
      currency: "SAR",
      max_number_of_payments: 1,
      organization_consumer_id: params.consumerId,
      success_redirect_url: params.successUrl,
      failure_redirect_url: params.failureUrl,
      custom_metadata: params.metadata ?? {},
    }),
  }) as StreamPayPaymentLink;
  logger.info({ linkId: link.id, url: link.url }, "StreamPay payment link created");
  return link;
}
