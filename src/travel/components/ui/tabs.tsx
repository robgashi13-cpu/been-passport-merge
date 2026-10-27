import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/travel/lib/utils";

const Tabs = TabsPrimitive.Root;

function useSegmentThumb(forwardedRef: React.ForwardedRef<HTMLDivElement>) {
  const local = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => local.current as HTMLDivElement);
  React.useLayoutEffect(() => {
    const list = local.current;
    if (!list) return;
    const thumb = document.createElement("span");
    thumb.className = "hq-segment-thumb";
    thumb.setAttribute("aria-hidden", "true");
    list.appendChild(thumb);
    const update = () => {
      const active = list.querySelector<HTMLElement>('[data-state="active"]');
      if (!active) { thumb.style.opacity = "0"; return; }
      thumb.style.opacity = "1";
      thumb.style.width = `${active.offsetWidth}px`;
      thumb.style.transform = `translateX(${active.offsetLeft}px)`;
    };
    update();
    const mutations = new MutationObserver(update);
    mutations.observe(list, { subtree: true, attributes: true, attributeFilter: ["data-state"] });
    const resize = new ResizeObserver(update); resize.observe(list);
    return () => { mutations.disconnect(); resize.disconnect(); thumb.remove(); };
  }, []);
  return local;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const local = useSegmentThumb(ref);
  return <TabsPrimitive.List ref={local} className={cn("hq-segmented inline-flex h-11 items-center justify-center p-1 text-muted-foreground", className)} {...props} />;
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "hq-segment inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
