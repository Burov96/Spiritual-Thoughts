// app/api/posts/route.ts

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../app/api/auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        likes: true,
        prayers: true,
        influences: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify(posts), { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
export async function POST(request: Request) {
  // Handle creating a new post
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { content } = await request.json();

  if (!content || typeof content !== 'string') {
    return new Response(JSON.stringify({ message: "Invalid content" }), { status: 400 });
  }

  try {
    const post = await prisma.post.create({
      data: {
        content,
        author: { connect: { email: session.user.email } },
      },
    });

    return new Response(JSON.stringify(post), { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
