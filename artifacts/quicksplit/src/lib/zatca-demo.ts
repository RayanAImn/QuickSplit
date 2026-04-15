function tlv(tag: number, value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  const result = new Uint8Array(2 + encoded.length);
  result[0] = tag;
  result[1] = encoded.length;
  result.set(encoded, 2);
  return result;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const a of arrays) {
    out.set(a, i);
    i += a.length;
  }
  return out;
}

export function generateDemoZatcaQr(overrides?: {
  sellerName?: string;
  vatNumber?: string;
  total?: number;
  vat?: number;
}): string {
  const sellerName = overrides?.sellerName ?? "مطعم الرياض الفاخر";
  const vatNumber = overrides?.vatNumber ?? "310122393500003";
  const timestamp = new Date().toISOString();
  const total = (overrides?.total ?? 230.0).toFixed(2);
  const vat = (overrides?.vat ?? 30.0).toFixed(2);

  const bytes = concat(
    tlv(1, sellerName),
    tlv(2, vatNumber),
    tlv(3, timestamp),
    tlv(4, total),
    tlv(5, vat)
  );

  return btoa(String.fromCharCode(...bytes));
}
