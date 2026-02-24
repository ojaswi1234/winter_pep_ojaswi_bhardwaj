import React from 'react';
import { Pencil, Eraser, Trash2, Palette } from 'lucide-react';

const Toolbar = ({ 
  tool, 
  setTool, 
  color, 
  setColor, 
  lineWidth, 
  setLineWidth, 
  onClear 
}) => {
  return (
    <div className="toolbar">
      <div className="tool-section">
        <label>Tools</label>
        <div className="button-group">
            <button 
            className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`} 
            onClick={() => setTool('pencil')}
            title="Pencil"
            >
            <Pencil size={20} />
            </button>
            <button 
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} 
            onClick={() => setTool('eraser')}
            title="Eraser"
            >
            <Eraser size={20} />
            </button>
        </div>
      </div>

      <div className="tool-section">
        <label>Color</label>
        <div className="color-picker-wrapper">
            <Palette size={20} className="color-icon" />
            <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            disabled={tool === 'eraser'}
            className="color-input"
            />
        </div>
      </div>

      <div className="tool-section">
        <label>Stroke Size</label>
        <div className="slider-container">
            <input 
            type="range" 
            min="1" 
            max="20" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(Number(e.target.value))} 
            className="slider"
            />
            <span className="size-label">{lineWidth}px</span>
        </div>
      </div>

      <div className="tool-section">
        <button className="clear-btn" onClick={onClear} title="Clear Board">
          <Trash2 size={20} />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;