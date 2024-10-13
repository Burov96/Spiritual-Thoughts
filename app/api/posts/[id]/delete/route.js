
import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to delete route");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = Number(params.id);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { influences: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Check if the user is the owner of the post
    if (post.authorId !== session.user.id) {
      console.log(post);
      return NextResponse.json({ message: "Unauthorized to delete this post" }, { status: 403 });
    }

    await prisma.influence.deleteMany({
      where: { postId: postId },
    });

    await prisma.post.delete({
      where: { id: postId },
    });

    console.log(`Post deleted with ID: ${postId}`);
    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
