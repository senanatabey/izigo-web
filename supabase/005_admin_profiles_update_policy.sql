create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());
