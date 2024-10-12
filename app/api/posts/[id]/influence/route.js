"use client"

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to like route");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Extract post ID from the request URL
  const url = new URL(request.url);
  const postId = Number(url.pathname.split('/').pop());

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId: postId,
        userId: session?.user.id,
        type: "like",
      },
    });

    if (existingInfluence) {
      await prisma.influence.delete({
        where: { id: existingInfluence.id },
      });
      console.log(`Post unliked with ID: ${postId}`);
      return NextResponse.json({ message: "Post unliked" }, { status: 200 });
    } else {
      await prisma.influence.create({
        data: {
          type: "like",
          postId: postId,
          userId: session.user.id,
        },
      });
      console.log(`Post liked with ID: ${postId}`);
      return NextResponse.json({ message: "Post liked" }, { status: 201 });
    }
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}