"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { isProductWishlisted, toggleWishlistProduct } from "@/services/customerEngagementService";

interface WishlistHeartButtonProps {
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly imageUrl: string | null;
  readonly studioId: string;
  readonly studioName: string;
  readonly pricePaise: number;
}

export function WishlistHeartButton(props: WishlistHeartButtonProps): React.JSX.Element {
  const auth = useAuth();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!auth.user) { setActive(false); return; }
    void isProductWishlisted(auth.user.uid, props.productId).then(setActive).catch(() => setActive(false));
  }, [auth.user, props.productId]);

  const toggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    if (!auth.user) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${props.productSlug}`)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await toggleWishlistProduct(props);
      setActive(result.active);
      if (result.active) setBurst((value) => value + 1);
    } finally { setBusy(false); }
  };

  return <button type="button" onClick={(event) => void toggle(event)} disabled={busy} aria-label={active ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={active} className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center overflow-visible rounded-full border border-white/55 bg-[rgba(248,244,240,.88)] shadow-[0_14px_36px_rgba(59,30,53,.22)] backdrop-blur-xl transition hover:scale-105 disabled:opacity-60">
    <AnimatePresence>{burst ? <motion.span key={burst} className="pointer-events-none absolute inset-0 rounded-full border border-[var(--color-dusty-rose)]" initial={{scale:.7,opacity:.9}} animate={{scale:1.9,opacity:0}} exit={{opacity:0}} transition={{duration:.7}} /> : null}</AnimatePresence>
    <motion.svg animate={{scale: active ? [1,1.28,1] : 1, rotate: active ? [0,-8,8,0] : 0}} transition={{duration:.45}} viewBox="0 0 24 24" className="h-5 w-5" fill={active ? "var(--color-dusty-rose)" : "none"} stroke="var(--color-deep-plum)" strokeWidth="1.8"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.8Z"/></motion.svg>
  </button>;
}
