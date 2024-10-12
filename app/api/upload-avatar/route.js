// app/api/upload-avatar/route.js
import { getServerSession } from "next-auth";
import prisma from "../../../lib/prisma";
import { authOptions } from "../../../lib/authOptions";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { avatarUrl } = await request.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { avatarUrl },
  });

  return new Response(JSON.stringify({ message: "Avatar updated successfully" }), { status: 200 });
}
