# Aurate — Full Research & Design Document

> "Main character energy check. Are you HIM or are you mid?"

**Date:** 2026-04-13
**Status:** Research & Design Phase

---

## 1. Executive Summary

Aurate is a social media app where users upload selfies/photos and an AI rates their "aura" — giving them a score, personality read, roast, and aura color. Users compete on friend and worldwide leaderboards ("The Mog Board"). The app speaks fluent Gen Z/Gen Alpha brainrot and differentiates through rich AI personality responses, people-focused scoring, and deep social/competitive features.

**Monetization:** Free + ads (rewarded video + native feed ads)
**Target:** Gen Z (16-26) and Gen Alpha (13-16)
**Platforms:** iOS + Android (cross-platform)

---

## 2. Market & Cultural Context

### 2.1 The "Aura" Phenomenon

- "Aura" is Gen Z slang for someone's vibe, energy, or coolness level
- "Aura points" are imaginary scores measuring wins or fails
- Originated from gaming language, popularized by TikToker @aidan2funny (May 2024)
- #aurapoints content grew 378% on TikTok in May-June 2024 alone
- Related terms: "aura farming" (trying too hard to look cool), "auramaxxing" (attempting to increase your aura)
- The concept treats social coolness like a video game score — perfect for gamification

### 2.2 Market Size & Opportunity

| Market | 2026 Value | Projected Growth |
|--------|-----------|-----------------|
| AI in Social Media | $5.65B | -> $70.53B by 2034 (37% CAGR) |
| Gamification | $16.04B | -> $79.09B by 2033 (25.6% CAGR) |
| AI Image Generator | $3.16B | -> $30.02B by 2033 (32.5% CAGR) |
| Spiritual Wellness Apps | $2.99B | Growing steadily |
| Consumer Gen AI App Spending | $10B+ expected by 2026 | Explosive growth |
| In-App Advertising | $390B global | 8.17% CAGR through 2029 |

### 2.3 Timing

The "aura" concept is transitioning from meme to mainstream cultural vocabulary. No dominant app owns this space yet. Aurascope is the closest competitor but has not achieved breakout scale. The window is open.

---

## 3. Competitive Landscape

### 3.1 Direct Competitors

#### Aurascope
- **What:** Camera-first app that scans anything (people, food, places, pets) and assigns an aura score out of 1000 based on 500+ data points
- **Features:** Friend leaderboards, daily score updates, 4 scan categories (Souls, Artifacts, Spaces, Elixirs), badges, journeys/challenges
- **Weaknesses:**
  - Unfocused — rates objects AND people (dilutes the social competition angle)
  - Score is just a number — no personality, no roasts, no shareability
  - No deep social graph features (challenges, voting, streaks)
  - Generic tone — doesn't speak the audience's language

#### AI Aura Readers (Jenova.ai, etc.)
- **What:** Spiritual aura color readings from selfies
- **Weaknesses:** Too niche/mystical, not social, not competitive, no Gen Z appeal

### 3.2 Adjacent Competitors

| App | Relevance | Why Aurate Wins |
|-----|-----------|----------------|
| **BeReal** (47.3M MAU) | Daily candid photos, authenticity-first | No AI, no scoring, no gamification — different product |
| **NGL** | Anonymous questions/compliments | Dying engagement, no AI, no photos |
| **Gas** | Anonymous compliments for teens | Shut down, proved the "social validation" demand exists |
| **Locket** | Friend photos on homescreen widget | No AI, no competition, no scoring |

### 3.3 Aurate's White Space

Nobody combines:
1. **People-focused** AI aura rating (not objects/food/places)
2. **Rich AI personality reads** (roasts, compliments, character analysis — not just a number)
3. **Deep social competition** (challenges, streaks, voting, leaderboards)
4. **Native brainrot language** (speaks fluent Gen Z/Gen Alpha)

---

## 4. Product Design

### 4.1 Core Loop

```
Drop a Pic -> AI Aura Check -> Get Score + Roast + Aura Color -> Share the W (or L) -> Climb The Mog Board
```

1. User selects a **Sigma Path** (archetype that changes how AI judges them)
2. User uploads a selfie or photo of themselves
3. AI analyzes the image and returns:
   - **Aura Points** (0-1000 score)
   - **Personality Read** (2-3 sentence character analysis in brainrot language)
   - **Roast or Compliment** (shareable one-liner)
   - **Aura Color** (visual gradient overlay for sharing)
4. Result is posted to their profile and leaderboard
5. Friends get notified, can react, challenge, or try to beat the score

### 4.2 Sigma Paths (Archetypes)

