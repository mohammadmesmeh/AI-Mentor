import { Link } from "@/i18n/navigation";
import { Brain } from "lucide-react";

const Logo = () => {
    return (
        <Link
            href="/"
            aria-label="AI Mentor"
            title="AI Mentor"
            rel="noopener noreferrer"
            target="_self"
            className="group flex items-center gap-2 text-xl font-bold text-primary"
        >
            <span className="flex items-center gap-2" dir="ltr">
                <span
                    className="ai-glow animate-glow-pulse flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110"
                >
                    <Brain className="h-5 w-5" />
                </span>

                <span className="transition-colors duration-300 group-hover:text-primary-600">
                    AI Mentor
                </span>
            </span>
        </Link>
    );
};

export { Logo };