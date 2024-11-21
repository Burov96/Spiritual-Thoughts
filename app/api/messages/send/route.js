import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { receiverId, senderId, text } = await req.json();

    // Save message to database
    const message = await prisma.message.create({
      data: {
        content: text,
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
      },
    });

    return new Response(JSON.stringify(message), { status: 200 });
  } catch (error) {
    console.error("Failed to send message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send message" }),
      { status: 500 }
    );
  }
}
