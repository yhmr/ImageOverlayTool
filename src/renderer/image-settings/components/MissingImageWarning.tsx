import { AlertTriangle } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";

interface MissingImageWarningProps {
    message: string;
    relinkLabel: string;
    onRelink: () => void;
}

export function MissingImageWarning(props: MissingImageWarningProps) {
    const { message, relinkLabel, onRelink } = props;

    return (
        <div
            className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive"
            data-testid="settings.image-item.missing-warning"
        >
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{message}</span>
            </div>
            <Button
                variant="destructive"
                size="sm"
                className="mt-2 w-full"
                onClick={onRelink}
                data-testid="settings.image-item.relink"
            >
                {relinkLabel}
            </Button>
        </div>
    );
}
