"use client";

import { useState } from "react";
import { SwitchField } from "@/app/(admin)/admin/settings/login-comments/login-comments-settings-form";
import {
  saveWebsocketSettingsAction,
  type SaveWebsocketSettingsState,
} from "@/app/(admin)/admin/settings/websocket/actions";
import { useToast } from "@/components/toast-provider";

const initialState: SaveWebsocketSettingsState = {
  error: null,
  success: null,
  nonce: 0,
};

export function WebsocketSettingsForm({
  defaultSiteLiveVisitorsEnabled,
  defaultPostReadingPresenceEnabled,
  defaultStandalonePageReadingPresenceEnabled,
}: {
  defaultSiteLiveVisitorsEnabled: boolean;
  defaultPostReadingPresenceEnabled: boolean;
  defaultStandalonePageReadingPresenceEnabled: boolean;
}) {
  const [siteLiveVisitorsEnabled, setSiteLiveVisitorsEnabled] = useState(
    defaultSiteLiveVisitorsEnabled,
  );
  const [postReadingPresenceEnabled, setPostReadingPresenceEnabled] = useState(
    defaultPostReadingPresenceEnabled,
  );
  const [standalonePageReadingPresenceEnabled, setStandalonePageReadingPresenceEnabled] = useState(
    defaultStandalonePageReadingPresenceEnabled,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  async function submitToggleUpdate(nextState: {
    siteLiveVisitorsEnabled: boolean;
    postReadingPresenceEnabled: boolean;
    standalonePageReadingPresenceEnabled: boolean;
  }) {
    if (isSubmitting) {
      return;
    }

    const previousState = {
      siteLiveVisitorsEnabled,
      postReadingPresenceEnabled,
      standalonePageReadingPresenceEnabled,
    };

    setIsSubmitting(true);
    setSiteLiveVisitorsEnabled(nextState.siteLiveVisitorsEnabled);
    setPostReadingPresenceEnabled(nextState.postReadingPresenceEnabled);
    setStandalonePageReadingPresenceEnabled(nextState.standalonePageReadingPresenceEnabled);

    const formData = new FormData();
    formData.set(
      "siteLiveVisitorsEnabled",
      nextState.siteLiveVisitorsEnabled ? "true" : "false",
    );
    formData.set(
      "postReadingPresenceEnabled",
      nextState.postReadingPresenceEnabled ? "true" : "false",
    );
    formData.set(
      "standalonePageReadingPresenceEnabled",
      nextState.standalonePageReadingPresenceEnabled ? "true" : "false",
    );

    const result: SaveWebsocketSettingsState = await saveWebsocketSettingsAction(
      initialState,
      formData,
    );

    if (result.error) {
      setSiteLiveVisitorsEnabled(previousState.siteLiveVisitorsEnabled);
      setPostReadingPresenceEnabled(previousState.postReadingPresenceEnabled);
      setStandalonePageReadingPresenceEnabled(previousState.standalonePageReadingPresenceEnabled);
      showToast(result.error, "error");
    } else if (result.success) {
      showToast(result.success);
    }

    setIsSubmitting(false);
  }

  function handleSiteLiveVisitorsEnabledChange(nextChecked: boolean) {
    void submitToggleUpdate({
      siteLiveVisitorsEnabled: nextChecked,
      postReadingPresenceEnabled,
      standalonePageReadingPresenceEnabled,
    });
  }

  function handlePostReadingPresenceEnabledChange(nextChecked: boolean) {
    void submitToggleUpdate({
      siteLiveVisitorsEnabled,
      postReadingPresenceEnabled: nextChecked,
      standalonePageReadingPresenceEnabled,
    });
  }

  function handleStandalonePageReadingPresenceEnabledChange(nextChecked: boolean) {
    void submitToggleUpdate({
      siteLiveVisitorsEnabled,
      postReadingPresenceEnabled,
      standalonePageReadingPresenceEnabled: nextChecked,
    });
  }

  return (
    <section className="grid gap-8">
      <div className="grid gap-3">
        <SwitchField
          title="启用全站在线统计"
          description="控制页脚的在线访客统计，以及全站 presence heartbeat 上报。关闭后，页脚不再展示在线人数。"
          checked={siteLiveVisitorsEnabled}
          onCheckedChange={handleSiteLiveVisitorsEnabledChange}
          disabled={isSubmitting}
        />
        <SwitchField
          title="启用文章实时阅读进度"
          description="控制文章详情页的实时阅读进度、在线读者会话和阅读分布展示。关闭后，文章页不建立 websocket 连接。"
          checked={postReadingPresenceEnabled}
          onCheckedChange={handlePostReadingPresenceEnabledChange}
          disabled={isSubmitting}
        />
        <SwitchField
          title="启用独立页面实时阅读进度"
          description="控制独立页面的实时阅读进度、在线读者会话和阅读分布展示。关闭后，独立页面不建立 websocket 连接。"
          checked={standalonePageReadingPresenceEnabled}
          onCheckedChange={handleStandalonePageReadingPresenceEnabledChange}
          disabled={isSubmitting}
        />
      </div>
    </section>
  );
}
