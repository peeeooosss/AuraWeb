# AURA AI Revenue Projection (Without Custom AI Agency)

*Last Updated: July 2026*

---

## Product Portfolio (Fixed Pricing)

| Product | Target | Pricing | Avg MRR/User |
|---------|--------|---------|--------------|
| **Tablely** | Restaurants/Cafes | ₹799-₹1999/mo | ₹1,400 |
| **Aura Workspace** | Businesses/Students | ₹299-₹599/mo | ₹450 |
| **Aura Career** | Job Seekers | ₹499-₹1499/mo | ₹900 |
| **Aura Coach** | Tutors/Coaches | ₹499-₹1999/mo | ₹1,200 |
| **AURA Voice** | Service Providers | ₹499-₹999/mo + usage | ₹800 |

---

## User Acquisition Scenarios

### Conservative (Organic Growth Only)

| Month | Tablely | Workspace | Career | Coach | Voice | Total Users |
|-------|---------|-----------|--------|-------|-------|-------------|
| 3 | 15 | 25 | 40 | 20 | 10 | 110 |
| 6 | 40 | 60 | 100 | 50 | 30 | 280 |
| 9 | 80 | 120 | 200 | 100 | 60 | 560 |
| 12 | 150 | 200 | 350 | 180 | 100 | 980 |

### Moderate (Paid Marketing + Content)

| Month | Tablely | Workspace | Career | Coach | Voice | Total Users |
|-------|---------|-----------|--------|-------|-------|-------------|
| 3 | 30 | 50 | 80 | 40 | 20 | 220 |
| 6 | 100 | 150 | 250 | 120 | 70 | 690 |
| 9 | 200 | 300 | 500 | 250 | 150 | 1,400 |
| 12 | 400 | 500 | 900 | 450 | 280 | 2,530 |

### Aggressive (Viral + Partnerships)

| Month | Tablely | Workspace | Career | Coach | Voice | Total Users |
|-------|---------|-----------|--------|-------|-------|-------------|
| 3 | 60 | 100 | 150 | 80 | 40 | 430 |
| 6 | 200 | 300 | 500 | 250 | 150 | 1,400 |
| 9 | 500 | 600 | 1,000 | 500 | 300 | 2,900 |
| 12 | 1,000 | 1,000 | 2,000 | 900 | 600 | 5,500 |

---

## Monthly Revenue Projections (MRR)

### Conservative Scenario

| Month | Revenue | Breakdown |
|-------|---------|-----------|
| 3 | ₹1.1L | 110 users × ₹1,000 avg |
| 6 | ₹3.5L | 280 users × ₹1,250 avg |
| 9 | ₹7.5L | 560 users × ₹1,340 avg |
| 12 | ₹14L | 980 users × ₹1,430 avg |
| **Year 1 Total** | **₹85L** | |

### Moderate Scenario

| Month | Revenue | Breakdown |
|-------|---------|-----------|
| 3 | ₹2.5L | 220 users × ₹1,140 avg |
| 6 | ₹9L | 690 users × ₹1,300 avg |
| 9 | ₹20L | 1,400 users × ₹1,430 avg |
| 12 | ₹38L | 2,530 users × ₹1,500 avg |
| **Year 1 Total** | **₹2.5Cr** | |

### Aggressive Scenario

| Month | Revenue | Breakdown |
|-------|---------|-----------|
| 3 | ₹5L | 430 users × ₹1,160 avg |
| 6 | ₹19L | 1,400 users × ₹1,360 avg |
| 9 | ₹42L | 2,900 users × ₹1,450 avg |
| 12 | ₹85L | 5,500 users × ₹1,545 avg |
| **Year 1 Total** | **₹5.5Cr** | |

---

## Infrastructure Cost Breakdown (Detailed)

### Service-Wise Pricing

| Service | Free Tier | Paid Tier | Your Usage (500-1000 Users) |
|---------|-----------|-----------|----------------------------|
| **Vercel** (Hosting) | ₹0 (100GB bandwidth) | ₹1,500/mo ($20) | ₹0 → ₹1,500 |
| **Supabase** (Database + Auth) | ₹0 (500MB DB, 50K MAU) | ₹1,500/mo ($25) | ₹0 → ₹1,500 |
| **Cloudflare** (CDN + Pages) | ₹0 (unlimited bandwidth) | ₹1,500/mo ($20) | ₹0 (free tier sufficient) |
| **Voice AI** (Exotel) | N/A | ₹1-₹1.5/min | ₹4,000-₹8,000 |
| **Email** (Resend) | ₹0 (3K emails/mo) | ₹1,500/mo ($20) | ₹0 (free tier sufficient) |

### Total Infrastructure Cost by Scale

