import {Menu, X } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
type MobileMenuButtonProps = {
 isOpen: boolean;
 toggle: () => void;
 id?: string;
};
const MobileMenuButton = ({
  isOpen,
  toggle,
  id,
}: MobileMenuButtonProps) => {
  const t = useT("nav")
  return (
    <button
      type="button"
      id={id}
      onClick={toggle}
      aria-label={isOpen ? t("closeMenu", "Close menu") : t("openMenu", "Open menu")}
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
    >
      {isOpen ? (
        <X className="size-5" />
      ) : (
        <Menu className="size-5" />
      )}
    </button>
  );
}

export { MobileMenuButton };