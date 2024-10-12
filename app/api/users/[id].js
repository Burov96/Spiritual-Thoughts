

import prisma from "../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        interests: true,
      },
    })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json(user)
  }

  res.setHeader("Allow", ["GET"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
