CREATE TABLE public.dashboard_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text
);

ALTER TABLE public.dashboard_access ADD CONSTRAINT dashboard_access_pkey PRIMARY KEY (id);

ALTER TABLE public.dashboard_access ADD CONSTRAINT dashboard_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.dashboard_access ADD CONSTRAINT dashboard_access_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);

ALTER TABLE public.dashboard_access ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.dashboard_access ADD CONSTRAINT dashboard_access_status_check CHECK (status IN ('pending', 'approved', 'rejected'));