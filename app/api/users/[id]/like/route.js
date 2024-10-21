

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; 
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(session.user.id),
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return new Response(JSON.stringify({ message: "Post unliked" }), { status: 200 });
    } else {
      await prisma.like.create({
        data: {
          user: { connect: { email: session.user.email } },
          post: { connect: { id: parseInt(id) } },
        },
      });
      return new Response(JSON.stringify({ message: "Post liked" }), { status: 201 });
    }
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
