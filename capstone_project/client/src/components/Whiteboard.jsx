import React, { useRef, useEffect, useState } from 'react';
import '../App.css';

const Whiteboard = ({ 
    tool, color, lineWidth, roomId, pageId, username, socket, clearVersion, downloadTrigger 
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({}); 

    // --- Helper Functions ---
    const drawBackground = (ctx, w, h) => {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e2e8f0'; // Grid Color
        for (let x = 0; x < w; x += 20) {
            for (let y = 0; y < h; y += 20) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
        ctx.restore();
    };

    const drawOnCanvas = (x, y, px, py, sColor, sWidth, toolType) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = toolType === 'eraser' ? sWidth * 2 : sWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = toolType === 'eraser' ? 'destination-out' : 'source-over';
        ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        ctx.closePath();
    };

    // --- Effects ---
    useEffect(() => {
        if (downloadTrigger > 0 && canvasRef.current) {
            const link = document.createElement('a');
            link.download = `Whiteboard_Room_${roomId}_Page_${pageId}.png`;
            link.href = canvasRef.current.toDataURL();
            link.click();
        }
    }, [downloadTrigger, roomId, pageId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        // Fix performance warning
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const resize = () => {
            if (container) {
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = container.clientWidth;
                canvas.height = 800; 
                drawBackground(ctx, canvas.width, canvas.height);
                ctx.putImageData(img, 0, 0);
            }
        };

        resize();
        const obs = new ResizeObserver(resize);
        if (container) obs.observe(container);

        const handleDraw = (d) => { if(d.roomId === roomId && d.pageId === pageId) drawOnCanvas(d.x, d.y, d.prevX, d.prevY, d.color, d.width, d.tool); };
        const handleMouseMove = (d) => { if(d.roomId === roomId && d.pageId === pageId) setCursors(prev => ({ ...prev, [d.username]: { x: d.x, y: d.y, color: d.color } })); };
        const handleClear = (d) => { if(d.roomId === roomId && d.pageId === pageId) { ctx.clearRect(0,0,canvas.width,canvas.height); drawBackground(ctx,canvas.width,canvas.height); } };

        socket.on('draw', handleDraw); socket.on('mouse-move', handleMouseMove); socket.on('clear-board', handleClear);
        return () => { if(container) obs.unobserve(container); socket.off('draw'); socket.off('mouse-move'); socket.off('clear-board'); };
    }, [roomId, pageId]);

    useEffect(() => { if(clearVersion > 0) { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0,0,canvasRef.current.width,800); drawBackground(ctx,canvasRef.current.width,800); } }, [clearVersion]);

    const move = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        socket.emit('mouse-move', { roomId, pageId, username, x: offsetX, y: offsetY, color });
        if (isDrawing) {
            const { prevX, prevY } = canvasRef.current;
            drawOnCanvas(offsetX, offsetY, prevX, prevY, color, lineWidth, tool);
            socket.emit('draw', { roomId, pageId, x: offsetX, y: offsetY, prevX, prevY, color, width: lineWidth, tool });
            canvasRef.current.prevX = offsetX; canvasRef.current.prevY = offsetY;
        }
    };

    return (
        <div ref={containerRef} style={{ position:'relative', height:'800px', width:'100%' }}>
            <canvas ref={canvasRef} onMouseDown={(e)=>{setIsDrawing(true); canvasRef.current.prevX=e.nativeEvent.offsetX; canvasRef.current.prevY=e.nativeEvent.offsetY}} onMouseMove={move} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)} style={{ display:'block', cursor: tool==='pencil'?'crosshair':'default', touchAction:'none' }} />
            {Object.entries(cursors).map(([u, pos]) => (
                <div key={u} style={{ position:'absolute', left:pos.x, top:pos.y, pointerEvents:'none', transition:'top 0.1s linear, left 0.1s linear', zIndex:10 }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill={pos.color || 'red'}><path d="M0 0L16 6L9 9L6 16L0 0Z" stroke="white" strokeWidth="1"/></svg>
                    <span style={{ background:pos.color||'red', color:'white', fontSize:'0.7rem', padding:'2px 4px', borderRadius:3, marginLeft:10, fontWeight:700 }}>{u}</span>
                </div>
            ))}
        </div>
    );
};
export default Whiteboard;