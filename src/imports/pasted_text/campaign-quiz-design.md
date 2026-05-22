# FRONTEND DESIGN PROMPT FOR FIGMA

## PROJECT: Campaign Quiz Platform

Build a fully responsive web-based quiz platform where users scan QR codes, take 5-question MCQs, and compete on real-time leaderboards. Includes admin panel for campaign management.

---

## COLOR SYSTEM

| Role | Color Code | Usage |
|------|------------|-------|
| Primary | #4F46E5 (Indigo 600) | Buttons, links, active states |
| Primary Dark | #4338CA (Indigo 700) | Hover states |
| Secondary | #F59E0B (Amber 500) | Accents, highlights, warnings |
| Success | #10B981 (Emerald 500) | Correct answers, completion |
| Error | #EF4444 (Red 500) | Errors, disconnections |
| Background Light | #F9FAFB | Main background |
| Background Dark | #1F2937 | Admin sidebar |
| Surface White | #FFFFFF | Cards, modals |
| Text Primary | #111827 | Headings, body text |
| Text Secondary | #6B7280 | Labels, hints |
| Border | #E5E7EB | Dividers, input borders |

---

## TYPOGRAPHY

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | Inter | 32px | 700 | 1.2 |
| H2 | Inter | 24px | 600 | 1.3 |
| H3 | Inter | 20px | 600 | 1.4 |
| Body Large | Inter | 18px | 400 | 1.5 |
| Body Regular | Inter | 16px | 400 | 1.5 |
| Body Small | Inter | 14px | 400 | 1.5 |
| Label | Inter | 12px | 500 | 1.4 |
| Timer | Inter (mono) | 24px | 600 | 1.2 |

**Google Font:** `@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap')`

---

## SPACING SYSTEM (8px base)

4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px

**Border Radius:** 8px (inputs, buttons), 12px (cards), 16px (modals), 999px (pills/badges)

---

## SCREEN 1: QR SCAN LANDING PAGE

**After scanning QR code - campaign-specific landing page**

### Layout
- Mobile-first (375px width), full viewport height
- Centered content with padding: 24px on sides

### Elements (top to bottom)

**1. Campaign Header**
- Campaign icon/avatar (48x48px, rounded-full, primary gradient)
- Campaign name (H2, bold, text-primary)
- Campaign description (body small, text-secondary, 2 lines max)

**2. Hero Illustration**
- SVG illustration of person taking quiz (240x160px)
- Or campaign banner image if uploaded (16:9, rounded-2xl)

**3. Instructions Card** (surface-white, rounded-2xl, padding-24, border, shadow-sm)
- "How it works" heading (H3)
- 3 steps in row with icons:
  - 📝 "Answer 5 questions"
  - ⚡ "Compete on leaderboard"
  - 🏆 "Win daily prizes"
- Divider line
- Privacy note with lock icon: "Name & mobile required"

**4. Campaign Stats Badge**
- Pill background: primary/10 (lightest primary tint)
- Icon + text: "👥 1,247 participated this week"

**5. Primary CTA Button**
- Width: 100%, height: 56px
- Background: primary, text: white
- Border radius: 12px
- Text: "Start Quiz →" (body large, semibold)
- Hover state: background primary-dark

**6. Footer**
- "Terms & Conditions" link
- "Support" link
- Copyright text (label, text-secondary)

### States to Design
- Loading skeleton (pulsing placeholder cards)
- Campaign not found error state (sad face icon + message)

---

## SCREEN 2: USER REGISTRATION FORM

**Before quiz starts - collect participant details**

### Layout
- Padding: 24px sides
- White background

### Elements (top to bottom)

**1. Progress Indicator**
- Step 1 of 3: Registration
- Progress bar: 33% filled primary

**2. Campaign Name Pill**
- Pill background: primary/10, text-primary
- Campaign name (body small)

**3. Form Container** (surface-white, rounded-2xl, border, padding-20)
- **Full Name field**
  - Label: "Full Name" (body small semibold)
  - Input: height 48px, border 1px border, border-radius 8px, padding 0-16px
  - Placeholder: "Enter your full name"
  - Validation: checkmark icon when valid
  - Error state: red border + "Name is required" message

- **Mobile Number field**
  - Label: "Mobile Number" + "🔒 Primary identifier" badge
  - Input: tel, placeholder: "9876543210"
  - Country code selector (optional, +91 / +1 / +44)
  - Error: "Mobile number already used today" (if duplicate)

