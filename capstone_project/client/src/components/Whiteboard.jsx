import React, { useRef, useEffect, useState } from 'react';
import '../App.css';

const Whiteboard = ({ 
    tool, 
    color, 
    lineWidth, 
    roomId, 
    pageId, 
    // username removed (unused)
    socket,
    clearVersion 
}) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // --- 1. HELPER FUNCTIONS (Moved Top to fix "Access before declaration") ---
    
    const drawGrid = (ctx, width, height) => {
        // Professional dot grid
        const gridSize = 20;
        ctx.fillStyle = '#e2e8f0'; // Subtle grey dots
        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    };

    const drawOnCanvas = (x, y, prevX, prevY, strokeColor, strokeWidth, currentTool) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        
        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = strokeWidth * 2; // Eraser slightly bigger
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, canvas.width, canvas.height); // Redraw grid after clear
    };

    // --- 2. EFFECT HOOKS ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Use ResizeObserver for responsive canvas
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                // Save current image
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight; 
                
                // Draw grid pattern 
                drawGrid(ctx, canvas.width, canvas.height);
                
                // Restore image
                ctx.putImageData(imageData, 0, 0);
                
                ctx.lineCap = 'round';
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Initial Grid Draw
        drawGrid(ctx, canvas.width, canvas.height);

        // Listen for remote drawing events
        const handleDraw = (data) => {
            if (data.roomId === roomId && data.pageId === pageId) {
                drawOnCanvas(data.x, data.y, data.prevX, data.prevY, data.color, data.width, data.tool);
            }
        };

        // Listen for clear events
        const handleClear = (data) => {
            if (data.roomId === roomId && data.pageId === pageId) {
                clearCanvas();
            }
        };

        socket.on('draw', handleDraw);
        socket.on('clear-board', handleClear);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            socket.off('draw', handleDraw);
            socket.off('clear-board', handleClear);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, pageId]); // Re-run if page/room changes

    // Update context properties when props change
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
    }, [color, lineWidth]);

    // Handle External Clear Trigger
    useEffect(() => {
        if (clearVersion > 0) {
            clearCanvas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearVersion]);

    // --- 3. EVENT HANDLERS ---
    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        setIsDrawing(true);
        canvasRef.current.prevX = offsetX;
        canvasRef.current.prevY = offsetY;
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        const { prevX, prevY } = canvasRef.current;

        // Draw locally
        drawOnCanvas(offsetX, offsetY, prevX, prevY, color, lineWidth, tool);

        // Emit to server
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
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ 
                display: 'block', 
                width: '100%', 
                height: '800px', 
                cursor: tool === 'pencil' ? 'crosshair' : 'cell',
                touchAction: 'none'
            }}
        />
    );
};

export default Whiteboard;