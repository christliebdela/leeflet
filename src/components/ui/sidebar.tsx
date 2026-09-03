"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu as IconMenu2, X as IconX } from "lucide-react";

export interface Links {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.JSX.Element | React.ReactNode;
}

export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-3 py-3 hidden md:flex md:flex-col bg-[#fafafa] dark:bg-[#121214] border-r border-[#e5e7eb] dark:border-[#27272a] shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "60px") : "260px",
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
      onMouseEnter={(e) => {
        setOpen(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setOpen(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-10 px-4 py-2 flex flex-row md:hidden items-center justify-between bg-[#fafafa] dark:bg-[#121214] border-b border-[#e5e7eb] dark:border-[#27272a] w-full"
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <IconMenu2
          className="text-neutral-800 dark:text-neutral-200 cursor-pointer w-5 h-5"
          onClick={() => setOpen(!open)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-white dark:bg-[#121214] p-6 z-[100] flex flex-col justify-between",
              className
            )}
          >
            <div
              className="absolute right-6 top-6 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <IconX className="w-5 h-5" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const Component = link.href ? 'a' : 'button';
  return (
    <Component
      href={link.href}
      onClick={link.onClick}
      className={cn(
        "flex items-center justify-start gap-2.5 group/sidebar py-1.5 px-2 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer w-full text-left",
        className
      )}
      {...props}
    >
      <div className="shrink-0">{link.icon}</div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{
          duration: 0.15,
        }}
        className="text-[#374151] dark:text-[#d4d4d8] text-xs font-medium group-hover/sidebar:translate-x-0.5 transition duration-150 whitespace-pre truncate !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Component>
  );
};
