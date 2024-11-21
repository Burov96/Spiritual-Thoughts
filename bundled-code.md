# Bundled Next.js Application Code

## File: app\api\auth\register\route.ts
```ts
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '../../../../lib/prisma';
import {randomColor} from 'randomcolor'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);
    const userColor = randomColor();
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        color: userColor,
      },
    });

    return NextResponse.json({ message: 'User registered successfully', user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

```

## File: app\api\auth\[...nextauth]\route.ts
```ts

import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/authOptions"; 
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };



 
```

## File: app\api\messages\mark-as-read\route.js
```js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId, senderId } = await req.json();

    await prisma.message.updateMany({
      where: {
        receiverId: parseInt(userId),
        senderId: parseInt(senderId),
        read: false,
      },
      data: {
        read: true,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

```

## File: app\api\messages\route.js
```js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = parseInt(searchParams.get('senderId'));
    const receiverId = parseInt(searchParams.get('receiverId'));

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 20,
    });

    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

```

## File: app\api\messages\send\route.js
```js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { receiverId, senderId, text } = await req.json();

    // Save message to database
    const message = await prisma.message.create({
      data: {
        content: text,
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
      },
    });

    return new Response(JSON.stringify(message), { status: 200 });
  } catch (error) {
    console.error("Failed to send message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send message" }),
      { status: 500 }
    );
  }
}

```

## File: app\api\messages\typing.js
```js
import { Server } from 'socket.io';

export const config = {
  api: { bodyParser: false },
};

const ioHandler = (res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('typing', ({ roomId, user }) => {
        socket.to(roomId).emit('userTyping', user);
      });
    });
  }
  res.end();
};

export default ioHandler;

```

## File: app\api\messages\users\route.js
```js
// app/api/messages/users/route.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get('userId'));

    if (!userId) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const chatUsers = await prisma.$queryRaw`
      SELECT DISTINCT
        u.id,
        u.name,
        u.profilePicture,
        CAST((
          SELECT COUNT(*)
          FROM Message m2
          WHERE m2.senderId = u.id 
          AND m2.receiverId = ${userId}
          AND m2.read = false
        ) AS SIGNED) as unreadCount
      FROM User u
      JOIN Message m ON (m.senderId = u.id OR m.receiverId = u.id)
      WHERE (m.senderId = ${userId} OR m.receiverId = ${userId})
        AND u.id != ${userId}
      GROUP BY u.id, u.name, u.profilePicture
      ORDER BY MAX(m.createdAt) DESC
    `;

    // Convert BigInt values to regular numbers
    const serializedUsers = chatUsers.map(user => ({
      ...user,
      id: Number(user.id),
      unreadCount: Number(user.unreadCount)
    }));

    return new Response(JSON.stringify(serializedUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch chat users:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

```

## File: app\api\posts\route.ts
```ts

interface CustomSession {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

import { getServerSession } from "next-auth/next";
import prisma from "../../../lib/prisma";
import { NextAuthOptions } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions as NextAuthOptions) as CustomSession;
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
  const session = await getServerSession(authOptions as NextAuthOptions) as CustomSession;
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

## File: app\api\posts\[id]\delete\route.js
```js

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; 
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("Unauthorized access to delete route");
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const postId = Number(id);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { influences: true },
    });

    if (!post) {
      return new Response(JSON.stringify({ message: "Post not found" }), { status: 404 });
    }

    
    if (post.authorId !== parseInt(session.user.id)) {
      console.log(post);
      return new Response(JSON.stringify({ message: "Unauthorized to delete this post" }), { status: 403 });
    }

    await prisma.influence.deleteMany({
      where: { postId: postId },
    });

    await prisma.post.delete({
      where: { id: postId },
    });

    console.log(`Post deleted with ID: ${postId}`);
    return new Response(JSON.stringify({ message: "Post deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

```

## File: app\api\posts\[id]\index.js
```js

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

## File: app\api\posts\[id]\influence\route.js
```js

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("Unauthorized access to influence route");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const postId = Number(params.id);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId: postId,
        userId: session.user.id*1,
        type: "like",
      },
    });

    if (existingInfluence) {
      await prisma.influence.delete({
        where: { id: existingInfluence.id },
      });
      console.log(`Post unliked with ID: ${postId}`);
      return NextResponse.json({ message: "Post unliked" }, { status: 200 });
    } else {
      await prisma.influence.create({
        data: {
          type: "like",
          postId: postId,
          userId: session.user.id*1,
        },
      });
      console.log(`Post liked with ID: ${postId}`);
      return NextResponse.json({ message: "Post liked" }, { status: 201 });
    }
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

```

## File: app\api\posts\[id]\influence.ts
```ts
"use client"

import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/authOptions";


interface CustomSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  
  const session = (await getServerSession(authOptions)) as CustomSession;

  if (!session || !session.user.id) {
    console.log("Unauthorized access to influence route");
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { type } = await request.json();
  const postId = Number(params.id);

  
  if (!type || typeof type !== 'string') {
    console.log("Invalid influence type");
    return new Response(JSON.stringify({ message: "Invalid influence type" }), { status: 400 });
  }

  try {
    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId,
        userId: Number(session.user.id) *1,
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
          userId: Number(session.user.id) *1,
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

## File: app\api\posts\[id]\like.js
```js


import { getSession } from "next-auth/react"
import prisma from "../../../../lib/prisma"

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

## File: app\api\posts\[id]\pray.js
```js


import { getSession } from "next-auth/react"
import prisma from "../../../../lib/prisma"

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

## File: app\api\profile\route.js
```js

import { getServerSession } from "next-auth/next";
import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

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

## File: app\api\socket\route.js
```js
import { Server } from "socket.io";

let io;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for WebSocket connections
  },
};

export async function GET(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO...");

    // Attach Socket.IO to the server
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Handle new messages
      socket.on("newMessage", ({ roomId, message }) => {
        socket.to(roomId).emit("receiveMessage", message);
      });

      // Handle typing indicator
      socket.on("typing", ({ roomId, user }) => {
        socket.to(roomId).emit("userTyping", user);
      });

      // Join a specific room
      socket.on("joinRoom", ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  res.end(); // End the response for GET requests
}

```

## File: app\api\upload-avatar\route.js
```js

import { getServerSession } from "next-auth";
import prisma from "../../../lib/prisma";
import { authOptions } from "../../../lib/authOptions";

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

## File: app\api\userOP\[id]\route.js
```js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";


export async function GET(request, {params}) { 
const {id} = params
  try {
      const user = await prisma.user.findUnique({
        where: { id: id*1 },
        select: { id: true, name: true, profilePicture: true, color:true},
      });
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });}
      return NextResponse.json(user, { status: 200 });
    } catch (error) {
      console.error("Error fetching OP's profile:", error);
      return NextResponse.json(
        { message: "Failed to load profile data" },
        { status: 500 }
      );
    }
  }
