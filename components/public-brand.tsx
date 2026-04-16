import Link from "next/link";
import { BrandLogoMark } from "@/components/brand-logo-mark";

export function PublicBrand({
  href = "/",
  subtitle = "Gestao inteligente de despesas corporativas",
}: {
  href?: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-3" aria-label="FinControl — início">
      <BrandLogoMark variant="header" />
      <span className="min-w-0">
        <span className="block text-sm text-white/85">{subtitle}</span>
      </span>
    </Link>
  );
}
