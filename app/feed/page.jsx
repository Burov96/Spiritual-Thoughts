"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Post } from "../components/Post";
import { PostForm } from "../components/PostForm";
import { useNotification } from "../NotificationProvider"; // Correct import
import { usePathname, useRouter } from "next/navigation";
import { Loading } from "../components/Loading";

export default function Feed() {
  const { showNotification } = useNotification(); // Use the hook directly
  const pathname = usePathname();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const { data: session, status } = useSession();

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
  }, [status, pathname, showNotification]);

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
