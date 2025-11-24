import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side API route to create CometChat users
 * Uses REST API Key (never exposed to client)
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, name, avatar, role } = await req.json();

    if (!uid || !name) {
      return NextResponse.json(
        { message: "UID and name are required" },
        { status: 400 }
      );
    }

    // CometChat UID requirements: alphanumeric, hyphens, underscores, max 100 chars
    // Convert UUID to safe format by removing hyphens if needed
    const sanitizedUid = uid.replace(/-/g, '_');

    // Get CometChat credentials from environment variables
    const appId = process.env.NEXT_PUBLIC_COMETCHAT_APP_ID || "16712913472aea194";
    // Valid regions: "us", "eu", or "in" (NOT "tz")
    const region = process.env.NEXT_PUBLIC_COMETCHAT_REGION || "us";
    const apiKey = process.env.COMETCHAT_API_KEY || process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY || "a9872929281e6788d558b02a78db2dc306e02786";

    console.log(`🔵 Creating CometChat user: ${sanitizedUid} (${name})`);
    console.log(`🔵 Role received:`, role);
    console.log(`🔵 Role to be set:`, role || 'user');

    // Create user via CometChat REST API with role metadata
    const response = await fetch(
      `https://api-${region}.cometchat.io/v3/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "appId": appId,
          "apiKey": apiKey,
        },
        body: JSON.stringify({
          uid: sanitizedUid,
          name,
          ...(avatar && { avatar }),
          metadata: {
            role: role || 'user', // Store role in metadata for filtering
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // If user already exists, update their metadata with the role
      if (data?.error?.code === "ERR_UID_ALREADY_EXISTS") {
        console.log(`🔄 CometChat user already exists: ${sanitizedUid}`);
        console.log(`🔄 Updating metadata with role: ${role || 'user'}`);
        
        // Update user metadata via PUT request (PATCH might not work)
        // Note: We use PUT to replace the entire user object with metadata
        const updateResponse = await fetch(
          `https://api-${region}.cometchat.io/v3/users/${sanitizedUid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "appId": appId,
              "apiKey": apiKey,
            },
            body: JSON.stringify({
              uid: sanitizedUid,
              name,
              ...(avatar && { avatar }),
              metadata: {
                role: role || 'user',
              },
            }),
          }
        );

        if (updateResponse.ok) {
          const updatedData = await updateResponse.json();
          console.log(`✅ CometChat user metadata updated successfully: ${sanitizedUid} with role: ${role || 'user'}`);
          console.log(`📦 CometChat PATCH response:`, JSON.stringify(updatedData, null, 2));
          console.log(`📦 Metadata in response:`, updatedData.data?.metadata);
          return NextResponse.json({ 
            message: "User exists and metadata updated",
            data: updatedData.data || { uid: sanitizedUid, name, avatar, metadata: { role: role || 'user' } },
          });
        } else {
          const errorData = await updateResponse.json();
          console.error(`❌ Failed to update metadata for ${sanitizedUid}`);
          console.error(`❌ Error response:`, JSON.stringify(errorData, null, 2));
        return NextResponse.json({
            message: "User already exists but metadata update failed",
          data: { uid: sanitizedUid, name, avatar },
            error: errorData
        });
        }
      }
      
      console.error("CometChat user creation error:", data);
      return NextResponse.json(
        { 
          message: data?.error?.message || "Failed to create CometChat user",
          error: data?.error 
        },
        { status: response.status }
      );
    }

    console.log(`✅ CometChat user created successfully: ${sanitizedUid} with role: ${role || 'user'}`);
    console.log(`📦 CometChat CREATE response:`, JSON.stringify(data, null, 2));
    console.log(`📦 Metadata in response:`, data.data?.metadata);
    return NextResponse.json({ ...data, data: { ...data.data, uid: sanitizedUid } });
  } catch (error: any) {
    console.error("CometChat user creation error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}




