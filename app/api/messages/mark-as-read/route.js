import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId, senderId } = await req.json();

    await prisma.message.updateMany({
      where: {
        receiverId: parseInt(userId),
        senderId: parseInt(senderId),
        read: false,
      },
      data: {
        read: true,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
