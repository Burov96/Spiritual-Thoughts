
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { receiverIdInt, senderId, text } = await req.json();

    
    const message = await prisma.message.create({
      data: {
        content: text,
        senderId: parseInt(senderId),
        receiverId: receiverIdInt, 
      },
    });

    return new Response(JSON.stringify(message), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send message', 
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
