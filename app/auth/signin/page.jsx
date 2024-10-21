"use client";

import { useContext, useEffect, useState } from "react";
import { NotificationContext } from "../../NotificationProvider";
import { signIn, useSession } from "next-auth/react";

export default function SignIn() {
  const { showNotification } = useContext(NotificationContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const session = useSession();
  useEffect(() => {
    if (session.status === "authenticated") {
      showNotification("You're already signed in", "warning");
      setTimeout(() => {
        window.location.replace("/feed");
      }, 1000);
    }
  }, []);
                                            
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/feed",
    });
  
    if (res?.error) {
      console.log(res)
      showNotification(`${res.error}`, "failure");
    }else {
      console.log(res)
      showNotification("Welcome back, "+email, "success");
      setTimeout(() => {
        window.location.replace(res?.url || "/feed");
      }, 1000);
    }

  };
  
  
  
  return (
    <div className="text-black flex flex-col items-center justify-center min-h-screen">
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
