// components/Interests.jsx
"use client"
import { useState } from "react"

const availableInterests = ["Meditation", "Yoga", "Mindfulness", "Philosophy", "Religion"]

export default function Interests() {
  const [selected, setSelected] = useState([])

  const toggleInterest = (interest) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleSave = async () => {
    await fetch("/api/users/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selected }),
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableInterests.map((interest) => (
        <button
          key={interest}
          onClick={() => toggleInterest(interest)}
          className={`px-3 py-1 rounded ${
            selected.includes(interest) ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {interest}
        </button>
      ))}
      <button onClick={handleSave} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
        Save Interests
      </button>
    </div>
  )
}
