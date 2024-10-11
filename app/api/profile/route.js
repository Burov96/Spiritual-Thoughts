import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);

  if (!session) {
    console.log("No session found");
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, profilePicture: true },
    });

    console.log("User Data:", user);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Failed to load profile data" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);

  if (!session) {
    console.log("No session found");
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { name, email, profilePicture } = await request.json();
    console.log("Updating User:", { name, email, profilePicture });

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser && existingUser.id != session.user.id) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, email, profilePicture },
      select: { id: true, name: true, email: true, profilePicture: true },
    });

    console.log("Updated User:", updatedUser);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
