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
    clearVersion 
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null); // Ref for the wrapper div (for responsiveness)
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({}); // Stores other users' cursor positions

    // --- Helper Functions ---

    // Draws the professional dot grid background
    const drawGrid = (ctx, w, h) => {
        ctx.fillStyle = '#e2e8f0';
        for(let x=0; x<w; x+=20) {
            for(let y=0; y<h; y+=20) {
                ctx.fillRect(x,y,1,1);
            }
        }
    };

    // Main drawing function used by both local mouse events and socket events
    const drawOnCanvas = (x, y, px, py, sColor, sWidth, toolType) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = sColor;
        ctx.lineWidth = sWidth;
        // Eraser uses destination-out to remove pixels
        ctx.globalCompositeOperation = toolType === 'eraser' ? 'destination-out' : 'source-over';
        // Eraser is slightly larger for better UX
        if (toolType === 'eraser') ctx.lineWidth = sWidth * 2;
        
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
    };

    // --- Effects ---

    // 1. Initialization, Resizing, and Socket Listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d');

        // Logic to Resize Canvas while preserving drawings
        const resize = () => {
            if (container) {
                // 1. Save current drawing data
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // 2. Resize canvas to match the container (which shrinks/grows with sidebar)
                canvas.width = container.clientWidth;
                canvas.height = 800; // Fixed height per page (scrolling handled by parent)
                
                // 3. Redraw Grid and Restore Data
                drawGrid(ctx, canvas.width, canvas.height);
                ctx.putImageData(img, 0, 0);
                
                // 4. Reset Context properties
                ctx.lineCap = 'round';
            }
        };

        // Initial Resize
        resize();

        // Use ResizeObserver to detect when Sidebar toggles
        const resizeObserver = new ResizeObserver(() => {
            resize();
        });
        
        if (container) {
            resizeObserver.observe(container);
        }
        
        // --- Socket Event Handlers ---
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

    // 2. Update Context when Tool/Color changes
    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
    }, [color, lineWidth]);

    // 3. Handle External Clear Trigger
    useEffect(() => {
        if(clearVersion > 0) {
             const ctx = canvasRef.current.getContext('2d');
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
             drawGrid(ctx, canvasRef.current.width, canvasRef.current.height);
        }
    }, [clearVersion]);

    // --- Interaction Handlers ---

    const handleMove = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        
        // Emit mouse position to server (Ghost Cursor)
        socket.emit('mouse-move', { 
            roomId, 
            pageId, 
            username, 
            x: offsetX, 
            y: offsetY, 
            color 
        });

        // Handle Drawing
        if (isDrawing) {
            const { prevX, prevY } = canvasRef.current;
            
            // Draw Locally
            drawOnCanvas(offsetX, offsetY, prevX, prevY, color, lineWidth, tool);
            
            // Emit Drawing to Server
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
            
            // Update previous coordinates
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
                style={{ display: 'block', cursor: tool === 'pencil' ? 'crosshair' : 'default' }} 
            />
            
            {/* Render Remote Cursors (Ghost Cursors) */}
            {Object.entries(cursors).map(([uName, pos]) => (
                <div key={uName} style={{
                    position: 'absolute', 
                    left: pos.x, 
                    top: pos.y, 
                    pointerEvents: 'none', // Allow clicking through the cursor
                    transition: 'top 0.1s linear, left 0.1s linear', // Smooth movement
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