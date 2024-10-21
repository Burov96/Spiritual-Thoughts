import prisma from "../../../../lib/prisma";

export async function GET(request, { params }) {
  const { id } = params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
      interests: true,
      posts: true,
      color: true,
    },
  });

  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }
  
  return new Response(JSON.stringify(user), { status: 200 });
}