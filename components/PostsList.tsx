"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { postsApi } from "@/lib/api-client";

interface Post {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
}

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // GET /posts?published=true - only fetch published posts for home page
      const data = await postsApi.getAll(true);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-text/70 py-8">
        <p>Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-text/70 py-8">
        <p>No posts available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          onClick={() => router.push(`/posts/${post.id}`)}
        >
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}
          <h3 className="text-xl font-bold text-text mb-3 leading-tight">{post.title}</h3>
          <p className="text-text-light line-clamp-3 mb-4 leading-relaxed">{post.body}</p>
          <p className="text-text-lighter text-sm">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

