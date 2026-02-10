"use no memo";
import React, { memo, useCallback } from "react";
import { Arrow, Group, Text, Circle } from "react-konva";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { KonvaEventObject } from "konva/lib/Node";

interface DimensionLineLayerProps {
    dimensionLines: DimensionLine[];
    unitFactor: number;
    unit: string;
    isSelected: (id: string) => boolean;
    onSelect: (id: string | null) => void;
    onUpdate: (line: DimensionLine) => void;
    isDimensionMode: boolean;
}

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
        (id: string, type: "start" | "end") =>
            (e: KonvaEventObject<DragEvent>) => {
                const line = dimensionLines.find((l) => l.id === id);
                if (!line) return;

                const newPos = { x: e.target.x(), y: e.target.y() };
                const newLine = { ...line };
                if (type === "start") {
                    newLine.start = newPos;
                } else {
                    newLine.end = newPos;
                }
                onUpdate(newLine);
            },
        [dimensionLines, onUpdate]
    );

    const onAnchorDragMove = useCallback(
        (id: string, type: "start" | "end") =>
            (e: KonvaEventObject<DragEvent>) => {
                // Optional: Implement if real-time line update during drag is needed via local state or throttle
                // For now, react-konva might handle component updates if we don't update redux on every move.
                // But since Arrow needs start and end props, we rely on dragEnd for persistence,
                // but for visual feedback during drag, we might need to use the shape's internal state or force update.
                // However, dragging a circle (anchor) doesn't automatically update the Arrow unless state changes.
                // To keep it simple, let's update Redux on dragMove too (or use a local optimization wrapper).
                // For this implementation, let's try updating on dragmove for smoothness, assuming low line count.

                const line = dimensionLines.find((l) => l.id === id);
                if (!line) return;

                const newPos = { x: e.target.x(), y: e.target.y() };
                const newLine = { ...line };
                if (type === "start") {
                    newLine.start = newPos;
                } else {
                    newLine.end = newPos;
                }
                onUpdate(newLine);
            },
        [dimensionLines, onUpdate]
    );

    return (
        <Group>
            {dimensionLines.map((line) => {
                const selected = isSelected(line.id);
                const mid = getMidPoint(line.start, line.end);
                const label = getLabel(line.start, line.end);

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
                            points={[
                                line.start.x,
                                line.start.y,
                                line.end.x,
                                line.end.y,
                            ]}
                            stroke={selected ? "red" : "blue"}
                            fill={selected ? "red" : "blue"}
                            strokeWidth={2}
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
                            fill="black"
                            align="center"
                            offset={{ x: label.length * 4, y: 20 }} // approximate centering
                        />

                        {/* ラベルを編集するためのアンカー */}
                        {selected && isDimensionMode && (
                            <>
                                <Circle
                                    x={line.start.x}
                                    y={line.start.y}
                                    radius={6}
                                    fill="red"
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
                                    x={line.end.x}
                                    y={line.end.y}
                                    radius={6}
                                    fill="red"
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
