"use client";
import { useState } from "react";
import { useNotification } from "../hooks/useNotification";
import Image from "next/image";

export function ProfileForm({ user }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || "");
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profilePicture && profilePicture.length > 255) {
      showNotification("Profile picture URL is too long", "failure");
      return;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          profilePicture,
        }),
      });
      if (res.ok) {
        showNotification("Profile updated successfully", "success");
      } else {
        const error = await res.json();
        console.log(error)
        showNotification(error.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.log(error)
      showNotification(error.message || "Failed to update profile", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="mb-6">
        <label htmlFor="name" className="block mb-2 font-bold text-gray-700">
          Name:
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="email" className="block mb-2 font-bold text-gray-700">
          Email address:
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
        />
      </div>

      <div className="mb-6 flex justify-center">
        <Image
          src={profilePicture || "/images/user.png"}
          alt={`${name}'s Profile Picture`}
          width={200}
          height={200}
          className="rounded-full object-cover"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="profilePicture" className="block mb-2 font-bold text-gray-700">
          Profile Picture URL:
        </label>
        <input
          type="text"
          id="profilePicture"
          value={profilePicture}
          onChange={(e) => setProfilePicture(e.target.value)}
          required
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full px-3 py-4 text-white bg-indigo-500 rounded-lg focus:bg-indigo-600 focus:outline-none"
      >
        Update Profile
      </button>
    </form>
  );
}
