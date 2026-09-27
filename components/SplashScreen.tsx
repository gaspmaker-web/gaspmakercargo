"use client";

import React, { useEffect, useState, useCallback } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"draw" | "fill" | "fadeout">("draw");

  const handleComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    // Fase 1: el trazo se dibuja (1.8s)
    const t1 = setTimeout(() => setPhase("fill"), 1800);
    // Fase 2: el relleno dorado aparece (0.8s)
    const t2 = setTimeout(() => setPhase("fadeout"), 2600);
    // Fase 3: la splash desaparece (0.6s) → notifica al padre
    const t3 = setTimeout(() => handleComplete(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [handleComplete]);

  const isFilled = phase === "fill" || phase === "fadeout";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1f2e",
        opacity: phase === "fadeout" ? 0 : 1,
        transition: phase === "fadeout" ? "opacity 0.6s ease-out" : "none",
        pointerEvents: phase === "fadeout" ? "none" : "all",
      }}
    >
      {/* ── Logo SVG animado ── */}
      <svg
        viewBox="310 135 425 475"
        width="160"
        height="160"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sp_gw1" x1="85%" y1="5%" x2="15%" y2="95%">
            <stop offset="0%"   stopColor="#C8860A" />
            <stop offset="20%"  stopColor="#F0C830" />
            <stop offset="45%"  stopColor="#F9E884" />
            <stop offset="70%"  stopColor="#D4950F" />
            <stop offset="100%" stopColor="#8A5205" />
          </linearGradient>
          <linearGradient id="sp_gw2" x1="85%" y1="5%" x2="15%" y2="95%">
            <stop offset="0%"   stopColor="#B8720A" />
            <stop offset="25%"  stopColor="#E8B820" />
            <stop offset="50%"  stopColor="#F5DC78" />
            <stop offset="75%"  stopColor="#C88010" />
            <stop offset="100%" stopColor="#7A4804" />
          </linearGradient>
          <linearGradient id="sp_gw3" x1="85%" y1="5%" x2="15%" y2="95%">
            <stop offset="0%"   stopColor="#A86808" />
            <stop offset="30%"  stopColor="#D8A820" />
            <stop offset="60%"  stopColor="#EDD068" />
            <stop offset="100%" stopColor="#6A4002" />
          </linearGradient>
          <linearGradient id="sp_gg" x1="5%" y1="5%" x2="95%" y2="95%">
            <stop offset="0%"   stopColor="#C8860A" />
            <stop offset="25%"  stopColor="#F0C830" />
            <stop offset="50%"  stopColor="#F9E884" />
            <stop offset="75%"  stopColor="#D0980C" />
            <stop offset="100%" stopColor="#906008" />
          </linearGradient>
        </defs>

        <g transform="scale(1,-1) translate(0,-791.868)">

          {/* Pluma 1 — más grande */}
          <path
            d="M418.502 431.416C429.518 417.415 471.522 392.573 482.517 378.572 499.393 366.259 529.787 325.902 529.985 289.736 562.464 409.712 428.552 448.095 353.477 649.731 329.052 560.192 352.094 487.926 418.502 431.416Z"
            fill={isFilled ? "url(#sp_gw1)" : "transparent"}
            stroke="#C8860A"
            strokeWidth="4"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: phase === "draw" ? 1200 : 0,
              transition: phase === "draw"
                ? "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)"
                : isFilled
                ? "fill 0.5s ease-in"
                : "none",
            }}
          />

          {/* Pluma 2 */}
          <path
            d="M409.097 361.644C419.667 351.914 456.073 337.661 466.627 327.928 481.572 320.337 510.97 292.11 516.061 263.191 525.219 363.567 414.721 376.34 328.193 527.658 321.213 452.723 349.186 397.972 409.097 361.644Z"
            fill={isFilled ? "url(#sp_gw2)" : "transparent"}
            stroke="#C8860A"
            strokeWidth="4"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: phase === "draw" ? 1000 : 0,
              transition: phase === "draw"
                ? "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1) 0.1s"
                : isFilled
                ? "fill 0.5s ease-in 0.05s"
                : "none",
            }}
          />

          {/* Pluma 3 — más pequeña */}
          <path
            d="M411.876 313.247C420.95 308.695 448.118 306.166 457.181 301.609 468.703 299.382 494.187 285.926 503.698 267.19 488.48 337.528 412.489 324.392 323.007 410.583 334.272 358.043 364.438 326.199 411.876 313.247Z"
            fill={isFilled ? "url(#sp_gw3)" : "transparent"}
            stroke="#C8860A"
            strokeWidth="4"
            style={{
              strokeDasharray: 800,
              strokeDashoffset: phase === "draw" ? 800 : 0,
              transition: phase === "draw"
                ? "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1) 0.2s"
                : isFilled
                ? "fill 0.5s ease-in 0.1s"
                : "none",
            }}
          />

          {/* Letra G */}
          <path
            d="M453.168 525.823C448.177 523.053 443.378 520.103 438.758 516.953L460.728 487.573C464.958 490.433 469.398 493.113 474.028 495.633 498.348 508.833 523.957 515.443 550.848 515.443 572.448 515.443 594.638 510.583 617.408 500.873 640.168 491.163 661.117 476.903 680.238 458.093L706.808 483.273C682.408 506.433 657.388 523.253 631.748 533.743 606.098 544.233 578.738 549.483 549.678 549.483 513.778 549.483 481.608 541.593 453.168 525.823M579.288 362.273V329.173H688.628C684.118 297.463 669.667 271.663 645.268 251.773 620.868 231.873 591.017 221.933 555.737 221.933 526.678 221.933 499.937 228.573 475.547 241.863 453.227 254.013 435.327 270.333 421.848 290.803L371.038 311.173C378.128 290.693 389.188 271.673 404.208 254.103 441.188 210.893 491.398 189.293 554.808 189.293 607.027 189.293 648.718 204.873 679.888 236.033 711.048 267.193 726.778 309.273 727.097 362.273Z"
            fill={isFilled ? "url(#sp_gg)" : "transparent"}
            stroke="#C8860A"
            strokeWidth="4"
            style={{
              strokeDasharray: 2800,
              strokeDashoffset: phase === "draw" ? 2800 : 0,
              transition: phase === "draw"
                ? "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1) 0.05s"
                : isFilled
                ? "fill 0.5s ease-in"
                : "none",
            }}
          />
        </g>
      </svg>

      {/* ── Nombre de empresa (aparece con el relleno) ── */}
      <div
        style={{
          marginTop: "28px",
          textAlign: "center",
          opacity: isFilled ? 1 : 0,
          transition: "opacity 0.8s ease-in",
        }}
      >
        <p
          style={{
            color: "#F4DBA7",
            fontFamily: "var(--font-garamond), Georgia, serif",
            fontSize: "22px",
            fontWeight: 400,
            letterSpacing: "5px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          GaspMaker
        </p>
        <p
          style={{
            color: "#D4950F",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "7px",
            textTransform: "uppercase",
            marginTop: "6px",
          }}
        >
          Cargo &amp; Logistics
        </p>
      </div>
    </div>
  );
}
