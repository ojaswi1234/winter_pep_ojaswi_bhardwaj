import React from 'react';
import { Pencil, Eraser, Trash2, Download, Monitor, Video, Upload, Sun, Moon, Undo, Redo } from 'lucide-react';

const Toolbar = ({ 
    tool, setTool, 
    color, setColor, 
    lineWidth, setLineWidth, 
    onClear, onDownload,
    onScreenShare, isSharing,
    onRecord, isRecording,
    onFileUpload,
    isDarkMode, toggleTheme,
    onUndo, onRedo
}) => {
    return (
        <div style={{display:'flex', flexDirection:'column', gap:24}}>
            {/* Theme Toggle */}
            <div>
                <button onClick={toggleTheme} className="icon-btn" style={{width: '100%', justifyContent:'center'}} title="Toggle Theme">
                    {isDarkMode ? <Sun size={18} color="var(--primary-yellow)"/> : <Moon size={18}/>}
                </button>
            </div>

            {/* Drawing Tools */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:8, fontWeight: 'bold'}}>TOOLS</label>
                <div style={{display: 'flex', gap: 10}}>
                    <button className={`icon-btn ${tool==='pencil'?'active':''}`} onClick={()=>setTool && setTool('pencil')} style={{flex: 1, justifyContent: 'center', padding: '12px'}}>
                        <Pencil size={20}/>
                    </button>
                    <button className={`icon-btn ${tool==='eraser'?'active':''}`} onClick={()=>setTool && setTool('eraser')} style={{flex: 1, justifyContent: 'center', padding: '12px'}}>
                        <Eraser size={20}/>
                    </button>
                </div>
            </div>

            {/* History Actions */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:8, fontWeight: 'bold'}}>HISTORY</label>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <button onClick={onUndo} className="icon-btn" style={{justifyContent:'center', padding: '10px'}} title="Undo"><Undo size={18}/></button>
                    <button onClick={onRedo} className="icon-btn" style={{justifyContent:'center', padding: '10px'}} title="Redo"><Redo size={18}/></button>
                </div>
            </div>

            {/* Stroke Properties */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:10, fontWeight: 'bold'}}>STROKE</label>
                <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:15}}>
                    {['#000000','#EF4444','#10B981','#3B82F6','#F59E0B', '#FFFFFF'].map(c => (
                        <div key={c} onClick={()=>setColor && setColor(c)} style={{width:28, height:28, background:c, borderRadius:'50%', cursor:'pointer', border: color===c?'2px solid var(--text-main)':'1px solid rgba(0,0,0,0.2)', transition: 'transform 0.1s', transform: color === c ? 'scale(1.1)' : 'scale(1)'}}/>
                    ))}
                    <input type="color" value={color} onChange={e=>setColor && setColor(e.target.value)} style={{width:28, height:28, borderRadius:'50%', padding:0, border:'none', cursor:'pointer'}}/>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Size:</span>
                    <input type="range" min="1" max="20" value={lineWidth} onChange={e=>setLineWidth && setLineWidth(Number(e.target.value))} style={{flex: 1, accentColor:'var(--primary-yellow)'}}/>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-main)', width: 20}}>{lineWidth}px</span>
                </div>
            </div>

            {/* Advanced Features */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:8, fontWeight: 'bold'}}>ADVANCED</label>
                <button onClick={onScreenShare} className={`icon-btn ${isSharing ? 'active' : ''}`} style={{width:'100%', marginBottom:8}}>
                    <Monitor size={18} style={{marginRight:10}}/> {isSharing ? 'Stop Share' : 'Screen Share'}
                </button>
                <button onClick={onRecord} className={`icon-btn`} style={{width:'100%', marginBottom:8, background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-panel)', borderColor: isRecording ? '#EF4444' : 'var(--glass-border)', color: isRecording ? '#EF4444' : 'var(--text-muted)'}}>
                    <Video size={18} style={{marginRight:10}}/> {isRecording ? 'Stop Recording' : 'Record Session'}
                </button>
                <div style={{position:'relative', width:'100%'}}>
                    <input type="file" id="fileUpload" style={{display:'none'}} onChange={onFileUpload} />
                    <button onClick={() => document.getElementById('fileUpload').click()} className="icon-btn" style={{width:'100%'}}>
                        <Upload size={18} style={{marginRight:10}}/> Share File
                    </button>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{marginTop:'auto', paddingTop:24, borderTop:'1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 10}}>
                <button onClick={() => onDownload && onDownload()} className="icon-btn" style={{width:'100%', justifyContent:'center', color:'var(--accent-green)', borderColor:'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)'}}>
                    <Download size={18} style={{marginRight:8}}/> Export Image
                </button>
                <button onClick={() => onClear && onClear()} className="btn-danger" style={{width:'100%', display:'flex', justifyContent:'center', padding: '12px'}}>
                    <Trash2 size={18} style={{marginRight:8}}/> Clear Board
                </button>
            </div>
        </div>
    );
};
export default Toolbar;