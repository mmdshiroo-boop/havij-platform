"use client";

import { useRef, useMemo, Suspense, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import {
  Search,
  PlusCircle,
  ArrowLeft,
  MapPin,
  Home,
  Building2,
  Car,
  Smartphone,
  ChevronLeft,
  Key,
  Fuel,
  Gauge,
  Monitor,
  Headphones,
  Camera,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

/* ═══════════════════════════════════════════
   بخش ۱ — Three.js (بهینه‌شده برای موبایل)
   ═══════════════════════════════════════════ */

function FloatingParticles({
  count = 40,
  mousePosition,
}: {
  count?: number;
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        basePosition: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 5,
        ] as [number, number, number],
        speed: 0.2 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
        scale: 0.025 + Math.random() * 0.035,
        currentPos: new THREE.Vector3(),
      });
    }
    return temp;
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const mx = mousePosition.current.x;
    const my = mousePosition.current.y;

    particles.forEach((p, i) => {
      const bx = p.basePosition[0] + Math.sin(t * p.speed + p.offset) * 0.4;
      const by = p.basePosition[1] + Math.cos(t * p.speed * 0.8 + p.offset) * 0.3;
      const bz = p.basePosition[2] + Math.sin(t * p.speed * 0.6 + p.offset) * 0.2;

      const dx = mx * 4 - bx;
      const dy = -my * 2.5 - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = Math.max(0, 1 - dist / 5) * 1.2;

      p.currentPos.lerp(
        new THREE.Vector3(bx + dx * force * 0.12, by + dy * force * 0.12, bz),
        0.04
      );

      dummy.position.copy(p.currentPos);
      const scaleBoost = 1 + force * 0.6;
      dummy.scale.setScalar(
        p.scale * scaleBoost * (1 + Math.sin(t * 2 + p.offset) * 0.25)
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#f97316" transparent opacity={0.5} />
    </instancedMesh>
  );
}

function CarrotShape({
  mousePosition,
}: {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const mx = mousePosition.current.x;
    const my = mousePosition.current.y;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mx * 0.25 + Math.sin(t * 0.3) * 0.08,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -my * 0.15 + Math.cos(t * 0.2) * 0.04,
      0.05
    );
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.2}
      floatIntensity={0.5}
      floatingRange={[-0.08, 0.08]}
    >
      <group ref={groupRef} position={[0, 0, 0]} scale={1.1}>
        <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.45, 1.8, 24]} />
          <MeshTransmissionMaterial
            color="#f97316"
            transmission={0.3}
            roughness={0.25}
            thickness={0.4}
            chromaticAberration={0.04}
            anisotropy={0.2}
            distortion={0.08}
            distortionScale={0.2}
            temporalDistortion={0.1}
          />
        </mesh>
        {[
          { rotZ: -0.2, rotX: 0 },
          { rotZ: 0.15, rotX: 0.3 },
          { rotZ: 0, rotX: -0.2 },
        ].map((leaf, i) => (
          <mesh
            key={i}
            position={[0, 0.7 + i * 0.08, 0]}
            rotation={[leaf.rotX, 0, leaf.rotZ]}
          >
            <capsuleGeometry args={[0.05, 0.45, 4, 10]} />
            <meshStandardMaterial
              color="#22c55e"
              transparent
              opacity={0.85}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function FloatingHouses() {
  const houses = useMemo(
    () => [
      { pos: [-2.6, 1.2, -2] as [number, number, number], s: 0.25, speed: 0.9 },
      { pos: [2.8, -0.8, -1.5] as [number, number, number], s: 0.22, speed: 1.1 },
      { pos: [-2.2, -1.2, -1] as [number, number, number], s: 0.18, speed: 0.8 },
      { pos: [1.8, 1.6, -2.2] as [number, number, number], s: 0.2, speed: 1.0 },
    ],
    []
  );

  return (
    <>
      {houses.map((h, i) => (
        <Float key={i} speed={h.speed} floatIntensity={0.3} rotationIntensity={0.15}>
          <group position={h.pos} scale={h.s}>
            <mesh>
              <boxGeometry args={[1, 0.8, 0.8]} />
              <meshStandardMaterial color="#fed7aa" transparent opacity={0.65} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[0.75, 0.5, 4]} />
              <meshStandardMaterial color="#f97316" transparent opacity={0.75} roughness={0.4} />
            </mesh>
          </group>
        </Float>
      ))}
    </>
  );
}

function GlowRings({
  mousePosition,
}: {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mx = mousePosition.current.x;
    const my = mousePosition.current.y;
    if (ringRef1.current) {
      ringRef1.current.rotation.x = t * 0.08 + my * 0.2;
      ringRef1.current.rotation.y = t * 0.12 + mx * 0.2;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x = t * -0.1 - my * 0.15;
      ringRef2.current.rotation.z = t * 0.06 + mx * 0.15;
    }
  });

  return (
    <>
      <mesh ref={ringRef1} position={[0, 0, -1]}>
        <torusGeometry args={[2.2, 0.012, 12, 80]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.12} />
      </mesh>
      <mesh ref={ringRef2} position={[0, 0, -1]}>
        <torusGeometry args={[2.7, 0.008, 12, 80]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.08} />
      </mesh>
    </>
  );
}

function Scene({
  mousePosition,
  isMobile = false,
}: {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
  isMobile?: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 4, 4]} intensity={0.8} color="#fff7ed" />
      <pointLight position={[-2, 2, 2]} intensity={0.4} color="#f97316" />
      <CarrotShape mousePosition={mousePosition} />
      {!isMobile && <FloatingHouses />}
      <FloatingParticles count={isMobile ? 25 : 50} mousePosition={mousePosition} />
      <GlowRings mousePosition={mousePosition} />
    </>
  );
}

