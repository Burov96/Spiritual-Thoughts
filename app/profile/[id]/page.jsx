// app/profile/[id]/page.jsx
"use client"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import FollowButton from "../../components/FollowButton"
import Image from "next/image"
import { Loading } from "../../components/Loading"

export default function Profile() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (id) {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => setUser(data))
    }
  }, [id])

  if (!user) return <Loading />

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <Image height={96} width={96} src={user.avatar || "/default-avatar.png"} alt="Avatar" className="rounded-full mx-auto" />
      <h2 className="text-xl text-center mt-2">{user.name}</h2>
      <p className="text-center text-gray-500">{user.email}</p>
      <div className="mt-4">
        <h3 className="font-semibold">Interests:</h3>
        <ul className="list-disc list-inside">
          {user.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </div>
      <FollowButton userId={user.id} />
    </div>
  )
}
