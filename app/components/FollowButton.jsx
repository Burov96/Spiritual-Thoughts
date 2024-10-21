"use client"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { useNotification } from "../NotificationProvider"

export default function FollowButton({ userId }) {
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)
  const { showNotification } = useNotification();
  

  const handleFollow = async () => {
    await fetch(`/api/users/${userId}/follow`, { method: "POST" })
    setIsFollowing(true)
    showNotification("Followed successfully", "success")
  }

  const handleUnfollow = async () => {
    await fetch(`/api/users/${userId}/unfollow`, { method: "POST" })
    setIsFollowing(false)
    showNotification("Unfollowed successfully", "success")
  }

  if (!session) return null

  return (
    <button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      className={`px-4 py-2 rounded ${
        isFollowing ? "bg-red-500 text-white" : "bg-blue-500 text-white"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  )
}
