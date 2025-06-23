-- Migration untuk menambahkan fitur pengelompokan dan linking notes

-- 1. Tambahkan kolom parent_id untuk hierarki notes
ALTER TABLE notes 
ADD COLUMN parent_id UUID REFERENCES notes(id) ON DELETE SET NULL,
ADD COLUMN is_folder BOOLEAN DEFAULT FALSE,
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 2. Buat tabel untuk menyimpan link antar notes
CREATE TABLE IF NOT EXISTS note_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  link_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'embed', 'child'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(source_note_id, target_note_id, link_type)
);

-- 3. Buat tabel untuk menyimpan tag/kategori
CREATE TABLE IF NOT EXISTS note_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, name)
);

-- 4. Buat tabel junction untuk many-to-many relationship notes-tags
CREATE TABLE IF NOT EXISTS note_tag_relations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES note_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(note_id, tag_id)
);

-- 5. Tambahkan indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_notes_parent_id ON notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_folder ON notes(is_folder);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_user_id ON note_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_note_tag_relations_note_id ON note_tag_relations(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tag_relations_tag_id ON note_tag_relations(tag_id);

-- 6. Tambahkan RLS policies untuk tabel baru
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tag_relations ENABLE ROW LEVEL SECURITY;

-- Note links policies
CREATE POLICY "Users can view links of their notes" ON note_links FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM notes WHERE id = source_note_id AND user_id = (SELECT id FROM users WHERE email = current_user))
  OR EXISTS (SELECT 1 FROM notes WHERE id = target_note_id AND user_id = (SELECT id FROM users WHERE email = current_user))
);

CREATE POLICY "Users can create links for their notes" ON note_links FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE id = source_note_id AND user_id = (SELECT id FROM users WHERE email = current_user))
  AND EXISTS (SELECT 1 FROM notes WHERE id = target_note_id AND user_id = (SELECT id FROM users WHERE email = current_user))
);

CREATE POLICY "Users can delete links of their notes" ON note_links FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM notes WHERE id = source_note_id AND user_id = (SELECT id FROM users WHERE email = current_user))
);

-- Note tags policies
CREATE POLICY "Users can view their own tags" ON note_tags FOR SELECT 
USING (user_id = (SELECT id FROM users WHERE email = current_user));

CREATE POLICY "Users can create their own tags" ON note_tags FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM users WHERE email = current_user));

CREATE POLICY "Users can update their own tags" ON note_tags FOR UPDATE 
USING (user_id = (SELECT id FROM users WHERE email = current_user));

CREATE POLICY "Users can delete their own tags" ON note_tags FOR DELETE 
USING (user_id = (SELECT id FROM users WHERE email = current_user));

-- Note tag relations policies
CREATE POLICY "Users can view tag relations of their notes" ON note_tag_relations FOR SELECT 
USING (EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = (SELECT id FROM users WHERE email = current_user)));

CREATE POLICY "Users can create tag relations for their notes" ON note_tag_relations FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = (SELECT id FROM users WHERE email = current_user)));

CREATE POLICY "Users can delete tag relations of their notes" ON note_tag_relations FOR DELETE 
USING (EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = (SELECT id FROM users WHERE email = current_user)));

-- 7. Function untuk mendapatkan hirarki notes
CREATE OR REPLACE FUNCTION get_note_hierarchy(user_id_param UUID, parent_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  parent_id UUID,
  is_folder BOOLEAN,
  sort_order INTEGER,
  level INTEGER,
  path TEXT[]
) AS $$
WITH RECURSIVE note_tree AS (
  -- Base case: root level notes
  SELECT 
    n.id,
    n.title,
    n.parent_id,
    n.is_folder,
    n.sort_order,
    0 as level,
    ARRAY[n.id] as path
  FROM notes n
  WHERE n.user_id = user_id_param 
    AND (
      (parent_id_param IS NULL AND n.parent_id IS NULL) OR
      (parent_id_param IS NOT NULL AND n.parent_id = parent_id_param)
    )
  
  UNION ALL
  
  -- Recursive case: child notes
  SELECT 
    n.id,
    n.title,
    n.parent_id,
    n.is_folder,
    n.sort_order,
    nt.level + 1,
    nt.path || n.id
  FROM notes n
  JOIN note_tree nt ON n.parent_id = nt.id
  WHERE n.user_id = user_id_param
    AND NOT (n.id = ANY(nt.path)) -- Prevent infinite loops
)
SELECT * FROM note_tree
ORDER BY level, sort_order, title;
$$ LANGUAGE SQL;
