import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/authOptions";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const { typing } = await req.json();
    await prisma.user.update({
      where: { email: session.user.email },
      data: { typing },
    });
    return new Response(JSON.stringify({ message: "Typing status updated" }), { status: 200 });
  } catch (error) {
    console.error("Error updating typing status:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
