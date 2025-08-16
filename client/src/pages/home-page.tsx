import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  
  if (user) {
    return <Redirect to="/dashboard" />;
  }
  
  return <Redirect to="/auth" />;
}