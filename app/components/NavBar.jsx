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
import MessagesIcon from "./MessagesIcon";
import { usePathname, useRouter } from "next/navigation";
import { useNavigation } from "../context/NavigationContext"; 

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/chat', label: 'Messages' },
  { path: '/profile', label: 'Profile' },
  { path: '/feed', label: 'Feed' },
];

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { showNotification } = useContext(NotificationContext);
  const { setDirection } = useNavigation();
  const menuRef = useRef(null);
  const exception = useRef(null);
  const userMenuException = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (targetPath) => {
    console.log("Target path is: "+targetPath)
    const currentIndex = navItems.findIndex(item => item.path === pathname) 
    const targetIndex = navItems.findIndex(item => item.path === targetPath) 
    console.log(targetIndex > currentIndex ?"forward" : "back");
    setDirection(targetIndex > currentIndex ? 1 : -1);
    router.push(targetPath);
  };

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
    <nav className="rounded-lg md:my-9 w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white pl-5 md:px-8 md:py-6 flex justify-between items-center relative z-20 shadow-lg border border-gray-700" ref={menuRef}>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10 duration-500 transition-opacity"></div>
        )}
        
        <Link href="/" className="md:text-2xl text-center text-2xl font-bold transition-all duration-300 hover:text-emerald-300" 
                  onClick={() => handleNavigation('/')}
                  >
          Spiritual Thoughts
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          {session ? (
            <>
              {navItems.map((item) => item.path !== '/' && (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 
                    ${pathname === item.path 
                      ? 'bg-gray-700 text-emerald-300' 
                      : 'hover:bg-gray-700 hover:text-emerald-300'} 
                    hover:scale-105`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
              
              <button 
                onClick={handleSignOut} 
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 border border-gray-600 hover:bg-gray-700 hover:text-emerald-300 hover:scale-105"
              >
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/auth/signin" 
                className="px-6 py-2 rounded-lg transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 hover:scale-105"
              >
                Sign In
              </Link>
              
              <Link 
                href="/auth/register" 
                className="px-6 py-2 rounded-lg transition-all duration-300 border border-emerald-600 hover:bg-emerald-600 hover:scale-105"
              >
                Register
              </Link>
            </>
          )}
        </div>
        <div className="md:hidden flex space-x-4 cursor-pointer">
        {/* MOBILE VIEW */}
          <button onClick={toggleMenu} ref={exception}>
            <Hamburger open={isMobileMenuOpen} />
          </button>
            <div className={`absolute top-32 ${isMobileMenuOpen?"right-4":"-right-40"} transition-all bg-gray-800 p-4 rounded-md z-30 border-2 border-emerald-300`}  ref={userMenuException}>
            {session ? (
              <div>
                <Link href="/profile" className="flex hover:underline my-4">
                <div className="scale-150">
            <ProfileIcon />
                </div>
                Profile
                </Link>
                <Link href="/feed" className="flex hover:underline my-4">
                <div className="scale-150">
                <FeedIcon />
                </div>
                <div className="ml-1 mt-2">
                  Feed
                </div>
                </Link>
                <Link href="/chat" className="flex hover:underline my-4">
                <MessagesIcon />
                <div className="ml-1 mt-2">
                  Messages
                  </div>
                </Link>
                <button onClick={handleSignOut} className="hover:underline my-4 flex">
                  <LogOutIcon />
                  <div className="ml-1 mt-2">
                  Sign Out
                  </div>
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
  );
}