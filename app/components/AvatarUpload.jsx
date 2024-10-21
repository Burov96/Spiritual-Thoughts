"use client"
import { useState } from "react"

export default function AvatarUpload() {
  const [file, setFile] = useState(null)

  const handleUpload = async () => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
        Upload Avatar
      </button>
    </div>
  )
}
