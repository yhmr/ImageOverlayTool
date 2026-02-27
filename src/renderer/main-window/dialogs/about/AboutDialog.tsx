import { useTranslation } from "react-i18next";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/renderer/components/ui/dialog";
import { Button } from "@/renderer/components/ui/button";
import { VisuallyHidden } from "@/renderer/components/ui/visually-hidden";
import { useAboutDialogData } from "./useAboutDialogData";
import { AboutAppInfo } from "./AboutAppInfo";
import { AboutLicenseList } from "./AboutLicenseList";

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

export function AboutDialog(props: AboutDialogProps) {
    const { open, onClose } = props;
    const { t } = useTranslation();
    const { licenses, loading, appVersion } = useAboutDialogData(open);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>{t("render.about_dlg.title")}</DialogTitle>
                    </VisuallyHidden>
                    <DialogDescription className="sr-only">
                        This dialog shows information about the application and
                        licenses of third-party libraries.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 flex flex-col min-h-0 py-4 gap-4">
                    <AboutAppInfo appVersion={appVersion} />
                    <AboutLicenseList licenses={licenses} loading={loading} />
                </div>
                <DialogFooter>
                    <Button onClick={onClose} data-testid="main.about.done">
                        {t("render.about_dlg.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
