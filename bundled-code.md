# Bundled Next.js Application Code

## File: app/feed/page.jsx
```jsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Post from "@/app/components/Post";
import PostForm from "@/app/components/PostForm";
import { useNotification } from "@/app/NotificationProvider"; // Correct import
import { useRouter } from "next/navigation";
import Loading from "@/app/components/Loading";

export default function Feed() {
  const { showNotification } = useNotification(); // Use the hook directly
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated" && router.pathname !== "/") {
      showNotification("First login to see the feed", "failure");
      router.push("/login");
    } else if (status === "authenticated") {
      fetch("/api/posts")
        .then((res) => res.json())
        .then((data) => setPosts(data))
        .catch(() => {
          showNotification("Failed to load posts", "failure");
        });
    }
  }, [status, router.pathname, showNotification]);

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <div className="max-w-xl mx-auto">
      <PostForm onPostAdded={() => fetchPosts(setPosts, showNotification)} />
      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <Post key={post.id} post={post} onPostUpdated={() => fetchPosts(setPosts, showNotification)} />
        ))}
      </div>
    </div>
  );
}

// Helper function to fetch posts
const fetchPosts = async (setPosts, showNotification) => {
  try {
    const res = await fetch("/api/posts");
    if (!res.ok) {
      throw new Error("Failed to fetch posts");
    }
    const data = await res.json();
    setPosts(data);
  } catch (error) {
    console.error(error);
    showNotification("Failed to load posts", "failure");
  }
};

```

## File: app/context/NotificationContext.tsx
```tsx
// app/context/NotificationContext.tsx

"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Notification } from "../components/Notification";
import {
  NotificationType,
  NotificationItem,
  Action,
  State,
  NotificationContextProps,
} from "../notificationTypes";

// Create the Notification Context with default undefined
const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

// Reducer function to handle state transitions
const notificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_NOTIFICATION": {
      const { message, type, persistent = false } = action.payload;

      // Determine the smallest missing ID
      const sortedIds = [...state.notifications.map((n) => n.id)].sort(
        (a, b) => a - b
      );
      let smallestMissingId = 1;
      for (const id of sortedIds) {
        if (id === smallestMissingId) {
          smallestMissingId++;
        } else {
          break;
        }
      }
      const id =
        smallestMissingId <= state.nextId ? smallestMissingId : state.nextId;

      // Add the new notification
      const newNotifications: NotificationItem[] = [
        ...state.notifications,
        { id, message, type, persistent },
      ];

      // Update available IDs and nextId
      const newAvailableIds = state.availableIds.filter(
        (existingId) => existingId !== id
      );
      const newNextId =
        smallestMissingId <= state.nextId ? state.nextId : state.nextId + 1;

      return {
        ...state,
        notifications: newNotifications,
        availableIds: newAvailableIds,
        nextId: newNextId,
      };
    }
    case "REMOVE_NOTIFICATION": {
      const idToRemove = action.payload;

      const newNotifications = state.notifications.filter(
        (n) => n.id !== idToRemove
      );
      const newAvailableIds = [...state.availableIds, idToRemove].sort(
        (a, b) => a - b
      );

      return {
        ...state,
        notifications: newNotifications,
        availableIds: newAvailableIds,
      };
    }
    default:
      return state;
  }
};

// Helper function to find the smallest missing ID
const findSmallestMissingId = (ids: number[]): number => {
  const sortedIds = [...ids].sort((a, b) => a - b);
  let smallestMissingId = 1;
  for (const id of sortedIds) {
    if (id === smallestMissingId) {
      smallestMissingId++;
    } else {
      break;
    }
  }
  return smallestMissingId;
};

// NotificationProvider Component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const initialState: State = {
    notifications: [],
    availableIds: [],
    nextId: 1,
  };

  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const hoveredNotifications = useRef<Set<number>>(new Set());

  // Function to show a new notification
  const showNotification = useCallback(
    (message: string, type: NotificationType, persistent: boolean = false) => {
      const id = findSmallestMissingId(state.notifications.map((n) => n.id));
      const finalId = id <= state.nextId ? id : state.nextId;

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message, type, persistent },
      });

      // Set timer to remove the notification after 3 seconds if not persistent
      if (!persistent) {
        const timer = setTimeout(() => {
          if (!hoveredNotifications.current.has(finalId)) {
            dispatch({ type: "REMOVE_NOTIFICATION", payload: finalId });
            timers.current.delete(finalId);
          }
        }, 3000);

        timers.current.set(finalId, timer);
      }
    },
    [state.notifications, state.nextId]
  );

  // Function to remove a notification manually
  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    hoveredNotifications.current.delete(id);
  }, []);

  // Function to handle hover events
  const handleNotificationHover = useCallback((id: number, isHovered: boolean) => {
    if (isHovered) {
      hoveredNotifications.current.add(id);
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    } else {
      hoveredNotifications.current.delete(id);
      const shouldPersist = state.notifications.find((n) => n.id === id)?.persistent;
      if (!shouldPersist) {
        const newTimer = setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
          timers.current.delete(id);
        }, 3000);
        timers.current.set(id, newTimer);
      }
    }
  }, [state.notifications]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
      hoveredNotifications.current.clear();
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      showNotification,
      removeNotification,
      notifications: state.notifications,
    }),
    [showNotification, removeNotification, state.notifications]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {state.notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onRemove={removeNotification}
          onHover={handleNotificationHover}
        />
      ))}
    </NotificationContext.Provider>
  );
};
```

## File: app/_app.js
```js
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;

```

