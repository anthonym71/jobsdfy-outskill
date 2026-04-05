
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
