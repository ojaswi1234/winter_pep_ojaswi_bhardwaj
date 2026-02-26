import React, { useRef, useEffect, useState } from 'react';
import '../App.css';

const Whiteboard = ({ 
    tool, 
    color, 
    lineWidth, 
    roomId, 
    pageId, 
    username, 
    socket, 
    clearVersion, 
    downloadTrigger 
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({}); // KEEPS GHOST CURSORS

    // --- Helper Functions ---

    // Fixed to always draw the Pro Grid (removed dynamic type)
    const drawGrid = (ctx, w, h) => {
        ctx.save();
        // 1. Fill base with white
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // 2. Draw Grid Pattern
        ctx.fillStyle = '#e2e8f0';
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
        
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
    };

    // --- Effects ---

    // 1. Handle Download Trigger
    useEffect(() => {
        if (downloadTrigger > 0 && canvasRef.current) {
            const link = document.createElement('a');
            link.download = `Whiteboard_Room_${roomId}_Page_${pageId}.png`;
            link.href = canvasRef.current.toDataURL('image/png');
            link.click();
        }
    }, [downloadTrigger, roomId, pageId]);

    // 2. Main Logic: Initialization, Resizing, and Listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        // Performance fix included
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const resize = () => {
            if (container) {
                // Save current drawing
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Resize
                canvas.width = container.clientWidth;
                canvas.height = 800; 
                
                // Redraw Grid
                drawGrid(ctx, canvas.width, canvas.height);
                
                // Restore Drawing
                ctx.putImageData(img, 0, 0);
                
                // Reset Context
                ctx.lineCap = 'round';
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
            }
        };

        resize();

        // Responsive Sidebar Observer
        const resizeObserver = new ResizeObserver(() => {
            resize();
        });
        
        if (container) {
            resizeObserver.observe(container);
        }
        
        // Socket Handlers
        const handleDraw = (d) => { 
            if(d.roomId === roomId && d.pageId === pageId) {
                drawOnCanvas(d.x, d.y, d.prevX, d.prevY, d.color, d.width, d.tool);
            }
        };
        
        const handleClear = (d) => { 
            if(d.roomId === roomId && d.pageId === pageId) { 
                ctx.clearRect(0, 0, canvas.width, canvas.height); 
                drawGrid(ctx, canvas.width, canvas.height); 
            } 
        };
        
        // GHOST CURSOR HANDLER
        const handleMouseMove = (d) => {
            if(d.roomId === roomId && d.pageId === pageId) {
                setCursors(prev => ({ 
                    ...prev, 
                    [d.username]: { x: d.x, y: d.y, color: d.color } 
                }));
            }
        };

        // Attach Listeners
        socket.on('draw', handleDraw);
        socket.on('clear-board', handleClear);
        socket.on('mouse-move', handleMouseMove);

        // Cleanup
        return () => {
            if (container) resizeObserver.unobserve(container);
            socket.off('draw', handleDraw);
            socket.off('clear-board', handleClear);
            socket.off('mouse-move', handleMouseMove);
        };
    }, [roomId, pageId]); 

    // 3. Properties Update
    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
    }, [color, lineWidth]);

    // 4. Handle Clear Trigger
    useEffect(() => {
        if(clearVersion > 0) {
             const ctx = canvasRef.current.getContext('2d');
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
             drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
        }
    }, [clearVersion]);

    // --- Interaction ---

    const handleMove = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        
        // EMIT MOUSE MOVE (For Ghost Cursors)
        socket.emit('mouse-move', { 
            roomId, 
            pageId, 
            username, 
            x: offsetX, 
            y: offsetY, 
            color 
        });

        if (isDrawing) {
            const { prevX, prevY } = canvasRef.current;
            drawOnCanvas(offsetX, offsetY, prevX, prevY, color, lineWidth, tool);
            socket.emit('draw', { 
                roomId, 
                pageId, 
                x: offsetX, 
                y: offsetY, 
                prevX, 
                prevY, 
                color, 
                width: lineWidth, 
                tool 
            });
            canvasRef.current.prevX = offsetX;
            canvasRef.current.prevY = offsetY;
        }
    };

    const start = (e) => { 
        setIsDrawing(true); 
        canvasRef.current.prevX = e.nativeEvent.offsetX; 
        canvasRef.current.prevY = e.nativeEvent.offsetY; 
    };
    
    const stop = () => {
        setIsDrawing(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', height: '800px', width: '100%' }}>
            {/* The Canvas */}
            <canvas 
                ref={canvasRef} 
                onMouseDown={start} 
                onMouseMove={handleMove} 
                onMouseUp={stop} 
                onMouseLeave={stop} 
                style={{ display: 'block', cursor: tool === 'pencil' ? 'crosshair' : 'default', touchAction: 'none' }} 
            />
            
            {/* GHOST CURSORS OVERLAY */}
            {Object.entries(cursors).map(([uName, pos]) => (
                <div key={uName} style={{
                    position: 'absolute', 
                    left: pos.x, 
                    top: pos.y, 
                    pointerEvents: 'none', 
                    transition: 'top 0.1s linear, left 0.1s linear', 
                    zIndex: 10
                }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill={pos.color || 'red'} style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}>
                        <path d="M0 0L16 6L9 9L6 16L0 0Z" stroke="white" strokeWidth="1"/>
                    </svg>
                    <span style={{
                        background: pos.color || 'red', 
                        color: 'white', 
                        fontSize: '0.7rem', 
                        padding: '2px 4px', 
                        borderRadius: 3, 
                        marginLeft: 10, 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                    }}>
                        {uName}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Whiteboard;