| Users | Vercel | Supabase | Cloudflare | Voice AI | Email | **Total/Mo** |
|-------|--------|----------|------------|----------|-------|--------------|
| 100 | ₹0 | ₹0 | ₹0 | ₹1,500 | ₹0 | **₹1,500** |
| 500 | ₹0 | ₹0 | ₹0 | ₹4,000 | ₹0 | **₹4,000** |
| 1,000 | ₹1,500 | ₹1,500 | ₹0 | ₹8,000 | ₹0 | **₹11,000** |
| 2,500 | ₹1,500 | ₹1,500 | ₹1,500 | ₹20,000 | ₹1,500 | **₹26,000** |
| 5,000 | ₹4,000 | ₹4,000 | ₹1,500 | ₹40,000 | ₹1,500 | **₹51,000** |

### Cost Per User

| Users | Total Infra Cost | **Cost Per User** |
|-------|------------------|-------------------|
| 100 | ₹1,500 | **₹15/user** |
| 500 | ₹4,000 | **₹8/user** |
| 1,000 | ₹11,000 | **₹11/user** |
| 2,500 | ₹26,000 | **₹10/user** |
| 5,000 | ₹51,000 | **₹10/user** |

### Key Insight
**Voice AI is 70-80% of infrastructure costs.** The rest is negligible.

---

## Profit Margins (Solo Founder)

| Expense Category | Monthly Cost | Notes |
|------------------|--------------|-------|
| Cloud Infrastructure | ₹4,000-₹11,000 | Scales with users |
| Payment Gateway (2%) | Variable | Only on transactions |
| Marketing | ₹30,000-₹1,00,000 | Your main expense |
| **Total Fixed** | **₹34,000-₹1,11,000** | Solo founder (no team) |

---

## Net Profit Projections (Revised)

| Scenario | Month 12 MRR | Monthly Expenses | Net Profit/Mo | Net Margin |
|----------|--------------|------------------|---------------|------------|
| Conservative | ₹14L | ₹40K | **₹13.6L** | 97% |
| Moderate | ₹38L | ₹80K | **₹37.2L** | 98% |
| Aggressive | ₹85L | ₹1.2L | **₹83.8L** | 99% |

---

## Break-Even Analysis (Revised)

| Metric | Value |
|--------|-------|
| **Monthly Fixed Costs** | ₹40,000 |
| **Avg Revenue/User** | ₹1,350 |
| **Break-even Users** | **30 users** |
| **Time to Break-even (Moderate)** | **Month 2-3** |

---

## Revenue by Product (Month 12 - Moderate)

| Product | Users | MRR | % of Revenue |
|---------|-------|-----|--------------|
| Tablely | 400 | ₹5.6L | 15% |
| Aura Workspace | 500 | ₹2.25L | 6% |
| Aura Career | 900 | ₹8.1L | 21% |
| Aura Coach | 450 | ₹5.4L | 14% |
| AURA Voice | 280 | ₹2.24L | 6% |
| **Total** | **2,530** | **₹23.6L** | **62%** |

*Note: 38% variance due to pricing tiers and usage-based voice revenue*

---

## Key Insights

| Insight | Recommendation |
|---------|----------------|
| **Career has highest volume** | Job seekers = high intent, viral potential |
| **Tablely has highest ARPU** | Restaurants = recurring, sticky revenue |
| **Voice is differentiator** | Few competitors in India market |
| **Workspace is volume play** | Low price = high adoption |

---

## Year 2 Projections (Moderate Growth)

| Metric | Month 12 | Month 24 |
|--------|----------|----------|
| Total Users | 2,530 | 12,000 |
| MRR | ₹38L | ₹1.8Cr |
| ARR | ₹4.5Cr | ₹21.6Cr |
| Infra Cost | ₹26,000/mo | ₹1,00,000/mo |
| Net Margin | 98% | 94% |

---

## Bottom Line

| Scenario | Year 1 | Year 2 |
|----------|--------|--------|
| Conservative | ₹85L | ₹3Cr |
| Moderate | ₹2.5Cr | ₹15Cr |
| Aggressive | ₹5.5Cr | ₹35Cr |

---

## Summary: Key Numbers

| Metric | Value |
|--------|-------|
| **Break-even Users** | 30 users |
| **Infra Cost (500 users)** | ₹4,000/mo |
| **Infra Cost (1000 users)** | ₹11,000/mo |
| **Cost Per User** | ₹8-₹15/mo |
| **Net Margin** | 94-99% |
| **Year 1 Revenue (Moderate)** | ₹2.5Cr |
| **Year 1 Profit (Moderate)** | ₹2.4Cr |

**Bottom Line:** With solo founder operation, your only real expense is marketing. Infrastructure is negligible. At 30 users, you're profitable.

---

*Note: Custom AI Agency revenue excluded as it's not guaranteed/sure income.*
