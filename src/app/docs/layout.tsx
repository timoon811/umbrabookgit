
import React from 'react';
import BodyClassManager from "@/components/BodyClassManager";
import AuthGuard from "@/components/AuthGuard";
import DocsContent from "@/components/DocsContent";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <AuthGuard>
      <BodyClassManager className="page-with-custom-layout" />
      <DocsContent>
        {children}
      </DocsContent>
    </AuthGuard>
  );
}

