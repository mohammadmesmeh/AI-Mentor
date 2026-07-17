import {Menu, X } from "lucide-react"
type MobileMenuButtonProps = {
 isOpen: boolean;
 toggle: () => void;
};
const MobileMenuButton = ({
  isOpen,
  toggle,
}: MobileMenuButtonProps) => {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-menu"
      className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
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