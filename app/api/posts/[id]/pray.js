// pages/api/posts/[id]/pray.js
import { getSession } from "next-auth/react"
import prisma from "../../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    const prayer = await prisma.prayer.create({
      data: {
        user: { connect: { email: session.user.email } },
        post: { connect: { id: parseInt(id) } },
      },
    })
    return res.status(201).json(prayer)
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
