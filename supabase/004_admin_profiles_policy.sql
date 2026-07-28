create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());
