-- Create table for individual card instances
CREATE TABLE public.card_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  card_template_id text NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('hero', 'dragon')),
  current_health integer NOT NULL DEFAULT 0,
  max_health integer NOT NULL DEFAULT 0,
  last_heal_time timestamp with time zone DEFAULT now(),
  card_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.card_instances ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own card instances" 
ON public.card_instances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own card instances" 
ON public.card_instances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card instances" 
ON public.card_instances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card instances" 
ON public.card_instances 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_card_instances_user_id ON public.card_instances(user_id);
CREATE INDEX idx_card_instances_template_id ON public.card_instances(card_template_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_card_instances_updated_at
BEFORE UPDATE ON public.card_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();