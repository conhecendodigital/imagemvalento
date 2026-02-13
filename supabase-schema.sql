-- ================================================
-- AI Marketing Studio — Supabase Schema
-- ================================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABELAS
-- ================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','pro','agency')),
  credits_images INTEGER DEFAULT 10,
  credits_pages INTEGER DEFAULT 3,
  credits_quiz INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generated Images
CREATE TABLE public.generated_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  preset TEXT,
  style TEXT,
  image_url TEXT,
  dimensions TEXT,
  model TEXT DEFAULT 'gemini-2.5-flash-image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages
CREATE TABLE public.pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  html_content TEXT,
  css_content TEXT,
  grapes_data JSONB,
  page_type TEXT CHECK (page_type IN ('sales','bio_link','lead_capture')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  product_data JSONB,
  published_url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  config JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  total_responses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Responses
CREATE TABLE public.quiz_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL,
  result_id TEXT,
  result_title TEXT,
  score INTEGER DEFAULT 0,
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategist Conversations
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategist Messages
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Analytics
CREATE TABLE public.page_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Users manage own data
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own images" ON public.generated_images
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own pages" ON public.pages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own quizzes" ON public.quizzes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit quiz responses" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Quiz owners see responses" ON public.quiz_responses
  FOR SELECT USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own messages" ON public.messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Public access
CREATE POLICY "Published pages are public" ON public.pages
  FOR SELECT USING (status = 'published');

CREATE POLICY "Published quizzes are public" ON public.quizzes
  FOR SELECT USING (status = 'published');

CREATE POLICY "Anyone can log page views" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_images_user ON public.generated_images(user_id);
CREATE INDEX idx_pages_user ON public.pages(user_id);
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_quizzes_user ON public.quizzes(user_id);
CREATE INDEX idx_quizzes_slug ON public.quizzes(slug);
CREATE INDEX idx_quiz_responses_quiz ON public.quiz_responses(quiz_id);
CREATE INDEX idx_conversations_user ON public.conversations(user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);

-- ================================================
-- STORAGE
-- ================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users upload own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');