/* ═══════════════════════════════════════════
   بخش ۲ — داده دسته‌بندی‌ها
   ═══════════════════════════════════════════ */

const categoryCards = [
  {
    slug: "real-estate",
    title: "املاک",
    description: "خرید، فروش، رهن و اجاره",
    icon: Building2,
    hoverGlow: "rgba(249, 115, 22, 0.25)",
    subItems: [
      { icon: Home, label: "آپارتمان" },
      { icon: Key, label: "رهن و اجاره" },
      { icon: MapPin, label: "زمین و ویلا" },
    ],
  },
  {
    slug: "vehicles",
    title: "خودرو",
    description: "سواری، سنگین، موتورسیکلت",
    icon: Car,
    hoverGlow: "rgba(249, 115, 22, 0.2)",
    subItems: [
      { icon: Car, label: "سواری" },
      { icon: Fuel, label: "قطعات" },
      { icon: Gauge, label: "موتورسیکلت" },
    ],
  },
  {
    slug: "electronics",
    title: "الکترونیک",
    description: "موبایل، لپ‌تاپ، دوربین",
    icon: Smartphone,
    hoverGlow: "rgba(249, 115, 22, 0.2)",
    subItems: [
      { icon: Monitor, label: "لپ‌تاپ" },
      { icon: Headphones, label: "صوتی" },
      { icon: Camera, label: "دوربین" },
    ],
  },
];

/* ═══════════════════════════════════════════
   بخش ۳ — کامپوننت‌های کارت
   ═══════════════════════════════════════════ */

