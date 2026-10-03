import { Link } from "@/i18n/navigation";
import { useT } from "@/shared/hooks/useT";
import { BrandLogo } from "@/shared/components/ui/BrandLogo";

const Logo = () => {
    const t = useT("nav")
    return (
        <Link
            href="/"
            title={t("brand", "Khatwa")}
            target="_self"
            className="group flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
            <span className="transition-transform duration-300 group-hover:scale-[1.03]" dir="ltr">
                <BrandLogo className="h-10" />
            </span>
        </Link>
    );
};

export { Logo };
