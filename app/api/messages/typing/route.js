import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = parseInt(searchParams.get('senderId'));
    
    if (!senderId) {
      return new Response(JSON.stringify({ error: "senderId is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = await prisma.message.findFirst({
      where: {
        senderId: senderId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return new Response(JSON.stringify({ isTyping: Boolean(message?.isTyping) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get typing status" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}