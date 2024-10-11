"use client";

import { signIn, useSession } from "next-auth/react";
import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationContext } from "../../NotificationProvider";

export default function SignIn() {
  const { data: session, status } = useSession();
  const { showNotification } = useContext(NotificationContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();
    const res = await signIn("credentials", {
      // callbackUrl: "/feed",
      username: email,
      password: password,
      redirect: false,
    });
    if (res.ok) {
      console.log('res is ok my nigga')
      console.log(res)
      showNotification("Welcome back, "+email, "success")
      router.push("/feed");
    } else {
      showNotification("Failed to sign in", "failure");
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
