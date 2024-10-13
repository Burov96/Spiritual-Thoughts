"use client";

import { signIn } from "next-auth/react";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationContext } from "../../NotificationProvider";

export default function SignIn() {
  const { showNotification } = useContext(NotificationContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false,
      });
      if (res?.error) {
        showNotification(res.error, "failure");
      } else if (res?.ok) {
        showNotification("Welcome back, " + email, "success");
        router.push("/feed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      showNotification("An unexpected error occurred", "failure");
    }
  };
  
  
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2 w-80">
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
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
          Sign In
        </button>
      </form>
    </div>
  );
}
