import { Card } from "@/components/ui/card";
import React from "react";
interface Props {
  children: React.ReactNode;
}
const Layout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-screen w-full">
      {children}
    </div>
  );
};

export default Layout;
