// src/app/api/flowflare/agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ARCFLARE_BASE = process.env.ARCFLARE_API_BASE || "https://arcflare-gateway.onrender.com";

const PRICE_TABLE: Record<string, string> = {
  "agent-lookup": "0.001",
  "reputation-check": "0.0005",
  "job-status": "0.0001",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resource, resourceQuery, payerAgentWalletAddress } = body;

    if (!resource || !resourceQuery || !payerAgentWalletAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const price = PRICE_TABLE[resource];
    if (!price) {
      return NextResponse.json(
        { success: false, error: `Unknown resource: ${resource}` },
        { status: 404 }
      );
    }

    // 1. Get seller address from ArcFlare
    let sellerAddress = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"; // fallback
    try {
      const infoRes = await axios.get(`${ARCFLARE_BASE}/api/merchant/info`);
      sellerAddress = infoRes.data.sellerAddress;
    } catch {
      // use fallback
    }

    // 2. Initialize payment
    const initRes = await axios.post(`${ARCFLARE_BASE}/api/payments/initialize`, {
      amount: price,
      recipient: sellerAddress,
    });
    const paymentId = initRes.data.paymentId;

    // 3. Settle payment
    const settleRes = await axios.post(`${ARCFLARE_BASE}/api/payments/settle`, {
      paymentId,
    });

    return NextResponse.json({
      success: true,
      discovered: { resource, price },
      payment: {
        paymentId,
        amount: price,
        recipient: sellerAddress,
        transactionHash: settleRes.data.transactionHash,
      },
      message: `Paid ${price} USDC for ${resource}`,
    });
  } catch (error: any) {
    console.error("FlowFlare error:", error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error?.response?.data?.error || error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "FlowFlare Agent (M2M)",
    resources: Object.keys(PRICE_TABLE),
    status: "online",
  });
}