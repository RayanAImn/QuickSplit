export interface ZatcaInvoice {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: number;
  vatAmount: number;
  subtotal: number;
}

export function decodeZatcaQr(raw: string): ZatcaInvoice | null {
  try {
    const bytes = base64ToUint8Array(raw.trim());
    const fields: Record<number, Uint8Array> = {};
    let i = 0;

    while (i < bytes.length) {
      const tag = bytes[i++];
      const length = bytes[i++];
      if (i + length > bytes.length) break;
      fields[tag] = bytes.slice(i, i + length);
      i += length;
    }

    if (!fields[1] || !fields[4]) return null;

    const decode = (b: Uint8Array) => new TextDecoder().decode(b);

    const totalWithVat = parseFloat(decode(fields[4]));
    const vatAmount = fields[5] ? parseFloat(decode(fields[5])) : 0;
    const subtotal = parseFloat((totalWithVat - vatAmount).toFixed(2));

    return {
      sellerName: fields[1] ? decode(fields[1]) : "",
      vatNumber: fields[2] ? decode(fields[2]) : "",
      timestamp: fields[3] ? decode(fields[3]) : "",
      totalWithVat,
      vatAmount,
      subtotal,
    };
  } catch {
    return null;
  }
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
