"use client";

import { Button, LogoMark } from "@/components/ui";
import Link from "next/link";
import { useState } from "react";

const slides = [
  {
    title: "Discover beauty near you",
    body: "Find trusted salons, barbers, and independents across Lusaka — including hidden gems.",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
  },
  {
    title: "Home service, made simple",
    body: "Book a pro to come to you. Clear prices, verified profiles, and real availability.",
    image:
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1200&q=80",
  },
  {
    title: "Book in a few taps",
    body: "Choose a service, pick a time, confirm — pay with mobile money when you’re ready.",
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&q=80",
  },
];

export default function OnboardingPage() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  function finish() {
    localStorage.setItem("zana_onboarded", "1");
  }

  return (
    <div className="mobile-shell flex min-h-dvh flex-col">
      <div className="relative h-[48vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fffaf8] via-transparent to-black/20" />
        <div className="absolute left-5 top-5">
          <LogoMark size={40} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8 pt-2">
        <div className="flex-1 animate-fade-up">
          <h1 className="font-display text-3xl text-stone-900">{slide.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">{slide.body}</p>
        </div>

        <div className="mb-5 flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i === index ? "bg-rose-800" : "bg-stone-200"}`}
            />
          ))}
        </div>

        {index < slides.length - 1 ? (
          <Button className="w-full" onClick={() => setIndex((i) => i + 1)}>
            Continue
          </Button>
        ) : (
          <Link href="/login" onClick={finish}>
            <Button className="w-full">Get started</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
