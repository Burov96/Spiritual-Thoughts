"use client"
import { useSession } from "next-auth/react"

export default function ProtectedPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (!session) {
    return <p>You must be logged in to view this page.</p>
  }

  return <div>Welcome, {session.user.name}!</div>
}
