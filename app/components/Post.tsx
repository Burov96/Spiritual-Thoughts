"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Like from "./Like";
import { revalidatePath } from "next/cache";
import { useNotification } from "../NotificationProvider";

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
              src={influence.user.profilePicture || "/images/user.png"}
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
