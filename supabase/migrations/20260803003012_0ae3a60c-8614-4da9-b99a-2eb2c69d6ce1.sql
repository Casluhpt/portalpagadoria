CREATE POLICY "Autenticados podem ler arquivos de fechamento"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'fechamentos');

CREATE POLICY "Autenticados podem enviar arquivos de fechamento"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fechamentos');