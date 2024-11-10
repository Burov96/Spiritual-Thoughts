// app/api/messages/users/route.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId'));

    if (!userId) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const chatUsers = await prisma.$queryRaw`
      SELECT DISTINCT
        u.id,
        u.name,
        u.profilePicture,
        CAST((
          SELECT COUNT(*)
          FROM Message m2
          WHERE m2.senderId = u.id 
          AND m2.receiverId = ${userId}
          AND m2.read = false
        ) AS SIGNED) as unreadCount
      FROM User u
      JOIN Message m ON (m.senderId = u.id OR m.receiverId = u.id)
      WHERE (m.senderId = ${userId} OR m.receiverId = ${userId})
        AND u.id != ${userId}
      GROUP BY u.id, u.name, u.profilePicture
      ORDER BY MAX(m.createdAt) DESC
    `;

    // Convert BigInt values to regular numbers
    const serializedUsers = chatUsers.map(user => ({
      ...user,
      id: Number(user.id),
      unreadCount: Number(user.unreadCount)
    }));

    return new Response(JSON.stringify(serializedUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch chat users:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
