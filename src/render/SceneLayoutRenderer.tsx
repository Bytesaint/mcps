import React from 'react';
import type { SceneLayout, SceneTextElement, SceneImageElement, SceneBoxElement } from '../types/models';

interface SceneLayoutRendererProps {
    layout: SceneLayout;
    placeholderMap: Record<string, string>;
    phoneAUrl?: string;
    phoneBUrl?: string;
    width: number | string;
    height: number | string;
}

export const SceneLayoutRenderer: React.FC<SceneLayoutRendererProps> = ({
    layout, placeholderMap, phoneAUrl, phoneBUrl, width, height
}) => {
    
    // Sort elements by zIndex
    const sortedElements = [...layout.elements].sort((a, b) => a.zIndex - b.zIndex);

    const renderText = (el: SceneTextElement) => {
        // Replace placeholders
        let text = el.content;
        Object.keys(placeholderMap).forEach(key => {
            text = text.replace(new RegExp(key, 'g'), placeholderMap[key]);
        });
        
        // font size in container query units if height is string
        const fontSizeVal = typeof height === 'number' 
            ? `${el.fontSize * (height / 1080)}px`
            : `${(el.fontSize / 1080) * 100}cqh`;
        
        return (
            <div
                key={el.id}
                style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    color: el.color,
                    fontSize: fontSizeVal,
                    fontFamily: el.fontFamily || 'Inter, sans-serif',
                    fontWeight: el.fontWeight || 'bold',
                    fontStyle: el.fontStyle || 'normal',
                    textAlign: el.textAlign || 'center',
                    backgroundColor: el.backgroundColor,
                    padding: el.padding,
                    borderRadius: el.borderRadius,
                    opacity: el.opacity ?? 1,
                    alignItems: 'center',
                    justifyContent: el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center',
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                    display: el.hidden ? 'none' : 'flex'
                }}
            >
                {text}
            </div>
        );
    };

    const renderImage = (el: SceneImageElement) => {
        let src = '';
        if (el.sourceType === 'phoneA') src = phoneAUrl || '';
        else if (el.sourceType === 'phoneB') src = phoneBUrl || '';
        else src = el.customImageId || ''; // Ideally loaded from IDB or it's a base64
        
        return (
            <div
                key={el.id}
                style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    opacity: el.opacity ?? 1,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                    border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : 'none',
                    borderRadius: el.borderRadius,
                    overflow: 'hidden',
                    display: el.hidden ? 'none' : 'block'
                }}
            >
                {src && (
                    <img
                        src={src}
                        alt={el.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: el.fit || 'contain',
                            transform: el.crop ? `scale(${el.crop.zoom}) translate(${el.crop.panX * 50}%, ${el.crop.panY * 50}%)` : 'none'
                        }}
                    />
                )}
            </div>
        );
    };

    const renderBox = (el: SceneBoxElement) => {
        return (
            <div
                key={el.id}
                style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    backgroundColor: el.backgroundColor,
                    border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : 'none',
                    borderRadius: el.borderRadius,
                    opacity: el.opacity ?? 1,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                    display: el.hidden ? 'none' : 'block'
                }}
            />
        );
    };

    return (
        <div
            style={{
                position: 'relative',
                width,
                height,
                containerType: 'size', // Enable container queries
                backgroundColor: layout.backgroundColor || 'transparent',
                overflow: 'hidden'
            }}
        >
            {sortedElements.map(el => {
                if (el.type === 'text') return renderText(el as SceneTextElement);
                if (el.type === 'image') return renderImage(el as SceneImageElement);
                if (el.type === 'box') return renderBox(el as SceneBoxElement);
                return null;
            })}
        </div>
    );
};
