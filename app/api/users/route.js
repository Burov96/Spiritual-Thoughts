import { getServerSession } from "next-auth";
import prisma from "../../../lib/prisma";
import { authOptions } from "../../../lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const users = await prisma.user.findMany();

  return new Response(JSON.stringify(users), { status: 200 });
}
