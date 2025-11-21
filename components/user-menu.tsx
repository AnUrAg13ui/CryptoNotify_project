import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback ,AvatarImage} from "@/components/ui/avatar"
import { Settings, LogOut, LayoutDashboard, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
interface UserMenuProps {
  userName: string;
  onLogout: () => void;
  onDashboardNavigate?: () => void;
  onProfileNavigate?: () => void;
}

export function UserMenu({
  userName,
  onLogout,
  onDashboardNavigate,
  onProfileNavigate,
}: UserMenuProps) {
  const nav = useRouter();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
    const { data: session } = useSession();
    
    // console.log("the session is :",session);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus:outline-none"
        aria-label="User menu dropdown"
      >
        <Avatar className="h-8 w-8 hover:ring-2 hover:ring-primary transition-all">
          {session?.user?.image ? (
          <AvatarImage src={session?.user?.image} alt="User Avatar" />
        ) : (<AvatarFallback className="bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>)}
          
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm dark:text-slate-200 font-medium text-gray-800">{userName}</p>
          <p className="text-xs text-gray-500">Manage your account</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => nav.push("/dashboard")}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-500 focus:text-red-500 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
