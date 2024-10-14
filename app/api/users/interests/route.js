import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/authOptions";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { interests } = await request.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { interests },
  });

  return new Response(JSON.stringify({ message: "Interests updated" }), { status: 200 });
}