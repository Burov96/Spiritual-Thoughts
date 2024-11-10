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
