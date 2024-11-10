"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {Loading} from "./components/Loading";
import { WelcomePage } from "./components/WelcomePage";
import { PageWrapper } from "./components/PageWrapper";
import { useNavigation } from "./context/NavigationContext";

export default function HomePage() {
  const { data: session, status } = useSession();
  const { direction } = useNavigation();


  if (status === "loading") {
    return(
      <div className="min-h-screen bg-gray-100 ">
    <PageWrapper direction={direction}>
      <Loading />
    </PageWrapper>
      </div>)
  }

  return (
    <PageWrapper direction={direction}>

    <div className="mb-10 flex flex-col items-center min-h-3/4 py-2 px-4">
      <WelcomePage />
      <h1 className="-mt-20 text-4xl font-bold mb-4">Welcome to Spiritual Thoughts</h1>
      {session ? (
        <>
          <p className="text-lg mb-8 text-center max-w-md">
            Hello, {session.user?.name}! Ready to let your soul speak? 
          </p>
          <Link
            href="/feed"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            View Feed
          </Link>
        </>
      ) : (
        <>
          <p className="text-lg mb-8 text-center max-w-md">
            Share your spiritual thoughts and connect with others. Let the power
            of collective positivity turn thoughts into reality.
          </p>
          <div className="flex space-x-4 ">
            <Link
              href="/auth/signin"
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              Register
            </Link>
          </div>
        </>
      )}
    </div>
    </PageWrapper>
  );
}
