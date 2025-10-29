-- Industry-Specific Business Profile Training System
-- This migration adds comprehensive industry intelligence gathering

-- 1. Enhanced User Profiles with Industry Training
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS business_type TEXT, -- 'rent_a_car', 'hotel', 'restaurant', 'ecommerce', etc.
ADD COLUMN IF NOT EXISTS target_location TEXT, -- 'Paros, Greece', 'Athens, Greece', etc.
ADD COLUMN IF NOT EXISTS industry_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_profile_trained BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ;

-- 2. Industry Intelligence Table
CREATE TABLE IF NOT EXISTS industry_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  business_type TEXT NOT NULL,
  
  -- Competitor Analysis
  competitors JSONB DEFAULT '[]'::jsonb, -- [{name, url, strengths, weaknesses}]
  competitor_keywords JSONB DEFAULT '[]'::jsonb,
  market_position TEXT, -- 'leader', 'challenger', 'follower', 'niche'
  
  -- Seasonal Intelligence
  peak_seasons JSONB DEFAULT '[]'::jsonb, -- [{months: [6,7,8], description: "Summer tourism peak"}]
  low_seasons JSONB DEFAULT '[]'::jsonb,
  seasonal_keywords JSONB DEFAULT '{}'::jsonb,
  
  -- Customer Demographics
  primary_countries JSONB DEFAULT '[]'::jsonb, -- [{country, percentage, peak_months}]
  customer_age_groups JSONB DEFAULT '[]'::jsonb,
  customer_preferences JSONB DEFAULT '[]'::jsonb,
  
  -- Product/Service Mix
  product_categories JSONB DEFAULT '[]'::jsonb, -- For rent-a-car: [{type: 'cars', percentage: 60}, {type: 'moto', percentage: 30}]
  best_sellers JSONB DEFAULT '[]'::jsonb,
  price_range JSONB DEFAULT '{}'::jsonb, -- {min, max, average, currency}
  
  -- Market Intelligence
  market_size_estimate TEXT,
  growth_trends TEXT,
  local_regulations JSONB DEFAULT '[]'::jsonb,
  industry_challenges JSONB DEFAULT '[]'::jsonb,
  
  -- SEO-Specific Intelligence
  search_volume_data JSONB DEFAULT '{}'::jsonb,
  content_opportunities JSONB DEFAULT '[]'::jsonb,
  backlink_opportunities JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_type)
);

CREATE INDEX idx_industry_intelligence_user ON industry_intelligence(user_id);
CREATE INDEX idx_industry_intelligence_type ON industry_intelligence(business_type);

-- 3. Business Insights & Recommendations
CREATE TABLE IF NOT EXISTS business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  intelligence_id UUID REFERENCES industry_intelligence,
  
  insight_type TEXT NOT NULL, -- 'seasonal_opportunity', 'competitor_gap', 'keyword_opportunity', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  impact_score INTEGER, -- 1-100
  
  action_items JSONB DEFAULT '[]'::jsonb,
  estimated_effort TEXT, -- 'low', 'medium', 'high'
  estimated_roi TEXT,
  
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'dismissed'
  completed_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_insights_user ON business_insights(user_id);
CREATE INDEX idx_business_insights_status ON business_insights(status);
CREATE INDEX idx_business_insights_priority ON business_insights(priority);

