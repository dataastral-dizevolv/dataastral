"use client";

import type { CSSProperties, ReactNode } from "react";

import { ChatThemeProvider, useChatTheme } from "@/components/iris-chat/ChatThemeContext";
import { IrisChatPrediction } from "@/components/iris-chat/IrisChatPrediction";
import type { CalculatorContext } from "@/hooks/useCalculatorPrediction";

interface IrisChatShellProps {
  context: CalculatorContext;
  header?: ReactNode;
}

function ThemedChat({ context, header }: IrisChatShellProps) {
  const { theme } = useChatTheme();
  const style = {
    ["--mint-bg" as string]: theme.bg,
    ["--warm-bubble" as string]: theme.bubble,
    ["--chat-vibrant" as string]: theme.vibrant,
    ["--chat-vibrant-fg" as string]: theme.vibrantFg,
    backgroundColor: `hsl(${theme.bg})`,
  } as CSSProperties;

  return (
    <div
      className={
        context === "app"
          ? "flex h-full min-h-0 flex-col overflow-hidden bg-mint transition-colors duration-500"
          : "flex h-[100dvh] flex-col overflow-hidden bg-mint transition-colors duration-500"
      }
      style={style}
    >
      {header}
      <div className={header ? "flex min-h-0 flex-1 flex-col pt-11 md:pt-14" : "flex min-h-0 flex-1 flex-col"}>
        <IrisChatPrediction context={context} />
      </div>
    </div>
  );
}

export function IrisChatShell({ context, header }: IrisChatShellProps) {
  return (
    <ChatThemeProvider>
      <ThemedChat context={context} header={header} />
    </ChatThemeProvider>
  );
}