- **Email Address field**
  - Label: "Email Address" (optional tag optional)
  - Input: email, placeholder: "you@example.com"
  - Validation: email format check

**4. Terms Checkbox**
- Custom checkbox (20x20px, rounded)
- Text: "I agree to the Terms & Conditions and Privacy Policy" (body small)
- Terms and Privacy links underlined

**5. Action Buttons**
- Primary: "Proceed to Quiz" (width 100%, height 52px, primary background)
- Secondary link: "← Back to Campaign" (text-center, text-secondary)

### Form States
- Empty state
- Valid input state (green check)
- Error state (red border + message)
- Loading state (spinner on button)
- Success state (green border)

---

## SCREEN 3: QUIZ INTERFACE

**Main quiz taking - one question at a time, 5 questions total**

### Layout
- White background
- Sticky header, scrollable question area

### Header (sticky, white, shadow-sm)
- Campaign name (body small, text-secondary)
- Question counter: "Question 2 of 5" (label semibold, primary)
- Timer display: "⏱️ 01:23" (monospace, 20px, text-dark)
- Difficulty badge: Pill, "EASY" (green) / "MEDIUM" (amber) / "HARD" (red)

### Question Area
- Question card (surface-white, border, rounded-2xl, padding-24)
- Question text (H3, text-primary, 24px, center alignment)
- Difficulty indicator (pill with difficulty color and word)

### Answer Options (5 options A through E)
Each option card:
- Container: border, rounded-xl, padding-16, margin-bottom-12
- Hover state: border-primary, shadow-sm
- Selected state: background-primary/5, border-primary-500, ring-1 ring-primary
- Option letter (A, B, C, D, E) inside circle (32px, primary/10, primary text)
- Option text (body regular, text-primary)
- Radio indicator (custom, on right side)

### Navigation
- Previous button (secondary outline, visible after question 1)
- Next button (primary filled, disabled until answer selected)
- Progress dots (5 dots, current dot primary, completed dots primary/50)

### Inactivity Warning Modal
**Trigger: 4 minutes of no activity**
- Centered modal (320px width, rounded-2xl, padding-24)
- Warning icon (yellow circle with exclamation, 48px)
- Heading: "Session Expiring Soon" (H3)
- Message: "You'll be disconnected due to inactivity in 60 seconds"
- "Stay Active" button (primary, full width)
- Timer countdown from 60 to 0

### Quiz Complete Modal (after Q5 answered)
- Centered modal
- Confetti animation
- "Quiz Complete!" heading
- Loading spinner while calculating
- Auto-advances to results in 1.5 seconds

---

## SCREEN 4: QUIZ RESULTS SCREEN

**Instant results after submission**

### Layout
- Padding: 24px sides
- Scrollable content

### Score Card (centered, margin-bottom-24)
- Large score: "4 / 5" (H1, 48px, text-primary)
- Percentage circle (SVG, 120px, progress from 0 to score%)
- Subtitle: "Correct Answers" (body small, text-secondary)
- Time taken card: "⏱️ Completed in 2 minutes 35 seconds" (pill)

### Performance Breakdown
- Section heading: "Question Summary" (H3, margin-bottom-16)
- Each question row (border-bottom, padding-vertical-12):
  - Left: Q1 icon (✅ green check / ❌ red X)
  - Center: Truncated question text
  - Right: "Correct: A" or "You: B • Correct: A"
  - Expandable for incorrect questions (shows correct answer explanation)

### Ranking Card (surface-white, border-primary/20, rounded-2xl, padding-20, margin-vertical-24)
- Trophy icon (🥇/🥈/🥉 or 🏆)
- "Your Rank: #3 on Today's Leaderboard"
- Confetti animation for #1 rank
- Previous rank (if available): "↑ Improved from #7"

### Call to Actions (vertical stack, gap-12)
- Primary button: "View Full Leaderboard →" (height 52px)
- Secondary button: "📤 Share My Score" (outline)
- Tertiary link: "← Back to Campaign"

### Social Share Preview
- Card preview of share link
- Thumbnail: "I scored 4/5 on [Campaign Name]!"
- WhatsApp / Twitter / Copy Link buttons (icon buttons)

---

## SCREEN 5: LEADERBOARD SCREEN

