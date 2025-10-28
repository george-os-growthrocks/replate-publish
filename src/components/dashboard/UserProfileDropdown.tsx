import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  Zap,
  Crown,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfileDropdownProps {
  userEmail: string;
  userPlan?: string;
}

export function UserProfileDropdown({ userEmail, userPlan = "Free" }: UserProfileDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  const getPlanIcon = () => {
    switch (userPlan.toLowerCase()) {
      case "pro":
        return <Zap className="h-3 w-3" />;
      case "agency":
      case "enterprise":
        return <Crown className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getPlanColor = () => {
    switch (userPlan.toLowerCase()) {
      case "pro":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      case "agency":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "enterprise":
        return "bg-gradient-to-r from-amber-500 to-orange-500";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-600";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className={`${getPlanColor()} text-white font-semibold`}>
              {userEmail?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3 p-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className={`${getPlanColor()} text-white text-lg font-bold`}>
                  {userEmail?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">{userEmail}</p>
                <Badge variant="secondary" className="w-fit mt-1 flex items-center gap-1">
                  {getPlanIcon()}
                  <span>{userPlan} Plan</span>
                </Badge>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">2.5k</div>
                <div className="text-xs text-muted-foreground">Credits</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-500">8</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-500">12</div>
                <div className="text-xs text-muted-foreground">Reports</div>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              navigate("/settings");
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigate("/settings");
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigate("/settings");
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              navigate("/pricing");
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing & Usage</span>
          </DropdownMenuItem>
          {userPlan.toLowerCase() === "free" && (
            <DropdownMenuItem
              onClick={() => {
                navigate("/pricing");
                setIsOpen(false);
              }}
              className="cursor-pointer bg-gradient-to-r from-primary/10 to-secondary/10"
            >
              <Crown className="mr-2 h-4 w-4 text-primary" />
              <span className="font-semibold">Upgrade to Pro</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => {
            navigate("/contact");
            setIsOpen(false);
          }}
          className="cursor-pointer"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