## File: app/hooks/useNotification.js
```js
import { useContext } from "react";
import { NotificationContext } from "../NotificationProvider";

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

```

## File: app/hooks/usePosts.ts
```ts
"use client";
import React from "react";
import { useState, useTransition}  from 'react';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const addPost = async (title:String) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        });
        if (!response.ok) {
          throw new Error('Failed to add post');
        }
        const newPost = await response.json();
        setPosts((prevPosts) => [...prevPosts, newPost]);
      } catch (err) {
        setError(err.message);
      }
    });
  };

  const deletePost = async (id) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete post');
        }
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
      } catch (err) {
        setError(err.message);
      }
    });
  };

  // Fetch posts on component mount
  React.useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchPosts();
  }, []);

  return {
    posts,
    addPost,
    deletePost,
    isLoading: isPending,
    error,
  };
}

```

## File: app/profile/page.jsx
```jsx
'use client'

import { useRouter } from "next/navigation";
import Loading from "../components/Loading"
import { useNotification } from "../NotificationProvider";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {ProfileForm} from "@/app/components/ProfileForm"

export default function Profile(){
  const {data:session, status} = useSession();
  const [userData, setUserData] = useState(null);
  const {showNotification} = useNotification();
  const router = useRouter();
  useEffect(() => {
  if (status==="loading"){
    return <Loading/>
  }
  if(!session){
    router.push("/login");
    showNotification("In order to access your profile, first login","failure");
  }
  else{
    fetch(`/api/profile/`)
    .then((res) => res.json())
    .then((data) => setUserData(data))
    .catch((err) => showNotification(err,"failure"));
  }},[status, session])
  return(
    <div className="profile-counter">
      <h1>Your Profile</h1>
      {userData&&
      <ProfileForm user={userData} />
      }
    </div>
  )
}
```

## File: app/profile/[id]/page.jsx
```jsx
// app/profile/[id]/page.jsx
"use client"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import FollowButton from "@/app/components/FollowButton"

export default function Profile() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (id) {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => setUser(data))
    }
  }, [id])

  if (!user) return <p>Loading...</p>

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <img src={user.avatar || "/default-avatar.png"} alt="Avatar" className="w-24 h-24 rounded-full mx-auto" />
      <h2 className="text-xl text-center mt-2">{user.name}</h2>
      <p className="text-center text-gray-500">{user.email}</p>
      <div className="mt-4">
        <h3 className="font-semibold">Interests:</h3>
        <ul className="list-disc list-inside">
          {user.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </div>
      <FollowButton userId={user.id} />
    </div>
  )
}

```

## File: app/protected/page.jsx
```jsx
// app/protected/page.jsx
"use client"
import { useSession } from "next-auth/react"

export default function ProtectedPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (!session) {
    return <p>You must be logged in to view this page.</p>
  }

  return <div>Welcome, {session.user.name}!</div>
}

```

## File: app/NotificationProvider.tsx
```tsx
"use client";

import React, { createContext, useReducer, useMemo, useCallback, useState, useRef, useEffect } from "react";
import { Notification } from "./components/Notification";
import { NotificationProps, NotificationType, State, Action } from "./notificationTypes";

// Create the Notification Context
export const NotificationContext = createContext<{
  showNotification: (message: string, type: NotificationType, persistent?: boolean) => void;
  removeNotification: (id: number) => void;
  notifications: NotificationProps[];
} | undefined>(undefined);

// Initial state for the reducer
const initialState: State = {
  availableIds: [],
  notifications: [],
  nextId: 1,
};

// Reducer function to handle state transitions
const notificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
        nextId: state.nextId + 1,
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    default:
      return state;
  }
};

// Helper function to find the smallest missing ID
const findSmallestMissingId = (ids: number[]): number => {
  const sortedIds = [...ids].sort((a, b) => a - b);
  let smallestMissingId = 1;
  for (const id of sortedIds) {
    if (id === smallestMissingId) {
      smallestMissingId++;
    } else {
      break;
    }
  }
  return smallestMissingId;
};

// NotificationProvider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [hoveredNotifications, setHoveredNotifications] = useState<Set<number>>(new Set());
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const handleNotificationHover = useCallback((id: number, isHovered: boolean) => {
    setHoveredNotifications(prev => {
      const newSet = new Set(prev);
      if (isHovered) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Function to show a new notification
  const showNotification = useCallback((message: string, type: NotificationType, persistent = false) => {
    const currentIds = state.notifications.map((n) => n.id);
    const id = findSmallestMissingId(currentIds);

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: { id, message, type, persistent },
    });

    // Set timer to remove the notification after 3 seconds
    if (!persistent) {
      const timer = setTimeout(() => {
        if (!hoveredNotifications.has(id)) {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
          timers.current.delete(id);
        }
      }, 3000);

      timers.current.set(id, timer);
    }
  }, [state.notifications, hoveredNotifications]);

  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setHoveredNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    showNotification,
    removeNotification,
    notifications: state.notifications,
  }), [showNotification, removeNotification, state.notifications]);
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {state.notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onRemove={removeNotification}
          onHover={handleNotificationHover}
        />
      ))}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

```

