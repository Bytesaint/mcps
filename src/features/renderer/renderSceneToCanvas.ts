import { Project, ProjectScene, SceneElement, SceneTextElement } from '../../types/models';
import { getAssetUrl } from '../../storage/idb';

interface RenderContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    project: Project;
    scene: ProjectScene;
    timeMs: number; // Time elapsed in the scene
    fps: number;
}

// Helper: Resolve placeholders (simple version)
function resolveText(content: string, project: Project, scene: ProjectScene): string {
    // This is a simplified placeholder resolver. 
    // In a real app we'd parse {{phoneA.name}} etc.
    let text = content;

    // Example replacements (expand as needed)
    // text = text.replace('{{phoneA.name}}', project.phoneAId ...);
    // For now we just return content as-is or handle simple overrides if we had the full phone data
    // But RenderContext doesn't currently include the full Phone objects, just the Project. 
    // We might need to pass resolved data or fetch it.
    // For Phase 3 MVP, let's assume the Editor resolves these or we pass them in.

    // Actually, SceneAutoData has specA, specB, etc.
    if (scene.auto) {
        if (content === '{{specA}}') return scene.auto.specA || '';
        if (content === '{{specB}}') return scene.auto.specB || '';
        if (content === '{{winner}}') return scene.auto.winner || '';
    }

    return text;
}

export async function renderSceneToCanvas({ ctx, width, height, project, scene, timeMs, fps }: RenderContext) {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // 2. Draw Background
    const layout = scene.override?.layout;
    if (layout?.backgroundColor) {
        ctx.fillStyle = layout.backgroundColor;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.fillStyle = '#000000'; // Default black
        ctx.fillRect(0, 0, width, height);
    }

    if (layout?.backgroundImageId) {
        // TODO: Load and draw background image
        // const url = await getAssetUrl(layout.backgroundImageId);
        // drawImage...
    }

    // 3. Draw Elements
    const elements = (layout?.elements || []).sort((a, b) => a.zIndex - b.zIndex);

    for (const el of elements) {
        if (el.hidden) continue;

        // Save context for this element
        ctx.save();

        // Handle Opacity
        ctx.globalAlpha = el.opacity ?? 1;

        // Calculate Position & Size (Assuming elements are stored relative to a reference resolution, e.g. 1080x1920)
        // If our canvas is different size, we scale? 
        // For MVP, let's assume export resolution matches the reference or we scale proportionally.
        // Let's assume elements x,y,w,h are in "logical pixels" based on 1080x1920 (9:16)
        // and 'width'/'height' passed to function are the target render size.
        // We'll calculate a scale factor.
        const REF_WIDTH = 1080;
        const REF_HEIGHT = 1920;
        const scaleX = width / REF_WIDTH;
        const scaleY = height / REF_HEIGHT;
        // Or specific aspect fit? Let's assume simple scale for now.
        // Actually, for MP4 export we usually want exactly 1080x1920 or 720x1280.

        // However, the Editor SceneStage used 360x640 (1/3 scale). 
        // If elements are stored in 360x640 coords, we need to triple them.
        // Let's verify SceneStage: `const STAGE_WIDTH = 360;`
        // The elements are saved with coordinates relative to THAT stage in EditorLayout Logic?
        // `parseInt(ref.style.width)` returns pixels on that 360px stage.
        // So we should adhere to that or normalize.
        // Let's assume stored coordinates are based on 360x640 for simplicity of MVP, 
        // and we scale UP for 1080p export (Scale = 3).
        const STORED_REF_WIDTH = 360;
        const scale = width / STORED_REF_WIDTH;

        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.width * scale;
        const h = el.height * scale;

        // Rotation (around center)
        if (el.rotation) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            ctx.translate(cx, cy);
            ctx.rotate((el.rotation * Math.PI) / 180);
            ctx.translate(-cx, -cy);
        }

        if (el.type === 'box') {
            ctx.fillStyle = el.backgroundColor;
            ctx.fillRect(x, y, w, h);

            if (el.borderWidth && el.borderColor) {
                ctx.strokeStyle = el.borderColor;
                ctx.lineWidth = el.borderWidth * scale; // items also scale
                ctx.strokeRect(x, y, w, h);
            }
        } else if (el.type === 'image') {
            // Placeholder: Draw a grey box with X
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h);
            ctx.moveTo(x + w, y);
            ctx.lineTo(x, y + h);
            ctx.stroke();

            // Real implementation needs to load Image object asynchronously PRE-render 
            // `renderSceneToCanvas` is async, so we *could* await.
            if (el.sourceType === 'custom' && el.customImageId) {
                const url = await getAssetUrl(el.customImageId);
                if (url) {
                    const img = new Image();
                    img.src = url;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = resolve; // don't crash text render
                    });

                    // Draw image with object-fit logic
                    drawImageProp(ctx, img, x, y, w, h, 0, 0, el.fit === 'contain' ? 0 : 0.5);
                }
            }
        } else if (el.type === 'text') {
            const textEl = el as SceneTextElement;
            const fontSize = (textEl.fontSize || 24) * scale;
            ctx.font = `${textEl.fontWeight || 'normal'} ${fontSize}px ${textEl.fontFamily || 'sans-serif'}`;
            ctx.fillStyle = textEl.color;
            ctx.textBaseline = 'middle';

            const text = resolveText(textEl.content, project, scene);

            // Align
            const align = textEl.textAlign || 'left';
            ctx.textAlign = align;

            let tx = x;
            if (align === 'center') tx = x + w / 2;
            if (align === 'right') tx = x + w;

            const ty = y + h / 2; // vertically centered for now

            // Handle padding/bg if needed
            if (textEl.backgroundColor) {
                ctx.fillStyle = textEl.backgroundColor;
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = textEl.color; // Restore text color
            }

            ctx.fillText(text, tx, ty);
        }

        ctx.restore();
    }
}

/**
 * Helper to draw image with object-fit (cover/contain) logic on canvas
 * adapted from standard solutions
 */
function drawImageProp(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, offsetX: number, offsetY: number, objectPositionKey: number = 0.5) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // define aspect ratio
    // decide which gap to fill    
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