**Campaign rankings - daily, weekly, monthly**

### Layout
- White background
- Sticky header with tabs

### Header
- Back button (arrow left, 40px)
- Campaign name (H3)
- Refresh button (icon only)

### User's Rank Card (sticky below tabs)
- Container: primary/10 background, border-left-4 border-primary, padding-12
- "Your Rank" label + rank number + score + time

### Time Period Tabs
- 3 equal width tabs: DAILY | WEEKLY | MONTHLY
- Active tab: border-bottom-2 border-primary, text-primary
- Indicator: sliding underline

### Top 3 Podium Display (flex row, justify-center, align-end)
- **2nd Place** (left): height 100px, silver background, rank 2 badge, name truncated, score
- **1st Place** (center): height 140px, gold background, crown 👑 icon, name, score, time
- **3rd Place** (right): height 80px, bronze background, rank 3 badge, name, score

### Leaderboard Table (positions 4+)
- Column headers: RANK | NAME | SCORE | TIME | DATE
- Each row: padding-vertical-12, border-bottom
- Rank numbers: #4, #5, #6...
- Highlight current user row: primary/5 background
- Medal icons for top 3 in rank column
- Score: "4/5" bold
- Time: "2:35"
- Date: "May 22"

### Pagination
- Previous / Next buttons
- Page indicator "Page 1 of 5"
- Items per page selector: 20 / 50 / 100

### Filter Bar (collapsible on mobile)
- Search input: 🔍 "Search by name"
- Date picker: calendar icon + date range
- Export CSV button (download icon)

### Footer Stats
- 3 stat cards in row:
  - "👥 Total: 2,347 participants"
  - "📊 Avg score: 3.8/5"
  - "⚡ Fastest: 45 seconds"

---

## SCREEN 6: ADMIN LOGIN PAGE

**Secure login for administrators**

### Layout
- Centered card on gradient background
- Background: subtle gradient primary to secondary (opacity 10%)

### Login Card (surface-white, rounded-2xl, shadow-xl, width 400px max)
- Logo/Platform name (H2, center)
- Email field (icon: envelope, placeholder: "admin@example.com")
- Password field (icon: lock, placeholder: "••••••••", show/hide toggle)
- Remember me checkbox + Forgot password link
- Login button (primary, full width, loading state)
- Error alert (red background, "Invalid credentials" message)

### 2FA Modal (after successful password)
- "Enter 6-digit code" heading
- 6 digit input boxes (single digit each)
- "Resend code" link
- Verify button

---

## SCREEN 7: ADMIN DASHBOARD

**Overview with key metrics**

### Layout
- Desktop: sidebar 260px + main content
- Mobile: bottom navigation + main content

### Sidebar Navigation (Desktop)
- Logo at top (32px height)
- Nav items (icon + text):
  - 📊 Dashboard (active: primary background/light)
  - 🎯 Campaigns
  - ❓ Questions Bank
  - 🏆 Leaderboards
  - ⚙️ Settings
  - 🚪 Logout
- Divider
- User avatar + name at bottom

### Top Bar
- Welcome message: "Good morning, Admin"
- Date range selector: "Last 7 days ▼"
- Notifications icon badge (count)
- Avatar dropdown

### KPI Cards (grid 2x2 on mobile, 4x1 on desktop)
Card design: surface-white, border, rounded-2xl, padding-16
- Total Participants: "12,847" + ↑12% (trend)
- Active Campaigns: "8" + icon
- Completion Rate: "76%" + progress ring
- Top Performer: "Rajesh K. • 5/5" + medal

### Charts
**Line Chart: Participants Over Time**
- X-axis: Dates (May 1-31)
- Y-axis: Participant count
- Smooth line, primary color
- Tooltip on hover

**Bar Chart: Campaign Performance**
- Horizontal bars
- Campaign name + participants + completion rate

### Recent Activity Feed
- List of recent events (each with icon, text, time)
- "🎉 John scored 5/5" - 2 mins ago
- "📁 New campaign 'Summer Quiz' created" - 1 hour ago
- "📤 500 questions uploaded" - yesterday
- "👑 Weekly winner announced" - yesterday

### Quick Actions Bar
- "+ Create New Campaign" (primary button)
- "📤 Upload Questions" (secondary)
- "📊 View All Leaderboards" (link)

---

## SCREEN 8: CREATE / EDIT CAMPAIGN