## File: app/example/page.tsx
```tsx
'use client'
import React, { useReducer } from 'react'

interface Action{
    type:"increment"|"decrement",
}

interface State{
    count:number,
    error:string|null|boolean
}

function page() {
function reducer(state:State, action:Action){
    const {type}=action;
    console.log(type)
    switch(type){
        case "increment":{
            const newCount = state.count + 1;
            if(newCount>10){
                return { ...state,error:"Count is too high!"}
            }
            return{ ...state,count:state.count+1, error:false}
        }
        case "decrement":{
            const newCount = state.count - 1;
            if(newCount<0){
                return { ...state,error:"Count is too low!"}
            }
            return { ...state,count:state.count--, error:false}
        }
    }
}

const [state,dispatch]=useReducer(reducer, {
    count:0,
    error:Boolean(false)
})

  return (
<div className={`flex flex-col align-middle items-center justify-center my-20 ${state.error ? " border-2 border-red-300" : ""}`}>
    <div>Currently it's:{state.count}</div>
    <button onClick={()=>dispatch({type:"increment"})} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-5'>Increment</button>
    <button onClick={()=>dispatch({type:"decrement"})} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-5'>Decrement</button>
    {state.error && <div className='text-red-500'>{state.error}</div>}
</div>
  )
}

export default page
```

## File: app/layout.tsx
```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { NotificationProvider } from "./NotificationProvider";

const geistSans = localFont({
  src: "../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Spiritual Thoughts",
  description: "Share your spiritual thoughts and connect with others.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <SessionProviderWrapper>
          <NotificationProvider>
          <NavBar />
          <main className="flex-grow">{children}</main>
          <Footer />
          </NotificationProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

```

## File: app/api/users/route.js
```js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const users = await prisma.user.findMany();

  return new Response(JSON.stringify(users), { status: 200 });
}

```

## File: app/api/users/[id].js
```js
// pages/api/users/[id].js
import prisma from "../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        interests: true,
      },
    })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json(user)
  }

  res.setHeader("Allow", ["GET"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/users/interests.js
```js
// pages/api/users/interests.js
import { getSession } from "next-auth/react"
import prisma from "../../../../prisma"

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    const { interests } = req.body
    await prisma.user.update({
      where: { email: session.user.email },
      data: { interests },
    })
    return res.status(200).json({ message: "Interests updated" })
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/users/[id]/follow.js
```js
// pages/api/users/[id]/follow.js
import { getSession } from "next-auth/react"
import prisma from "../../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        following: {
          connect: { id: parseInt(id) },
        },
      },
    })
    return res.status(200).json({ message: "Followed" })
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/users/[id]/unfollow.js
```js
// pages/api/users/[id]/unfollow.js
import { getSession } from "next-auth/react"
import prisma from "../../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        following: {
          disconnect: { id: parseInt(id) },
        },
      },
    })
    return res.status(200).json({ message: "Unfollowed" })
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/profile/route.js
```js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);

  if (!session) {
    console.log("No session found");
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, profilePicture: true },
    });

    console.log("User Data:", user);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Failed to load profile data" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);

  if (!session) {
    console.log("No session found");
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { name, email, profilePicture } = await request.json();
    console.log("Updating User:", { name, email, profilePicture });

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser && existingUser.id != session.user.id) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, email, profilePicture },
      select: { id: true, name: true, email: true, profilePicture: true },
    });

    console.log("Updated User:", updatedUser);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

```

## File: app/api/upload-avatar/route.js
```js
// app/api/upload-avatar/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { avatarUrl } = await request.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { avatarUrl },
  });

  return new Response(JSON.stringify({ message: "Avatar updated successfully" }), { status: 200 });
}

```

## File: app/api/posts/route.ts
```ts
// app/api/posts/route.ts

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        likes: true,
        prayers: true,
        influences: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify(posts), { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

export async function POST(request: Request) {
  // Handle creating a new post
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { content } = await request.json();

  if (!content || typeof content !== 'string') {
    return new Response(JSON.stringify({ message: "Invalid content" }), { status: 400 });
  }

  try {
    const post = await prisma.post.create({
      data: {
        content,
        author: { connect: { email: session.user.email } },
      },
    });

    return new Response(JSON.stringify(post), { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

```

## File: app/api/posts/[id]/influence/route.ts
```ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to like route");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = Number(params.id);

  try {
    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Toggle like: if already liked, remove; else, add
    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId: postId,
        userId: session.user?.id * 1,
        type: "like", // Assuming 'type' distinguishes like, dislike, etc.
      },
    });

    if (existingInfluence) {
      // Unlike the post
      await prisma.influence.delete({
        where: { id: existingInfluence.id },
      });
      console.log(`Post unliked with ID: ${postId}`);
      return NextResponse.json({ message: "Post unliked" }, { status: 200 });
    } else {
      // Like the post
      await prisma.influence.create({
        data: {
          type: "like",
          postId: postId,
          userId: session.user?.id * 1,
        },
      });
      console.log(`Post liked with ID: ${postId}`);
      return NextResponse.json({ message: "Post liked" }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Error liking/unliking post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

```

## File: app/api/posts/[id]/like.js
```js
// pages/api/posts/[id]/like.js
import { getSession } from "next-auth/react"
import prisma from "../../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    const like = await prisma.like.create({
      data: {
        user: { connect: { email: session.user.email } },
        post: { connect: { id: parseInt(id) } },
      },
    })
    return res.status(201).json(like)
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/posts/[id]/index.js
```js
// pages/api/posts/index.js
import prisma from "../../../../prisma"

