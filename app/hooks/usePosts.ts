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
