# Content Ideas AI Feature Specification

## Overview
**Content Ideas AI** proactively suggests marketing content tailored to each dealership's inventory, seasonality, performance history, and market trends. It reduces the decision paralysis of "what should we create today?" and maximizes relevance and engagement.

---

## 🎯 User Problem It Solves

**Before**: Users stare at a blank canvas wondering:
- "What should we post?"
- "Which vehicle should we feature?"
- "What type of content performs best?"
- "When should we post?"

**After**: Users get specific, actionable ideas:
- "🔥 Feature the 2024 Tesla Model 3 (lowest mileage in inventory)"
- "📅 Create a 'Coming Soon' post for the 3 arriving next week"
- "💰 Price drop alert - the 2022 Honda Civic just dropped $2K"

---

## 🔧 How It Works

### Core Logic

**Content Ideas AI analyzes:**

1. **Inventory Health** 📊
   - Vehicle age (oldest vehicles need promotion)
   - Price trends (recent price drops = quick sales opportunity)
   - Mileage patterns (low-mileage = premium positioning)
   - Status distribution (featured, available, sold, coming_soon)
   - Days on lot (older inventory needs movement)

2. **Seasonal Opportunities** 📅
   - Current holidays/events (Valentine's Day, Summer, Back-to-School)
   - Weather patterns (winter cars in fall, convertibles in spring)
   - Tax refund season, graduation, holidays
   - Dealership-specific events (anniversary, grand opening, etc.)

3. **Performance Data** 📈
   - Top-performing content types (which generated most clicks/leads)
   - Best channels (Instagram posts vs. Facebook vs. Twitter)
   - Optimal posting times (when audience is most engaged)
   - Vehicle types with highest conversion (luxury, affordable, family)

4. **Market Signals** 🎯
   - Inventory gaps (low on SUVs? Generate SUV content)
   - Price competitiveness (locally trending price points)
   - Inventory turnover (if sedans sell fast, suggest more sedan content)
   - Competitor activity (if competitor featured luxury, we should too)

5. **User Behavior** 👥
   - What the user generates most
   - Channels they publish to most
   - Time of day they typically publish
   - Preferences (favorite content types, vehicles)

---

## 💡 Types of Ideas Generated

### 1. **Spotlight Ideas** ⭐
```
"Feature your lowest-mileage vehicle"
Vehicle: 2024 Tesla Model 3 Long Range
Why: Only 2,000 miles, premium inventory
Channel: Instagram Story + Feed
Content Type: Vehicle Spotlight
Urgency: HIGH (low-mileage vehicles sell fast)
```

### 2. **Price-Driven Ideas** 💰
```
"Create a price drop alert"
Vehicle: 2022 Honda Civic (just dropped $2,000)
Why: Price reduction = fresh reason to engage audience
Channel: Facebook + Twitter (urgency platforms)
Content Type: Price Drop Alert
Urgency: HIGH (limited-time offer feeling)
```

### 3. **Seasonal Ideas** 📅
```
"Summer Road Trip Campaign"
Vehicles: All convertibles + SUVs
Why: Summer travel season = convertible/SUV interest
Channel: All channels
Content Type: Seasonal Greeting + Vehicle Showcase
Campaign: "Summer Adventure Ready"
Timing: Weekly through August
```

### 4. **Inventory Movement Ideas** 🚗
```
"Move the oldest vehicle in inventory"
Vehicle: 2020 Chevy Silverado (285 days on lot)
Why: Aged inventory needs aggressive promotion
Channel: Instagram + Pinterest (visual)
Content Type: Bold Graphic + Promo
CTA: "This weekend only - $3K off"
```

### 5. **Category Gaps** 📊
```
"You're low on family vehicles"
Gap: Only 3 minivans/crossovers available
Suggestion: Create 2-3 family-focused content pieces
Vehicles: 2023 Honda Odyssey, 2023 Toyota Highlander
Why: Family buyers are actively shopping
Content Type: Family Vehicle Showcase
```

### 6. **Upcoming Inventory Ideas** 🔮
```
"Create 'Coming Soon' teaser campaign"
Vehicles: 3 vehicles arriving next Tuesday
Why: Build anticipation, get pre-orders
Channel: Email + Instagram Story
Content Type: Coming Soon Announcement
Frequency: Tease today, reveal next week
```

### 7. **Performance-Based Ideas** 🎯
```
"Replicate your top-performing content"
Best Performer: 2024 luxury sedan posts (3.2K engagement)
Suggestion: Create similar content for your other luxury vehicles
Vehicles: BMW 3-Series, Mercedes C-Class
Content Type: Luxury Brand Post
Why: Proven winner with your audience
```

### 8. **Promotional Ideas** 🎁
```
"Weekend flash sale campaign"
Idea: "3-Day Only: $2K off all sedans"
Vehicles: 8 sedans under $25K
Why: EOW urgency drives showroom traffic
Channels: All (coordinated blast)
Content Type: Promo + Bold Graphics
Timing: Friday 10am (peak posting time for your account)
```

### 9. **Competitor-Inspired Ideas** 🔍
```
"Match competitor's luxury campaign"
Competitor: Local dealer running BMW campaign
Insight: Luxury segment showing high interest in your area
Suggestion: Feature your luxury inventory
Content Type: Bold luxury positioning
Why: Capture segment interest while it's hot
```

### 10. **Customer Testimonial Ideas** 😊
```
"Create a customer success story"
Data: Vehicle XYZ sold 3 months ago, likely satisfied
Suggestion: Reach out for testimonial + before/after story
Content Type: Customer Review/Testimonial
Channel: Facebook + Google Business
Why: Social proof converts better than advertising
```

---

## 🏗️ Architecture

### Database Schema

```sql
-- Store content idea configurations and history
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY,
  dealership_id UUID REFERENCES dealerships(id),
  
  -- Idea metadata
  idea_type TEXT, -- 'spotlight', 'price_drop', 'seasonal', etc.
  idea_title TEXT,
  idea_description TEXT,
  
  -- Recommendation data
  suggested_vehicles UUID[], -- Array of vehicle IDs
  suggested_content_types TEXT[], -- Array of content types
  suggested_channels TEXT[], -- Array of channels
  
  -- Reasoning
  reasoning TEXT, -- Why this idea is good
  urgency_level TEXT, -- 'low', 'medium', 'high'
  
  -- Performance tracking
  was_generated BOOLEAN DEFAULT false,
  generated_at TIMESTAMP,
  generated_asset_id UUID REFERENCES generated_assets(id),
  
  -- Feedback
  user_liked BOOLEAN,
  user_feedback TEXT,
  
  created_at TIMESTAMP,
  expires_at TIMESTAMP -- Ideas expire (old ideas less relevant)
);

-- Track idea performance (how well suggested ideas perform)
CREATE TABLE idea_performance (
  id UUID PRIMARY KEY,
  dealership_id UUID,
  idea_type TEXT,
  content_type TEXT,
  channel TEXT,
  
  -- Metrics
  times_generated INT,
  times_published INT,
  avg_engagement FLOAT,
  avg_ctr FLOAT,
  conversion_rate FLOAT,
  
  created_at TIMESTAMP
);

-- Store user preferences for idea generation
CREATE TABLE idea_preferences (
  id UUID PRIMARY KEY,
  dealership_id UUID,
  
  -- What ideas to show
  idea_types_enabled TEXT[], -- Which types they want
  min_urgency_level TEXT, -- Don't show low-urgency ideas
  max_ideas_per_day INT DEFAULT 5,
  
  -- When to show
  preferred_times TEXT[], -- Morning, afternoon, evening
  preferred_channels TEXT[], -- Channels they actually use
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### API Endpoints

```
GET /api/ideas/suggestions
- Get today's content ideas (paginated, cached)
- Query params: idea_type, urgency, limit
- Response: [{ idea, vehicles, reasoning, cta }]

GET /api/ideas/suggestions/[id]
- Get details of a specific idea
- Response: full idea object with detailed reasoning

POST /api/ideas/[id]/generate
- User clicks "Generate this idea"
- Redirects to /dashboard/create with pre-filled params
  (vehicle, content_type, channel, caption)

POST /api/ideas/[id]/feedback
- User gives thumbs up/down on idea
- Trains the AI on preferences
- Body: { liked: boolean, reason?: string }

GET /api/ideas/analytics
- See which ideas convert best
- Data for training/optimization
```

### AI/ML Component

**Input Data** (real-time):
- `Vehicle inventory` (age, price, mileage, status, tags)
- `Generated assets` (performance, content type, channel, vehicle)
- `Published posts` (engagement, clicks, conversions)
- `Current date/time` (seasonality, day of week, time)
- `User behavior` (preferences, favorite types, posting patterns)

**Processing** (Claude API call):
```typescript
const ideaSuggestions = await claude.messages.create({
  model: "claude-opus-4-6",
  messages: [{
    role: "user",
    content: `You are a marketing AI for a car dealership. 
    
Given this inventory and data, suggest 5 specific, actionable content ideas:

DEALERSHIP INFO:
- Name: ${dealership.name}
- Personality: ${dealership.local_context.personality}
- Communities: ${dealership.local_context.communities_served}

CURRENT INVENTORY (${vehicles.length} vehicles):
${formatInventorySummary(vehicles)}

PERFORMANCE DATA (best-performing content):
${formatPerformanceData(recentAssets)}

TODAY'S DATE: ${new Date()}
CURRENT SEASON: ${getCurrentSeason()}
UPCOMING HOLIDAYS: ${getUpcomingHolidays()}

For each idea, provide:
1. TYPE (spotlight, price_drop, seasonal, etc)
2. TITLE (catchy)
3. DESCRIPTION (2-3 sentences)
4. VEHICLE(S) (which to feature)
5. CONTENT_TYPE (from our 11 types)
6. CHANNELS (from our 13 channels)
7. WHY (reasoning - urgency, trend, performance)
8. URGENCY (low/medium/high)

Format as JSON.`
  }]
});
```

**Output**: Structured ideas with reasoning

---

## 🎨 UI/UX

### Ideas Dashboard Widget
```
┌─ Content Ideas for Today ────────────────────────┐
│                                                  │
│ 🔥 HIGH PRIORITY                               │
│ ├─ Feature lowest-mileage vehicle              │
│ │  └─ 2024 Tesla Model 3 (2K mi)              │
│ │     Instagram Post • Vehicle Spotlight       │
│ │     [Generate] [Dismiss] [Later]             │
│                                                 │
│ 💰 MEDIUM PRIORITY                             │
│ ├─ Price drop alert: Honda Civic              │
│ │  └─ Just dropped $2K!                        │
│ │     Facebook + Twitter • Price Drop Alert    │
│ │     [Generate] [Dismiss]                     │
│                                                 │
│ 📅 SEASONAL                                    │
│ ├─ Summer Road Trip Campaign                  │
│ │  └─ Feature convertibles + SUVs              │
│ │     All Channels • Seasonal Greeting         │
│ │     [Create Campaign] [Details]              │
│                                                 │
│ ✨ [View All Ideas] [Preferences]              │
└─────────────────────────────────────────────────┘
```

### Ideas Page (`/dashboard/ideas`)
- Calendar view of suggested ideas over time
- Filter by type, urgency, vehicle, channel
- Performance metrics (which ideas convert)
- Archive/history of past ideas
- "Like/Dislike" feedback
- One-click generation with pre-filled forms

### Quick Generate Flow
```
Idea Card
  ↓
[Generate Button]
  ↓
Auto-fill form with:
  - Vehicle (pre-selected)
  - Content Type (pre-selected)
  - Channel (pre-selected)
  - Caption suggestions
  ↓
User customizes + generates
  ↓
Asset created + option to publish
```

---

## 🚀 Implementation Phases

### Phase 1: Basic Ideas (Week 1-2)
- [x] Database schema
- [ ] Inventory-based ideas (spotlights, price drops, aged inventory)
- [ ] Seasonal calendar integration
- [ ] Simple Claude API calls
- [ ] Dashboard widget display
- [ ] Generate one-click flow

**MVP**: "What should we feature today?"

### Phase 2: Smart Ideas (Week 3-4)
- [ ] Performance analysis (what sells)
- [ ] User preference learning
- [ ] Upcoming inventory teasers
- [ ] Category gap detection
- [ ] Competitor insights (requires Perplexity/web API)

### Phase 3: Advanced (Week 5+)
- [ ] Multi-vehicle campaigns
- [ ] Email sequence suggestions
- [ ] Landing page suggestions
- [ ] A/B test recommendations
- [ ] Predictive content (what will sell next month)

---

## 📊 Data Requirements

**Inventory data** (already have):
- Vehicle specs, price, mileage, status, days on lot

**Performance data** (need to track):
- Asset generation history (what gets created)
- Publication data (what gets published, where)
- Engagement metrics (likes, clicks, conversions)
- Time-to-sale (which content types lead to quick sales)

**User behavior** (need to track):
- What they generate most
- What they publish to
- Feedback (likes/dislikes)
- Time patterns

---

## 💰 Value Proposition

**For Dealerships:**
- 📈 **50% faster content creation** (no brainstorming)
- 🎯 **Better targeting** (AI knows what works)
- 💯 **Higher relevance** (personalized to their inventory)
- ⏰ **Consistent posting** (always have ideas)
- 🚀 **Faster inventory turnover** (aged vehicles get promotion)

**For Platform:**
- 📊 More assets generated = more data for training
- 💾 Better retention (users know what to create)
- 🔄 Higher publishing rate (easier → they share more)
- 📈 Usage growth (less friction = more volume)

---

## 🔌 Integration Points

1. **Dashboard** - Ideas widget on home page
2. **Create Flow** - Pre-fill form from idea
3. **Asset Page** - "This was suggested by AI Ideas"
4. **Settings** - Idea preferences
5. **Analytics** - Track idea performance
6. **Email** - Daily idea digest (optional)

---

## 🧪 Success Metrics

Track these to measure feature impact:

- **Adoption**: % of users who view ideas daily
- **Conversion**: % of ideas that get generated
- **Publishing**: % of generated ideas that get published
- **Engagement**: Avg engagement on AI-suggested content
- **Sales Impact**: Days-to-sale for vehicles featured via ideas
- **User Satisfaction**: Feedback rating on ideas (like/dislike)
- **Frequency**: How many ideas generated per user per week

---

## 🔐 Privacy & Security

- Ideas are dealership-specific (RLS enforced)
- No sharing of inventory between dealerships
- Ideas stored with expiration (old ideas deleted)
- User feedback used only for that dealership's training
- Claude API calls don't log sensitive inventory data

---

## 📝 Next Steps

1. **Validate** - Ask users if they'd use this
2. **Design** - Create detailed wireframes
3. **Build Phase 1** - Basic inventory-based ideas
4. **Test** - Get feedback from pilot users
5. **Iterate** - Refine based on real usage
6. **Launch** - Roll out to all users

---

## 🎯 Success Criteria

✅ Users see 3-5 relevant ideas daily
✅ 30%+ of ideas get converted to generated assets
✅ Generated-from-ideas content outperforms random content
✅ Users feel their workload is reduced
✅ Platform sees increased asset generation & publishing
