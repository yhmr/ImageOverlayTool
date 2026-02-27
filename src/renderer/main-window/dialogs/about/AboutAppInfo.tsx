import { useTranslation } from "react-i18next";

import logo from "@assets/icon.png";

interface AboutAppInfoProps {
    appVersion: string;
}

export function AboutAppInfo({ appVersion }: AboutAppInfoProps) {
    const { t } = useTranslation();

    return (
        <div className="flex-shrink-0 flex flex-col items-center gap-2 text-center">
            <img src={logo} alt="Logo" className="w-16 h-16 drop-shadow-sm" />
            <div>
                <h2 className="text-xl font-bold">ImageOverlayTool</h2>
                <p className="text-sm text-muted-foreground">
                    {t("render.about_dlg.version")}: {appVersion}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Copyright &copy; 2026 yhmr
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                <a
                    href="https://yhmr.github.io/ImageOverlayTool/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    data-testid="main.about.link.official-site"
                >
                    Official Site
                </a>
                <a
                    href="https://github.com/yhmr/ImageOverlayTool"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    data-testid="main.about.link.github"
                >
                    GitHub
                </a>
                <a
                    href="https://github.com/yhmr/ImageOverlayTool/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    data-testid="main.about.link.issue"
                >
                    Report Issue
                </a>
                <a
                    href="https://yhmr.github.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                    data-testid="main.about.link.developer"
                >
                    Developer
                </a>
            </div>
        </div>
    );
}
