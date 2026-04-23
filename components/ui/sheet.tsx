"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={`fixed inset-0 z-50 bg-black/50 ${className || ""}`}
    {...props}
  />
));

SheetOverlay.displayName = "SheetOverlay";

type SheetContentProps =
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    side?: "top" | "right" | "bottom" | "left";
  };

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  const sideClasses = {
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <Dialog.Content
        ref={ref}
        className={`fixed z-50 bg-white p-6 shadow-lg transition ${sideClasses[side]} ${className || ""}`}
        {...props}
      >
        {children}
      </Dialog.Content>
    </SheetPortal>
  );
});

SheetContent.displayName = "SheetContent";

export { Sheet, SheetClose, SheetContent, SheetTrigger };