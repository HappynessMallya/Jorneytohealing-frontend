"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { postsApi } from "@/lib/api-client";

export interface Post {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  published: boolean;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PostsStore {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  getPostById: (id: string) => Post | undefined;
  fetchPostById: (id: string) => Promise<Post | null>;
  publishPost: (id: string) => void;
  unpublishPost: (id: string) => void;
}

export const usePostsStore = create<PostsStore>()(
  persist(
    (set, get) => ({
      posts: [],
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id ? { ...post, ...updates } : post
          ),
        })),
      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== id),
        })),
      getPostById: (id) => get().posts.find((post) => post.id === id),
      fetchPostById: async (id) => {
        try {
          // GET /posts/:id - fetch post details by ID
          const post = await postsApi.getById(id);
          // Update store with fetched post
          const existingPost = get().posts.find((p) => p.id === id);
          if (existingPost) {
            get().updatePost(id, post);
          } else {
            get().addPost(post);
          }
          return post;
        } catch (error) {
          console.error("Error fetching post by ID:", error);
          return null;
        }
      },
      publishPost: (id) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id ? { ...post, published: true } : post
          ),
        })),
      unpublishPost: (id) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id ? { ...post, published: false } : post
          ),
        })),
    }),
    {
      name: "posts-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

