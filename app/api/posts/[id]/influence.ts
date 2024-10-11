import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to influence route");
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { type } = await request.json();
  const postId = Number(params.id);

  // Input validation
  if (!type || typeof type !== 'string') {
    console.log("Invalid influence type");
    return new Response(JSON.stringify({ message: "Invalid influence type" }), { status: 400 });
  }

  try {
    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    if (existingInfluence) {
      await prisma.influence.delete({
        where: {
          id: existingInfluence.id,
        },
      });
      console.log(`Influence removed for postId: ${postId}, userId: ${session.user.id}`);
      return new Response(JSON.stringify({ message: "Influence removed" }), { status: 200 });
    } else {
      await prisma.influence.create({
        data: {
          type,
          postId,
          userId: session.user.id,
        },
      });
      console.log(`Influence added for postId: ${postId}, userId: ${session.user.id}`);
      return new Response(JSON.stringify({ message: "Influence added" }), { status: 201 });
    }
  } catch (error) {
    console.error("Error adding/removing influence:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}