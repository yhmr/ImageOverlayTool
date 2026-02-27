import { Button } from "@/renderer/components/ui/button";

import type { MainWindowActions } from "../hooks/useMainWindowActions";

interface MenuBarStatusBadgesProps {
    missingCount: number;
    mainWindowActions: MainWindowActions;
    t: (key: string, options?: Record<string, unknown>) => string;
}

export function MenuBarStatusBadges({
    missingCount,
    mainWindowActions,
    t,
}: MenuBarStatusBadgesProps) {
    return (
        <>
            {missingCount > 0 && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={mainWindowActions.openImageSettingsWindow}
                    className="mr-2 app-region-no-drag"
                    data-testid="main.status.missing-images"
                    data-clickthrough-allow
                >
                    {t("render.image_status.missing_summary", {
                        count: missingCount,
                    })}
                </Button>
            )}

            {mainWindowActions.isClickThroughMode && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={mainWindowActions.disableClickThroughMode}
                    className="mr-2 app-region-no-drag bg-amber-500/90 text-amber-950 hover:bg-amber-500"
                    data-testid="main.status.click-through-mode"
                    data-clickthrough-allow
                >
                    {t("render.menu_button.status.click_through_mode_active")}
                </Button>
            )}

            {mainWindowActions.isAlwaysOnTopMode &&
                !mainWindowActions.isClickThroughMode && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={mainWindowActions.disableAlwaysOnTopMode}
                        className="mr-2 app-region-no-drag bg-cyan-500/90 text-cyan-950 hover:bg-cyan-500"
                        data-testid="main.status.always-on-top-mode"
                        data-clickthrough-allow
                    >
                        {t(
                            "render.menu_button.status.always_on_top_mode_active"
                        )}
                    </Button>
                )}
        </>
    );
}
