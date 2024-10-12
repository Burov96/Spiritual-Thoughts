"use client";

export default function InterestsList({ interests }) {
    return (
      <ul className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <li key={interest} className="px-2 py-1 bg-gray-200 rounded">
            {interest}
          </li>
        ))}
      </ul>
    )
  }
  