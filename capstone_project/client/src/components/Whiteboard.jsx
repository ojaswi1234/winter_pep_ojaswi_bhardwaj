import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../utils/socket';

// Throttle function to limit emit frequency
const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
};

const Whiteboard = ({ tool, color, lineWidth, roomId, pageId = 0, username, clearVersion = 0 }) => {
    // Clear canvas when clearVersion changes (local clear fallback)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, [clearVersion]);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [remoteCursors, setRemoteCursors] = useState({});
  const throttledCursorEmit = useRef(null);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const drawOnCanvas = useCallback((data, isLocal = true) => {
    const { x0, y0, x1, y1, color, width, tool } = data;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    
    // Set style properties based on tool
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = width; // Eraser often larger
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
    }
    
    ctx.stroke();
    ctx.closePath(); // Important for performance usually

    if (isLocal) {
        // Emit only if it's a local drawing action
        socket.emit('draw', {
            roomId,
            pageId,
            x0, y0, x1, y1,
            color,
            width,
            tool
        });
    }
  }, [roomId, pageId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    // Handle window resize
    const handleResize = () => {
      // Create a temp canvas to save current drawing
      const tempCanvas = document.createElement('canvas');
      // eslint-disable-next-line react-hooks/immutability
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);

      // Resize to parent container size
      const parent = canvas.parentElement;
      if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        // Fallback dimensions
        canvas.width = 800;
        canvas.height = 600;
      }

      // Restore drawing
      ctx.drawImage(tempCanvas, 0, 0);
      
      // Reset context properties after resize
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);

    // Socket event listeners for remote drawing
    const handleRemoteDraw = (data) => {
      if (data.pageId === pageId) {
        drawOnCanvas(data, false);
      }
    };
    
    const handleClear = (data) => {
      if (data.pageId === pageId) {
        const cvs = canvasRef.current;
        if (cvs) {
          const context = cvs.getContext('2d');
          context.clearRect(0, 0, cvs.width, cvs.height);
        }
      }
    };

    // Socket event listeners for cursor tracking
    const handleCursorMove = (data) => {
      if (data.pageId === pageId) {
        setRemoteCursors(prev => ({
          ...prev,
          [data.userId]: {
            x: data.x,
            y: data.y,
            username: data.username,
            color: data.color,
            lastUpdate: Date.now()
          }
        }));
      }
    };

    const handleCursorLeave = (data) => {
      if (data.pageId === pageId) {
        setRemoteCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[data.userId];
          return newCursors;
        });
      }
    };

    const handleUserLeft = (userId) => {
      setRemoteCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[userId];
        return newCursors;
      });
    };

    // Register socket listeners
    socket.on('draw', handleRemoteDraw);
    socket.on('clear', handleClear);
    socket.on('cursor-move', handleCursorMove);
    socket.on('cursor-leave', handleCursorLeave);
    socket.on('user-left', handleUserLeft);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('draw', handleRemoteDraw);
      socket.off('clear', handleClear);
      socket.off('cursor-move', handleCursorMove);
      socket.off('cursor-leave', handleCursorLeave);
      socket.off('user-left', handleUserLeft);
    };
  }, [pageId, drawOnCanvas]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
  };

  // Create throttled cursor emit function
  useEffect(() => {
    throttledCursorEmit.current = throttle((data) => {
      if (socket.connected) {
        socket.emit('cursor-move', data);
      }
    }, 50); // Emit at most every 50ms (20 times per second)
  }, []);

  const handleMouseMove = (e) => {
    const currentPos = getPos(e);
    
    // Emit cursor position for ghost cursor (throttled)
    if (throttledCursorEmit.current && roomId && username) {
      throttledCursorEmit.current({
        roomId,
        pageId,
        x: currentPos.x,
        y: currentPos.y,
        username,
        color
      });
    }

    // Draw if currently drawing
    if (isDrawing) {
      drawOnCanvas({
        x0: lastPos.current.x,
        y0: lastPos.current.y,
        x1: currentPos.x,
        y1: currentPos.y,
        color,
        width: lineWidth,
        tool
      }, true);

      lastPos.current = currentPos;
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    // Remove cursor from remote view when leaving canvas
    if (socket.connected && roomId) {
      socket.emit('cursor-leave', { roomId, pageId });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={handleMouseLeave}
        className="whiteboard-canvas"
        style={{ cursor: tool === 'pencil' ? 'crosshair' : 'cell' }}
      />
      {/* Render remote cursors */}
      {Object.entries(remoteCursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="ghost-cursor"
          style={{
            position: 'absolute',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={cursor.color || '#000'}>
            <path d="M5 3l14 9-6 1-2 6-6-16z" />
          </svg>
          <div
            className="cursor-label"
            style={{
              backgroundColor: cursor.color || '#000',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Whiteboard;