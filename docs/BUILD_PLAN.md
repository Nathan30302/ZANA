# ZANA — Rebuild Plan

**Goal:** Build the clearest, most useful beauty booking app for Lusaka — start over, ship one thin product, prove it with **one barbershop**, then grow.

**Slogan:** Style at your fingertips.

**North star:** A young person opens ZANA, books a barber or stylist in under 60 seconds, and knows exactly what happens next — like Yango for beauty.

---

## Why we are starting over

The previous build piled on features (broadcast, floats, maps, schedules, teams, alerts) before the core loop was obvious. The app felt hard to use. That is a product problem, not a code problem.

**Rule for the rebuild:** one job per screen. One job per phase. If a feature does not help the pilot barbershop take and finish a booking, it waits.

---

## What ZANA is (and is not)

| ZANA is | ZANA is not |
|---|---|
| Book a beauty pro to come to you, or visit a shop | A full salon ERP / POS |
| Simple for customers aged ~18–35 | A dashboard of stats and settings |
| A marketplace that helps shops get paid work | A social network or content feed first |
| Proven with one real shop before city-wide | A feature race against Uber Beauty |

**Primary job to be done**

> “I want to look good for tonight / this weekend. I need a trusted barber or stylist near me, now or at a time I choose, without calling around.”

**Secondary job (shop owner)**

> “I want more booked clients without standing on the street or relying only on walk-ins and WhatsApp.”

---

## Who we serve first

1. **Customer** — young urban Lusaka (phone-first, map-comfortable, cash or mobile money later).
2. **One pilot barbershop** — owner + 1–3 barbers who already serve walk-ins.
3. **Independent mobile pros** — only after the shop pilot works (same app, later phase).

Education / “learn beauty as a business” content comes **after** booking works. It is a growth and trust layer, not the MVP.

---

## The product in one sentence

**Customer requests a service → nearby approved pro accepts → both see status → job finishes → both rate.**

That is the entire Phase 1–3 product. Everything else is later.

---

## Core user journeys (MVP)

### Customer — Book now (comes to you)

1. Open app → see **ZANA** and one clear action: **Book**.
2. Pick category (Barber / Salon / Nails).
3. Confirm location (saved home pin or map).
4. See 1–3 online options **or** send to any nearby.
5. Wait for accept (short timeout + clear “finding…” state).
6. Live map: pro moving toward you + ETA + call.
7. Service happens → mark done → rate.

### Customer — Visit shop

1. Book → choose **At shop**.
2. Pick the pilot shop + service + time slot.
3. Get confirmation + address + “I’m here” when arrived.
4. Done → rate.

### Pro / shop

1. Go **Online**.
2. See incoming request (sound + big Accept / Decline).
3. Accept → navigate to customer (or wait for walk-in).
4. Tap **Arrived** → **Start** → **Complete**.
5. See today’s jobs in one list. Nothing else required.

---

## How we connect the first barbershop

This is as important as the code.

### Pilot criteria (pick one shop)

- Busy walk-in traffic already (they understand demand).
- Owner reachable by phone / WhatsApp.
- At least one barber willing to use a phone during the day.
- Location in a dense Lusaka area (Roma, CBD, Matero, Chelstone, etc.).
- Open to a **2-week free pilot** with daily check-ins.

### Onboarding script (owner meeting, ~45 min)

1. **Show the problem:** missed bookings, WhatsApp chaos, idle chairs mid-afternoon.
2. **Show the loop on two phones:** customer books → their phone rings → they accept → map.
3. **Promise for pilot:** we sit with them; no payment fees during pilot; we fix bugs same day.
4. **Ask for:** shop name, pin, hours, 3–5 services + prices, photos of space + 2 barbers, phone numbers.
5. **Agree:** who goes Online each day; how they handle “Book now” vs walk-ins.
6. **Leave them with:** one laminated “How to use ZANA Pro” card (Online → Accept → Arrive → Done).

### Activation checklist (before go-live)

- [ ] Shop profile approved in admin
- [ ] Owner + staff accounts created and tested login
- [ ] Services + prices loaded
- [ ] Shop pin correct on map
- [ ] Float credits seeded for pilot (or accept without float during pilot)
- [ ] Owner can receive a test booking from your phone
- [ ] WhatsApp group: you + owner + 1 barber for support
- [ ] Soft launch: friends/family book for 3 days, then real customers

### How customers find the shop during pilot

Do **not** wait for App Store growth.

1. QR code on the shop mirror / chair → deep link or “Download ZANA / Book this shop”.
2. Owner posts status on WhatsApp Status with the link.
3. You personally seed 10–20 first bookings (friends, campus, office).
4. After a good cut: “Next time book me on ZANA — same price, no queue guessing.”

---

## Build phases

Ship in order. Do not skip ahead. Each phase has a **done when** test you can run on two phones.

### Phase 0 — Clean slate

**Intent:** Remove the confusing pile. Keep brand assets, product docs, and deploy scaffolding. Reset apps to a thin skeleton.

**Keep**

- Brand (logo, copper/charcoal direction, slogan)
- `docs/PRODUCT.md`, this plan, deploy notes
- Monorepo shape (`apps/api`, `apps/customer`, `apps/pro`, `apps/web`) if useful — or recreate empty shells
- Auth idea: phone OTP (can stub OTP in pilot)

**Remove / rewrite**

- Overloaded screens, half-finished flows, unused tabs
- Feature flags and paths that are not on the critical path
- Anything that cannot be explained in one sentence to a barber

**Done when:** Empty but runnable customer + pro shells open; API health check works; no dead navigation.

