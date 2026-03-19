import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/server/auth";

// Validation Schema
const supportSchema = z.object({
  message: z.string().min(1, "กรุณาระบุปัญหาหรือข้อความที่ต้องการแจ้ง"),
  context: z.object({
    userAgent: z.string().optional(),
    url: z.string().optional(),
    resolution: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  billing: z.object({
    referenceCode: z.string(),
    status: z.string(),
    packageName: z.string(),
    amountTHB: z.number(),
    errorCategory: z.string().optional(),
    verificationErrorCode: z.string().nullable().optional(),
    verificationErrorMessage: z.string().nullable().optional(),
    latestLogStatus: z.string().nullable().optional(),
    latestLogProvider: z.string().nullable().optional(),
    latestLogAt: z.string().nullable().optional(),
  }).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = supportSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = (result.error as any).errors?.[0]?.message || "Validation validation error";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { message, context, billing } = result.data;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Format Discord Embed
    const isBillingTicket = Boolean(billing);
    const embedTitle = isBillingTicket ? "💳 Billing Support Ticket" : "🎫 New Support Ticket";
    const embedColor = isBillingTicket ? 0xE74C3C : 0xD4AF37;

    const baseFields = [
      {
        name: "👤 User",
        value: `${session.user.name} (${session.user.email})`,
        inline: true
      },
      {
        name: "🆔 User ID",
        value: `\`${session.user.id}\``,
        inline: true
      },
      {
        name: "📱 Device Info",
        value: [
          `**OS/Browser**: ${context?.userAgent || "Unknown"}`,
          `**Resolution**: ${context?.resolution || "Unknown"}`,
          `**Page**: ${context?.url || "Unknown"}`
        ].join("\n"),
        inline: false
      }
    ];

    const billingFields = billing ? [
      {
        name: "📋 Reference",
        value: `\`${billing.referenceCode}\``,
        inline: true
      },
      {
        name: "📦 Package",
        value: `${billing.packageName} · ฿${billing.amountTHB}`,
        inline: true
      },
      {
        name: "🔄 Status",
        value: billing.status,
        inline: true
      },
      ...(billing.errorCategory && billing.errorCategory !== 'UNKNOWN' ? [{
        name: "⚠️ Error",
        value: [
          `Category: ${billing.errorCategory}`,
          billing.verificationErrorCode ? `Code: ${billing.verificationErrorCode}` : null,
          billing.verificationErrorMessage ? `Message: ${billing.verificationErrorMessage}` : null,
        ].filter(Boolean).join("\n"),
        inline: false
      }] : []),
      ...(billing.latestLogStatus ? [{
        name: "🔍 Latest Verification",
        value: [
          `Status: ${billing.latestLogStatus}`,
          billing.latestLogProvider ? `Provider: ${billing.latestLogProvider}` : null,
          billing.latestLogAt ? `At: ${billing.latestLogAt}` : null,
        ].filter(Boolean).join("\n"),
        inline: false
      }] : []),
    ] : [];

    const discordPayload = {
      username: "MMV Support Bot",
      avatar_url: "https://www.mimivibe-tarot.com/images/logo.png",
      embeds: [
        {
          title: embedTitle,
          color: embedColor,
          description: message,
          timestamp: new Date().toISOString(),
          footer: {
            text: `Ticket ID: ${Date.now().toString().slice(-6)}`
          },
          fields: [...baseFields, ...billingFields]
        }
      ]
    };

    // Send to Discord
    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!discordRes.ok) {
      throw new Error(`Discord API Error: ${discordRes.statusText}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Support API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
