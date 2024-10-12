"use client"
import { useState } from "react"

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: null,
    interests: [],
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "avatar") {
      setForm({ ...form, avatar: files[0] })
    } else if (name === "interests") {
      const selected = Array.from(e.target.selectedOptions, (option) => option.value)
      setForm({ ...form, interests: selected })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData()
    data.append("name", form.name)
    data.append("email", form.email)
    data.append("password", form.password)
    if (form.avatar) data.append("avatar", form.avatar)
    data.append("interests", JSON.stringify(form.interests))

    await fetch("/api/auth/register", {
      method: "POST",
      body: data,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <input name="name" type="text" placeholder="Name" onChange={handleChange} required className="p-2 border rounded" />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="p-2 border rounded" />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="p-2 border rounded" />
      <input name="avatar" type="file" accept="image/*" onChange={handleChange} className="p-2 border rounded" />
      <select name="interests" multiple onChange={handleChange} className="p-2 border rounded">
        <option value="Meditation">Meditation</option>
        <option value="Yoga">Yoga</option>
        <option value="Mindfulness">Mindfulness</option>
        <option value="Philosophy">Philosophy</option>
        <option value="Religion">Religion</option>
      </select>
      <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Register</button>
    </form>
  )
}