```

## File: app\api\users\interests\route.js
```js
import { getServerSession } from "next-auth/next";
import prisma from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/authOptions";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { interests } = await request.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { interests },
  });

  return new Response(JSON.stringify({ message: "Interests updated" }), { status: 200 });
}
```

## File: app\api\users\route.js
```js

import { getServerSession } from "next-auth";
import prisma from "../../../lib/prisma";
import { authOptions } from "../../../lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const users = await prisma.user.findMany();

  return new Response(JSON.stringify(users), { status: 200 });
}

```

## File: app\api\users\[id]\follow\route.js
```js

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; 
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      following: {
        connect: { id: parseInt(id) },
      },
    },
  });

  return new Response(JSON.stringify({ message: "Followed" }), { status: 200 });
}

```

## File: app\api\users\[id]\influence\route.js
```js

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("Unauthorized access to influence route");
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { type } = await request.json();
  const postId = Number(id);

  if (!type || typeof type !== 'string') {
    console.log("Invalid influence type");
    return new Response(JSON.stringify({ message: "Invalid influence type" }), { status: 400 });
  }

  try {
    const existingInfluence = await prisma.influence.findFirst({
      where: {
        postId,
        userId: parseInt(session.user.id),
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
          userId: parseInt(session.user.id),
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

## File: app\api\users\[id]\like\route.js
```js


import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; 
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: parseInt(id),
        userId: parseInt(session.user.id),
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return new Response(JSON.stringify({ message: "Post unliked" }), { status: 200 });
    } else {
      await prisma.like.create({
        data: {
          user: { connect: { email: session.user.email } },
          post: { connect: { id: parseInt(id) } },
        },
      });
      return new Response(JSON.stringify({ message: "Post liked" }), { status: 201 });
    }
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}

```

## File: app\api\users\[id]\route.js
```js
import prisma from "../../../../lib/prisma";

export async function GET(request, { params }) {
  const { id } = params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
      interests: true,
      posts: true,
      color: true,
    },
  });

  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
  }
  
  return new Response(JSON.stringify(user), { status: 200 });
}
```

## File: app\api\users\[id]\unfollow\route.js
```js

import { getServerSession } from "next-auth/next";
import prisma from "../../../../../lib/prisma";
import { authOptions } from "../../../../../lib/authOptions";

export async function POST(request, { params }) {
  const { id } = params; 
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      following: {
        disconnect: { id: parseInt(id) },
      },
    },
  });

  return new Response(JSON.stringify({ message: "Unfollowed" }), { status: 200 });
}

```

## File: app\auth\register\page.jsx
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

  const { status } = useSession();


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
        showNotification("Registration successful!", "success")
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

```

## File: app\auth\signin\page.jsx
```jsx
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

```

## File: app\chat\page.jsx
```jsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotification } from "../NotificationProvider";
import ChatWindow from "../components/ChatWindow";
import { Loading } from "../components/Loading";
import { useNavigation } from "../context/NavigationContext";
import { PageWrapper } from "../components/PageWrapper";
import Image from "next/image";


export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [activeChat, setActiveChat] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { direction } = useNavigation();


  useEffect(() => {
    if (status === "unauthenticated") {
      showNotification("Please login first", "failure");
      router.push("/auth/signin");
      return;
    }

    const fetchChatUsers = async () => {
      try {
        const response = await fetch(`/api/messages/users?userId=${session?.user?.id}`);
        const data = await response.json();
        setChatUsers(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch chat users:", error);
        showNotification("Failed to load chats", "failure");
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchChatUsers();
    }
  }, [activeChat, session, status, router, showNotification]);

  const handleChatSelect = (userId) => {
    setActiveChat(userId);
    // Mark messages as read when opening chat
    fetch("/api/messages/mark-as-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: session.user.id,
        senderId: userId,
      }),
    });
  };

  if (loading) {
    return (
      <PageWrapper direction={direction}>
      <Loading />
      </PageWrapper>
      );
  }

  return (
    <PageWrapper direction={direction}>
    <div className="flex h-90 max-h-[30 rem]">
      {/* Sidebar with chat users */}
      <div className="w-1/4 border-r border-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <div className="space-y-2">
          {chatUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleChatSelect(user.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeChat === user.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-opacity-20 hover:bg-gray-500"
              }`}
            >
              <div className="flex items-center space-x-3">
                  <Image
                  width={20}
                  height={20}
                    src={user.profilePicture || "/images/user.png"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                
                <div>
                    <div className="flex items-center space-x-12">

                  <p className="font-semibold">{user.name}</p>
                  {user.unreadCount > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                      {user.unreadCount}
                    </span>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1">
        {activeChat ? (
          <ChatWindow
            senderId={session.user.id*1}
            receiverId={activeChat}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
    </PageWrapper>
  );
}

```

## File: app\components\Avatars.jsx
```jsx

import Image from "next/image";

const Avatars = () => {
  return (
    <div>
      <Image src="/images/user.png"  alt="Avatar" width={100} height={100} />
    </div>
  );
};

export default Avatars;

```

## File: app\components\AvatarUpload.jsx
```jsx
"use client"
// import { useState } from "react"

export default function AvatarUpload() {
  // const [file, setFile] = useState(null)

  const handleUpload = async () => {
    // const formData = new FormData()
    // formData.append("file", file)
    // const res = await fetch("/api/upload-avatar", {
    //   method: "POST",
    //   body: formData,
    // })
    // const data = await res.json()
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

## File: app\components\Button.jsx
```jsx
"use client"

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

## File: app\components\ChatWindow.jsx
```jsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { initSocket } from '../../lib/socket';
import MessageInput from './MessageInput';

export default function ChatWindow({ senderId, receiverId }) {
  console.log({ senderId, receiverId })
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  // setInterval(() => {
  //   fetchMessages();
  // }, 2000);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/messages?senderId=${senderId}&receiverId=${receiverId}`
      );
      const data = await response.json();
      console.log(data) 
      setMessages(data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.current = initSocket();
    fetchMessages();
    socket.current.on('receiveMessage', handleNewMessage);
    socket.current.on('userTyping', handleUserTyping);

    return () => {
      if (socket.current) {
        socket.current.off('receiveMessage');
        socket.current.off('userTyping');
      }
    };
  }, [senderId, receiverId]);

  const handleNewMessage = (message) => {
    if (
      (message.senderId === senderId && message.receiverId === receiverId) ||
      (message.senderId === receiverId && message.receiverId === senderId)
    ) {
      fetchMessages(); 
    }
  };

  const handleUserTyping = (data) => {
    if (data.senderId === receiverId) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div>Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`text-black font-mono italic my-2 p-2 rounded-lg max-w-[70%] ${
                  message.senderId === senderId
                    ? 'ml-auto bg-blue-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {isTyping && (
        <div className="px-4 text-sm text-gray-500">User is typing... </div>
      )}
      <MessageInput
        senderId={senderId}
        receiverId={receiverId}
        socket={socket.current}
        onMessageSent={fetchMessages} 
      />
    </div>
  );
}

```

## File: app\components\FeedIcon.tsx
```tsx
"use client"
import {
  DotLottiePlayer,
} from "@dotlottie/react-player";

const FeedIcon: React.FC = () => {


  return (
    <div className="relative w-8 h-8 m-1">
      <DotLottiePlayer
        src={"/images/news.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default FeedIcon;

```

## File: app\components\FetchUsers.jsx
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

## File: app\components\FollowButton.jsx
```jsx
"use client"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { useNotification } from "../NotificationProvider"

export default function FollowButton({ userId }) {
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)
  const { showNotification } = useNotification();
  

  const handleFollow = async () => {
    await fetch(`/api/users/${userId}/follow`, { method: "POST" })
    setIsFollowing(true)
    showNotification("Followed successfully", "success")
  }

  const handleUnfollow = async () => {
    await fetch(`/api/users/${userId}/unfollow`, { method: "POST" })
    setIsFollowing(false)
    showNotification("Unfollowed successfully", "success")
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

## File: app\components\Footer.jsx
```jsx
"use client";

export default function Footer() {
  return (
    <footer className="rounded-md w-full bg-gray-800 text-white p-4 text-center">
      <p>&copy; {new Date().getFullYear()} Spiritual Thoughts. All rights reserved.</p>
    </footer>
  );
}

```

## File: app\components\Hamburger.tsx
```tsx
"use client";

import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef } from 'react';

interface BurgerOpened {
  open: boolean;
}

const Hamburger: React.FC<BurgerOpened> = ({ open }) => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  useEffect(() => {
    if (open) {
      playerRef.current?.playSegments([30, 60], true);
    } else {
      playerRef.current?.playSegments([40, 20], true);
    }
  }, [open]);

  return (
    <div className='w-20'>
      <DotLottiePlayer
        ref={playerRef}
        src="/images/hamburger.lottie"
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Hamburger;

```

## File: app\components\Interests.jsx
```jsx
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

## File: app\components\InterestsList.jsx
```jsx
"use client";

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

## File: app\components\Like.tsx
```tsx
"use client";

import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef } from 'react';

interface LikeProps {
  userInfluenced: boolean;
}

const Like = ({ userInfluenced }: LikeProps) => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  useEffect(() => {
    if (playerRef.current) {
      setTimeout(() => {
        if (userInfluenced) {
          playerRef.current?.playSegments([65, 67], true);
        } else {
          playerRef.current?.playSegments([10, 0], true);
        }
      }, 70);
    }
  }, [userInfluenced]);

  useEffect(() => {
    if (playerRef.current) {
      if (userInfluenced) {
        playerRef.current.playSegments([0, 67], true);
      } else {
        playerRef.current.playSegments([40, 0], true);
      }
    }
  }, [userInfluenced]);

  return (
    <div className='w-10 h-10'>
      <DotLottiePlayer
        ref={playerRef}
        src={"/images/like2.lottie"}
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Like;

```

## File: app\components\Loading.tsx
```tsx
"use client";

import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';

interface LoadingProps {
  width?: number;
  height?: number;
}

const Loading = ({ width = 700, height = 700 }: LoadingProps) => {
  return (
    <div className="flex justify-center align-middle loading-container bg-slate-300 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <DotLottiePlayer
        src="/images/loading.lottie"
        autoplay
        loop
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export {Loading};

```

## File: app\components\LogOutIcon.tsx
```tsx
"use client"
import {
  DotLottiePlayer,
} from "@dotlottie/react-player";

const LogOutIcon: React.FC = () => {


  return (
    <div className="relative w-8 h-8 m-1">
      <DotLottiePlayer
        src={"/images/logout.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default LogOutIcon;

```

## File: app\components\MessageButton.jsx
```jsx
"use client";
import { useNotification } from "../NotificationProvider";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "./Loading";
import { useRouter } from "next/navigation";

export default function MessageButton({ senderId, receiverId }) {
  const { showNotification } = useNotification();
  const [form, setForm] = useState(false);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const sendMessage = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId, senderId, text }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      const data = await response.json();
      console.log("Message sent: ", data);
      showNotification("Message sent!", "success");
    } catch (error) {
      console.error(error);
      showNotification("Message have not been sent!", "failure");
    } finally {
      setIsLoading(false);
      setText("");
      setForm(false);
      router.push("/chat");
    }
  };
  const handleMessage = () => {
    setForm(!form);
  };

  return (
    <div className="relative text-black">
      <AnimatePresence mode="wait">
        {!form ? (
          <motion.div
            key="message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={"/images/message.svg"}
              alt="message"
              height={60}
              width={60}
              onClick={handleMessage}
              className={`px-4 py-2 rounded bg-blue-500 text-white`}
            />
          </motion.div>
        ) : (
          !isLoading?(<motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <form className="flex flex-col" onSubmit={sendMessage}>
              <textarea
                rows={3}
                className="border rounded p-2 resize-none"
                maxLength={500}
                type="text"
                value={text}
                required={true}
                placeholder="Type your message..."
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex flex-row gap-2 justify-evenly mt-5">
                <button
                  type="button"
                  onClick={handleMessage}
                  className="p-1 rounded bg-blue-500"
                >
                  <Image
                    src={"/images/cancel.svg"}
                    height={40}
                    width={40}
                    alt="Cancel"
                    className="text-white"
                  />
                </button>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className={`p-1 rounded ${
                    !text.trim() ? "bg-blue-300" : "bg-blue-500"
                  }`}
                >
                  <Image
                    src={"/images/send.svg"}
                    height={40}
                    width={40}
                    alt="Send"
                    className="text-white"
                  />
                </button>
              </div>
            </form>
          </motion.div>)
        :(<motion.div
          key="loadingScreen"
          className=" flex justify-center align-middle w-1 h-0 "
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        ><Loading /></motion.div>)
        )}
      </AnimatePresence>
    </div>
  );
}

```

## File: app\components\MessageInput.jsx
```jsx
"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

let socket;

export default function MessageInput({ senderId, receiverId, onMessageSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const roomId = `${Math.min(senderId, receiverId)}-${Math.max(senderId, receiverId)}`;

  useEffect(() => {
    // Connect to the Socket.IO server
    socket = io("/api/socket"); // Matches your API route path
    socket.emit("joinRoom", { roomId });

    return () => {
      socket.disconnect(); // Clean up when component unmounts
    };
  }, [roomId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const newMessage = await response.json();
      socket.emit("newMessage", { roomId, message: newMessage });

      setText("");
      onMessageSent();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", { roomId, user: senderId });
  };

  return (
    <form onSubmit={handleSubmit} className="text-black p-4 border-t">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className={`px-4 py-2 rounded-lg ${
            !text.trim() || sending
              ? "bg-gray-300"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Send
        </button>
      </div>
    </form>
  );
}

```

## File: app\components\MessagesIcon.tsx
```tsx
"use client"
import {
  DotLottiePlayer,
} from "@dotlottie/react-player";

const MessagesIcon: React.FC = () => {


  return (
    <div className="relative w-8 h-8 m-1">
      <DotLottiePlayer
        src={"/images/feed.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default MessagesIcon;

```

## File: app\components\NavBar.jsx
```jsx
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
```

## File: app\components\Notification.tsx
```tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DotLottiePlayer } from "@dotlottie/react-player";
import Thrash from "./Thrash";
import styles from "./Notification.module.css";

interface NotificationProps {
  message: string;
  type: string;
  id: number;
  onRemove: (id: number) => void;
  onHover: (id: number, isHovered: boolean) => void;
}

const Notification = ({
  message,
  type,
  id,
  onRemove,
  onHover,
}: NotificationProps) => {
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
          top: `${10 + id * 7}rem`, 
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

## File: app\components\PageWrapper.jsx
```jsx
"use client";

import { motion } from "framer-motion";

export function PageWrapper({ children, direction }) {
  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  return (
    <motion.div
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

```

## File: app\components\Post.tsx
```tsx
"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Like from "./Like";
import { revalidatePath } from "next/cache";
import { useNotification } from "../NotificationProvider";
import UserOP from "../components/UserOP"
import Link from "next/link";

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

export  function Post({ post }: PostProps) {
  const { data: session } = useSession();
  const [influenced, setInfluenced] = useState(post.influences.length || 0);
  const [userInfluenced, setUserInfluenced] = useState(
    post.influences.some((influence) => influence.user.email === session?.user?.email)  );
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
    }
  };

  return (
    <div className="transition-all p-4 border rounded shadow hover:shadow-xl flex flex-col relative min-h-52">
      <Link href={`/profile/${post.author.id}`}>
<UserOP id={post.authorId} />
      </Link>
      <p>{post.content}</p>
      <div className="mt-4 transition-all flex">

      <div className="flex space-x-4 mt-2">
        <button onClick={handleInfluence} className=" text-purple-500">
          {<Like userInfluenced={userInfluenced} />}
           ({influenced})
        </button>
      </div>
      <div className={`mt-4 ${post.influences.length>2 &&"grid grid-cols-2 gap-1"}`}>
        {post.influences.map((influence) => (
          <div key={influence.id} className="flex  items-center space-x-2">
            <Image
              src={influence.user.profilePicture || "/images/user.png" }
              alt={influence.user.name.substring(0,3) + ".."}
              width={24}
              height={24}
              className="rounded-full"
              />
              {post.influences.length<3 && 
            <span>{influence.user.name}</span>
              }
          </div>
        ))}
        </div>
      </div>
      {isAuthor&& 
      (<div onClick={ handleDelete } className="absolute bottom-2 right-2 text-red-500 hover:text-red-700 transition-colors duration-200 cursor-pointer">❌</div>)}
    </div>
  );
}

```

## File: app\components\PostForm.jsx
```jsx
"use client";

import { useContext, useState } from "react";
import { useSession } from "next-auth/react";
import { NotificationContext } from "../NotificationProvider";

export function PostForm() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const { showNotification } = useContext(NotificationContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setContent((prev) => prev.trim());

    if (content.length < 1) {
      showNotification("Please enter a thought first", 'failure');
      return;
    }

    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      showNotification("Thought posted successfully", 'success');
      setContent("");
    } catch (error) {
      console.error("Error posting thought:", error);
      showNotification("Failed to post thought", 'failure');
    }
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2 ">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thought..."
        required
        className={`m-2 p-2 border rounded-lg outline hover:outline-4 outline-2 outline-gray-500 focus-within:outline-gray-600 focus-within:outline-offset-2 focus-within:outline-4 transition-all duration-500 text-black ${content.length>30?"text-lg":content.length>50?"text-base":"text-xl"}`}
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        Post Thought
      </button>
    </form>
  );
}

```

## File: app\components\ProfileForm.jsx
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
          src={profilePicture || "/images/user.png"}
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

## File: app\components\ProfileIcon.tsx
```tsx
"use client"
import {
  DotLottiePlayer,
} from "@dotlottie/react-player";

const ProfileIcon: React.FC = () => {


  return (
    <div className="relative w-8 h-8 m-1">
      <DotLottiePlayer
        src={"/images/profile.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default ProfileIcon;

```

## File: app\components\RegisterForm.jsx
```jsx
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

## File: app\components\SessionProviderWrapper.tsx
```tsx
"use client"

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export default function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}

```

## File: app\components\Thrash.tsx
```tsx
"use client"

import {
  DotLottieCommonPlayer,
  DotLottiePlayer,
} from "@dotlottie/react-player";
import React, { useRef } from "react";

const Thrash: React.FC = () => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);




  return (
    <div className="w-9 h-9">
      <DotLottiePlayer
        ref={playerRef}
        src={"/images/thrash.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default Thrash;

```

## File: app\components\TypingIndicator.jsx
```jsx
export default function TypingIndicator() {
    return <div>User is typing...</div>;
  }
  
```

## File: app\components\UserOP.jsx
```jsx
"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {randomColor} from 'randomcolor'
import { useSession } from "next-auth/react";


export default function UserOP({ id }) {
  const [userData, setUserData] = useState(null);
  const [color, setColor] = useState(randomColor());
  const [randomized, setRandomized] = useState(false)
  const loggedInUser = useSession()
   
  useEffect(() => {
    async function fetchUserOP() {
      try {
        const response = await fetch(`/api/userOP/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`failed to fetch user data`);
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error(error);
      }
    }
    if (id) {
      fetchUserOP();
    }
  }, [id]);

  useEffect(() => {
    if(loggedInUser.data.user.name === userData?.name) {
      setInterval(() => {
        setColor("#d4af37");
        setRandomized((prev)=>!prev);
      }, 7000);
    }
      
      setTimeout(() => {
        setColor(userData?.color);
      }, 1000);
    }, [userData, randomized])
  return (
    (
  userData &&
      <div className=" flex italic m-2 p-1">
      <Image src={userData.profilePicture ||"/images/user.png" || "https://i.ibb.co/Qv0nQSg/user.png"} width={32} height={32}/>
      <div className="transition-all duration-500 font-semibold capitalize mx-1 font-mono" style={{ color: color }}>
      {userData.name} 
      </div>
      <span className="text-sm font-mono">
       {`:    just thought about:`}
      </span>
      </div>
    )
);
}

```

## File: app\components\WelcomePage.tsx
```tsx
"use client";

import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';


const WelcomePage = () => {
  return (
    <div className="mr-24 flex justify-center align-middle  text-slate-900 ">
      <DotLottiePlayer
        src="/images/socials.lottie"
        autoplay
        loop
        style={{ width: 700, height: 700 }}
      />
    </div>
  );
};

export {WelcomePage};

```

## File: app\context\NavigationContext.tsx
```tsx
"use client";

import { createContext, useState, useContext, ReactNode } from 'react';

interface NavigationContextType {
  direction: number;
  setDirection: (direction: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState(1);

  return (
    <NavigationContext.Provider value={{ direction, setDirection }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

```

## File: app\context\NotificationContext.tsx
```tsx
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


const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);


const notificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_NOTIFICATION": {
      const { message, type, persistent = false } = action.payload;

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

      const newNotifications: NotificationItem[] = [
        ...state.notifications,
        { id, message, type, persistent },
      ];

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

  const showNotification = useCallback(
    (message: string, type: NotificationType, persistent: boolean = false) => {
      const id = findSmallestMissingId(state.notifications.map((n) => n.id));
      const finalId = id <= state.nextId ? id : state.nextId;
  
      
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { id: finalId, message, type, persistent },
      });
  
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
  

  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    hoveredNotifications.current.delete(id);
  }, []);

  const handleNotificationHover = useCallback(
    (id: number, isHovered: boolean) => {
      if (isHovered) {
        hoveredNotifications.current.add(id);
        const timer = timers.current.get(id);
        if (timer) {
          clearTimeout(timer);
          timers.current.delete(id);
        }
      } else {
        hoveredNotifications.current.delete(id);
        const shouldPersist = state.notifications.find(
          (n) => n.id === id
        )?.persistent;
        if (!shouldPersist) {
          const newTimer = setTimeout(() => {
            dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
            timers.current.delete(id);
          }, 3000);
          timers.current.set(id, newTimer);
        }
      }
    },
    [state.notifications]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
      hoveredNotifications.current.clear();
    };
  }, []);

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


export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

```

## File: app\feed\page.jsx
```jsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Post } from "../components/Post";
import { PostForm } from "../components/PostForm";
import { useNotification } from "../NotificationProvider";
import { usePathname, useRouter } from "next/navigation";
import { Loading } from "../components/Loading";
import { useNavigation } from "../context/NavigationContext";
import { PageWrapper } from "../components/PageWrapper";

export default function Feed() {
  const { showNotification } = useNotification();
  const pathname = usePathname();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const { status } = useSession();
  const { direction } = useNavigation();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/") {
      showNotification("First login to see the feed", "failure");
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetch("/api/posts")
        .then((res) => res.json())
        .then((data) => setPosts(data))
        .catch(() => {
          console.log("Failed to load posts", "failure");
        });
    }
  }, [status, pathname, showNotification, router]);

  if (posts.length < 1) {
    return (
      <PageWrapper direction={direction}>
        <Loading />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper direction={direction}>
    <div className="max-w-xl mx-auto overflow-hidden">
    <div className={`  animate-[growHeight_1s_ease-in-out] ${posts.length>0 ? ' ' : 'max-h-0 opacity-0'} `}>        <PostForm setPosts={setPosts} />
        <div className="space-y-4">
          {posts.map((post) => (
            <Post key={post.id} post={post} setPosts={setPosts} />
          ))}
        </div>
        </div>
      </div>
    </PageWrapper>
  );
}

```

## File: app\hooks\useNotification.js
```js
;

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

## File: app\hooks\usePosts.ts
```ts
"use client";

import { useState, useTransition, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const addPost = async (title: string) => {
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
        const newPost: Post = await response.json();
        setPosts((prevPosts) => [...prevPosts, newPost]);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    });
  };

  const deletePost = async (id: number) => {
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
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    });
  };

  
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data: Post[] = await response.json();
        setPosts(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
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

## File: app\layout.tsx
```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { NotificationProvider } from "./NotificationProvider";
import { NavigationProvider } from "./context/NavigationContext";
import { AnimatePresence } from "framer-motion";

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
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-slate-300 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}
      >
        <SessionProviderWrapper>
          <NotificationProvider>
            <NavigationProvider>
              <div className="flex flex-col flex-1 overflow-hidden">
                <NavBar />
                <main className="flex-grow overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
                  <div className="max-w-7xl mx-auto">
                    <AnimatePresence mode="wait" initial={false}>
                      {children}
                    </AnimatePresence>
                  </div>
                </main>
                <Footer />
              </div>
            </NavigationProvider>
          </NotificationProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