Users pick a path that changes the AI's scoring lens. Same photo, different rating angle.

| Path | AI Judges On | In-App Description |
|------|-------------|-------------------|
| **Auramaxxing** | Overall energy, confidence, presence, fit | "Main character energy check. Are you HIM or are you mid?" |
| **Looksmaxxing** | Style, grooming, outfit, glow-up | "Softmaxx or hardmaxx, we rate the whole glow-up no cap" |
| **Mogger Mode** | How hard you outshine everyone | "Are you mogging the room or getting mogged? Let's find out" |
| **Rizzmaxxing** | Charisma, charm, flirt energy | "Unspoken rizz or no rizz detected? The AI knows." |
| **Statusmaxxing** | Flex, luxury, expensive vibes | "How hard are you flexing rn? Drip check activated" |
| **Brainrot Mode** | Chaotic/unhinged/meme-worthy energy | "Full goblin mode. Ohio energy. Skibidi toilet arc. No thoughts." |
| **Sigma Grindset** | Discipline, grind, lone wolf energy | "Are you on your sigma grindset or are you just an NPC?" |

- Users can switch paths anytime
- Each path has its own leaderboard
- Path-specific W's (badges): "Supreme Mogger", "Certified Rizz Lord", "Sigma Supreme", "Chaos Agent"

### 4.3 Aura Tier System

| Aura Points | Tier Name | Visual |
|------------|-----------|--------|
| 0-199 | **Down Bad** | Skull energy, dark faded aura |
| 200-399 | **NPC** | Gray flat aura |
| 400-599 | **6-7** | Faded, lukewarm aura — the "if you know you know" mid zone |
| 600-799 | **Cooking** | Warm glowing aura |
| 800-899 | **HIM / HER** | Bright radiating aura |
| 900-949 | **Sigma** | Golden blazing aura |
| 950-999 | **Mog God** | Intense radiating aura with particles |
| 1000 | **Skibidi Legendary** | Transcendent, animated aura effect |

### 4.4 UI Language System

