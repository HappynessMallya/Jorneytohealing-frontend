import { NextRequest, NextResponse } from "next/server";

/**
 * Generate CometChat Auth Token for a user
 * This endpoint creates auth tokens that allow users to login to CometChat
 */
export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { message: "UID is required" },
        { status: 400 }
      );
    }

    // Sanitize UID to match what was used during user creation
    const sanitizedUid = uid.replace(/-/g, '_');

    // Get CometChat credentials from environment variables
    const appId = process.env.NEXT_PUBLIC_COMETCHAT_APP_ID || "16712913472aea194";
    // Valid regions: "us", "eu", or "in" (NOT "tz")
    const region = process.env.NEXT_PUBLIC_COMETCHAT_REGION || "us";
    const apiKey = process.env.COMETCHAT_API_KEY || process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY || "a9872929281e6788d558b02a78db2dc306e02786";

    console.log(`🔑 Generating auth token for: ${sanitizedUid}`);

    // Create auth token via CometChat REST API
    const response = await fetch(
      `https://api-${region}.cometchat.io/v3/users/${encodeURIComponent(sanitizedUid)}/auth_tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "appId": appId,
          "apiKey": apiKey,
        },
      }
    );

    const data = await response.json();

    console.log('📦 Raw CometChat API response:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      console.error("CometChat auth token error:", data);
      return NextResponse.json(
        { 
          message: data?.error?.message || "Failed to create auth token",
          error: data?.error
        },
        { status: response.status }
      );
    }

    // CometChat API returns: { data: { uid, authToken, createdAt } }
    const authToken = data?.data?.authToken;
    
    if (!authToken) {
      console.error('❌ No auth token in response! Full response:', JSON.stringify(data));
      return NextResponse.json(
        { message: "Auth token not found in response", rawResponse: data },
        { status: 500 }
      );
    }

    console.log(`✅ Auth token generated successfully for: ${sanitizedUid}`);
    console.log(`✅ Token type: ${typeof authToken}, Length: ${authToken.length}`);
    console.log(`✅ Token preview: ${authToken.substring(0, 50)}...`);
    
    return NextResponse.json({ authToken });
  } catch (error: any) {
    console.error("CometChat auth token creation error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

