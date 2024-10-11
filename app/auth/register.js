// pages/api/auth/register.js
import prisma from "../../../lib/prisma"
import bcrypt from "bcrypt"

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, email, password, interests } = req.body
    const avatar = req.files?.avatar ? `/avatars/${req.files.avatar.newFilename}` : null
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          avatar,
          interests: JSON.parse(interests),
        },
      })
      res.status(201).json({ message: "User created", user })
    } catch (error) {
      res.status(400).json({ message: "User creation failed", error })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
