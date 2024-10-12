"use client";

import { useSession, signOut } from "next-auth/react";
import { useContext, useState, useRef } from "react";
import { NotificationContext } from "../NotificationProvider";
import Link from "next/link";
import Hamburger from "./Hamburger";
import { useOutsideClick } from "../utils/outsideClidkFunctionRuner";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { showNotification } = useContext(NotificationContext);
  const menuRef = useRef(null);
  const exception = useRef(null);
  const userMenuException = useRef(null);
  const toggleMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useOutsideClick(menuRef, () => setIsMobileMenuOpen(false), exception, userMenuException);

  const handleSignOut = () => {
    showNotification("See ya, " + session.user.name, "goodbye");
    setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 2000);
  };

  return (
  <>
    <nav className="rounded-md my-9 w-full bg-gray-800 text-white p-4 flex justify-between items-center relative z-20" ref={menuRef}>
    {isMobileMenuOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10  duration-500 transition-opacity"></div>
    )}
      <Link href="/" className="md:text-2xl text-l font-bold">
        Spiritual Thoughts
      </Link>
      <div className="hidden md:flex space-x-4">
        {session ? (
          <>
            <Link href="/profile">Profile
            </Link>
            <Link href="/feed" className="hover:underline">
              Feed
            </Link>
            <button onClick={handleSignOut} className="hover:underline">
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="hover:underline">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
        </div>
        <div className="md:hidden flex space-x-4 cursor-pointer">
          <button onClick={toggleMenu} ref={exception}>
            <Hamburger open={isMobileMenuOpen} />
          </button>
            <div className={`absolute top-32 ${isMobileMenuOpen?"right-4":"-right-32"} transition-all bg-gray-800 p-4 rounded-md z-30 border-2 border-emerald-300`}  ref={userMenuException}>
            {session ? (
              <div>
                <Link href="/profile">Profile
                </Link>
                <Link href="/feed" className="block hover:underline mb-2">
                  Feed
                </Link>
                <button onClick={handleSignOut} className="hover:underline">
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <Link href="/auth/signin" className="block hover:underline mb-2">
                  Sign In
                </Link>
                <Link href="/auth/register" className="block hover:underline">
                  Register
                </Link>
              </div>
            )}
            </div>
        </div>
      </nav>
    </>
  );
}