"use client"
import { useEffect, useState } from "react"
import FollowButton from "../../components/FollowButton"
import Image from "next/image"
import { Loading } from "../../components/Loading"
import {randomColor} from 'randomcolor'


export default function Profile({params}) {
  const id =params.id
  const [user, setUser] = useState(null)
  const [outlineColor, setOutlineColor] = useState('')

  useEffect(() => {
    if (id) {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => setUser(data))
      }
    }, [id])
    
    if (!user) return <Loading />
    setTimeout(() => {
      setOutlineColor(randomColor())
    }, 2000);
    const color = user.color

  return (
    <div className="transition-colors duration-1000 max-w-md mx-auto p-4 border rounded-lg shadow" style={{borderColor:outlineColor}}>
      <Image height={96} width={96} src={user.profilePicture || "/images/user.png"} alt="Avatar" className="rounded-full mx-auto" />
      <h2 className="text-xl text-center mt-2 " style={{color:color}}>{user.name}</h2>
      <p className="text-center text-gray-500">{user.email}</p>
      <p className="text-center text-gray-200">{user.posts.length} posts</p>
      <div className="mt-4 text-center">
        <h3 className="font-semibold">Interests:</h3>
        <h4 className="opacity-40 text-green-900">~// Coming soon //~ </h4>
        <ul className="list-disc list-inside">
          {user.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      <FollowButton userId={user.id} />
      </div>
    </div>
  )
}
