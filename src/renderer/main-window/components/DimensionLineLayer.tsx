"use no memo";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Arrow, Group, Text, Circle } from "react-konva";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { KonvaEventObject } from "konva/lib/Node";
import { sanitizeDimensionLineColor } from "../../../shared/constants/dimensionLine";

interface DimensionLineLayerProps {
    dimensionLines: DimensionLine[];
    unitFactor: number;
    unit: string;
    isSelected: (id: string) => boolean;
    onSelect: (id: string | null) => void;
    onUpdate: (line: DimensionLine) => void;
    isDimensionMode: boolean;
}

type AnchorType = "start" | "end";
type Point = { x: number; y: number };
type EditingAnchorMap = Record<string, Partial<Record<AnchorType, Point>>>;

export const DimensionLineLayer = memo(function DimensionLineLayer(
    props: DimensionLineLayerProps
) {
    const {
        dimensionLines,
        unitFactor,
        unit,
        isSelected,
        onSelect,
        onUpdate,
        isDimensionMode,
    } = props;
    const [editingAnchors, setEditingAnchors] = useState<EditingAnchorMap>({});

    useEffect(() => {
        const existingIds = new Set(dimensionLines.map((line) => line.id));
        setEditingAnchors((prev) => {
            const next: EditingAnchorMap = {};
            let changed = false;

            Object.entries(prev).forEach(([id, anchors]) => {
                if (existingIds.has(id)) {
                    next[id] = anchors;
                } else {
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [dimensionLines]);

    // ラベルの
    const getLabel = (
        start: { x: number; y: number },
        end: { x: number; y: number }
    ) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // ピクセルを実際の距離に変換
        const realDist = dist * unitFactor;
        return `${realDist.toFixed(2)} ${unit}`;
    };

    const getMidPoint = (
        start: { x: number; y: number },
        end: { x: number; y: number }
    ) => {
        return {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
        };
    };

    const onAnchorDragEnd = useCallback(
        (id: string, type: AnchorType) => (e: KonvaEventObject<DragEvent>) => {
            const line = dimensionLines.find((l) => l.id === id);
            if (!line) {
                setEditingAnchors((prev) => {
                    if (!prev[id]) {
                        return prev;
                    }
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                return;
            }

            const newPos = { x: e.target.x(), y: e.target.y() };
            const newLine = { ...line };
            if (type === "start") {
                newLine.start = newPos;
            } else {
                newLine.end = newPos;
            }
            onUpdate(newLine);

            setEditingAnchors((prev) => {
                const lineAnchors = prev[id];
                if (!lineAnchors) {
                    return prev;
                }
                const nextLineAnchors = { ...lineAnchors };
                delete nextLineAnchors[type];
                if (Object.keys(nextLineAnchors).length === 0) {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                }
                return { ...prev, [id]: nextLineAnchors };
            });
        },
        [dimensionLines, onUpdate]
    );

    const onAnchorDragMove = useCallback(
        (id: string, type: AnchorType) => (e: KonvaEventObject<DragEvent>) => {
            const newPos = { x: e.target.x(), y: e.target.y() };
            setEditingAnchors((prev) => ({
                ...prev,
                [id]: {
                    ...(prev[id] ?? {}),
                    [type]: newPos,
                },
            }));
        },
        []
    );

    return (
        <Group>
            {dimensionLines.map((line) => {
                const selected = isSelected(line.id);
                const editing = editingAnchors[line.id];
                const start = editing?.start ?? line.start;
                const end = editing?.end ?? line.end;
                const mid = getMidPoint(start, end);
                const label = getLabel(start, end);
                const lineColor = sanitizeDimensionLineColor(line.color);

                return (
                    <Group
                        key={line.id}
                        onClick={(e) => {
                            if (isDimensionMode) {
                                onSelect(line.id);
                                e.cancelBubble = true;
                            }
                        }}
                    >
                        {/* 矢印 */}
                        <Arrow
                            points={[start.x, start.y, end.x, end.y]}
                            stroke={lineColor}
                            fill={lineColor}
                            strokeWidth={selected ? 3 : 2}
                            pointerLength={10}
                            pointerWidth={10}
                            pointerAtBeginning={true}
                        />

                        {/* ラベル */}
                        <Text
                            x={mid.x}
                            y={mid.y}
                            text={label}
                            fontSize={16}
                            fill={lineColor}
                            align="center"
                            offset={{ x: label.length * 4, y: 20 }} // approximate centering
                        />

                        {/* ラベルを編集するためのアンカー */}
                        {selected && isDimensionMode && (
                            <>
                                <Circle
                                    x={start.x}
                                    y={start.y}
                                    radius={6}
                                    fill={lineColor}
                                    draggable
                                    onDragMove={onAnchorDragMove(
                                        line.id,
                                        "start"
                                    )}
                                    onDragEnd={onAnchorDragEnd(
                                        line.id,
                                        "start"
                                    )}
                                />
                                <Circle
                                    x={end.x}
                                    y={end.y}
                                    radius={6}
                                    fill={lineColor}
                                    draggable
                                    onDragMove={onAnchorDragMove(
                                        line.id,
                                        "end"
                                    )}
                                    onDragEnd={onAnchorDragEnd(line.id, "end")}
                                />
                            </>
                        )}
                    </Group>
                );
            })}
        </Group>
    );
});