| Generic | Aurate Version |
|---------|---------------|
| Profile | **Your Aura** |
| Score | **Aura Points** |
| Leaderboard | **The Mog Board** |
| Friends list | **Your Circle** |
| Upload photo | **Drop a Pic** |
| Daily challenge | **Daily Vibe Check** |
| Badge/achievement | **W** (plural: **W's**) |
| Losing aura | **L detected** / **Aura drain** |
| Gaining aura | **W secured** / **Aura surge** |
| High score | **Peak Aura** |
| Low score | **Down bad** / **that's a 6-7** |
| Notification | **Aura Alert** |
| Share result | **Post the W** |
| Add friend | **Link up** |
| Feed | **The Timeline** |
| Onboarding | **Aura Origin Story** |
| Streak | **Streak** |

### 4.5 AI Response Tone

The AI speaks fluent brainrot. Examples by score range:

**Peak Aura (800+):**
> "Bro is actually HIM. +847 aura no cap. The fit is mogging everyone in a 5 mile radius. Certified sigma behavior. This pic goes stupid hard."

**6-7 Zone (400-600):**
> "You're giving NPC energy ngl. Not terrible but you're not cooking either. The aura is giving 6-7 fr. Solid 523 — you're one glow-up away from being dangerous."

**Down Bad (under 300):**
> "L detected. Major aura drain. This pic has Ohio energy fr. Bro crashed out. The fit is giving 'I woke up 3 minutes ago and chose chaos.'"

**Vocabulary the AI uses:**
- "no cap" / "fr fr" / "ngl" / "deadass"
- "you're cooking" / "let him cook" / "cooked"
- "main character" / "NPC" / "background character"
- "this goes hard" / "this ain't it" / "mid"
- "W" / "L" / "massive W" / "fat L"
- "down bad" / "actually HIM" / "she ate"
- "ate and left no crumbs" / "served" / "slay"
- "understood the assignment" / "failed the assignment"
- "mogging" / "getting mogged" / "mog differential"
- "rent free" / "living in their head"
- "sigma behavior" / "beta energy" / "NPC arc"
- "goblin mode" / "Ohio energy" / "brainrot"
- "6-7" / "that's a 6-7 at best" (the universal mid rating)
- "skibidi" / "gyatt" / "fanum tax"

### 4.6 Feature Set

#### v1 (MVP)
- Photo upload + AI aura rating (score, roast, aura color)
- 7 Sigma Paths with different AI scoring lenses
- The Mog Board (global + friends leaderboard)
- Your Aura (profile with history of ratings)
- Share cards (Instagram Story / TikTok optimized result cards)
- Your Circle (add friends, see their scores)
- Daily Vibe Check (daily challenge for bonus aura)
- Streaks (consecutive daily uploads)
- Push notifications (Aura Alerts)
- Ad monetization (rewarded video for extra scans, native feed ads)

#### v2 (Social Layer)
- Challenge friends ("1v1 me in Mogger Mode")
- React to friend's scores (fire/skull/L emoji reactions)
- Vote on each other's aura (crowd-sourced scoring alongside AI)
- Group Vibe Checks (rate the whole squad)
- Aura compatibility between friends ("you and @jake have 87% aura sync")

#### v3 (Identity & Retention)
- Aura profile evolution (track your aura journey over time)
- Seasonal events ("Summer Aura Games", "Sigma September")
- Aura types/personality archetypes (like zodiac but for aura)
- W collection gallery (achievement showcase)
- Creator tools (top-rated users become "Aura Influencers")

### 4.7 Notification Copy

- "Your bestie just mogged your high score. You taking that L?"
- "Daily Vibe Check is live. Drop a pic or lose your streak fr"
- "Someone in your circle just hit Sigma tier. You're getting cooked rn"
- "New W unlocked: 7-day streak. Your aura is immaculate"
- "You crashed out of the top 10. Time to cook."
- "@maya challenged you to a Rizzmaxxing battle. Accept or L?"

---

## 5. Technical Architecture

### 5.1 Recommended Tech Stack

#### Mobile App
- **Framework:** React Native (Expo)
  - Why: Faster iteration, single codebase for iOS + Android, massive ecosystem, strong community, Expo simplifies deployment
  - Flutter is technically faster for animations, but React Native's ecosystem advantage matters more for a social app with standard UI patterns
  - Expo provides OTA updates (critical for fast iteration on AI prompts and language)

#### Backend
- **Runtime:** Node.js (Express or Fastify)
- **Database:** Supabase (PostgreSQL + Auth + Realtime + Storage)
  - Why: Built-in auth, realtime subscriptions for leaderboards, row-level security, image storage, generous free tier, fast to build on
- **Image Storage:** Supabase Storage (or Cloudflare R2 for cost optimization at scale)
- **Caching:** Redis (Upstash) — for leaderboard rankings, rate limiting

#### AI Layer
- **Primary:** OpenAI GPT-4o Vision API or Google Gemini Flash
  - Both handle multimodal (image + text) well
  - GPT-4o has stronger personality/creative writing for roasts
  - Gemini Flash is cheaper and faster for high-volume scoring
  - Recommendation: Gemini Flash for scoring, GPT-4o for personality reads (or fine-tune a smaller model)
- **Prompt Engineering:** Path-specific system prompts that define scoring criteria and brainrot tone
- **Content Moderation:** Built-in content filtering + custom guardrails for NSFW, hate speech, bullying

#### Infrastructure
- **Hosting:** Vercel (frontend) + Railway or Fly.io (backend)
- **CDN:** Cloudflare (image delivery, edge caching)
- **Push Notifications:** Firebase Cloud Messaging (FCM) + APNs
- **Analytics:** PostHog or Mixpanel (event tracking, funnels, retention)
- **Ads:** Google AdMob (rewarded video + native ads)

### 5.2 Architecture Diagram

```
[Mobile App (React Native/Expo)]
         |
    [API Layer (Node.js)]
         |
    +---------+---------+---------+
    |         |         |         |
[Supabase] [Redis]  [AI APIs]  [AdMob]
(DB/Auth/   (Cache/  (GPT-4o/   (Ads)
 Storage/   Leaders) Gemini)
 Realtime)
```

### 5.3 AI Prompt Architecture

Each Sigma Path maps to a different system prompt:

```
Base Prompt (shared):
- Analyze the uploaded selfie/photo
- Return: aura_score (0-1000), personality_read, roast, aura_color
- Speak in Gen Z brainrot language
- Be funny, edgy but never mean-spirited or discriminatory
- Never comment on race, ethnicity, body weight negatively

Path-Specific Overlay:
- Auramaxxing: Focus on overall energy, vibe, confidence
- Looksmaxxing: Focus on style, grooming, fashion choices
- Mogger Mode: Focus on dominance, presence, how much they outshine
- (etc.)
```

### 5.4 Content Moderation Strategy

- AI-level: System prompt guardrails preventing offensive outputs
- Image-level: Pre-screening with moderation API (NSFW, violence, minors in inappropriate context)
- Report system: Users can flag AI responses
- Tone calibration: Roasts should be playful, never attack identity (race, body, disability, gender)
- Age gating: 13+ (COPPA compliance), additional restrictions for under-16

### 5.5 Cost Estimates (MVP, first 10K users)

| Service | Monthly Cost |
|---------|-------------|
| Supabase (Pro) | $25 |
| AI API calls (~50K/month) | $50-150 |
| Vercel (Pro) | $20 |
| Railway/Fly.io | $5-20 |
| Redis (Upstash) | Free tier |
| Firebase (Push) | Free tier |
| Domain + misc | $15 |
| **Total** | **~$115-230/month** |

Scales well — main cost driver is AI API calls which scale linearly with users.

---

## 6. Monetization Strategy

### 6.1 Ad Model (Free + Ads)

**Primary:** Rewarded Video Ads
- Users get 3 free aura checks per day
- Watch a rewarded video ad to unlock extra checks
- eCPM: $16-20 on iOS, $14-17 on Android
- This format has highest user acceptance — players opt in voluntarily

**Secondary:** Native Feed Ads
- Subtle ads in The Timeline (between friend score updates)
- Non-intrusive, blends with content
- eCPM: $5-10

**Tertiary:** Interstitial Ads
- Full-screen ad between certain flows (e.g., after viewing a leaderboard)
- Use sparingly to avoid ruining UX
- eCPM: $14-15

### 6.2 Revenue Projections (Conservative)

| Users (MAU) | Daily Checks | Rewarded Ads/Day | Monthly Ad Revenue |
|-------------|-------------|-------------------|-------------------|
| 10K | 15K | 5K | $800-1,500 |
| 50K | 75K | 25K | $4,000-7,500 |
| 100K | 150K | 50K | $8,000-15,000 |
| 500K | 750K | 250K | $40,000-75,000 |
| 1M | 1.5M | 500K | $80,000-150,000 |

### 6.3 Future Monetization (Post-Growth)

- **Aurate Pro** subscription: Unlimited checks, ad-free, exclusive paths, custom aura colors
- **Branded Paths**: Partner with brands for sponsored archetypes ("Nike Grindset Mode")
- **Aura Merch**: Generate custom merch from your aura color/score

---

## 7. Marketing & Growth Strategy

### 7.1 Pre-Launch (Build Hype)

1. **TikTok-First Content Strategy**
   - Create a TikTok account posting aura rating content before the app even launches
   - Series: "Rating strangers' aura" / "Which celebrity has the most aura?"
   - Use brainrot language natively — don't explain the meme, be the meme
   - Target: 50-100 videos before launch, build to 10K+ followers

2. **Waitlist / Early Access**
   - Landing page with "Check your aura" teaser
   - Waitlist with referral mechanic ("invite 3 friends, skip the line")
   - Share your waitlist position (gamification before the app even exists)

3. **Seed with Micro-Influencers**
   - Target 50-100 Gen Z TikTok/Instagram creators (10K-100K followers)
   - Give them early access, let them post their aura scores organically
   - Focus on comedy/lifestyle/fashion niches

### 7.2 Launch Strategy

1. **TikTok Viral Loop**
   - The share card IS the marketing. Every aura result is designed to be screenshotted and posted
   - Result cards include: score, roast quote, aura color gradient, app watermark
   - "What's your aura score?" becomes the viral prompt
   - Goal: organic sharing drives 60%+ of installs

2. **Challenge Marketing**
   - Launch with a viral challenge: "#AuraCheck — drop your score"
   - Partner with 5-10 mid-tier creators to kick off the challenge
   - Challenge format: Show your aura score, tag friends to check theirs

3. **App Store Optimization (ASO)**
   - Keywords: aura, aura check, aura points, rate my aura, vibe check, auramaxxing
   - Screenshots showing brainrot AI responses (the roasts sell the app)

### 7.3 Retention & Growth Loops

1. **Daily Vibe Check** — brings users back every day
2. **Streaks** — loss aversion keeps daily engagement
3. **Friend competition** — "your friend just mogged your score" notifications
4. **Path exploration** — 7 different ways to be rated = 7 reasons to come back
5. **Score improvement** — "can I beat my peak aura?" drives repeat uploads

### 7.4 Growth Flywheel

```
User gets aura score -> Shares result card on TikTok/IG ->
Friends see it -> Download app to check their aura ->
They share their result -> More friends download ->
Leaderboard competition keeps everyone engaged ->
Repeat
```

The AI roast/personality read is the shareable moment. If the AI output is funny enough, people WILL share it. This is the entire growth engine.

---

## 8. Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI generates offensive content | High | Multi-layer moderation: system prompts, output filtering, user reports, human review queue |
| App promotes unhealthy beauty standards | High | Tone is humor-first, not beauty-rating. Never comment on body/weight. Focus on vibe/energy/style |
| Aurascope copies our features | Medium | Speed advantage + community building + richer AI responses create moat |
| Ad revenue insufficient | Medium | Low operating costs ($115-230/mo at MVP). Ads only need to cover costs initially |
| TikTok ban disrupts marketing | Medium | Diversify to Instagram Reels, YouTube Shorts, Snapchat. The share card works on any platform |
| Brainrot language ages quickly | Medium | Language is configurable via AI prompts — can update without app releases (OTA) |
| Users game the AI (same photo repeatedly) | Low | Rate limiting, diminishing returns on same image, variety bonus |
| Privacy/COPPA concerns | High | 13+ age gate, no facial recognition storage, delete images after processing, clear privacy policy |

---

## 9. Success Metrics

### North Star Metric
**Daily Active Aura Checks** — measures both DAU and engagement depth

### Key Metrics

| Metric | Target (3 months post-launch) |
|--------|------------------------------|
| DAU / MAU ratio | > 30% |
| D1 Retention | > 40% |
| D7 Retention | > 20% |
| D30 Retention | > 10% |
| Avg. checks per user per day | > 2 |
| Share rate (% who share result) | > 15% |
| Viral coefficient (K-factor) | > 0.7 |
| Friend invites per user | > 2 |

---

## 10. Sources & References

### Cultural Research
- [Gen Z Slang Dictionary — Aura](https://www.diy.org/tools/gen-z-slang-dictionary/aura)
- [Aura Points — Know Your Meme](https://knowyourmeme.com/memes/aura-points)
- [Aura Slang — Know Your Meme](https://knowyourmeme.com/memes/aura-slang)
- [Auramaxxing and Aura Points — TikTok Trends](https://findmykids.org/blog/en/what-is-aura-points-and-auramaxxing)
- [Looksmaxxing — Wikipedia](https://en.wikipedia.org/wiki/Looksmaxxing)
- [-maxxing — Wikipedia](https://en.wikipedia.org/wiki/-maxxing)
- [Mogging and Looksmaxxing Explained — nss magazine](https://www.nssmag.com/en/fashion/35543/mogger)
- [Retardmaxxing — Know Your Meme](https://knowyourmeme.com/memes/retardmaxxing)
- [Gen Alpha Slang — Parade](https://parade.com/living/gen-alpha-slang)

### Competition
- [Aurascope — App Store](https://apps.apple.com/us/app/aurascope/id6743813411)
- [Aurascope — Product Hunt](https://www.producthunt.com/products/aurascope)
- [I Tried the Social App Based on Aura — Phone Time](https://www.phonetime.news/p/i-tried-the-social-app-based-on-aura)
- [BeReal Comeback Strategy — Marketing Brew](https://www.marketingbrew.com/stories/2025/07/16/bereal-comeback-strategy)
- [Are Gen Z Social Media Apps Sustainable? — Thred](https://thred.com/newsletters/are-gen-z-social-media-apps-sustainable-long-term/)

### Market Data
- [AI in Social Media Market — Fortune Business Insights](https://www.fortunebusinessinsights.com/ai-in-social-media-market-107187)
- [Gamification Market — Coherent Market Insights](https://www.coherentmarketinsights.com/market-insight/gamification-market-4292)
- [AI Image Generator Market — SkyQuest](https://www.skyquestt.com/report/ai-image-generator-market)
- [Rewarded Ads Performance 2026 — MAF](https://maf.ad/en/blog/rewarded-ads-stats/)
- [App Monetization Strategies 2026 — Publift](https://www.publift.com/blog/app-monetization)

### Technology
- [React Native vs Flutter 2026 — Adevs](https://adevs.com/blog/react-native-vs-flutter/)
- [Multimodal AI Vision 2026 — Claude5 Hub](https://claude5.com/news/multimodal-ai-in-2026-vision-documents-real-world-applicatio)
- [AI API Pricing Comparison 2026 — IntuitionLabs](https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude)

### Growth Strategy
- [TikTok Marketing Strategy 2026 — Marketing Agent](https://marketingagent.blog/2025/11/03/tiktok-marketing-strategy-for-2026-the-complete-guide-to-dominating-the-worlds-fastest-growing-platform/)
- [TikTok Growth Hacks 2026 — Insense](https://insense.pro/blog/tiktok-growth-hacks)
- [Social Media Trends 2026 — Hootsuite](https://blog.hootsuite.com/social-media-trends/)