export default async function handler(req, res) {
  if (req.method === "GET") {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
        likes: true,
        prayers: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return res.status(200).json(posts)
  }

  res.setHeader("Allow", ["GET"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/posts/[id]/pray.js
```js
// pages/api/posts/[id]/pray.js
import { getSession } from "next-auth/react"
import prisma from "../../../../../prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  if (req.method === "POST") {
    const prayer = await prisma.prayer.create({
      data: {
        user: { connect: { email: session.user.email } },
        post: { connect: { id: parseInt(id) } },
      },
    })
    return res.status(201).json(prayer)
  }

  res.setHeader("Allow", ["POST"])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

```

## File: app/api/posts/[id]/delete/route.ts
```ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to delete route");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = Number(params.id);

  try {
    // Check if the post exists and belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { influences: true },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    if (post.authorId != session.user?.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete related influences
    await prisma.influence.deleteMany({
      where: { postId: postId },
    });

    // Delete the post
    await prisma.post.delete({
      where: { id: postId },
    });

    console.log(`Post deleted with ID: ${postId}`);
    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

```

## File: app/api/posts/[id]/influence.ts
```ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to influence route");
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { type } = await request.json();
  const postId = Number(params.id);

  // Input validation
  if (!type || typeof type !== 'string') {
    console.log("Invalid influence type");
    return new Response(JSON.stringify({ message: "Invalid influence type" }), { status: 400 });
  }

  try {
    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    if (existingInfluence) {
      await prisma.influence.delete({
        where: {
          id: existingInfluence.id,
        },
      });
      console.log(`Influence removed for postId: ${postId}, userId: ${session.user.id}`);
      return new Response(JSON.stringify({ message: "Influence removed" }), { status: 200 });
    } else {
      await prisma.influence.create({
        data: {
          type,
          postId,
          userId: session.user.id,
        },
      });
      console.log(`Influence added for postId: ${postId}, userId: ${session.user.id}`);
      return new Response(JSON.stringify({ message: "Influence added" }), { status: 201 });
    }
  } catch (error) {
    console.error("Error adding/removing influence:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

```

## File: app/api/auth/[...nextauth]/route.js
```js
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.username },
        });

        if (user && (await compare(credentials.password, user.password))) {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (token && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

```

## File: app/api/auth/register/route.js
```js
// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const { name, email, password } = await request.json();

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json(user);
}

```

## File: app/auth/register.js
```js
// pages/api/auth/register.js
import prisma from "../../../lib/prisma"
import bcrypt from "bcrypt"

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, email, password, interests } = req.body
    const avatar = req.files?.avatar ? `/avatars/${req.files.avatar.newFilename}` : null
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          avatar,
          interests: JSON.parse(interests),
        },
      })
      res.status(201).json({ message: "User created", user })
    } catch (error) {
      res.status(400).json({ message: "User creation failed", error })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

```

## File: app/auth/signin/page.jsx
```jsx
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

```

## File: app/auth/register/page.jsx
```jsx
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
        showNotification("Registration successful, welcome to Spiritual Thoughts, "+name+"!", "success")
        router.push("/auth/signin");
      } else {
        showNotification('Registration was not successfull, please try again after a while. It\'s not you, it us!', 'failure')
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
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2 w-80">
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

```

## File: app/NotificationProvider old.jsx
```jsx
"use client";
import { createContext, useCallback, useState } from "react";
import { Notification } from "./components/Notification";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  const showNotification = (message, type) => {
    const id = nextId;
    setNextId(prevId => prevId + 1);
    setNotifications(prev => [...prev, { id, message, type }]);

    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
        setNextId(prevId => {
          const currentIds = notifications.map(notification => notification.id);
          const smallestMissingId = findSmallestMissingId(currentIds);
          return smallestMissingId !== null ? smallestMissingId : prevId;
        });
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  };

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setNextId(prevId => {
      const currentIds = notifications.map(notification => notification.id);
      const smallestMissingId = findSmallestMissingId(currentIds);
      return smallestMissingId !== null ? smallestMissingId : prevId;
    });
  }, [notifications]);

  const findSmallestMissingId = (ids) => {
    const sortedIds = ids.sort((a, b) => a - b);
    let smallestMissingId = 1;
    for (const id of sortedIds) {
      if (id === smallestMissingId) {
        smallestMissingId++;
      } else {
        break;
      }
    }
    return smallestMissingId <= ids.length ? smallestMissingId : null;
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      {children}
    </NotificationContext.Provider>
  );
};

```

## File: app/notificationTypes.ts
```ts
// app/notificationTypes.ts

export type NotificationType =
  | "success"
  | "failure"
  | "goodbye"
  | "removed"
  | "favourite"
  | "delete"
  | "uploaded"
  | "warning";

export interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
  persistent?: boolean;
}

export interface NotificationProps extends NotificationItem {
  onRemove: (id: number) => void;
  onHover: (id: number, isHovered: boolean) => void;
}

export type Action =
  | { type: "ADD_NOTIFICATION"; payload: Omit<NotificationItem, "onRemove" | "onHover"> }
  | { type: "REMOVE_NOTIFICATION"; payload: number };

export interface State {
  notifications: NotificationItem[];
  availableIds: number[];
  nextId: number;
}

export interface NotificationContextProps {
  showNotification: (
    message: string,
    type: NotificationType,
    persistent?: boolean
  ) => void;
  removeNotification: (id: number) => void;
  notifications: NotificationItem[];
}

```

## File: app/utils/outsideClidkFunctionRuner.js
```js
import { useEffect } from "react";

export function useOutsideClick(ref, callback, exception, exception2) {
  let e;
  useEffect(() => {
    function handleClickOutside(event) {
      e = event.target;
      if (!exception?.current?.contains(e) && !exception2?.current?.contains(e)) {
        if (ref.current && !ref.current.contains(e)){
          callback(false);
        } else {
          callback(true);
        }
      }
      if (exception2?.current?.contains(e)){
        setTimeout(() => {
            callback(true);
          }, 70);
        }
      

    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}
```

## File: app/components/Post.tsx
```tsx
// app/components/Post.tsx

"use client";

import { useSession } from "next-auth/react";
import { useState, useContext } from "react";
import Image from "next/image";
import Like from "./Like";
import { useNotification } from "@/app/hooks/useNotification";
import { revalidatePath } from "next/cache";

export interface User {
  id: number;
  name: string;
  profilePicture: string;
  email: string;
}

interface Influence {
  id: number;
  type: string;
  user: User;
}

interface PostProps {
  // {
  //   "id": 1,
  //   "content": "In the realm of code and spirit, remember: while bugs may haunt your app like restless spirits, patience and debugging are the sage's path to enlightenment.",
  //   "authorId": 1,
  //   "createdAt": "2024-09-27T12:40:42.639Z",
  //   "author": {
  //     "id": 1,
  //     "name": "Teodor",
  //     "email": "burov96@gmail.com",
  //     "profilePicture": "https://img.freepik.com/free-vector/groovy-hippie-with-peace-sunglasses_1308-162780.jpg?t=st=1728640246~exp=1728643846~hmac=fb9d30601d398104869f84cf42f8ed0008866423ebef234db9733880ac211844&w=1800",
  //     "password": "$2a$12$sMlUXfIOV.zqs/fryhUFOuMDW3IDuL4u7skw9Mqhohl9Pz6T5mADO",
  //     "avatar": null
  //   },
  //   "likes": [],
  //   "prayers": [],
  //   "influences": [
  //     {
  //       "id": 391,
  //       "type": "feel",
  //       "postId": 1,
  //       "userId": 1,
  //       "user": {
  //         "id": 1,
  //         "name": "Teodor",
  //         "email": "burov96@gmail.com",
  //         "profilePicture": "https://img.freepik.com/free-vector/groovy-hippie-with-peace-sunglasses_1308-162780.jpg?t=st=1728640246~exp=1728643846~hmac=fb9d30601d398104869f84cf42f8ed0008866423ebef234db9733880ac211844&w=1800",
  //         "password": "$2a$12$sMlUXfIOV.zqs/fryhUFOuMDW3IDuL4u7skw9Mqhohl9Pz6T5mADO",
  //         "avatar": null
  //       }
  //     }
  //   ]
  // }
  post: {
    authorId: number;
    createdAt: string;
    author: User;
    avatar: string;
    likes: [];
    prayers: [];
    influences: Influence[];
    id: number;
    content: string;
  };
}

export default function Post({ post }: PostProps, { setRerenders }: { setRerenders: void }) {
  const { data: session } = useSession();
  const [influenced, setInfluenced] = useState(post.influences.length || 0);
  const [userInfluenced, setUserInfluenced] = useState(
    post.influences.some((influence) => influence.user.id == session?.user?.id)
  );
  const { showNotification } = useNotification();
const isAuthor = session?.user?.email === post.author.email;
  const handleInfluence = async () => {
    if (!session) {
      showNotification("First login in order to interact with posts.", "failure");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/influence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "feel" }),
      });
      const data = await response.json();
      // console.log(data)
      if (response.ok) {
        if (data.message === "Post liked") {
          setInfluenced((prev) => prev + 1);
          setUserInfluenced(true);
          showNotification("Successfully liked the post!", "success");
        } else if (data.message === "Post unliked") {
          setInfluenced((prev) => prev - 1);
          setUserInfluenced(false);
          showNotification("Successfully unliked the post.", "success");
        }
      } else {
        showNotification(data.message || "Something went wrong.", "failure");
      }
    } catch (error) {
      console.log(error)
    }
  };
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post }),
      });
      const data = await response.json();
      if (response.ok && data.message === "Post deleted successfully") {
          showNotification("Successfully deleted the post!", "success");
          revalidatePath("/feed");
      } else {
        showNotification(data.message || "Something went wrong.", "failure");
      }
    } catch (error) {
      console.log(error)
      // showNotification("An error occurred while deleting the post. Please try again.", "failure");
    }
  };

  return (
    <div className="p-4 border rounded shadow hover:shadow-xl">
      <p>{post.content}</p>
      <div className="flex space-x-4 mt-2">
        <button onClick={handleInfluence} className="text-purple-500">
          {<Like userInfluenced={userInfluenced} />}
           ({influenced})
        </button>
      </div>
      <div className="mt-4">
        {post.influences.map((influence) => (
          <div key={influence.id} className="flex items-center space-x-2">
            <Image
              src={influence.user.profilePicture}
              alt={influence.user.name.substring(0,3) + ".."}
              width={24}
              height={24}
              className="rounded-full"
              />
            <span>{influence.user.name}</span>
          </div>
        ))}
      </div>
      {isAuthor&& 
      (<div onClick={ handleDelete } className="flex flex-row-reverse top cursor-pointer">❌</div>)}
    </div>
  );
}

```

## File: app/components/Notification.tsx
```tsx
// app/components/Notification.tsx

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { NotificationProps } from "../notificationTypes";
import Thrash from "./Thrash";
import styles from "./Notification.module.css";

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  id,
  onRemove,
  onHover,
  persistent = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    onRemove(id);
  }, [id, onRemove]);

  const handleMouseEnter = useCallback(() => {
    onHover(id, true);
  }, [id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(id, false);
  }, [id, onHover]);

  useEffect(() => {
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 20);

    return () => {
      clearTimeout(showTimeout);
    };
  }, []);

  return (
    message && (
      <div
        className={`${styles.notification} ${styles[type]} ${
          isVisible ? styles.fadeIn : styles.fadeOut
        }`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          top: `${10 + id * 7}rem`, // Adjust stacking based on ID
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.iconContainer}>
          {type === "success" ? (
            <DotLottiePlayer src="/images/success.lottie" autoplay={true} />
          ) : type === "failure" ? (
            <DotLottiePlayer src="/images/failure.lottie" autoplay={true} />
          ) : type === "goodbye" ? (
            <DotLottiePlayer src="/images/goodbye.lottie" autoplay={true} />
          ) : type === "removed" ? (
            <DotLottiePlayer
              src="/images/removed.lottie"
              autoplay={true}
              direction={-1}
            />
          ) : type === "favourite" ? (
            <DotLottiePlayer src="/images/favourite.lottie" autoplay={true} />
          ) : type === "delete" ? (
            <DotLottiePlayer src="/images/delete.lottie" autoplay={true} />
          ) : type === "uploaded" ? (
            <DotLottiePlayer src="/images/uploaded.lottie" autoplay={true} />
          ) : (
            <DotLottiePlayer src="/images/warning.lottie" autoplay={true} />
          )}
        </div>
        <div className={styles.message}>{message}</div>
        <button
          onClick={handleClose}
          className={styles.closeButton}
          aria-label="Close notification"
        >
          <Thrash />
        </button>
      </div>
    )
  );
};

export { Notification };

```

## File: app/components/FetchUsers.jsx
```jsx
"use client"
import { useEffect, useState } from "react"

export default function FetchUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function getUsers() {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data)
    }
    getUsers()
  }, [])

  return (
    <div>
      <h2>Registered Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  )
}

```

## File: app/components/NavBar.jsx
```jsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useContext, useState, useRef } from "react";
import { NotificationContext } from "../NotificationProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hamburger from "./Hamburger";
import { useOutsideClick } from "../utils/outsideClidkFunctionRuner";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { showNotification } = useContext(NotificationContext);
  const router = useRouter();
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
```

## File: app/components/AvatarUpload.jsx
```jsx
// components/AvatarUpload.jsx
"use client"
import { useState } from "react"

export default function AvatarUpload() {
  const [file, setFile] = useState(null)

  const handleUpload = async (e) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    })
    const data = await res.json()
    // Update user profile with avatar URL
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
        Upload Avatar
      </button>
    </div>
  )
}

```

## File: app/components/InterestsList.jsx
```jsx
export default function InterestsList({ interests }) {
    return (
      <ul className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <li key={interest} className="px-2 py-1 bg-gray-200 rounded">
            {interest}
          </li>
        ))}
      </ul>
    )
  }
  
```

## File: app/components/Loading.tsx
```tsx
import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';

interface LoadingProps {
  width?: number;
  height?: number;
}

const Loading: React.FC<LoadingProps> = ({ width = 700, height = 700 }) => {
  return (
    <div className=" flex justify-center align-middle loading-container">
      <DotLottiePlayer
        src="/images/loading.lottie"
        autoplay
        loop
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default Loading;

```

## File: app/components/Footer.jsx
```jsx
// app/components/Footer.jsx
"use client";

export default function Footer() {
  return (
    <footer className="rounded-md w-full bg-gray-800 text-white p-4 text-center">
      <p>&copy; {new Date().getFullYear()} Spiritual Thoughts. All rights reserved.</p>
    </footer>
  );
}

```

## File: app/components/Notification old.tsx
```tsx
"use client";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { useCallback, useEffect, useState } from "react";
import { NotificationProps, NotificationType } from "../notificationTypes";

const Notification:React.FC<NotificationProps> = ({ message, type, id}) => {
  const [fade, setFade] = useState(Boolean);
  const [opened, setOpened] = useState(Boolean);

  const handleClose = useCallback(() => {
    setFade(false);
    setOpened(false);
    setTimeout(() => {
    }, 300);
  }, []);

  useEffect(() => {
    const preTimeout = setTimeout(() => {
      setFade(true);
      setOpened(true);
    }, 20);

    const fadeTimeout = setTimeout(() => {
      setFade(false);
    }, 2700);

    const closeTimeout = setTimeout(() => {
      handleClose();
    }, 3000);

    console.log(id)
    return () => {
      clearTimeout(preTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(closeTimeout);
    };
  }, [id, handleClose]);


  return (
    message && (
      <div
        className={`z-[999] fixed top-10 md:top-32 right-1 w-60 md:w-80 h-16 md:h-24 bg-white p-4 rounded-lg shadow-md flex items-center justify-between hover:shadow-2xl transition-all duration-1000  opacity-0 md:scale-100 sm:scale-75`}
        style={{
          opacity: opened ? 1 : 0,
          transform: `translateX(${fade ? -40 : opened ? -10 : 100}px)`,
          top: `${10 + id*7}rem`,
        }}
      >
        <div className="w-20 h-20 flex items-center justify-center rounded-full">
            {type === "success" ? (
              <DotLottiePlayer src={"/images/success.lottie"} autoplay={true} />
            ) : type === "failure" ? (
              <DotLottiePlayer src={"/images/failure.lottie"} autoplay={true} />
            ) : type === "goodbye" ? (
              <DotLottiePlayer src={"/images/goodbye.lottie"} autoplay={true} />
            ) : type === "removed" ? (
              <DotLottiePlayer
                src={"/images/removed.lottie"}
                autoplay={true}
                direction={-1}
              />
            ) : type === "favourite" ? (
              <DotLottiePlayer
                src={"/images/favourite.lottie"}
                autoplay={true}
              />
            ) : type === "delete" ? (
              <DotLottiePlayer src={"/images/delete.lottie"} autoplay={true} />
            ) : type === "uploaded" ? (
              <DotLottiePlayer
                src={"/images/uploaded.lottie"}
                autoplay={true}
              />
            ) : (
              <DotLottiePlayer src={"/warning.lottie"} autoplay={true} />
            )
            }
        </div>
        <div className="text-gray-800 text-sm md:text-xl py-2">{message}</div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-800 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1.414-9.293a1 1 0 0 1 1.414-1.414L10 8.586l1.414-1.414a1 1 0 0 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 1 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 0 1-1.414-1.414L8.586 10 7.172 8.586a1 1 0 0 1 1.414-1.414L10 8.586l1.414-1.414a1 1 0 0 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 0 1-1.414-1.414L8.586 10 7.172 8.586a1 1 0 0 1 1.414-1.414L10 8.586l1.414-1.414a1 1 0 0 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 0 1-1.414-1.414L8.586 10 7.172 8.586a1 1 0 0 1 0-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    )
  );
};


export {  Notification };

```

## File: app/components/Thrash.tsx
```tsx
import {
  DotLottieCommonPlayer,
  DotLottiePlayer,
} from "@dotlottie/react-player";
import React, { useRef } from "react";

const Thrash: React.FC = () => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  const handleMouseEnter = () => {
    if (playerRef.current) {
      console.log("hovered");
      playerRef.current.setSpeed(3);
        playerRef.current.playSegments([10, 11], false);
    }
  };


  return (
    <div className="w-10 h-10">
      <DotLottiePlayer
        ref={playerRef}
        src={"images/thrash.lottie"}
        autoplay={false}
        loop={false}
        onMouseEnter={handleMouseEnter}
      />
    </div>
  );
};

export default Thrash;

```

## File: app/components/Avatars.jsx
```jsx
export default function Avatar({ src }) {
    return <img src={src || "/default-avatar.png"} alt="User Avatar" className="w-12 h-12 rounded-full" />
  }
  
```

## File: app/components/ProfileForm.jsx
```jsx
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
          src={profilePicture}
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

```

## File: app/components/FollowButton.jsx
```jsx
// components/FollowButton.jsx
"use client"
import { useSession } from "next-auth/react"
import { useState } from "react"

export default function FollowButton({ userId }) {
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)

  const handleFollow = async () => {
    await fetch(`/api/users/${userId}/follow`, { method: "POST" })
    setIsFollowing(true)
  }

  const handleUnfollow = async () => {
    await fetch(`/api/users/${userId}/unfollow`, { method: "POST" })
    setIsFollowing(false)
  }

  if (!session) return null

  return (
    <button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      className={`px-4 py-2 rounded ${
        isFollowing ? "bg-red-500 text-white" : "bg-blue-500 text-white"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  )
}

```

## File: app/components/SessionProviderWrapper.tsx
```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

## File: app/components/Hamburger.tsx
```tsx
import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef } from 'react';

interface BurgerOpened {
  open: boolean;
}

const Hamburger: React.FC<BurgerOpened> = ({ open }) => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  useEffect(() => {
        open?playerRef.current?.playSegments([30, 60], true):playerRef.current?.playSegments([40, 20], true);
    // if (playerRef.current) {
    //   if (open) {
    //     console.log(
    //         'otvori sa'
    //     )
    //     playerRef.current.playSegments([0, 20], true);
    //   } else {
    //     playerRef.current.playSegments([20,0], true);
    //   }
    // }
  }, [open]);

  return (
    <div className='w-20 '>
      <DotLottiePlayer
        ref={playerRef}
        src={"images/hamburger.lottie"}
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Hamburger;

```

## File: app/components/Like.tsx
```tsx
import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef } from 'react';

interface LikeProps {
  userInfluenced: boolean;
}

const Like: React.FC<LikeProps> = ({ userInfluenced }) => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  useEffect(() => {
    if (playerRef.current) {
setTimeout(() => {
  userInfluenced?playerRef.current?.playSegments([65, 67], true):playerRef.current?.playSegments([10, 0], true);
}, 70);
    }
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      if (userInfluenced) {
        playerRef.current.playSegments([0, 67], true);
      } else {
        playerRef.current.playSegments([40,0], true);
      }
    }
  }, [userInfluenced]);

  return (
    <div className='w-10 h-10'>
      <DotLottiePlayer
        ref={playerRef}
        src={"images/like2.lottie"}
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Like;

```

## File: app/components/RegisterForm.jsx
```jsx
// components/RegisterForm.jsx
"use client"
import { useState } from "react"

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: null,
    interests: [],
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "avatar") {
      setForm({ ...form, avatar: files[0] })
    } else if (name === "interests") {
      const selected = Array.from(e.target.selectedOptions, (option) => option.value)
      setForm({ ...form, interests: selected })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData()
    data.append("name", form.name)
    data.append("email", form.email)
    data.append("password", form.password)
    if (form.avatar) data.append("avatar", form.avatar)
    data.append("interests", JSON.stringify(form.interests))

    await fetch("/api/auth/register", {
      method: "POST",
      body: data,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <input name="name" type="text" placeholder="Name" onChange={handleChange} required className="p-2 border rounded" />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="p-2 border rounded" />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="p-2 border rounded" />
      <input name="avatar" type="file" accept="image/*" onChange={handleChange} className="p-2 border rounded" />
      <select name="interests" multiple onChange={handleChange} className="p-2 border rounded">
        <option value="Meditation">Meditation</option>
        <option value="Yoga">Yoga</option>
        <option value="Mindfulness">Mindfulness</option>
        <option value="Philosophy">Philosophy</option>
        <option value="Religion">Religion</option>
      </select>
      <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Register</button>
    </form>
  )
}

```

## File: app/components/lottieExample.jsx
```jsx
import { DotLottiePlayer } from "@dotlottie/react-player";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export const LottieExample = () => {
  const [dotLottie, setDotLottie] = useState(null);
  const [status, setStatus] = useState("idle");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loop, setLoop] = useState(true);

  // Calculating total frames and progress
  const totalFrames = dotLottie?.isLoaded ? dotLottie.totalFrames : 0;
  const progress = dotLottie?.isLoaded ? (currentFrame / totalFrames) * 100 : 0;

  // Effect for handling dotLottie events
  useEffect(() => {
    // Event handlers
    const onFrameChange = (event) => setCurrentFrame(event.currentFrame);
    const onPlay = () => setStatus("playing");
    const onPause = () => setStatus("paused");
    const onStop = () => setStatus("stopped");
    const onComplete = () => setStatus("completed");

    // Registering event listeners
    if (dotLottie) {
      dotLottie.addEventListener("frame", onFrameChange);
      dotLottie.addEventListener("play", onPlay);
      dotLottie.addEventListener("pause", onPause);
      dotLottie.addEventListener("stop", onStop);
      dotLottie.addEventListener("complete", onComplete);
    }

    // Cleanup
    return () => {
      if (dotLottie) {
        dotLottie.removeEventListener("frame", onFrameChange);
        dotLottie.removeEventListener("play", onPlay);
        dotLottie.removeEventListener("pause", onPause);
        dotLottie.removeEventListener("stop", onStop);
        dotLottie.removeEventListener("complete", onComplete);
      }
    };
  }, [dotLottie]);

  // Play or pause animation
  const playOrPause = () => {
    status === "playing" ? dotLottie?.pause() : dotLottie?.play();
  };

  // Toggle loop state
  const toggleLoop = (event) => setLoop(event.target.checked);

  // Seek functionality
  const onSeek = (event) => {
    const newFrame = (event.target.value / 100) * totalFrames;
    dotLottie.setFrame(newFrame);
  };

  const onSeekStart = () => status === "playing" && dotLottie.pause();
  const onSeekEnd = () => status !== "playing" && dotLottie.play();

  return (
    <div className="container">
      <DotLottiePlayer
        dotLottieRefCallback={setDotLottie}
        src="https://lottie.host/63e43fb7-61be-486f-aef2-622b144f7fc1/2m8UGcP8KR.json"
        autoplay
        loop={loop}
        style={{ maxWidth: "600px" }}
      />
      <a href="https://lottiefiles.com/animations/hiding-lolo-eH80VLpL27" target="_blank">
        Lolo Sticker - Hiding Lolo
      </a>
      <div>
        <button onClick={playOrPause}>
          {status === "playing" ? "⏸️" : "▶️"}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="0.01"
          value={progress}
          onChange={onSeek}
          onMouseDown={onSeekStart}
          onMouseUp={onSeekEnd}
        />
        <span>
          {Math.round(currentFrame)}/{totalFrames}
        </span>
        <input onChange={toggleLoop} checked={loop} type="checkbox" />
      </div>
    </div>
  );
};

```

## File: app/components/Button.jsx
```jsx
export default function Button({ children, onClick, className }) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
      >
        {children}
      </button>
    )
  }
  
```

## File: app/components/PostForm.jsx
```jsx
"use client";

import { useContext, useState } from "react";
import { useSession } from "next-auth/react";
import { NotificationContext } from "../NotificationProvider";
import { revalidatePath } from "next/cache";

export default function PostForm() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const {showNotification} = useContext(NotificationContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setContent((prev)=>prev.trim())
    content.length < 1 && showNotification("Please enter a thought first", 'failure');
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    showNotification("Thought posted successfully", 'success');
    setContent("");
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thought..."
        required
        className="p-2 border rounded"
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        Post Thought
      </button>
    </form>
  );
}

```

## File: app/components/Interests.jsx
```jsx
// components/Interests.jsx
"use client"
import { useState } from "react"

const availableInterests = ["Meditation", "Yoga", "Mindfulness", "Philosophy", "Religion"]

export default function Interests() {
  const [selected, setSelected] = useState([])

  const toggleInterest = (interest) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleSave = async () => {
    await fetch("/api/users/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selected }),
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableInterests.map((interest) => (
        <button
          key={interest}
          onClick={() => toggleInterest(interest)}
          className={`px-3 py-1 rounded ${
            selected.includes(interest) ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {interest}
        </button>
      ))}
      <button onClick={handleSave} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
        Save Interests
      </button>
    </div>
  )
}

```

## File: app/page.tsx
```tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Loading from "./components/Loading";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return(
    <div className="min-h-screen bg-gray-100 ">
      <Loading />
    </div>)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Spiritual Thoughts</h1>
      {session ? (
        <>
          <p className="text-lg mb-8 text-center max-w-md">
            Hello, {session.user.name}! Ready to share your spiritual thoughts?
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
          <div className="flex space-x-4">
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
  );
}

```

## File: lib/prisma.js
```js
// lib/prisma.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

```

## File: prisma/test.js
```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

```

