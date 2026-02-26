import React, { useRef, useEffect, useState } from 'react';
import '../App.css';

const Whiteboard = ({ tool, color, lineWidth, roomId, pageId, username, socket, clearVersion }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({}); 
    
    // Ref to track last emission time for throttling
    const lastCursorEmit = useRef(0);

    // Helper functions
    const drawGrid = (ctx, w, h) => {
        ctx.fillStyle = '#e2e8f0';
        for(let x=0; x<w; x+=20) for(let y=0; y<h; y+=20) ctx.fillRect(x,y,1,1);
    };

    const drawOnCanvas = (x, y, px, py, sColor, sWidth, toolType) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = sWidth;
        ctx.globalCompositeOperation = toolType === 'eraser' ? 'destination-out' : 'source-over';
        if (toolType === 'eraser') ctx.lineWidth = sWidth * 2;
        ctx.lineCap = 'round'; // Make lines smoother
        ctx.lineJoin = 'round'; // Make corners smoother
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const resize = () => {
            if (canvas.parentElement) {
                // Save content before resize
                const img = ctx.getImageData(0,0,canvas.width,canvas.height);
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = 800; 
                drawGrid(ctx, canvas.width, canvas.height);
                ctx.putImageData(img,0,0);
                
                // Important: Context properties reset on resize, so restore them
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        };
        resize();
        window.addEventListener('resize', resize);
        
        const handleDraw = (d) => { 
            if(d.roomId===roomId && d.pageId===pageId) {
                drawOnCanvas(d.x, d.y, d.prevX, d.prevY, d.color, d.width, d.tool); 
            }
        };
        
        const handleClear = (d) => { 
            if(d.roomId===roomId && d.pageId===pageId) { 
                ctx.clearRect(0,0,canvas.width,canvas.height); 
                drawGrid(ctx,canvas.width,canvas.height); 
            } 
        };
        
        // Handle remote mouse
        const handleMouseMove = (d) => {
            // Check username mismatch to prevent self-cursor
            if(d.roomId===roomId && d.pageId===pageId && d.username !== username) {
                const userColor = d.color || '#'+Math.floor(Math.random()*16777215).toString(16);
                // Functional update to avoid dependency issues
                setCursors(prev => ({ ...prev, [d.username]: { x: d.x, y: d.y, color: userColor } }));
            }
        };

        const handleUserLeft = (d) => {
            if (d.username) {
                setCursors(prev => {
                    const copy = { ...prev };
                    delete copy[d.username];
                    return copy;
                });
            }
        };

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
    }, [roomId, pageId, username]);

    useEffect(() => {
        if(clearVersion > 0) {
             const ctx = canvasRef.current.getContext('2d');
             ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
             drawGrid(ctx,canvasRef.current.width,canvasRef.current.height);
        }
    }, [clearVersion]);

    const handleMove = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        
        // --- THROTTLING LOGIC FOR CURSOR ---
        const now = Date.now();
        // Only emit cursor position every 30ms to prevent network/render flood
        if (now - lastCursorEmit.current > 30) {
             socket.emit('mouse-move', { roomId, pageId, username, x: offsetX, y: offsetY, color });
             lastCursorEmit.current = now;
        }

        if(isDrawing) {
            const { prevX, prevY } = canvasRef.current;
            drawOnCanvas(offsetX, offsetY, prevX, prevY, color, lineWidth, tool);
            socket.emit('draw', { roomId, pageId, x: offsetX, y: offsetY, prevX, prevY, color, width: lineWidth, tool });
            canvasRef.current.prevX = offsetX;
            canvasRef.current.prevY = offsetY;
        }
    };

    const start = (e) => { 
        setIsDrawing(true); 
        canvasRef.current.prevX = e.nativeEvent.offsetX; 
        canvasRef.current.prevY = e.nativeEvent.offsetY; 
    };
    
    const stop = () => setIsDrawing(false);

    return (
        <div style={{position:'relative', height:'800px'}}>
            <canvas 
                ref={canvasRef} 
                onMouseDown={start} 
                onMouseMove={handleMove} 
                onMouseUp={stop} 
                onMouseLeave={stop} 
                style={{display:'block', cursor: tool==='pencil'?'crosshair':'default'}} 
            />
            
            {Object.entries(cursors).map(([uName, pos]) => (
                <div key={uName} style={{
                    position: 'absolute', 
                    left: pos.x, 
                    top: pos.y, 
                    pointerEvents: 'none', 
                    // Use transform for better performance than top/left
                    transform: `translate(0, -100%)`, 
                    transition: 'all 0.1s linear', // Interpolate movement for smoothness
                    zIndex: 10
                }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill={pos.color || 'red'} style={{filter:'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'}}>
                        <path d="M0 0L16 6L9 9L6 16L0 0Z" stroke="white" strokeWidth="1"/>
                    </svg>
                    <span style={{background: pos.color||'red', color:'white', fontSize:'0.7rem', padding:'2px 4px', borderRadius:3, marginLeft:10, fontWeight:'bold'}}>
                        {uName}
                    </span>
                </div>
            ))}
        </div>
    );
};
export default Whiteboard;