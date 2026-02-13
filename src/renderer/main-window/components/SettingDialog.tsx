import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/renderer/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Button } from "@/renderer/components/ui/button";
import { Label } from "@/renderer/components/ui/label";
import { useIpcService } from "../../providers/IpcServiceProvider";

interface SettingDialogProps {
    open: boolean;
    onClose: () => void;
}

const LOG_LEVELS = ["error", "warn", "info", "debug", "silly"];

export function SettingDialog(props: SettingDialogProps) {
    const { open, onClose } = props;
    const { t, i18n } = useTranslation();
    const ipcService = useIpcService();
    const [logLevel, setLogLevel] = useState("info");

    // 言語切り替え
    const changeLanguage = (value: string) => {
        i18n.changeLanguage(value);
    };

    const persistSettings = async () => {
        await ipcService.saveSetting({
            language: i18n.language,
            logLevel,
        });
    };

    // 終了時に設定保存
    const saveAndClose = async () => {
        await persistSettings();
        onClose();
    };

    const exportSettings = async () => {
        // Export must include currently edited values in this dialog.
        await persistSettings();
        await ipcService.exportSettings();
    };

    const importSettings = async () => {
        const imported = await ipcService.importSettings();
        if (imported) {
            if (imported.language) {
                i18n.changeLanguage(imported.language);
            }
            if (imported.logLevel) {
                setLogLevel(imported.logLevel);
            }
        }
    };

    // 初期化
    useLayoutEffect(() => {
        const loadSetting = async () => {
            const setting = await ipcService.loadSetting();
            i18n.changeLanguage(setting.language);
            if (setting.logLevel) {
                setLogLevel(setting.logLevel);
            }
        };
        void loadSetting();
    }, [i18n, ipcService]);

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => !isOpen && saveAndClose()}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("render.setting_dlg.title")}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {t("render.setting_dlg.description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="language-select" className="text-right">
                            {t("render.setting_dlg.language")}
                        </Label>
                        <Select
                            value={i18n.language}
                            onValueChange={changeLanguage}
                        >
                            <SelectTrigger
                                className="col-span-3"
                                id="language-select"
                            >
                                <SelectValue
                                    placeholder={t(
                                        "render.setting_dlg.language"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(
                                    i18n.services.resourceStore.data
                                ).map((lng) => (
                                    <SelectItem key={lng} value={lng}>
                                        {lng}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground ml-auto">
                        {t("render.setting_dlg.helper.language")}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="loglevel-select" className="text-right">
                            {t("render.setting_dlg.log_level")}
                        </Label>
                        <Select value={logLevel} onValueChange={setLogLevel}>
                            <SelectTrigger
                                className="col-span-3"
                                id="loglevel-select"
                            >
                                <SelectValue
                                    placeholder={t(
                                        "render.setting_dlg.log_level"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {LOG_LEVELS.map((level) => (
                                    <SelectItem key={level} value={level}>
                                        {t(
                                            `render.setting_dlg.log_levels.${level}`
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={exportSettings}
                            type="button"
                        >
                            {t("render.setting_dlg.export")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={importSettings}
                            type="button"
                        >
                            {t("render.setting_dlg.import")}
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={saveAndClose}>
                        {t("render.setting_dlg.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
