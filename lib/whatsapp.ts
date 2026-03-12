import type { Order } from "@prisma/client";

interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface WhatsAppOrderPayload {
  order: Order;
  items: WhatsAppOrderItem[];
  customerName: string;
  customerPhone: string;
  address: string;
}

export async function sendOrderWhatsAppNotification(payload: WhatsAppOrderPayload) {
  const accountSid = process.env.WHATSAPP_ACCOUNT_SID;
  const authToken = process.env.WHATSAPP_AUTH_TOKEN;
  const from = process.env.WHATSAPP_FROM;
  const to = process.env.WHATSAPP_TO;

  if (!accountSid || !authToken || !from || !to) {
    console.warn("WhatsApp notification skipped: missing WHATSAPP_* env vars.");
    return;
  }

  try {
    const lines: string[] = [];
    lines.push("New RG Bowl order ✅");
    lines.push("");
    lines.push(`Name: ${payload.customerName || "Unknown"}`);
    lines.push(`Phone: ${payload.customerPhone || ""}`);
    lines.push(`Address: ${payload.address}`);
    lines.push("");
    lines.push("Items:");
    for (const item of payload.items) {
      lines.push(`- ${item.name} × ${item.quantity} (₹${item.price * item.quantity})`);
    }
    lines.push("");
    lines.push(`Total: ₹${payload.order.totalAmount}`);
    lines.push(`Placed at: ${payload.order.createdAt.toISOString()}`);

    const bodyText = lines.join("\n");

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams({
      From: `whatsapp:${from}`,
      To: `whatsapp:${to}`,
      Body: bodyText,
    });

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (error) {
    console.error("Failed to send WhatsApp order notification", error);
  }
}

