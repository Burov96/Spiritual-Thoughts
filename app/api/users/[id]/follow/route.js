
import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; // ID of the user to follow
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      following: {
        connect: { id: parseInt(id) },
      },
    },
  });

  return new Response(JSON.stringify({ message: "Followed" }), { status: 200 });
}
