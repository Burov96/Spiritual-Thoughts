"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
const [userInfluenced, setUserInfluenced] = useState(() => {
    return post.influences?.some((influence) => influence.user.email === session?.user?.email) || false;
  });
  const [influenced, setInfluenced] = useState(post.influences?.length || 0);
  const { showNotification } = useNotification();
  const isAuthor = session?.user?.email === post.author.email;

  // useEffect(() => {
  //   if (session?.user?.email && post.influences) {
  //     const isLiked = post.influences.some(
  //       (influence) => influence.user.email === session.user.email
  //     );
  //     setUserInfluenced(isLiked);
  //     setInfluenced(post.influences.length);
  //   }
  // }, [session?.user?.email, post.influences]);

  const handleInfluence = async () => {
    if (!session) {
      showNotification("First login in order to interact with posts.", "failure");
      return;
    }
    const wasInfluenced = userInfluenced;
    setUserInfluenced(!wasInfluenced);
    setInfluenced((prev) => (wasInfluenced ? prev - 1 : prev + 1));

    try {
      const response = await fetch(`/api/posts/${post.id}/influence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "feel" }),
      });
      const data = await response.json();
if (response.ok) {
        if (data.message === "Post liked") {
          showNotification("Successfully liked the post!", "success");
        } else if (data.message === "Post unliked") {
          showNotification("Successfully unliked the post.", "success");
        }
      } else {
setUserInfluenced(wasInfluenced);
        setInfluenced((prev) => (wasInfluenced ? prev + 1 : prev - 1));
        showNotification(data.message || "Something went wrong.", "failure");
      }
    } catch (error) {
setUserInfluenced(wasInfluenced);
      setInfluenced((prev) => (wasInfluenced ? prev + 1 : prev - 1));
      showNotification("Network error. Please try again.", "failure");
      console.log(error);
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
