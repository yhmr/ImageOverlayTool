import { useTranslation } from "react-i18next";
import {
    ContextMenu as ShadcnContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/renderer/components/ui/context-menu";

import { useFitToScreen } from "../../hooks/useFitToScreen";

interface ContextMenuProps {
    children: React.ReactNode;
}

export function ContextMenu(props: ContextMenuProps) {
    const { children } = props;

    const { t } = useTranslation();
    const { fitToScreen } = useFitToScreen();

    return (
        <ShadcnContextMenu>
            <ContextMenuTrigger>
                <div style={{ cursor: "context-menu" }}>{children}</div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onSelect={fitToScreen}>
                    {t(
                        "render.context_menu.fit_screen",
                        "画面をフィッティング"
                    )}
                </ContextMenuItem>
            </ContextMenuContent>
        </ShadcnContextMenu>
    );
}
