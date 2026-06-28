import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const ARCFLARE_BASE = process.env.ARCFLARE_API_BASE || "https://arcflare-gateway.onrender.com";

// Price table for the resources FlowFlare can discover
const PRICE_TABLE: Record<string, string> = {
  "agent-lookup": "0.001",
  "reputation-check": "0.0005",
  "job-status": "0.0001",
};

type Resource = "agent-lookup" | "reputation-check" | "job-status";

interface DiscoveryRequest {
  resource: Resource;
  resourceQuery: Record<string, string>;
  payerWalletAddress: string;   // the Circle Agent Wallet address that will pay
  maxPayments?: number;         // optional cap, default 1
}

// Simulated discovery – in a real scenario you'd call an API or DB
async function discoverResource(resource: Resource, query: Record<string, string>) {
  // For demo, just return a dummy result with the price
  const price = PRICE_TABLE[resource];
  if (!price) throw new Error(`Unknown resource: ${resource}`);
  return {
    resource,
    price,
    details: `Resource ${resource} with query ${JSON.stringify(query)}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoveryRequest = await request.json();
    const { resource, resourceQuery, payerWalletAddress, maxPayments = 1 } = body;

    if (!resource || !resourceQuery || !payerWalletAddress) {
      return NextResponse.json(
        { error: "Missing required fields: resource, resourceQuery, payerWalletAddress" },
        { status: 400 }
      );
    }

    // 1. Discover the resource and its price
    const discovered = await discoverResource(resource, resourceQuery);
    const amount = discovered.price;

    // 2. Initialize payment with ArcFlare
    const initPayload = {
      amount,
      recipient: payerWalletAddress,  // the agent's own address (it pays itself? Actually the agent pays the service provider)
      // In a real scenario, the provider would be the resource owner – for hackathon, we'll just pay the agent itself as a demo
      // But we need a valid recipient. Let's use the SELLER_WALLET_ADDRESS from ArcFlare env.
    };

    // For the hackathon demo, we'll just simulate the M2M flow: we'll call /api/payments/initialize and /api/payments/settle.
    // We need a recipient address – use the seller address from ArcFlare.
    const sellerAddress = "0xYourSellerAddress"; // You should set this in env or fetch from ArcFlare
    // Actually, we can call ArcFlare's /api/merchant/info to get the seller address, but for simplicity we'll assume a fixed one.
    // In your actual deployment, you would use the environment variable SELLER_WALLET_ADDRESS.

    // Let's call ArcFlare's merchant info endpoint to get the seller address dynamically:
    let seller = "";
    try {
      const infoRes = await axios.get(`${ARCFLARE_BASE}/api/merchant/info`);
      seller = infoRes.data.sellerAddress;
    } catch {
      // fallback: use the one from your ArcFlare .env
      seller = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"; // known Gateway wallet
    }

    // Initialize payment
    const initRes = await axios.post(`${ARCFLARE_BASE}/api/payments/initialize`, {
      amount,
      recipient: seller,
      // description is optional; omit it to avoid validation issues
    });

    const paymentId = initRes.data.paymentId;

    // 3. Settle the payment (auto‑settle)
    const settleRes = await axios.post(`${ARCFLARE_BASE}/api/payments/settle`, {
      paymentId,
    });

    // 4. Return result
    return NextResponse.json({
      success: true,
      discovered,
      payment: {
        paymentId,
        amount,
        recipient: seller,
        transactionHash: settleRes.data.transactionHash,
      },
      message: `Successfully paid ${amount} USDC for ${resource}`,
    });
  } catch (error: any) {
    console.error("[FlowFlare Agent Error]", error?.response?.data || error.message);
    return NextResponse.json(
      { error: error?.response?.data?.error || error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// GET – describe the agent
export async function GET() {
  return NextResponse.json({
    name: "FlowFlare Agent",
    description: "Autonomous agent that discovers and pays for resources using ArcFlare M2M settlement.",
    resources: Object.keys(PRICE_TABLE),
    status: "online",
  });
}