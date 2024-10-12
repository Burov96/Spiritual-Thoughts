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

  // Fetch posts on component mount
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
