
import prisma from "../../../../prisma"

export default async function handler(req, res) {
  if (req.method === "GET") {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        likes: true,
        prayers: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return res.status(200).json(posts)
  }

  res.setHeader("Allow", ["GET"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
