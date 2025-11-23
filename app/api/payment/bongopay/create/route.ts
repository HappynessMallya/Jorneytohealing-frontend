import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { phone, amount, order_id, callback_url } = requestBody;

    console.log("=== BONGO PAY CREATE PAYMENT (POST) ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request Payload:", JSON.stringify(requestBody, null, 2));

    if (!phone || !amount || !order_id) {
      console.error("Missing required fields:", { phone: !!phone, amount: !!amount, order_id: !!order_id });
      return NextResponse.json(
        { message: "Phone, amount, and order_id are required" },
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

    const payload = {
      phone,
      amount,
      order_id,
      callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/callback`,
    };

    console.log("Sending POST request to BongoPay with payload:", JSON.stringify(payload, null, 2));

    // Create payment with BongoPay
    const response = await fetch("https://bongopay.vastlabs.co.tz/api/v1/payment/create", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("BongoPay Response Status:", response.status);
    console.log("BongoPay Response Data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("BongoPay POST request failed:", {
        status: response.status,
        data: data,
      });
      return NextResponse.json(
        { message: data?.message || "Failed to create payment" },
        { status: response.status }
      );
    }

    console.log("✅ Payment creation successful");
    console.log("=== END BONGO PAY CREATE PAYMENT ===\n");

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ BongoPay payment creation error:", error);
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

