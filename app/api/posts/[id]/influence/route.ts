import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to like route");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = Number(params.id);

  try {
    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Toggle like: if already liked, remove; else, add
    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId: postId,
        userId: session.user?.id * 1,
        type: "like", // Assuming 'type' distinguishes like, dislike, etc.
      },
    });

    if (existingInfluence) {
      // Unlike the post
      await prisma.influence.delete({
        where: { id: existingInfluence.id },
      });
      console.log(`Post unliked with ID: ${postId}`);
      return NextResponse.json({ message: "Post unliked" }, { status: 200 });
    } else {
      // Like the post
      await prisma.influence.create({
        data: {
          type: "like",
          postId: postId,
          userId: session.user?.id * 1,
        },
      });
      console.log(`Post liked with ID: ${postId}`);
      return NextResponse.json({ message: "Post liked" }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Error liking/unliking post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
