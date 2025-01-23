"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SessionControls } from "@voiceact/mabel";

function App() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen">
        <AppSidebar />
        {/* <div className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-5">

            //TODO: Add dynamic breadcrumb based on selections
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Agents</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Agent Builder</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1">
            <SidebarInset />
          </main>
        </div> */}
      </div>
      <div className="fixed right-8 bottom-8">
        <SessionControls />
      </div>
    </SidebarProvider >
  );
}

export default App;
