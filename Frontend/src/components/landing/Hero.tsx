import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const PET_CARE_VIDEO = "https://www.pexels.com/download/video/8498672/";

const Hero = () => {
  const shouldReduceMotion = useReducedMotion();
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  return (
    <section className="relative isolate overflow-hidden bg-cream px-4 pb-8 pt-14 sm:px-6 sm:pt-20 lg:px-10 lg:pb-0 lg:pt-24">
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <clipPath id="hero-left-frame" clipPathUnits="objectBoundingBox">
            <path d="M .22 0 H .88 C .96 0 1 .06 1 .13 V .24 C 1 .3 .87 .34 .87 .41 C .87 .48 1 .53 1 .6 V .71 C 1 .79 .86 .82 .86 .9 C .86 .95 .94 .98 1 1 H .22 C .09 1 0 .92 0 .8 V .2 C 0 .08 .09 0 .22 0 Z" />
          </clipPath>
          <clipPath id="hero-right-frame" clipPathUnits="objectBoundingBox">
            <path d="M .12 0 H .78 C .91 0 1 .08 1 .2 V .8 C 1 .92 .91 1 .78 1 H 0 C .06 .98 .14 .95 .14 .9 C .14 .82 0 .79 0 .71 V .6 C 0 .53 .13 .48 .13 .41 C .13 .34 0 .3 0 .24 V .13 C 0 .06 .04 0 .12 0 Z" />
          </clipPath>
        </defs>
      </svg>

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 150 150"
        className="absolute left-[10%] top-16 hidden h-32 w-32 text-caramel/40 lg:block"
        animate={shouldReduceMotion ? undefined : { rotate: [0, 4, 0], y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M39 17c21 8 30 8 52 0 14-5 26 7 23 21-6 24-6 35 0 59 3 14-9 26-23 21-22-8-31-8-52 0-14 5-26-7-23-21 6-24 6-35 0-59-3-14 9-26 23-21Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </motion.svg>

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 135 220"
        className="absolute -right-8 top-[34%] hidden h-52 w-32 text-blush/70 lg:block"
        animate={shouldReduceMotion ? undefined : { y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M36 3c17 0 17 18 34 18S87 3 104 3s28 14 28 31v152c0 17-11 31-28 31s-17-18-34-18-17 18-34 18S3 203 3 186c0-21 17-21 17-42S3 123 3 102s17-21 17-42S3 38 3 34C3 17 19 3 36 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </motion.svg>

      <motion.svg
        aria-hidden="true"
        viewBox="0 0 88 180"
        className="absolute -left-8 bottom-28 hidden h-44 w-24 text-sage lg:block"
        animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M30 3C13 3 3 16 3 31c0 18 16 18 16 36S3 85 3 103s16 18 16 36S3 157 3 160c0 10 10 17 27 17s17-16 34-16 17 16 21 16V3c-4 0-4 16-21 16S47 3 30 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </motion.svg>

      <div className="relative mx-auto max-w-[1480px]">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-[900px] text-center sm:mb-20"
        >
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.34em] text-caramel">
            PNetAI Pet Network
          </p>
          <h1 className="font-serif text-[clamp(3rem,6.25vw,6rem)] font-semibold not-italic leading-[1.05] tracking-[-0.04em] text-ink">
            One Place for Your
            <br className="hidden sm:block" />{" "}
            <span className="relative inline-block">
              Pet&apos;s Care
              <svg
                aria-hidden="true"
                viewBox="0 0 330 26"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 -z-10 h-5 w-full text-caramel/55"
              >
                <path
                  d="M5 17C92 2 219 2 325 15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="10"
                />
              </svg>
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-[650px] text-base leading-relaxed text-muted sm:text-xl">
            Book care services, shop pet products, find breeding matches, and join a friendly pet community.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-[1360px] grid-cols-2 items-end gap-3 sm:gap-5 lg:grid-cols-[minmax(215px,0.78fr)_minmax(430px,1.3fr)_minmax(215px,0.78fr)] lg:gap-6">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.7, ease: "easeOut" }}
            className="order-2 h-[280px] overflow-hidden sm:h-[390px] lg:order-1 lg:h-[500px]"
            style={{ clipPath: "url(#hero-left-frame)" }}
          >
            <img
              src="/images/home/hero-border-collie.jpg"
              alt="Happy border collie welcoming pet parents"
              className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.75, ease: "easeOut" }}
            className="relative order-1 col-span-2 h-[280px] overflow-hidden rounded-[30px] bg-sand sm:h-[390px] lg:order-2 lg:col-span-1 lg:h-[500px] lg:rounded-b-none lg:rounded-t-[32px]"
          >
            {videoUnavailable ? (
              <img
                src="/images/home/hero-grooming-poster.jpg"
                alt="Gentle grooming care for a relaxed dog"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                className="h-full w-full object-cover"
                poster="/images/home/hero-grooming-poster.jpg"
                autoPlay={!shouldReduceMotion}
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => setVideoUnavailable(true)}
                aria-label="A pet receiving gentle grooming care"
              >
                <source src={PET_CARE_VIDEO} type="video/mp4" />
              </video>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/12 via-transparent to-ink/10" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
              <span className="rounded-full bg-ink/90 px-4 py-2 text-xs font-medium text-white backdrop-blur sm:px-5 sm:text-sm">
                <strong className="mr-1.5 font-serif text-lg font-semibold not-italic">AI</strong>
                Care tips
              </span>
              <span className="rounded-full bg-ink/90 px-4 py-2 text-xs font-medium text-white backdrop-blur sm:px-5 sm:text-sm">
                <strong className="mr-1.5 font-serif text-lg font-semibold not-italic">24/7</strong>
                Support
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.7, ease: "easeOut" }}
            className="order-3 h-[280px] overflow-hidden sm:h-[390px] lg:h-[500px]"
            style={{ clipPath: "url(#hero-right-frame)" }}
          >
            <img
              src="/images/home/hero-tabby-cat.jpg"
              alt="Curious tabby cat during a gentle care session"
              className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export { Hero };
export default Hero;
