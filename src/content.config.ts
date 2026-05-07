import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: ["tech/**/*.md", "life/**/*.md", "projects/**/*.md", "news/**/*.md"], base: "./src/content" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
  }),
});

const movies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/movies" }),
  schema: z.object({
    title: z.string(),
    originalTitle: z.string().optional(),
    year: z.number(),
    director: z.string(),
    country: z.string().default(""),
    genre: z.array(z.string()),
    rating: z.number().min(0).max(10).optional(),
    popularity: z.number().min(0).optional(),
    poster: z.string(),
    backdrop: z.string().optional(),
    watchLinks: z.array(z.string()).default([]),
    date: z.date(),
    review: z.string().optional(),
  }),
});

export const collections = { articles, movies };
