-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.estado_obrigacao AS ENUM (
  'pendente',
  'em_revisao',
  'aprovado',
  'submetido',
  'concluido',
  'atrasado'
);

CREATE TYPE public.tipo_obrigacao AS ENUM (
  'iva',
  'ies',
  'saft',
  'modelo_10',
  'modelo_22',
  'dmr',
  'ifs',
  'outro'
);

CREATE TYPE public.periodicidade AS ENUM (
  'mensal',
  'trimestral',
  'anual',
  'pontual'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  nif TEXT,
  contacto TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projetos table
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create obrigacoes table
CREATE TABLE public.obrigacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo public.tipo_obrigacao NOT NULL,
  periodicidade public.periodicidade NOT NULL,
  periodo_referencia TEXT,
  
  deadline_revisao_senior TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline_interna TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline_oficial TIMESTAMP WITH TIME ZONE NOT NULL,
  
  estado public.estado_obrigacao DEFAULT 'pendente',
  
  responsavel_id UUID REFERENCES auth.users(id),
  enviado_senior_em TIMESTAMP WITH TIME ZONE,
  aprovado_em TIMESTAMP WITH TIME ZONE,
  submetido_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT check_deadlines_order CHECK (
    deadline_revisao_senior < deadline_interna AND 
    deadline_interna < deadline_oficial
  )
);

-- Create tarefas table
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obrigacao_id UUID REFERENCES public.obrigacoes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  concluida BOOLEAN DEFAULT false,
  responsavel_id UUID REFERENCES auth.users(id),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lembretes table
CREATE TABLE public.lembretes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obrigacao_id UUID REFERENCES public.obrigacoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  data_envio TIMESTAMP WITH TIME ZONE NOT NULL,
  enviado BOOLEAN DEFAULT false,
  mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create logs table
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  detalhes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comprovativos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovativos', 'comprovativos', false)
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obrigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for clientes (all authenticated users)
CREATE POLICY "Authenticated users can view clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for projetos
CREATE POLICY "Authenticated users can view projetos"
  ON public.projetos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projetos"
  ON public.projetos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update projetos"
  ON public.projetos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete projetos"
  ON public.projetos FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for obrigacoes
CREATE POLICY "Authenticated users can view obrigacoes"
  ON public.obrigacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert obrigacoes"
  ON public.obrigacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update obrigacoes"
  ON public.obrigacoes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete obrigacoes"
  ON public.obrigacoes FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for tarefas
CREATE POLICY "Authenticated users can view tarefas"
  ON public.tarefas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tarefas"
  ON public.tarefas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tarefas"
  ON public.tarefas FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tarefas"
  ON public.tarefas FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for lembretes
CREATE POLICY "Authenticated users can view lembretes"
  ON public.lembretes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lembretes"
  ON public.lembretes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lembretes"
  ON public.lembretes FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for logs
CREATE POLICY "Authenticated users can view logs"
  ON public.logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert logs"
  ON public.logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Storage policies for comprovativos
CREATE POLICY "Authenticated users can upload comprovativos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comprovativos');

CREATE POLICY "Authenticated users can view comprovativos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprovativos');

CREATE POLICY "Authenticated users can delete comprovativos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'comprovativos');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obrigacoes_updated_at
  BEFORE UPDATE ON public.obrigacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Utilizador'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update estado to atrasado automatically
CREATE OR REPLACE FUNCTION public.check_obrigacao_atrasada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline_oficial < now() AND NEW.estado != 'concluido' THEN
    NEW.estado = 'atrasado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check if obrigacao is atrasada
CREATE TRIGGER check_obrigacao_atrasada_trigger
  BEFORE INSERT OR UPDATE ON public.obrigacoes
  FOR EACH ROW EXECUTE FUNCTION public.check_obrigacao_atrasada();