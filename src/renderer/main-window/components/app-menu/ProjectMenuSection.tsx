import { FilePlus, FolderOpen, Save, SaveAll } from "lucide-react";

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from "@/renderer/components/ui/dropdown-menu";

import type { ShortcutLabel, Translate } from "./menuTypes";

interface ProjectMenuSectionProps {
    t: Translate;
    shortcut: ShortcutLabel;
    newProject: () => void;
    openProject: () => void;
    saveProject: () => void;
    saveProjectAs: () => void;
}

export function ProjectMenuSection({
    t,
    shortcut,
    newProject,
    openProject,
    saveProject,
    saveProjectAs,
}: ProjectMenuSectionProps) {
    return (
        <>
            <DropdownMenuLabel>
                {t("render.menu.group_project")}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
                <DropdownMenuItem
                    onClick={newProject}
                    data-testid="main.menu.item.new-project"
                >
                    <FilePlus className="mr-2 h-4 w-4" />
                    {t("render.menu.new_project")}
                    <DropdownMenuShortcut>
                        {shortcut("newProject")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={openProject}
                    data-testid="main.menu.item.open-project"
                >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {t("render.menu.open_project")}
                    <DropdownMenuShortcut>
                        {shortcut("openProject")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={saveProject}
                    data-testid="main.menu.item.save-project"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {t("render.menu.save_project")}
                    <DropdownMenuShortcut>
                        {shortcut("saveProject")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={saveProjectAs}
                    data-testid="main.menu.item.save-project-as"
                >
                    <SaveAll className="mr-2 h-4 w-4" />
                    {t("render.menu.save_project_as")}
                    <DropdownMenuShortcut>
                        {shortcut("saveProjectAs")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </>
    );
}
