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
    const currentIndex = navItems.findIndex(item => item.path === pathname);
    const targetIndex = navItems.findIndex(item => item.path === targetPath);
    setDirection(targetIndex > currentIndex ? 1 : -1);
    router.push(targetPath);
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useOutsideClick(menuRef, () => setIsMobileMenuOpen(false), exception, userMenuException);

  const handleSignOut = () => {
    showNotification("See ya, " + session?.user?.name, "goodbye");
    setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 1000);
  };

  return (
    <nav className="rounded-lg md:my-9 w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white pl-5 md:px-8 md:py-6 flex justify-between items-center relative z-20 shadow-lg border border-gray-700" ref={menuRef}>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10 duration-500 transition-opacity"></div>
      )}
      
      <Link 
        href="/" 
        className={`md:text-2xl text-center text-2xl font-bold transition-all duration-300 hover:text-emerald-300 ${
          pathname === '/' ? 'text-emerald-300' : 'text-white'
        }`}
        onClick={() => handleNavigation('/')}
      >
        Spiritual Thoughts
      </Link>
      
      {/* DESKTOP VIEW */}
      <div className="hidden md:flex items-center space-x-6">
        {session ? (
          <>
            {navItems.map((item) => {
              if (item.path === '/') return null;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 border ${
                    isActive
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-semibold'
                      : 'text-gray-300 border-transparent hover:border-emerald-400/50 hover:bg-gray-800 hover:text-white hover:scale-105'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <button 
              onClick={handleSignOut} 
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 border border-gray-600 hover:border-red-400/60 hover:bg-red-950/30 hover:text-red-300 hover:scale-105 ml-2"
            >
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <Link 
              href="/auth/signin" 
              className={`px-6 py-2 rounded-lg transition-all duration-300 border ${
                pathname === '/auth/signin'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-semibold'
                  : 'border-emerald-600/60 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:scale-105'
              }`}
            >
              Sign In
            </Link>
            
            <Link 
              href="/auth/register" 
              className={`px-6 py-2 rounded-lg transition-all duration-300 border ${
                pathname === '/auth/register'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-semibold'
                  : 'border-emerald-600/60 text-emerald-300 hover:bg-emerald-600 hover:text-white hover:scale-105'
              }`}
            >
              Register
            </Link>
          </>
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden flex space-x-4 cursor-pointer">
        <button onClick={toggleMenu} ref={exception}>
          <Hamburger open={isMobileMenuOpen} />
        </button>

        <div 
          className={`absolute top-32 ${isMobileMenuOpen ? "right-4" : "-right-60"} transition-all duration-300 bg-gray-800/95 backdrop-blur-md p-4 rounded-xl z-30 border-2 border-emerald-400/80 shadow-2xl w-48`}  
          ref={userMenuException}
        >
          {session ? (
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => handleNavigation('/profile')}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all w-full text-left ${
                  pathname === '/profile' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40' : 'hover:bg-gray-700/60 text-gray-200'
                }`}
              >
                <div className="scale-125 ml-1">
                  <ProfileIcon />
                </div>
                <span className="ml-2">Profile</span>
              </button>

              <button 
                onClick={() => handleNavigation('/feed')}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all w-full text-left ${
                  pathname === '/feed' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40' : 'hover:bg-gray-700/60 text-gray-200'
                }`}
              >
                <div className="scale-125 ml-1">
                  <FeedIcon />
                </div>
                <span className="ml-2">Feed</span>
              </button>

              <button 
                onClick={() => handleNavigation('/chat')}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all w-full text-left ${
                  pathname === '/chat' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40' : 'hover:bg-gray-700/60 text-gray-200'
                }`}
              >
                <div className="scale-125 ml-1">
                  <MessagesIcon />
                </div>
                <span className="ml-2">Messages</span>
              </button>

              <hr className="border-gray-700 my-1" />

              <button 
                onClick={handleSignOut} 
                className="flex items-center space-x-3 p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-all w-full text-left"
              >
                <div className="scale-125 ml-1">
                  <LogOutIcon />
                </div>
                <span className="ml-2">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link 
                href="/auth/signin" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block p-2 rounded-lg text-center transition-all ${
                  pathname === '/auth/signin' 
                    ? 'bg-emerald-600 text-white font-bold border border-emerald-400' 
                    : 'border border-emerald-600/60 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block p-2 rounded-lg text-center transition-all ${
                  pathname === '/auth/register' 
                    ? 'bg-emerald-600 text-white font-bold border border-emerald-400' 
                    : 'border border-emerald-600/60 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}