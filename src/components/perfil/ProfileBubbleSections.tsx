"use client";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { DeleteAccountDialog } from "@/components/perfil/DeleteAccountDialog";
import { NatalChartSection } from "@/components/perfil/NatalChartSection";
import { PredictionHistoryList } from "@/components/perfil/PredictionHistoryList";
import { ProfileCreditsBubble, ProfileReferralBubble } from "@/components/perfil/ProfileCreditsBubble";
import {
  ProfileBackLink,
  ProfileGreetingBubble,
  ProfilePersonalDataBubble,
  ProfileWelcomeCard,
} from "@/components/perfil/ProfilePersonalDataBubble";
import { ProfilePinBubble } from "@/components/perfil/ProfilePinBubble";

const BUBBLE_CLASS =
  "!bg-iris-blue-chambray !border-iris-blue-chambray text-iris-blue-ink text-[15px] sm:text-[17px] font-black";

export function ProfileBubbleSections() {
  const { user } = useDashboardUser();

  return (
    <div className="space-y-4">
      <ProfilePersonalDataBubble />
      <ProfileGreetingBubble />
      <ProfileWelcomeCard />

      <ChatBubble from="iris" className={BUBBLE_CLASS}>
        <NatalChartSection user={user} variant="bubble" />
      </ChatBubble>

      <ProfileCreditsBubble />
      <ProfileReferralBubble />
      <ProfilePinBubble />

      <ChatBubble from="iris" className={BUBBLE_CLASS}>
        <PredictionHistoryList variant="bubble" />
      </ChatBubble>

      <ChatBubble from="iris" className={BUBBLE_CLASS}>
        <DeleteAccountDialog user={user} variant="bubble" backLink={<ProfileBackLink />} />
      </ChatBubble>
    </div>
  );
}
