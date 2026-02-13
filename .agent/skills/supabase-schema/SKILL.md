---
name: supabase-schema
description: Generate complete Supabase SQL schema for all tables, RLS, triggers, and storage
---

## Schema
Generate a single `supabase-schema.sql` file containing all tables:
- profiles (extends auth.users), generated_images, pages, quizzes, quiz_responses, conversations, messages, page_views
- Auto-create profile trigger on signup
- RLS policies for all tables
- Performance indexes
- Storage bucket for generated-images

## Key patterns
- All user tables have `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`
- RLS: users manage own data, public access for published pages/quizzes
- Quiz responses: anyone can insert, quiz owners can select
- Storage: users upload to their own folder `{userId}/`
