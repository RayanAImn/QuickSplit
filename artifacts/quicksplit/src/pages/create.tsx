import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateBill, getListBillsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePayer } from "@/hooks/use-payer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrScannerModal } from "@/components/qr-scanner-modal";
import { ScannedBillCard } from "@/components/scanned-bill-card";
import { ZatcaInvoice } from "@/lib/zatca-decoder";
import { ArrowLeft, Plus, Trash2, Users, Receipt, ScanLine, X, Contact } from "lucide-react";

interface Member {
  name: string;
  phone: string;
}

declare global {
  interface Navigator {
    contacts?: {
      select: (
        properties: string[],
        options?: { multiple?: boolean }
      ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
    };
  }
}

export default function CreateBill() {
  const { phone: payerPhone, name: payerName } = usePayer();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [members, setMembers] = useState<Member[]>([{ name: "", phone: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedInvoice, setScannedInvoice] = useState<ZatcaInvoice | null>(null);

  const createBillMutation = useCreateBill({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey({ payerPhone }) });
        setLocation(`/bills/${data.id}`);
      },
      onError: () => {
        setError("Failed to create bill. Please try again.");
      },
    },
  });

  const parsedAmount = parseFloat(totalAmount) || 0;
  const numMembers = members.length;
  const amountPerPerson = numMembers > 0 ? parsedAmount / numMembers : 0;

  const addMember = () => {
    setMembers([...members, { name: "", phone: "" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleInvoiceScanned = (invoice: ZatcaInvoice) => {
    setScannedInvoice(invoice);
    if (!description && invoice.sellerName) {
      setDescription(`Dinner at ${invoice.sellerName}`);
    }
    if (!totalAmount && invoice.totalWithVat > 0) {
      setTotalAmount(invoice.totalWithVat.toFixed(2));
    }
  };

  const handleAddFromContacts = async (index: number) => {
    if (!navigator.contacts) {
      alert("Contacts access is not supported on this browser. Use Chrome on Android or Safari on iOS.");
      return;
    }
    try {
      const results = await navigator.contacts.select(["name", "tel"], { multiple: false });
      if (!results.length) return;
      const contact = results[0];
      const contactName = contact.name?.[0] ?? "";
      const rawPhone = contact.tel?.[0]?.replace(/\s+/g, "") ?? "";
      const contactPhone = rawPhone.startsWith("+") ? rawPhone : rawPhone;
      updateMember(index, "name", contactName);
      updateMember(index, "phone", contactPhone);
    } catch {
      // user dismissed
    }
  };

  const handleAddMultipleFromContacts = async () => {
    if (!navigator.contacts) {
      alert("Contacts access is not supported on this browser. Use Chrome on Android or Safari on iOS.");
      return;
    }
    try {
      const results = await navigator.contacts.select(["name", "tel"], { multiple: true });
      if (!results.length) return;
      const newMembers: Member[] = results.map((c) => ({
        name: c.name?.[0] ?? "",
        phone: c.tel?.[0]?.replace(/\s+/g, "") ?? "",
      }));
      const hasEmpty = members.length === 1 && !members[0].name && !members[0].phone;
      setMembers(hasEmpty ? newMembers : [...members, ...newMembers]);
    } catch {
      // user dismissed
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please enter a bill description.");
      return;
    }
    if (!totalAmount || parsedAmount <= 0) {
      setError("Please enter a valid total amount.");
      return;
    }
    const filledMembers = members.filter((m) => m.name.trim() && m.phone.trim());
    if (filledMembers.length === 0) {
      setError("Please add at least one member.");
      return;
    }

    createBillMutation.mutate({
      data: {
        payerName: payerName || payerPhone,
        payerPhone,
        description: description.trim(),
        totalAmount: parsedAmount,
        members: filledMembers,
      },
    });
  };

  if (!payerPhone) {
    setLocation("/");
    return null;
  }

  const contactsSupported = typeof navigator !== "undefined" && "contacts" in navigator;

  return (
    <div className="min-h-[100dvh] pb-10">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold font-heading">New Bill</h1>
        </div>
      </header>

      <main className="p-4 space-y-5 max-w-md mx-auto -mt-2">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-dashed border-2 border-primary/40 text-primary hover:bg-primary/5 gap-2"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="h-5 w-5" />
          Scan Restaurant Receipt (QR)
        </Button>

        <AnimatePresence>
          {scannedInvoice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative"
            >
              <ScannedBillCard invoice={scannedInvoice} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScannedInvoice(null)}
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Bill Details
              </CardTitle>
              {scannedInvoice && (
                <CardDescription className="text-secondary text-xs">
                  Pre-filled from your scanned receipt — edit if needed.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Dinner at Nusret"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Total Amount (SAR)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
                {scannedInvoice && (
                  <p className="text-xs text-muted-foreground">
                    Includes VAT of SAR {scannedInvoice.vatAmount.toFixed(2)}
                  </p>
                )}
              </div>

              {parsedAmount > 0 && numMembers > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-xl p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-1">Each person pays</p>
                  <p className="text-3xl font-bold font-heading text-secondary">
                    SAR {amountPerPerson.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parsedAmount.toFixed(2)} ÷ {numMembers} {numMembers === 1 ? "person" : "people"}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Members
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Each member gets a WhatsApp payment link automatically.
                  </CardDescription>
                </div>
                {contactsSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMultipleFromContacts}
                    className="shrink-0 gap-1.5 text-xs border-secondary/40 text-secondary hover:bg-secondary/10"
                  >
                    <Contact className="h-3.5 w-3.5" />
                    Contacts
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {members.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 items-start"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Full Name"
                          value={member.name}
                          onChange={(e) => updateMember(index, "name", e.target.value)}
                          className="flex-1"
                        />
                        {contactsSupported && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddFromContacts(index)}
                            className="shrink-0 text-secondary border-secondary/40 hover:bg-secondary/10"
                            title="Pick from contacts"
                          >
                            <Contact className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="+966500000000"
                        value={member.phone}
                        onChange={(e) => updateMember(index, "phone", e.target.value)}
                      />
                    </div>
                    {members.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                type="button"
                variant="outline"
                onClick={addMember}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Member
              </Button>
            </CardContent>
          </Card>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={createBillMutation.isPending}
          >
            {createBillMutation.isPending
              ? "Sending payment links via WhatsApp..."
              : "Send Payment Requests"}
          </Button>
        </form>
      </main>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onInvoiceScanned={handleInvoiceScanned}
      />
    </div>
  );
}
