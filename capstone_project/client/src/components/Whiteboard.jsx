import React, { useRef, useEffect, useState } from 'react';
import '../App.css';

const Whiteboard = ({ tool, color, lineWidth, roomId, pageId, username, socket, clearVersion, downloadTrigger }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({}); 
    
    // Store current stroke data to send to backend history for Undo/Redo
    const currentStrokeRef = useRef({ points: [], color, width: lineWidth, tool });

    // --- Helper Functions ---
    const redrawFromHistory = (history) => {
        const ctx = canvasRef.current.getContext('2d');
        const { width, height } = canvasRef.current;
        
        ctx.clearRect(0, 0, width, height); // Just clear, CSS background handles the grid
        
        // Redraw all strokes from server history
        history.forEach(stroke => {
            if(stroke.points.length < 2) return;
            ctx.beginPath(); 
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 2 : stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
            
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for(let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
            ctx.closePath();
        });
    };

    // --- Effects ---
    useEffect(() => {
        if (downloadTrigger > 0 && canvasRef.current) {
            // Because the grid is CSS-based, the downloaded png background will be transparent. 
            // If you want a white background inside the downloaded file, composite it temporarily:
            const downloadCanvas = document.createElement('canvas');
            downloadCanvas.width = canvasRef.current.width;
            downloadCanvas.height = canvasRef.current.height;
            const tempCtx = downloadCanvas.getContext('2d');
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
            tempCtx.drawImage(canvasRef.current, 0, 0);

            const link = document.createElement('a');
            link.download = `Whiteboard_Room_${roomId}_Page_${pageId}.png`;
            link.href = downloadCanvas.toDataURL('image/png');
            link.click();
        }
    }, [downloadTrigger, roomId, pageId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const resize = () => {
            if (container) {
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = container.clientWidth;
                canvas.height = 800;
                ctx.putImageData(img, 0, 0);
            }
        };

        resize();
        const obs = new ResizeObserver(resize);
        if(container) obs.observe(container);

        // --- Socket Listeners ---
        const handleDraw = (d) => {
            if(d.roomId === roomId && d.pageId === pageId) {
                ctx.beginPath(); 
                ctx.strokeStyle = d.color; 
                ctx.lineWidth = d.tool === 'eraser' ? d.width * 2 : d.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalCompositeOperation = d.tool === 'eraser' ? 'destination-out' : 'source-over';
                ctx.moveTo(d.prevX, d.prevY); 
                ctx.lineTo(d.x, d.y); 
                ctx.stroke();
                ctx.closePath();
            }
        };

        const handleMouseMove = (d) => { 
            if(d.roomId === roomId && d.pageId === pageId) {
                setCursors(prev => ({ ...prev, [d.username]: { x: d.x, y: d.y, color: d.color } })); 
            }
        };

        const handleUserLeft = (data) => {
            setCursors(prev => { 
                const newCursors = {...prev}; 
                delete newCursors[data.username]; 
                return newCursors; 
            });
        };

        const handleClear = (d) => { 
            if(d.roomId === roomId && d.pageId === pageId) { 
                ctx.clearRect(0,0,canvas.width,canvas.height); 
            }
        };

        socket.on('draw', handleDraw);
        socket.on('board-history', redrawFromHistory); 
        socket.on('mouse-move', handleMouseMove);
        socket.on('user-left', handleUserLeft);
        socket.on('clear-board', handleClear);

        return () => { 
            if(container) obs.unobserve(container); 
            socket.off('draw', handleDraw); 
            socket.off('board-history', redrawFromHistory);
            socket.off('mouse-move', handleMouseMove);
            socket.off('user-left', handleUserLeft);
            socket.off('clear-board', handleClear);
        };
    }, [roomId, pageId]);

    // Handle Clear Trigger
    useEffect(() => {
        if(clearVersion > 0) {
             const ctx = canvasRef.current.getContext('2d');
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }, [clearVersion]);

    // --- Interactions ---
    const handleMove = (e) => {
        const { offsetX: x, offsetY: y } = e.nativeEvent;
        
        socket.emit('mouse-move', { roomId, pageId, username, x, y, color });
        
        if (isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            const { prevX, prevY } = canvasRef.current;
            
            ctx.beginPath(); 
            ctx.strokeStyle = color; 
            ctx.lineWidth = tool === 'eraser' ? lineWidth * 2 : lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.moveTo(prevX, prevY); 
            ctx.lineTo(x, y); 
            ctx.stroke();
            ctx.closePath();
            
            socket.emit('draw', { roomId, pageId, x, y, prevX, prevY, color, width: lineWidth, tool });
            currentStrokeRef.current.points.push({ x, y });
            
            canvasRef.current.prevX = x; 
            canvasRef.current.prevY = y;
        }
    };

    const start = (e) => {
        setIsDrawing(true); 
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;
        canvasRef.current.prevX = x; 
        canvasRef.current.prevY = y;
        
        currentStrokeRef.current = { points: [{ x, y }], color, width: lineWidth, tool };
    };

    const stop = () => {
        if(isDrawing) {
            setIsDrawing(false); 
            socket.emit('commit-stroke', { roomId, stroke: currentStrokeRef.current }); 
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '800px', overflow: 'hidden' }}>
            <canvas 
                ref={canvasRef} 
                onMouseDown={start} 
                onMouseMove={handleMove} 
                onMouseUp={stop} 
                onMouseLeave={stop} 
                style={{ 
                    display: 'block', 
                    cursor: tool === 'pencil' ? 'crosshair' : 'default', 
                    touchAction: 'none',
                    // Pure CSS Background grid so destination-out safely exposes the grid!
                    background: '#ffffff',
                    backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(#e2e8f0 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} 
            />
            
            {/* Render Ghost Cursors Over the Canvas */}
            {Object.entries(cursors).map(([uName, pos]) => (
                <div key={uName} style={{ position: 'absolute', left: pos.x, top: pos.y, pointerEvents: 'none', transition: 'top 0.05s linear, left 0.05s linear', zIndex: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill={pos.color || 'red'} style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.5))' }}>
                        <path d="M0 0L16 6L9 9L6 16L0 0Z" stroke="white" strokeWidth="1.5"/>
                    </svg>
                    <span style={{ background: pos.color || 'red', color: 'white', fontSize: '0.75rem', padding: '3px 6px', borderRadius: 4, marginLeft: 12, fontWeight: 'bold', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
                        {uName}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Whiteboard;