

import { getSession } from "next-auth/react"
import prisma from "../../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        following: {
          connect: { id: parseInt(id) },
        },
      },
    })
    return res.status(200).json({ message: "Followed" })
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
