import React, { useRef, useEffect, useState } from 'react';
import '../App.css';

const Whiteboard = ({ tool, color, lineWidth, roomId, pageId, username, socket, clearVersion, downloadTrigger }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({}); 

    const drawGrid = (ctx, w, h) => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e2e8f0';
        for(let x=0; x<w; x+=20) for(let y=0; y<h; y+=20) ctx.fillRect(x,y,1,1);
        ctx.restore();
    };

    const drawOnCanvas = (x, y, px, py, sColor, sWidth, toolType) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = toolType === 'eraser' ? sWidth * 2 : sWidth;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = toolType === 'eraser' ? 'destination-out' : 'source-over';
        ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const resize = () => {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = containerRef.current.clientWidth;
            canvas.height = 800;
            drawGrid(ctx, canvas.width, canvas.height);
            ctx.putImageData(img, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const handleDraw = (d) => { if(d.roomId === roomId && d.pageId === pageId) drawOnCanvas(d.x, d.y, d.prevX, d.prevY, d.color, d.width, d.tool); };
        const handleClear = (d) => { if(d.roomId === roomId && d.pageId === pageId) { ctx.clearRect(0,0,canvas.width,canvas.height); drawGrid(ctx,canvas.width,canvas.height); }};
        const handleMouseMove = (d) => { if(d.roomId === roomId && d.pageId === pageId) setCursors(prev => ({ ...prev, [d.username]: { x: d.x, y: d.y, color: d.color } })); };
        const handleUserLeft = ({ username: leftUser }) => { setCursors(prev => { const n = {...prev}; delete n[leftUser]; return n; }); };

        socket.on('draw', handleDraw);
        socket.on('clear-board', handleClear);
        socket.on('mouse-move', handleMouseMove);
        socket.on('user-left', handleUserLeft);

        return () => {
            window.removeEventListener('resize', resize);
            socket.off('draw', handleDraw);
            socket.off('clear-board', handleClear);
            socket.off('mouse-move', handleMouseMove);
            socket.off('user-left', handleUserLeft);
        };
    }, [roomId, pageId, socket]);

    const handleMove = (e) => {
        const { offsetX: x, offsetY: y } = e.nativeEvent;
        socket.emit('mouse-move', { roomId, pageId, username, x, y, color });
        if (isDrawing) {
            const { prevX, prevY } = canvasRef.current;
            drawOnCanvas(x, y, prevX, prevY, color, lineWidth, tool);
            socket.emit('draw', { roomId, pageId, x, y, prevX, prevY, color, width: lineWidth, tool });
            canvasRef.current.prevX = x; canvasRef.current.prevY = y;
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '800px' }}>
            <canvas ref={canvasRef} onMouseDown={(e)=>{setIsDrawing(true); canvasRef.current.prevX=e.nativeEvent.offsetX; canvasRef.current.prevY=e.nativeEvent.offsetY}} onMouseMove={handleMove} onMouseUp={()=>setIsDrawing(false)} onMouseLeave={()=>setIsDrawing(false)} style={{ display: 'block', cursor: tool === 'pencil' ? 'crosshair' : 'default', touchAction: 'none' }} />
            {Object.entries(cursors).map(([u, pos]) => (
                <div key={u} style={{ position: 'absolute', left: pos.x, top: pos.y, pointerEvents: 'none', transition: 'all 0.1s linear', zIndex: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill={pos.color || 'red'}><path d="M0 0L16 6L9 9L6 16L0 0Z" stroke="white" strokeWidth="1"/></svg>
                    <span style={{ background: pos.color || 'red', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: 3, marginLeft: 10, fontWeight: 'bold' }}>{u}</span>
                </div>
            ))}
        </div>
    );
};
export default Whiteboard;