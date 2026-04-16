import Image from "next/image";

const SRC = "/fincontrol_logo_icon_cropped.png";

type BrandLogoMarkProps = {
  variant?: "header" | "sidebar";
  className?: string;
};

const variantStyles: Record<NonNullable<BrandLogoMarkProps["variant"]>, { box: string; img: string; sizes: string }> = {
  header: {
    box: "h-12 w-12",
    img: "object-contain scale-[0.96]",
    sizes: "48px",
  },
  sidebar: {
    box: "h-10 w-10",
    img: "object-contain scale-[0.95]",
    sizes: "40px",
  },
};

export function BrandLogoMark({ variant = "header", className }: BrandLogoMarkProps) {
  const v = variantStyles[variant];
  return (
    <span
      className={`fc-brand-logo-badge relative inline-block shrink-0 overflow-hidden rounded-2xl ${v.box} ${className ?? ""}`}
      aria-hidden
    >
      <span className="fc-brand-logo-glow" />
      <Image src={SRC} alt="" fill sizes={v.sizes} className={v.img} quality={100} unoptimized priority />
    </span>
  );
}
