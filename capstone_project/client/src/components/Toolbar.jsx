import React from 'react';
import { Pencil, Eraser, Trash2, MousePointer2, Minus } from 'lucide-react';

// Helper for tool buttons
const ToolButton = ({ name, icon: Icon, tool, setTool }) => (
  <button 
    className={`icon-btn ${tool === name ? 'active' : ''}`}
    onClick={() => setTool(name)}
    title={name.charAt(0).toUpperCase() + name.slice(1)}
    style={{ width: '100%', justifyContent: 'flex-start', gap: '12px' }}
  >
    <Icon size={20} />
    <span style={{ fontSize: '0.9rem' }}>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
  </button>
);

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
    <div className="toolbar-content">
      {/* Drawing Tools */}
      <div className="tool-group">
        <label>Drawing Tools</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ToolButton name="pencil" icon={Pencil} tool={tool} setTool={setTool} />
            <ToolButton name="eraser" icon={Eraser} tool={tool} setTool={setTool} />
        </div>
      </div>

      {/* Properties Section */}
      <div className="tool-group">
        <label>Properties</label>
        
        {/* Color Picker */}
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Stroke Color</span>
                <span style={{ color: color, fontWeight: 'bold' }}>{color}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#000000', '#EF4444', '#10B981', '#3B82F6', '#F59E0B'].map((c) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: c,
                            border: color === c ? '2px solid white' : '2px solid transparent',
                            cursor: 'pointer',
                            boxShadow: color === c ? '0 0 0 2px var(--primary-yellow)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    />
                ))}
                <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    style={{ 
                        width: '24px', 
                        height: '24px', 
                        padding: 0, 
                        border: 'none', 
                        borderRadius: '50%', 
                        overflow: 'hidden', 
                        cursor: 'pointer' 
                    }} 
                />
            </div>
        </div>

        {/* Thickness Slider */}
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Thickness</span>
                <span>{lineWidth}px</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="20" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(Number(e.target.value))} 
                style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--bg-panel)',
                    borderRadius: '2px',
                    appearance: 'none',
                    outline: 'none',
                    cursor: 'pointer'
                }}
            />
        </div>
      </div>

      {/* Actions */}
      <div className="tool-group" style={{ marginTop: 'auto' }}>
        <button 
            className="btn-danger" 
            onClick={onClear} 
            title="Clear Board"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Trash2 size={18} />
          <span>Clear Canvas</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;