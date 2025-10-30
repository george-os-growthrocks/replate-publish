-- GSC Properties Table
-- Stores Google Search Console properties that users can connect to their projects

CREATE TABLE IF NOT EXISTS gsc_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  permission_level TEXT,
  verified BOOLEAN DEFAULT true,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one property per user (can't add same property twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_properties_user_site 
ON gsc_properties(user_id, site_url);

-- Only one property can be selected per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_properties_project_selected 
ON gsc_properties(project_id, selected) 
WHERE selected = true;

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_gsc_properties_user_id ON gsc_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_project_id ON gsc_properties(project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_selected ON gsc_properties(selected) WHERE selected = true;

-- Enable RLS
ALTER TABLE gsc_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage their own properties
DROP POLICY IF EXISTS "Users can view own GSC properties" ON gsc_properties;
DROP POLICY IF EXISTS "Users can insert own GSC properties" ON gsc_properties;
DROP POLICY IF EXISTS "Users can update own GSC properties" ON gsc_properties;
DROP POLICY IF EXISTS "Users can delete own GSC properties" ON gsc_properties;

CREATE POLICY "Users can view own GSC properties" 
ON gsc_properties FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GSC properties" 
ON gsc_properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GSC properties" 
ON gsc_properties FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GSC properties" 
ON gsc_properties FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can manage all properties (for Edge Functions)
CREATE POLICY "Service role can manage all GSC properties" 
ON gsc_properties FOR ALL 
USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gsc_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_gsc_properties_updated_at_trigger ON gsc_properties;
CREATE TRIGGER update_gsc_properties_updated_at_trigger
  BEFORE UPDATE ON gsc_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_gsc_properties_updated_at();

-- Function to ensure only one property is selected per project
CREATE OR REPLACE FUNCTION ensure_single_selected_property()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a property to selected=true, unselect all others for this project
  IF NEW.selected = true AND NEW.project_id IS NOT NULL THEN
    UPDATE gsc_properties 
    SET selected = false 
    WHERE project_id = NEW.project_id 
      AND id != NEW.id 
      AND selected = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single selection
DROP TRIGGER IF EXISTS ensure_single_selected_property_trigger ON gsc_properties;
CREATE TRIGGER ensure_single_selected_property_trigger
  BEFORE INSERT OR UPDATE ON gsc_properties
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_selected_property();

-- Comments
COMMENT ON TABLE gsc_properties IS 'Google Search Console properties connected by users to their projects';
COMMENT ON COLUMN gsc_properties.site_url IS 'The GSC property URL (e.g., https://example.com/ or sc-domain:example.com)';
COMMENT ON COLUMN gsc_properties.permission_level IS 'User permission level in GSC (owner, full, restricted)';
COMMENT ON COLUMN gsc_properties.selected IS 'Whether this property is currently selected for the project';
COMMENT ON COLUMN gsc_properties.verified IS 'Whether the property is verified in GSC';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created gsc_properties table';
END $$;

