"use client"
import { useEffect, useState } from "react"

export default function FetchUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function getUsers() {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data)
    }
    getUsers()
  }, [])

  return (
    <div>
      <h2>Registered Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  )
}
