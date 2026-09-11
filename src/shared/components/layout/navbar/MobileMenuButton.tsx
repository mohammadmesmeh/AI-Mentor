import {Menu, X } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
type MobileMenuButtonProps = {
 isOpen: boolean;
 toggle: () => void;
};
const MobileMenuButton = ({
  isOpen,
  toggle,
}: MobileMenuButtonProps) => {
  const t = useT("nav")
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? t("closeMenu", "Close menu") : t("openMenu", "Open menu")}
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
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