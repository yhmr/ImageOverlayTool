import { useTranslation } from "react-i18next";

import type { LicenseInfo } from "@/shared/types/LicenseInfo";

interface AboutLicenseListProps {
    licenses: LicenseInfo[];
    loading: boolean;
}

const splitPackageNameVersion = (
    packageName: string
): { name: string; version: string } => {
    const lastAtIndex = packageName.lastIndexOf("@");
    if (lastAtIndex <= 0 || lastAtIndex >= packageName.length - 1) {
        return { name: packageName, version: "" };
    }

    return {
        name: packageName.substring(0, lastAtIndex),
        version: packageName.substring(lastAtIndex + 1),
    };
};

export function AboutLicenseList({ licenses, loading }: AboutLicenseListProps) {
    const { t } = useTranslation();

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold mb-2 flex-shrink-0">
                {t("render.about_dlg.licenses")}
            </h3>
            <div className="flex-1 overflow-y-auto rounded-md border p-2">
                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : licenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No license information available
                    </p>
                ) : (
                    <div className="space-y-3">
                        {licenses.map((license, index) => {
                            const { name, version } = splitPackageNameVersion(
                                license.name
                            );

                            return (
                                <div
                                    key={index}
                                    className="text-xs border-b pb-2 last:border-b-0"
                                >
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="font-bold text-sm">
                                            {name}
                                        </div>
                                        {version && (
                                            <div className="text-muted-foreground ml-2">
                                                v{version}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-muted-foreground italic">
                                        <div>{license.licenses}</div>
                                        {license.publisher && (
                                            <div className="text-[10px] opacity-70">
                                                {license.publisher}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