**Campaign management form**

### Layout
- Form container (max-width 800px)
- 2 columns on desktop, 1 on mobile

### Form Sections

**Basic Information**
- Campaign Name (required, max 100 chars, counter)
- Campaign Description (textarea, 4 rows)
- Status Toggle: Active/Inactive (pill switch)
- Date Range: Start Date + End Date (date pickers)
- Campaign Image Upload (drag-drop area 200x120px, preview)

**QR Code Section** (card background)
- QR Code Preview (200x200px center)
- Download buttons: PNG / SVG
- "Regenerate QR" button (secondary, with confirmation)
- Scan instructions: "Scan with any QR reader"

**Campaign Settings**
- Questions per quiz: 5 (locked or dropdown: 5/10/15)
- Time limit per question: None / 30s / 60s / 120s
- Leaderboard visibility: Public / Private (toggle)
- Winner announcement: "Show winner banner" toggle

**Action Buttons**
- Save Campaign (primary, right aligned)
- Cancel (secondary outline)
- Delete Campaign (red text, left aligned, with confirm modal)

### Live Preview Card (sidebar on desktop)
- Real-time preview of campaign landing page
- Updates as form fields change

---

## SCREEN 9: QUESTION BANK MANAGEMENT

**Manage questions per campaign**

### Layout
- Campaign selector dropdown at top
- Upload section + questions table

### Campaign Selector
- Dropdown with all campaigns
- "Current: Summer Quiz 2024" with change button
- Question count badge: "342 questions"

### Bulk Upload Section (card)
- Drag-drop zone (border-dashed, rounded-2xl, padding-40)
- "📁 Drop Excel file here or browse"
- Supports .xlsx, .xls (max 10MB)
- Sample template download link
- Upload progress bar (0% → 100%)
- Success toast: "500 questions uploaded successfully"
- Error toast with row numbers for failures

### Questions Table
- Search bar (🔍 Search questions...)
- Filter chips: All | Easy | Medium | Hard
- Select all checkbox
- Columns:
  - ☑️ Select
  - Question text (truncated, max 60 chars)
  - Difficulty badge (color coded)
  - Options (hover to see A-E)
  - Correct answer (pill, primary/10)
  - Actions (✏️ Edit | 🗑️ Delete)
- Pagination: 25/50/100 per page

### Add Single Question Button (floating action button)
- Opens modal with form:
  - Question text (textarea)
  - Option A, B, C, D, E (5 inputs)
  - Correct option (dropdown A-E)
  - Difficulty (dropdown)
- Save & Add Another checkbox
- Cancel + Save buttons

### Bulk Actions Bar (when rows selected)
- Delete selected (with counter)
- Export selected as CSV
- Change difficulty for selected

---

## SCREEN 10: LEADERBOARD MANAGEMENT (ADMIN)

**Admin view with export and override capabilities**

### Layout
- Campaign selector + date range at top

### Controls Bar
- Campaign dropdown
- Date range picker (presets: Today, This Week, This Month)
- "Apply Filters" button

### Three Tab View (Daily | Weekly | Monthly)
Each tab has:
- Export buttons: CSV | PDF
- Last updated timestamp
- Recalculate button (refresh icon)

### Leaderboard Table (enhanced admin version)
Additional columns beyond user view:
- Mobile (masked: 98765****0)
- Email
- Session ID (for debugging)
- Actions (View Details, Adjust Rank)

### Manual Adjustment Modal
- Trigger: "Adjust Rank" button on row
- Current rank display
- New rank selector (dropdown)
- Reason textarea (required)
- "Apply Adjustment" button
- Audit log entry created

### Winner History Section
- Previous winners by period
- Month selector (January, February...)
- Winner cards with: Name, Score, Time, Date

### Analytics Section
**Heatmap: Participation Times**
- Grid: Hours (0-23) x Days (Mon-Sun)
- Color intensity based on volume

**Drop-off Analysis**
- Funnel: Scan → Register → Q1 → Q2 → Q3 → Q4 → Q5 → Complete
- Percentage at each stage

**Question Difficulty Analysis**
- Bar chart: Correct % by question
- Identify hardest/easiest questions
- Click to view question details

---

## SCREEN 11: SESSION EXPIRED PAGE

**Disconnected due to 5 minutes inactivity**

### Layout
- Centered content, full viewport
- Padding 24px

