"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationContext } from "../../NotificationProvider";
import { useSession } from "next-auth/react";


export default function Register() {
  const { showNotification } = useContext(NotificationContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { data: session, status } = useSession();

  console.log(session)

  if (status === "authenticated") {
    router.push("/feed");
    showNotification("You are already logged in", "failure");
    return null;
  }
else{

  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      
      if (res.ok) {
        showNotification("Registration successful, welcome!", "success")
        router.push("/auth/signin");
      } else {
        showNotification('Registration was not successfull, please try again after a while. It\'s not you, it us!', 'failure', true)
        const errorData = await res.json();
        alert(`Registration failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="text-black flex flex-col space-y-2 w-80">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 border rounded"
          />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 border rounded"
          />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 border rounded"
          />
        <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded">
          Register
        </button>
      </form>
    </div>
  );
}
}