function CategoryCard({
  cat,
  index,
}: {
  cat: (typeof categoryCards)[number];
  index: number;
}) {
  return (
    <motion.div
      className="relative bg-background/80 dark:bg-background/70 backdrop-blur-md border border-orange-200/50 dark:border-orange-800/30 rounded-2xl p-4 sm:p-5 cursor-pointer group overflow-hidden h-full"
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: `0 20px 40px -12px ${cat.hoverGlow}, 0 0 0 1px rgba(249, 115, 22, 0.15)`,
      }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3 + index * 0.1,
        type: "spring",
        stiffness: 120,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

      <div className="relative z-10 flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <cat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300 group-hover:scale-110 transition-all duration-300 flex-shrink-0" />

        <div className="flex-1 text-right min-w-0">
          <h3 className="text-xs sm:text-sm font-extrabold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300 truncate">
            {cat.title}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
            {cat.description}
          </p>
        </div>

        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 dark:text-orange-500 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0" />
      </div>

      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-orange-100/50 dark:border-orange-800/20 group-hover:border-orange-200/60 transition-colors duration-300">
        {cat.subItems.map((sub, j) => (
          <div
            key={j}
            className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-md bg-orange-50/70 dark:bg-orange-950/40 border border-orange-100/50 dark:border-orange-800/20 group-hover:bg-orange-100/80 dark:group-hover:bg-orange-900/40 transition-all duration-300 shrink-0"
          >
            <sub.icon className="w-3 h-3 text-orange-500 dark:text-orange-400" />
            <span className="text-[9px] sm:text-[10px] font-bold text-foreground/80 whitespace-nowrap">
              {sub.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AllCategoriesCard() {
  return (
    <motion.div
      className="relative bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl p-4 sm:p-5 text-white cursor-pointer group overflow-hidden h-full flex items-center justify-between"
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: "0 20px 40px -12px rgba(249, 115, 22, 0.35)",
      }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

      <div className="relative z-10 flex items-center gap-3">
        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white/90 group-hover:text-white group-hover:scale-110 transition-all duration-300 shrink-0" />
        <div>
          <p className="text-xs sm:text-sm font-extrabold">همه دسته‌بندی‌ها</p>
          <p className="text-[10px] sm:text-[11px] text-orange-100 mt-0.5">
            مشاهده تمام دسته‌ها
          </p>
        </div>
      </div>
      <ChevronLeft className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-white transition-all shrink-0" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   بخش ۴ — کامپوننت اصلی HeroSection
   ═══════════════════════════════════════════ */

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!sectionRef.current || prefersReducedMotion || isMobile) return;
      const rect = sectionRef.current.getBoundingClientRect();
      mousePosition.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      };
    },
    [prefersReducedMotion, isMobile]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!sectionRef.current || prefersReducedMotion || !e.touches[0]) return;
      const rect = sectionRef.current.getBoundingClientRect();
      mousePosition.current = {
        x: ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1,
      };
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    mousePosition.current = { x: 0, y: 0 };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 110,
        damping: 14,
      },
    },
  };

  const statsData = [
    {
      icon: Home,
      text: "خرید، فروش و رهن ملک",
      href: "/category/real-estate",
    },
    {
      icon: MapPin,
      text: "تمام شهرهای ایران",
      href: "/search",
    },
  ];

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-200/50 dark:border-orange-800/25 min-h-[440px] sm:min-h-[520px] md:min-h-[600px] lg:min-h-[640px] cursor-default"
    >
      {/* ───── پس‌زمینه Three.js ───── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!prefersReducedMotion && (
          <Suspense
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-orange-50 via-background to-orange-100/30 dark:from-orange-950/30 dark:via-background dark:to-orange-900/10" />
            }
          >
            <Canvas
              camera={{ position: [0, 0, 5.5], fov: isMobile ? 50 : 45 }}
              dpr={isMobile ? [1, 1] : [1, 1.5]}
              gl={{ antialias: !isMobile, alpha: true }}
              style={{ background: "transparent" }}
            >
              <Scene mousePosition={mousePosition} isMobile={isMobile} />
            </Canvas>
          </Suspense>
        )}
      </div>

      {/* ───── لایه تیرگی و خوانایی ───── */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b md:bg-gradient-to-l from-background/95 via-background/85 to-background/40 dark:from-background/98 dark:via-background/90 dark:to-background/50" />

      {/* ───── محتوا ───── */}
      <div className="relative z-10 px-3.5 sm:px-6 lg:px-10 py-8 sm:py-12 md:py-16 lg:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* ═══ ستون راست — متن و دکمه‌ها ═══ */}
            <div className="flex-1 text-center lg:text-right">
              {/* عنوان */}
              <motion.h1
                variants={itemVariants}
                className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.3] sm:leading-[1.35] md:leading-[1.3]"
              >
                هر چی می‌خوای
                <br />
                <motion.span
                  className="inline-block bg-gradient-to-l from-orange-600 to-orange-400 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent mt-1"
                  animate={
                    !prefersReducedMotion
                      ? {
                          backgroundPosition: [
                            "0% 50%",
                            "100% 50%",
                            "0% 50%",
                          ],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ backgroundSize: "200% 100%" }}
                >
                  اینجا پیدا کن
                </motion.span>
              </motion.h1>

              {/* توضیحات */}
              <motion.p
                variants={itemVariants}
                className="mt-3 sm:mt-5 text-xs sm:text-base text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-[1.8] sm:leading-[1.9]"
              >
                هویج پلتفرمی برای خرید و فروش املاک، خودرو، لوازم الکترونیکی و
                هزاران کالای دیگر. آگهی‌ها توسط کارشناسان بررسی و تأیید می‌شوند.
              </motion.p>

              {/* دکمه‌ها */}
              <motion.div
                variants={itemVariants}
                className="mt-6 sm:mt-9 flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center lg:justify-start w-full sm:w-auto"
              >
                <Link href="/search" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Button
                      size="lg"
                      className="w-full sm:w-auto rounded-xl sm:rounded-2xl px-6 sm:px-10 py-3.5 sm:py-5 h-12 sm:h-14 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all font-extrabold gap-2.5 text-xs sm:text-[15px]"
                    >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      جستجو در آگهی‌ها
                    </Button>
                  </motion.div>
                </Link>

                <Link href="/create-ad" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto rounded-xl sm:rounded-2xl px-6 sm:px-10 py-3.5 sm:py-5 h-12 sm:h-14 bg-background/70 backdrop-blur-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 border-2 border-orange-300/60 dark:border-orange-700/50 hover:border-orange-400 dark:hover:border-orange-500 font-extrabold gap-2.5 text-xs sm:text-[15px] text-orange-600 dark:text-orange-400 group transition-all"
                    >
                      <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors" />
                      ثبت آگهی رایگان
                      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* ویژگی‌ها — لینک‌دار */}
              <motion.div
                variants={itemVariants}
                className="mt-6 sm:mt-10 flex flex-wrap gap-2 sm:gap-2.5 justify-center lg:justify-start"
              >
                {statsData.map((stat, i) => (
                  <Link href={stat.href} key={i}>
                    <motion.div
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30 backdrop-blur-sm cursor-pointer group"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        backgroundColor: "rgba(249,115,22,0.12)",
                        borderColor: "rgba(249,115,22,0.4)",
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors duration-300" />
                      <span className="text-[11px] sm:text-xs font-semibold text-foreground/80 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors duration-300">
                        {stat.text}
                      </span>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            </div>

            {/* ═══ ستون چپ — کارت‌های دسته‌بندی ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                type: "spring",
                stiffness: 80,
                damping: 18,
                delay: 0.3,
              }}
              className="mt-8 lg:mt-0 flex-shrink-0 w-full lg:w-[340px]"
            >
              {/* ═══ موبایل و تبلت (<lg): Swiper اسلایدر ═══ */}
            {/* ═══ موبایل و تبلت (<lg): Swiper اسلایدر ═══ */}
<div className="block lg:hidden">
  <Swiper
    modules={[Pagination, Autoplay]}
    spaceBetween={12}
    slidesPerView={1.15}
    centeredSlides={true}
    grabCursor={true}
    loop={false}
    autoplay={{
      delay: 4000,
      disableOnInteraction: true,
      pauseOnMouseEnter: true,
    }}
    pagination={{
      clickable: true,
      bulletClass: "havij-bullet",
      bulletActiveClass: "havij-bullet-active",
      el: ".havij-pagination",
    }}
    breakpoints={{
      0: {
        slidesPerView: 1.05,
        spaceBetween: 8,
      },
      400: {
        slidesPerView: 1.1,
        spaceBetween: 10,
      },
      640: {
        slidesPerView: 1.4,
        spaceBetween: 12,
      },
      768: {
        slidesPerView: 1.8,
        spaceBetween: 14,
      },
    }}
    className="!pb-8"
    dir="rtl"
  >
    {categoryCards.map((cat, i) => (
      <SwiperSlide key={cat.slug}>
        <Link href={`/category/${cat.slug}`} className="block h-full">
          <CategoryCard cat={cat} index={i} />
        </Link>
      </SwiperSlide>
    ))}
  </Swiper>

  {/* Pagination سفارشی */}
  <div className="havij-pagination flex items-center justify-center gap-1.5 mt-2" />

  {/* کارت همه دسته‌بندی‌ها — زیر اسلایدر، وسط‌چین، عرض بیشتر */}
  <div className="flex justify-center mt-4 px-2 sm:px-4">
    <Link href="/category" className="block w-full max-w-[400px] sm:max-w-[440px]">
      <AllCategoriesCard />
    </Link>
  </div>
</div>

              {/* ═══ دسکتاپ (≥lg): عمودی زیر هم ═══ */}
              <div className="hidden lg:flex flex-col gap-4">
                {categoryCards.map((cat, i) => (
                  <Link href={`/category/${cat.slug}`} key={cat.slug}>
                    <CategoryCard cat={cat} index={i} />
                  </Link>
                ))}

                <Link href="/category">
                  <AllCategoriesCard />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}