### Elements
- Warning icon (⚠️, 64px, red-500)
- Heading: "Session Expired" (H1, 28px)
- Message: "You were disconnected due to 5 minutes of inactivity to maintain leaderboard integrity." (body, text-secondary, centered)
- Two primary buttons (stack vertical):
  - "Start New Quiz" (primary)
  - "Back to Campaign" (secondary outline)

---

## SCREEN 12: 404 / CAMPAIGN NOT FOUND

**Invalid QR code or broken link**

### Layout
- Centered, playful illustration

### Elements
- Illustration: "🔍" or custom SVG (160x160px)
- Heading: "Campaign Not Found" (H1)
- Message: "The campaign you're looking for doesn't exist or has been deactivated." (text-secondary)
- Buttons:
  - "Go to Home" (primary)
  - "Contact Support" (link)
- Footer: Support email (support@platform.com)

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | 320px - 428px | Single column, bottom nav, 24px padding |
| Tablet | 768px - 1024px | 2 columns possible, sidebar collapses to icons |
| Desktop | 1280px+ | Full layout, 32px padding, max-width 1280px centered |

### Mobile Specifics
- Touch targets: minimum 44x44px
- Bottom sheet modals instead of center modals
- Bottom navigation: Dashboard | Campaigns | Questions | Profile
- Table horizontal scroll for leaderboard
- Swipe back on quiz navigation (optional)

---

## COMPONENT LIBRARY (Reusable)

### Buttons
| Variant | Height | Padding | Border Radius | Background |
|---------|--------|---------|---------------|------------|
| Primary | 48px | 0 24px | 12px | Primary |
| Secondary Outline | 48px | 0 24px | 12px | Transparent + border |
| Tertiary Text | 40px | 0 16px | 8px | Transparent |
| Icon Button | 40px | 0 | 8px | Transparent/10 on hover |

### Inputs
- Height: 48px
- Border: 1px solid border
- Border radius: 8px
- Padding: 0 16px
- Focus state: ring-2 ring-primary/20, border-primary

### Cards
- Background: white
- Border: 1px solid border (optional)
- Border radius: 16px
- Shadow: 0 1px 3px rgba(0,0,0,0.1) (optional)

### Modals
- Overlay: black/50 backdrop blur-sm
- Container: white, rounded-2xl, max-width 90% on mobile, 500px on desktop
- Padding: 24px
- Close button: top right (40x40px icon)

### Toasts / Alerts
- Position: bottom center on mobile, top right on desktop
- Duration: 5 seconds
- Types: Success (green), Error (red), Warning (amber), Info (blue)
- Dismissible X button

### Badges / Pills
- Height: 24px, padding: 0 12px
- Border radius: 999px
- Font size: 12px
- Colors: Primary, Green, Red, Amber, Gray

### Loading States
- Spinner: rotating circle, primary color, 32px
- Skeleton: gray-200 pulsing animation
- Button loading: spinner + "Loading..." text

---

## ANIMATIONS & TRANSITIONS

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Modal open | fade + scale | 200ms | ease-out |
| Page transition | fade | 150ms | ease-in-out |
| Hover state | background/border change | 150ms | ease |
| Tab switch | slide + fade | 200ms | ease |
| Correct answer | green flash + bounce | 300ms | ease |
| Leaderboard refresh | subtle fade | 200ms | ease |
| Countdown timer | pulse animation | 1s | infinite |

---

## DELIVERABLES FOR FIGMA

1. **All 12 screens** designed at 375px width (mobile)
2. **Desktop versions** of dashboard screens (admin panel)
3. **Interactive prototype** with clickable flows:
   - QR scan → Register → Quiz → Results → Leaderboard
   - Admin login → Dashboard → Create campaign
4. **Component library** with all reusable components
5. **Design system** page with colors, typography, spacing
6. **States** for all interactive elements (hover, active, disabled, loading, error)
7. **Mobile and desktop variants** for key screens

---

## SUBMISSION CHECKLIST

- [ ] All colors match the specified palette
- [ ] Inter font used throughout
- [ ] 8px spacing system followed
- [ ] All form fields have validation states
- [ ] Inactivity warning modal designed
- [ ] Leaderboard has daily/weekly/monthly tabs
- [ ] Admin panel has all 5 main screens
- [ ] Mobile responsive layouts included
- [ ] Prototype links all key flows
- [ ] Component library organized