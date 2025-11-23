import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get("order_id");

    console.log("=== BONGO PAY GET STATUS (GET) ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Order ID:", order_id);

    if (!order_id) {
      console.error("Order ID is missing");
      return NextResponse.json(
        { message: "order_id is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.BONGOPAY_API_KEY;
    if (!apiKey) {
      console.error("BongoPay API key not configured");
      return NextResponse.json(
        { message: "BongoPay API key not configured" },
        { status: 500 }
      );
    }

    const url = `https://bongopay.vastlabs.co.tz/api/v1/payment/status/${order_id}`;
    console.log("Sending GET request to:", url);

    // Get payment status from BongoPay
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log("BongoPay Response Status:", response.status);
    console.log("BongoPay Response Data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("BongoPay GET request failed:", {
        status: response.status,
        data: data,
      });
      return NextResponse.json(
        { message: data?.message || "Failed to get payment status" },
        { status: response.status }
      );
    }

    console.log("✅ Status check successful");
    console.log("Payment Status:", data?.payment_status || "N/A");
    console.log("=== END BONGO PAY GET STATUS ===\n");

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ BongoPay status check error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

