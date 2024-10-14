
import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; // Post ID
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("Unauthorized access to delete route");
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const postId = Number(id);

  try {
console.log('PROBLEMA E V API DELETEEEE')
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { influences: true },
    });

    if (!post) {
      return new Response(JSON.stringify({ message: "Post not found" }), { status: 404 });
    }

    // Check if the user is the owner of the post
    if (post.authorId !== parseInt(session.user.id)) {
      console.log(post);
      return new Response(JSON.stringify({ message: "Unauthorized to delete this post" }), { status: 403 });
    }

    await prisma.influence.deleteMany({
      where: { postId: postId },
    });

    await prisma.post.delete({
      where: { id: postId },
    });

    console.log(`Post deleted with ID: ${postId}`);
    return new Response(JSON.stringify({ message: "Post deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
