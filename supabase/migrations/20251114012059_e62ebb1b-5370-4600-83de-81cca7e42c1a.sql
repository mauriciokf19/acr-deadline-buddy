-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'PT',
  tipo_obrigacao tipo_obrigacao NOT NULL,
  periodicidade periodicidade NOT NULL,
  regra_deadline_oficial TEXT NOT NULL,
  offset_interna INTEGER NOT NULL DEFAULT 3,
  offset_revisao INTEGER NOT NULL DEFAULT 2,
  notas TEXT
);

-- Create template_instancias table
CREATE TABLE public.template_instancias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  ano_fiscal INTEGER NOT NULL,
  parametros_json JSONB NOT NULL,
  obrigacoes_geradas INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_instancias ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Authenticated users can view templates" 
ON public.templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates" 
ON public.templates 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete templates" 
ON public.templates 
FOR DELETE 
USING (true);

-- RLS policies for template_instancias
CREATE POLICY "Authenticated users can view template_instancias" 
ON public.template_instancias 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create template_instancias" 
ON public.template_instancias 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update template_instancias" 
ON public.template_instancias 
FOR UPDATE 
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_template_instancias_template_id ON public.template_instancias(template_id);
CREATE INDEX idx_template_instancias_projeto_id ON public.template_instancias(projeto_id);
CREATE INDEX idx_template_instancias_ano_fiscal ON public.template_instancias(ano_fiscal);