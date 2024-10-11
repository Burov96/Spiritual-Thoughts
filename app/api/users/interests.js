// pages/api/users/interests.js
import { getSession } from "next-auth/react"
import prisma from "../../../../prisma"

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    const { interests } = req.body
    await prisma.user.update({
      where: { email: session.user.email },
      data: { interests },
    })
    return res.status(200).json({ message: "Interests updated" })
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
