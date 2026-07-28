# ZANA product wiki

Working rules for engineering. Source of truth alongside the Product Blueprint PDF.

## Roles

| Role | Surface | Notes |
|---|---|---|
| Customer | ZANA app | Free phone OTP signup |
| Independent pro | ZANA Pro | Mobile stylist / barber |
| Salon / barbershop owner | ZANA Pro | Venue + staff |
| Staff | ZANA Pro | Assigned bookings |
| Admin | admin.zana.zm | Approve pros, floats, disputes |

Same phone can be customer **and** pro. Modes stay separate (Yango-style).

## Booking states

```
REQUESTED → ACCEPTED → ON_THE_WAY | CONFIRMED → IN_SERVICE → COMPLETED → RATED
                ↘ DECLINED / CANCELLED / EXPIRED
```

- **Book now (ASAP):** `scheduledAt` null — customer picks a nearby **online** pro; request goes live on the map until accept; float burns on accept.
- **Schedule later:** pick a slot (overlap guarded). Offline pros cannot take new requests.
- Full client address only after **ACCEPTED** (home visits).
- 1 accepted/completed job burns **1 float credit**.
- Live map: satellite/hybrid imagery, ETA, status coaching, call/WhatsApp after accept, review prompt when done.

## Dispatch model (MVP)

Yango-style **nearby + online + float**, not open multi-driver bidding yet:

1. Customer sees who’s online near them (Discover / Map / Book now).
2. They request a specific pro + service (now or scheduled).
3. That pro accepts (needs float) or declines; customer tracks movement on the map.
4. Later: optional open request broadcast to many online pros in radius.

## Float packages (MVP defaults)

| Package | Credits | Notes |
|---|---|---|
| Starter | 10 | First purchase |
| Pro | 30 | Default mid |
| Elite | 100 | High volume / shops |

- Payment: MTN MoMo / Airtel Money
- Credits = 0 → cannot accept new jobs
- Shop accounts may share a **team float**

## Pro verification checklist

1. Phone (+260) verified  
2. NRC or passport + selfie  
3. Portfolio photos (before/after)  
4. Type: Independent / Salon / Barbershop  
5. Shops: name, pin, photos, hours, services  
6. Admin: Pending → Needs info → Approved / Rejected  

## Lusaka service taxonomy (seed)

**Categories:** Barber · Salon · Nails · Bridal/Events · Mobile  

**Areas (seed):** Roma, Kabulonga, CBD, Woodlands, Rhodes Park, Olympia, Chilanga, Chelstone, Matero, Chilenje  

## Brand (UI)

- **Slogan:** Style at your fingertips  
- **Logo:** Copper + black scissors/comb **Z** mark (`apps/web/public/brand/zana-logo.png`)  
- Warm charcoal + copper/gold accent + soft cream  
- Premium African salon & barbershop — not purple SaaS, not neon dark  
- Strong ZANA mark + wordmark; one job per screen  
