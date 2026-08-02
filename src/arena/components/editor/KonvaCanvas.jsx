import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';

const STAGE_W = 960;
const STAGE_H = 540;

function ElementRenderer({ el, isSelected, onSelect, onChange }) {
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = useCallback((e) => {
    onChange(el.id, { x: e.target.x(), y: e.target.y() });
  }, [el.id, onChange]);

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onChange(el.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  }, [el.id, onChange]);

  const commonProps = {
    ref: shapeRef,
    id: el.id,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    fill: el.fill || '#7C3AED',
    draggable: true,
    onClick: () => onSelect(el.id),
    onTap: () => onSelect(el.id),
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  if (el.type === 'text') {
    return (
      <Group>
        <Text
          {...commonProps}
          text={el.text || 'Double-click to edit'}
          fontSize={el.fontSize || 20}
          fontFamily={el.fontFamily || '"Inter", sans-serif'}
          fontStyle={el.fontStyle || 'normal'}
          fill={el.fill || '#101323'}
          align={el.align || 'left'}
          padding={8}
          perfectDrawEnabled={false}
        />
        {isSelected && <Transformer ref={trRef} rotateEnabled={false} boundBoxFunc={(old, n) => n} />}
      </Group>
    );
  }

  if (el.type === 'rect') {
    return (
      <Group>
        <Rect
          {...commonProps}
          cornerRadius={el.cornerRadius || 8}
          stroke={el.stroke || '#E5E7EB'}
          strokeWidth={el.strokeWidth || 1}
          perfectDrawEnabled={false}
        />
        {isSelected && <Transformer ref={trRef} rotateEnabled={false} boundBoxFunc={(old, n) => n} />}
      </Group>
    );
  }

  if (el.type === 'image' && el.src) {
    const [img] = useState(() => {
      const i = new window.Image();
      i.crossOrigin = 'anonymous';
      i.src = el.src;
      return i;
    });
    return (
      <Group>
        <KonvaImage
          {...commonProps}
          image={img}
          perfectDrawEnabled={false}
        />
        {isSelected && <Transformer ref={trRef} rotateEnabled={false} boundBoxFunc={(old, n) => n} />}
      </Group>
    );
  }

  return null;
}

export default function KonvaCanvas({ elements, selectedId, onSelectElement, onUpdateElement, onDeleteElement }) {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function fitStage() {
      const container = stageRef.current?.container();
      if (!container) return;
      const containerW = container.offsetWidth;
      const containerH = container.offsetHeight;
      const s = Math.min(containerW / STAGE_W, containerH / STAGE_H, 1);
      setScale(s);
    }
    fitStage();
    window.addEventListener('resize', fitStage);
    return () => window.removeEventListener('resize', fitStage);
  }, []);

  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      onSelectElement(null);
    }
  }, [onSelectElement]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4" ref={stageRef}>
      <Stage
        width={STAGE_W * scale}
        height={STAGE_H * scale}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', borderRadius: 8, overflow: 'hidden' }}
      >
        <Layer>
          {elements.map((el) => (
            <ElementRenderer
              key={el.id}
              el={el}
              isSelected={el.id === selectedId}
              onSelect={onSelectElement}
              onChange={onUpdateElement}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
