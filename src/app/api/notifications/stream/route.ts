import { NextRequest } from "next/server";

/// SSE (Server-Sent Events) endpoint for real-time order notifications.
/// Merchants connect with EventSource to receive push notifications.
/// Falls back to polling every 15s since Turso doesn't support real-time triggers.
export const dynamic = "force-dynamic";

// In-memory store for last known counts per shop
const lastCounts: Record<string, number> = {};
const POLL_INTERVAL = 15_000; // 15 seconds

async function getPendingCount(shopId: string): Promise<number> {
  try {
    const { tursoQuery, toNum } = await import("@/lib/turso-lite");
    const rows = await tursoQuery<{ cnt: unknown }>(
      `SELECT COUNT(*) as cnt FROM "PrintOrder" WHERE status = ? AND "shopId" = ?`,
      ["pending", shopId]
    );
    return toNum(rows[0]?.cnt);
  } catch {
    return -1; // error indicator
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return new Response("shopId is required", { status: 400 });
  }

  // Initialize count if first connection
  if (!(shopId in lastCounts)) {
    lastCounts[shopId] = await getPendingCount(shopId);
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let keepAliveId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const sendEvent = (data: string, event?: string) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event || "message"}\ndata: ${data}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      };

      // Send connected event
      sendEvent(JSON.stringify({ type: "connected", shopId, timestamp: Date.now() }), "connected");

      // Poll for changes
      intervalId = setInterval(async () => {
        try {
          const count = await getPendingCount(shopId);
          if (count < 0) {
            sendEvent(JSON.stringify({ type: "error", message: "DB query failed" }), "error");
            return;
          }

          const prevCount = lastCounts[shopId] ?? 0;

          if (count !== prevCount) {
            const diff = count - prevCount;
            lastCounts[shopId] = count;

            if (diff > 0) {
              // New orders arrived
              sendEvent(
                JSON.stringify({
                  type: "new_orders",
                  count,
                  diff,
                  timestamp: Date.now(),
                  message: diff === 1 ? "طلب جديد" : `${diff} طلبات جديدة`,
                }),
                "orders"
              );
            } else {
              // Orders resolved
              sendEvent(
                JSON.stringify({
                  type: "status_update",
                  count,
                  diff,
                  timestamp: Date.now(),
                }),
                "orders"
              );
            }
          }

          // Send heartbeat with current count
          sendEvent(JSON.stringify({ type: "heartbeat", count, timestamp: Date.now() }));
        } catch (err) {
          console.error("[SSE] Poll error:", err);
        }
      }, POLL_INTERVAL);

      // Keep-alive comment every 5s to prevent connection timeout
      keepAliveId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          // Client disconnected
        }
      }, 5_000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
      if (keepAliveId) clearInterval(keepAliveId);
      delete lastCounts[shopId]; // Clean up
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Nginx proxy
    },
  });
}