---

### Phase 1 — Trust & identity (thin)

**Build**

- Phone signup / login (OTP stub OK for pilot)
- Roles: Customer vs Pro (same phone can have both later; one mode at a time)
- Admin approve/reject for the pilot shop only (even a simple script is fine)

**Done when:** You can create a customer and a pro account and log into each app.

---

### Phase 2 — Shop catalog (one shop)

**Build**

- Shop profile: name, photo, pin, hours
- Services list (name, duration, price)
- Staff list (names only)
- Customer can open **that one shop** and see services

**Done when:** From customer app you see the pilot shop and its services. No map marketplace yet required.

---

### Phase 3 — Booking loop (the product)

**Build only this loop**

```
REQUESTED → ACCEPTED → ON_THE_WAY → IN_SERVICE → COMPLETED → RATED
              ↘ DECLINED / CANCELLED / EXPIRED
```

- Customer: Book now (comes-to-you) **or** book a time at shop
- Pro: Online toggle, accept/decline, status buttons
- 5-minute timeout on unaccepted “Book now”
- Clear empty states: “Finding a barber…”, “No one online — try later or book a time”

**Done when:** Cold path on two phones: book → accept → complete → rate, without coaching from you mid-flow.

---

### Phase 4 — Live map (Yango feel)

**Build**

- Customer pin + pro pin
- Route + ETA (OSRM or equivalent)
- Pro GPS while Online / en route
- Call / WhatsApp button after accept

**Done when:** Customer sees the pro move toward them and the ETA feels believable.

---

### Phase 5 — Pilot hardening (no payments yet)

**Build**

- Expiry + “find another”
- Arrival assist (near customer → Arrived)
- Status alerts (simple polling is fine)
- Saved home pin
- Crash-resistant “one active booking” banner

**Done when:** You can run a full day at the pilot shop without you babysitting every request.

---

### Phase 6 — Money (after the loop is loved)

**Build**

- Service price shown clearly (pay at shop / cash / MoMo later)
- Optional: float credits so pros pay per accepted job
- MTN MoMo / Airtel Money for floats or customer prepay

**Done when:** Owner understands how they earn; you can charge a small take-rate or float package without breaking trust.

---

### Phase 7 — Second shop + light marketplace

**Build**

- Discover nearby shops/pros
- Open broadcast (“any nearby barber”)
- Categories and areas (Roma, CBD, …)

**Done when:** A customer in another neighborhood can find someone without knowing them.

---

### Phase 8 — Growth & education

**Build**

- Pro tips: how to run a chair as a business (short in-app lessons)
- Portfolio photos / before-after
- Referral: give a friend a free booking credit
- Campus / event bridal packages later

**Done when:** New pros join because ZANA helps them earn, not only because they get listed.

---

## Screen budget (Phase 1–5)

Keep the app stupidly small.

### Customer app (max ~6 screens)

1. Home / Book
2. Choose service + place (come to me / at shop)
3. Confirm request
4. Live status / map
5. History
6. Profile (phone, home pin)

### Pro app (max ~5 screens)

1. Home (Online + today’s jobs)
2. Incoming request (full screen)
3. Active job (status + navigate)
4. Shop / services (read-mostly in pilot)
5. Profile

No Schedule tab jungle. No Team management maze. No marketing carousels on the first screen.

---

## Design principles (rebuild)

1. **Brand first** — ZANA is the hero of the first viewport, not a tiny nav word.
2. **One composition** — first screen is not a dashboard.
3. **One CTA** — Book (customer) / Go Online (pro).
4. **Familiar** — map + ETA like ride apps; young users already know this.
5. **Warm premium** — charcoal + copper/gold + cream; African salon energy; not purple SaaS.
6. **Motion with purpose** — accept pulse, pro marker move, status change — not noise.
7. **Explain out loud** — if a barber cannot use it after one demo, the UI failed.

---

## Success metrics (pilot, 2 weeks)

| Metric | Target |
|---|---|
| Completed bookings | ≥ 30 |
| Accept rate (Book now) | ≥ 70% |
| Median time to accept | < 2 min |
| Customer can finish flow unaided | Yes |
| Owner wants to continue after pilot | Yes |

If these fail, fix the loop — do not add features.

---

## What we deliberately delay

- Payments / MoMo (until Phase 6)
- Multi-shop marketplace (until Phase 7)
- Team rosters, payroll, inventory
- Heavy admin analytics
- Social feed, chat threads, stories
- Education academy (until Phase 8)
- iOS/Android store polish beyond sideload / internal test

---

## Suggested build order for engineering (after Phase 0)

1. API: users, shop, services, bookings state machine  
2. Pro app: Online + accept + status  
3. Customer app: book + status  
4. Map + GPS  
5. Hardening  
6. Soft launch with pilot shop  

Prefer **Flutter customer + Flutter pro** (or web demos only if phones are blocked) talking to one Nest/Prisma API. One database. One booking table. No microservices.

---

## Decision log (locked for MVP)

| Decision | Choice |
|---|---|
| First market | Lusaka |
| First supply | One barbershop |
| Default fulfillment | Pro comes to customer; at-shop also supported |
| Dispatch | Pick a pro **or** first-accept nearby (after Phase 3) |
| Payments | Deferred |
| Floats | Optional; seed free credits in pilot |
| Languages | English first |
| Brand | ZANA / Style at your fingertips |

---

## Next action

**Approve this plan → execute Phase 0 (clean slate) → Phase 1.**

Do not rebuild features from the old stack “because they existed.” Rebuild only what this document names for the current phase.
