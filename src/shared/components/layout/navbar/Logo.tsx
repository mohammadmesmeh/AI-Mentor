import { Link } from "@/i18n/navigation";
import { Brain } from "lucide-react";

const Logo = () => {
    return (
        <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold text-primary"
        >
            <Brain className="h-6 w-6 " />
            <span >AI Mentor</span>
        </Link>
    );
};


export { Logo };