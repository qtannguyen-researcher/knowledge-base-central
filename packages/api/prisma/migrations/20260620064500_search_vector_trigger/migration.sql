-- GIN index for full-text search on knowledge_assets.search_vector
CREATE INDEX "knowledge_assets_search_vector_gin_idx" ON "knowledge_assets" USING GIN ("search_vector");

-- Maintain search_vector via trigger on insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.title, '') || ' ' ||
      coalesce(NEW.summary, '') || ' ' ||
      coalesce(NEW.content, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_assets_search_vector_update
BEFORE INSERT OR UPDATE ON knowledge_assets
FOR EACH ROW EXECUTE FUNCTION update_search_vector();
