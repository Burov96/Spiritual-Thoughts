import { NextResponse } from "next/server";

export async function GET(request, {params}) { 
const {id} = params
  try {
      const user = await prisma.user.findUnique({
        where: { id: id*1 },
        select: { id: true, name: true, profilePicture: true },
      });
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });}

      console.log("User Data:", user);
      return NextResponse.json(user, { status: 200 });
    } catch (error) {
      console.error("Error fetching OP's profile:", error);
      return NextResponse.json(
        { message: "Failed to load profile data" },
        { status: 500 }
      );
    }
  }