-- 4. Training Questions Template (for different industries)
CREATE TABLE IF NOT EXISTS industry_training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  questions JSONB NOT NULL, -- [{id, question, type, options, required}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert training templates for common industries
INSERT INTO industry_training_templates (business_type, display_name, questions) VALUES
(
  'rent_a_car',
  'Car & Motorcycle Rental',
  '[
    {"id": "location", "question": "Where is your rental business located?", "type": "text", "required": true},
    {"id": "fleet_size", "question": "How many vehicles do you have?", "type": "number", "required": true},
    {"id": "vehicle_types", "question": "What types of vehicles do you offer?", "type": "multiselect", "options": ["Economy Cars", "SUVs", "Luxury Cars", "Motorcycles", "ATVs", "Scooters"], "required": true},
    {"id": "best_selling", "question": "Which vehicle type rents the most?", "type": "select", "options": ["Economy Cars", "SUVs", "Luxury Cars", "Motorcycles", "ATVs", "Scooters"], "required": true},
    {"id": "peak_months", "question": "Which months are your busiest?", "type": "multiselect", "options": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "required": true},
    {"id": "customer_countries", "question": "Which countries do most customers come from? (comma separated)", "type": "text", "required": true},
    {"id": "booking_window", "question": "How far in advance do customers typically book?", "type": "select", "options": ["Same day", "1-3 days", "1 week", "2-4 weeks", "1-3 months", "3+ months"], "required": false},
    {"id": "competitors", "question": "List your main 3-5 competitors (names or websites)", "type": "textarea", "required": true},
    {"id": "unique_selling", "question": "What makes your service different from competitors?", "type": "textarea", "required": true},
    {"id": "price_range", "question": "What is your daily rental price range? (e.g., €30-€150)", "type": "text", "required": false},
    {"id": "services", "question": "What additional services do you offer?", "type": "multiselect", "options": ["Airport pickup/delivery", "Hotel delivery", "Insurance packages", "GPS rental", "Child seats", "Additional driver", "24/7 support"], "required": false}
  ]'::jsonb
),
(
  'hotel',
  'Hotel & Accommodation',
  '[
    {"id": "location", "question": "Where is your hotel located?", "type": "text", "required": true},
    {"id": "star_rating", "question": "What is your hotel rating?", "type": "select", "options": ["1-star", "2-star", "3-star", "4-star", "5-star", "Boutique", "No official rating"], "required": true},
    {"id": "room_count", "question": "How many rooms do you have?", "type": "number", "required": true},
    {"id": "room_types", "question": "What room types do you offer?", "type": "multiselect", "options": ["Standard", "Deluxe", "Suite", "Family Room", "Sea View", "Pool View"], "required": true},
    {"id": "peak_months", "question": "Which months are your busiest?", "type": "multiselect", "options": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "required": true},
    {"id": "customer_countries", "question": "Which countries do most guests come from? (comma separated)", "type": "text", "required": true},
    {"id": "booking_window", "question": "How far in advance do guests typically book?", "type": "select", "options": ["Same day", "1-3 days", "1 week", "2-4 weeks", "1-3 months", "3+ months"], "required": false},
    {"id": "competitors", "question": "List your main 3-5 competitor hotels (names or websites)", "type": "textarea", "required": true},
    {"id": "amenities", "question": "What amenities do you offer?", "type": "multiselect", "options": ["Pool", "Spa", "Restaurant", "Bar", "Beach Access", "Gym", "Free WiFi", "Parking", "Airport Shuttle", "Room Service"], "required": true},
    {"id": "unique_selling", "question": "What makes your hotel different from competitors?", "type": "textarea", "required": true},
    {"id": "price_range", "question": "What is your nightly room price range? (e.g., €80-€300)", "type": "text", "required": false}
  ]'::jsonb
),
(
  'restaurant',
  'Restaurant & Dining',
  '[
    {"id": "location", "question": "Where is your restaurant located?", "type": "text", "required": true},
    {"id": "cuisine_type", "question": "What type of cuisine do you serve?", "type": "multiselect", "options": ["Greek", "Italian", "Mediterranean", "Seafood", "International", "Fusion", "Vegan/Vegetarian", "Fast Food"], "required": true},
    {"id": "dining_style", "question": "What is your dining style?", "type": "select", "options": ["Fine Dining", "Casual Dining", "Fast Casual", "Cafe", "Bistro", "Taverna"], "required": true},
    {"id": "peak_times", "question": "When are you busiest?", "type": "multiselect", "options": ["Breakfast", "Brunch", "Lunch", "Dinner", "Late Night", "Weekends", "Holidays"], "required": true},
    {"id": "peak_months", "question": "Which months are your busiest?", "type": "multiselect", "options": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "required": true},
    {"id": "customer_mix", "question": "Who are your main customers?", "type": "multiselect", "options": ["Tourists", "Locals", "Business travelers", "Families", "Couples", "Groups"], "required": true},
    {"id": "competitors", "question": "List your main 3-5 competitor restaurants (names or locations)", "type": "textarea", "required": true},
    {"id": "signature_dishes", "question": "What are your signature dishes or specialties?", "type": "textarea", "required": true},
    {"id": "price_range", "question": "What is your average meal price per person?", "type": "select", "options": ["Under €15", "€15-€25", "€25-€40", "€40-€60", "Over €60"], "required": false},
    {"id": "unique_selling", "question": "What makes your restaurant different from competitors?", "type": "textarea", "required": true}
  ]'::jsonb
),
(
  'ecommerce',
  'E-commerce & Online Store',
  '[
    {"id": "product_category", "question": "What products do you sell?", "type": "text", "required": true},
    {"id": "target_market", "question": "Which countries/regions do you target?", "type": "text", "required": true},
    {"id": "product_count", "question": "How many products do you have?", "type": "select", "options": ["1-50", "51-200", "201-1000", "1001-5000", "5000+"], "required": true},
    {"id": "best_sellers", "question": "What are your best-selling product categories?", "type": "textarea", "required": true},
    {"id": "peak_seasons", "question": "When do you see the most sales?", "type": "multiselect", "options": ["January-March", "April-June", "July-September", "October-December", "Black Friday", "Christmas", "Summer Sales"], "required": true},
    {"id": "customer_demographics", "question": "Who are your typical customers? (age, interests)", "type": "textarea", "required": true},
    {"id": "competitors", "question": "List your main 3-5 competitors (websites)", "type": "textarea", "required": true},
    {"id": "price_range", "question": "What is your typical product price range?", "type": "text", "required": false},
    {"id": "shipping", "question": "Where do you ship to?", "type": "multiselect", "options": ["Local only", "National", "Europe", "Worldwide"], "required": true},
    {"id": "unique_selling", "question": "What makes your store different from competitors?", "type": "textarea", "required": true}
  ]'::jsonb
);