```

## File: app\NotificationProvider old.jsx
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

## File: app\NotificationProvider.tsx
```tsx
"use client";

import React, {
  createContext,
  useReducer,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { Notification } from "./components/Notification";
import {
  NotificationType,
  State,
  Action,
  NotificationItem,
} from "./notificationTypes";

export const NotificationContext = createContext<
  | {
      showNotification: (
        message: string,
        type: NotificationType,
        persistent?: boolean
      ) => void;
      removeNotification: (id: number) => void;
      notifications: NotificationItem[];
    }
  | undefined
>(undefined);

const initialState: State = {
  availableIds: [],
  notifications: [],
  nextId: 1,
};

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [hoveredNotifications, setHoveredNotifications] = useState<Set<number>>(
    new Set()
  );
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const recentMessages = useRef<Map<string, number>>(new Map());

  const handleNotificationHover = useCallback(
    (id: number, isHovered: boolean) => {
      setHoveredNotifications((prev) => {
        const newSet = new Set(prev);
        if (isHovered) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
    },
    []
  );

  const showNotification = useCallback(
    (message: string, type: NotificationType, persistent = false) => {
      const currentTime = Date.now();
      const recentMessageTime = recentMessages.current.get(message);

      if (recentMessageTime && currentTime - recentMessageTime < 3000) {
        return;
      }

      const currentIds = state.notifications.map((n) => n.id);
      const id = findSmallestMissingId(currentIds);
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { id, message, type, persistent },
      });

      recentMessages.current.set(message, currentTime);

      if (!persistent) {
        const timer = setTimeout(() => {
          if (!hoveredNotifications.has(id)) {
            dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
            timers.current.delete(id);
          }
        }, 3000);

        timers.current.set(id, timer);
      }
      const cleanupTime = currentTime - 3000;
      for (const [key, time] of Object.entries(Object.fromEntries(recentMessages.current))) {
        if (time < cleanupTime) {
          recentMessages.current.delete(key);
        }
      }
      

    },
    [state.notifications, hoveredNotifications]
  );

  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setHoveredNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  useEffect(() => {
    const currentTimers = Array.from(timers.current.values());
    return () => {
      currentTimers.forEach(clearTimeout);
    };
  }, []);

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

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

```

## File: app\notificationTypes.ts
```ts
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

## File: app\page.tsx
```tsx
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

```

## File: app\profile\page.jsx
```jsx
'use client'

import { useRouter } from "next/navigation";
import { Loading } from "../components/Loading"
import { useNotification } from "../NotificationProvider";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {ProfileForm} from "../../app/components/ProfileForm"
import { useNavigation } from "../context/NavigationContext";
import { PageWrapper } from "../components/PageWrapper";

export default function Profile(){

  const GetProfile = async () => {
    fetch(`/api/profile/`)
    .then((res) => res.json())
    .then((data) => setUserData(data))
    .catch((err) => showNotification(err,"failure"));
  };
  const {data:session, status} = useSession();
  const [userData, setUserData] = useState(null);
  const {showNotification} = useNotification();
  const { direction } = useNavigation();

  const router = useRouter();
  useEffect(() => {
  if (status==="loading"){
    return (
    <PageWrapper direction={direction}>
    <Loading/>
    </PageWrapper>
)
  }
  if(!session){
    router.push("/login");
    showNotification("In order to access your profile, first login","failure");
  }
  else{GetProfile()}},[status, session])
  return(
    <PageWrapper direction={direction}>
    <div className="profile-counter">
      <h1>Your Profile</h1>
      {userData&&
      <ProfileForm user={userData} />
      }
    </div>
    </PageWrapper>

  )
}
```

## File: app\profile\[id]\page.jsx
```jsx
"use client";
import { useEffect, useState } from "react";
import FollowButton from "../../components/FollowButton";
import MessageButton from "../../components/MessageButton";
import Image from "next/image";
import { Loading } from "../../components/Loading";
import { randomColor } from "randomcolor";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Profile({ params }) {
  const id = params.id;
  const [user, setUser] = useState(null);
  const [outlineColor, setOutlineColor] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    if (id) {
      fetch(`/api/users/${id}`)
        .then((res) => res.json())
        .then((data) => setUser(data));
    }
  }, [id]);

  setTimeout(() => {
    setOutlineColor(randomColor());
  }, 2000);
  if (!user) return <Loading />;
  const color = user.color;

  return (
    <div
      className="hover:backdrop-brightness-110 hover:shadow-xl select-none transition-colors duration-1000 max-w-md mx-auto p-4 border-2 rounded-lg shadow"
      style={{ borderColor: outlineColor }}
    >
      <Image
        height={96}
        width={96}
        src={user.profilePicture || "/images/user.png"}
        alt="Avatar"
        className="rounded-full mx-auto"
      />
      <h2 className="text-xl text-center mt-2 " style={{ color: color }}>
        {user.name}
      </h2>
      <p className="text-center text-gray-500">{user.email}</p>
      <p className="text-center text-gray-200">{user.posts.length} posts</p>
      <div className="mt-4 text-center">
        <h3 className="font-semibold">Interests:</h3>
        <h4 className="opacity-40 text-green-900">~// Coming soon //~ </h4>
        <ul className="list-disc list-inside">
          {user.interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
        {user.id !== session.user.id ? (
          <div className="flex flex-row justify-center gap-3">
            <div className="mt-4">
              <FollowButton userId={user.id} />
            </div>
            <div className="mt-4">
              <MessageButton receiverId={session.user.id} senderId={user.id}  />
            </div>
          </div>
        ) : (
          <Link href={`/profile/`} className="mt-4">
            {" "}
            Edit{" "}
          </Link>
        )}
      </div>
    </div>
  );
}

```

## File: app\protected\page.jsx
```jsx
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

## File: app\utils\outsideClidkFunctionRuner.js
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

## File: app\_app.js
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

## File: lib\authOptions.ts
```ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";



declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}



export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
      
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
      
        if (!user || !user.password) {
          throw new Error("No user found");
        }
      
        const isPasswordValid = await compare(credentials.password, user.password);
      
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
      
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      }
      
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  },
};

export default NextAuth(authOptions);

```

## File: lib\generateUserColors.ts
```ts
import { PrismaClient } from "@prisma/client";
import randomColor from "randomcolor";

const prisma = new PrismaClient();

async function generateUserColors() {
  const users = await prisma.user.findMany({
    where: { color: null },
  });

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { color: randomColor() },
    });
  }

  console.log(`Updated colors for ${users.length} users.`);
}

generateUserColors()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

```

## File: lib\prisma.ts
```ts
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;

```

## File: lib\socket.js
```js
import { io } from 'socket.io-client';

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      path: '/api/socket',
    });
  }
  return socket;
};

```

## File: prisma\test.js
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

