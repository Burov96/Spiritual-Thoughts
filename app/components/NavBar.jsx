"use client";

import { useSession, signOut } from "next-auth/react";
import { useContext, useState, useRef } from "react";
import { NotificationContext } from "../NotificationProvider";
import Link from "next/link";
import Hamburger from "./Hamburger";
import { useOutsideClick } from "../utils/outsideClidkFunctionRuner";
import ProfileIcon from "./ProfileIcon";
import FeedIcon from "./FeedIcon";
import LogOutIcon from "./LogOutIcon";

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
    }, 1000);
  };

  return (
  <>
    <nav className="rounded-md md:my-9 w-full bg-gray-800 text-white  pl-5 md:p-4 flex justify-between items-center relative z-20" ref={menuRef}>
    {isMobileMenuOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10  duration-500 transition-opacity"></div>
    )}
      <Link href="/" className="md:text-2xl text-center text-2xl font-bold">
        Spiritual Thoughts
      </Link>
      <div className="hidden md:flex space-x-4">
        {session ? (
          <>
            <Link href="/profile">
            Profile
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
            <div className={`absolute top-32 ${isMobileMenuOpen?"right-4":"-right-40"} transition-all bg-gray-800 p-4 rounded-md z-30 border-2 border-emerald-300`}  ref={userMenuException}>
            {session ? (
              <div>
                <Link href="/profile" className="flex hover:underline my-4">
            <ProfileIcon />
                Profile
                </Link>
                <Link href="/feed" className="flex hover:underline my-4">
                <FeedIcon />
                  Feed
                </Link>
                <button onClick={handleSignOut} className="hover:underline my-4 flex">
                  <LogOutIcon />
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