-- 5. RLS Policies
ALTER TABLE industry_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_training_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intelligence" ON industry_intelligence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intelligence" ON industry_intelligence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intelligence" ON industry_intelligence
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON business_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own insights" ON business_insights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "All users can view templates" ON industry_training_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grants
GRANT SELECT, INSERT, UPDATE ON industry_intelligence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_insights TO authenticated;
GRANT SELECT ON industry_training_templates TO authenticated;

-- 6. Function to generate insights from industry intelligence
CREATE OR REPLACE FUNCTION generate_business_insights(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_intelligence RECORD;
  v_peak_months TEXT[];
  v_competitor_count INTEGER;
BEGIN
  -- Get user's industry intelligence
  SELECT * INTO v_intelligence
  FROM industry_intelligence
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Extract peak months if they exist
  IF v_intelligence.peak_seasons IS NOT NULL THEN
    SELECT array_agg(DISTINCT elem->>'months')
    INTO v_peak_months
    FROM jsonb_array_elements(v_intelligence.peak_seasons) AS elem;
  END IF;
  
  -- Get competitor count
  SELECT jsonb_array_length(COALESCE(v_intelligence.competitors, '[]'::jsonb))
  INTO v_competitor_count;
  
  -- Generate seasonal opportunity insights
  IF array_length(v_peak_months, 1) > 0 THEN
    INSERT INTO business_insights (
      user_id, intelligence_id, insight_type, title, description, priority, impact_score,
      action_items, estimated_effort, estimated_roi
    )
    VALUES (
      p_user_id,
      v_intelligence.id,
      'seasonal_opportunity',
      'Optimize for Peak Season Traffic',
      format('Your business peaks during %s. Create seasonal content 2-3 months before to capture early searchers.', array_to_string(v_peak_months, ', ')),
      'high',
      85,
      '[
        "Create seasonal landing pages",
        "Build location + season keyword content",
        "Start SEO campaigns 3 months before peak",
        "Target early bookers with long-tail keywords"
      ]'::jsonb,
      'medium',
      'high'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Generate competitor gap insights
  IF v_competitor_count > 0 THEN
    INSERT INTO business_insights (
      user_id, intelligence_id, insight_type, title, description, priority, impact_score,
      action_items, estimated_effort
    )
    VALUES (
      p_user_id,
      v_intelligence.id,
      'competitor_gap',
      'Competitor Analysis Opportunity',
      format('You have %s competitors identified. Analyze their keywords and backlinks to find content gaps.', v_competitor_count),
      'high',
      90,
      '[
        "Use Competitor Analysis tool to find keyword gaps",
        "Identify their top-performing content",
        "Find backlink opportunities",
        "Create better content on their topics"
      ]'::jsonb,
      'low'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- More insights can be added based on other data points
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
