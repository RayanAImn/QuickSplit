export interface ParsedContact {
  name: string;
  phone: string;
}

export function parseVCard(text: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const cards = text.split(/(?=BEGIN:VCARD)/i);

  for (const card of cards) {
    if (!card.trim()) continue;

    let name = "";
    let phone = "";

    const lines = card.split(/\r?\n/);
    for (const line of lines) {
      const upper = line.toUpperCase();

      if (upper.startsWith("FN:") || upper.startsWith("FN;")) {
        name = line.substring(line.indexOf(":") + 1).trim();
      }

      if (!name && (upper.startsWith("N:") || upper.startsWith("N;"))) {
        const raw = line.substring(line.indexOf(":") + 1).trim();
        const parts = raw.split(";").filter(Boolean);
        if (parts.length >= 2) {
          name = `${parts[1]} ${parts[0]}`.trim();
        } else if (parts.length === 1) {
          name = parts[0].trim();
        }
      }

      if (upper.startsWith("TEL") && line.includes(":")) {
        const raw = line.substring(line.indexOf(":") + 1).trim();
        const cleaned = raw.replace(/[\s\-().]/g, "");
        if (cleaned && !phone) {
          phone = cleaned;
        }
      }
    }

    if (name || phone) {
      contacts.push({ name, phone });
    }
  }

  return contacts;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
