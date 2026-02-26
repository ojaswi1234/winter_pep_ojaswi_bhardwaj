import React from 'react';
import { Pencil, Eraser, Trash2, Download, Monitor, Video, Upload, Sun, Moon } from 'lucide-react';

const Toolbar = ({ 
    tool, setTool, 
    color, setColor, 
    lineWidth, setLineWidth, 
    onClear, 
    onDownload,
    // New Props
    onScreenShare, isSharing,
    onRecord, isRecording,
    onFileUpload,
    isDarkMode, toggleTheme
}) => {
    return (
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
            {/* Theme Toggle (Top) */}
            <button onClick={toggleTheme} className="icon-btn" style={{justifyContent:'center', marginBottom:10}} title="Toggle Theme">
                {isDarkMode ? <Sun size={18} color="orange"/> : <Moon size={18}/>}
            </button>

            {/* Tools */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:5}}>TOOLS</label>
                <button className={`icon-btn ${tool==='pencil'?'active':''}`} onClick={()=>setTool && setTool('pencil')} style={{width:'100%', marginBottom:5}}>
                    <Pencil size={18} style={{marginRight:8}}/> Draw
                </button>
                <button className={`icon-btn ${tool==='eraser'?'active':''}`} onClick={()=>setTool && setTool('eraser')} style={{width:'100%'}}>
                    <Eraser size={18} style={{marginRight:8}}/> Erase
                </button>
            </div>

            {/* Stroke */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:10}}>STROKE</label>
                <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:10}}>
                    {['#000000','#EF4444','#10B981','#3B82F6','#F59E0B', '#FFFFFF'].map(c => (
                        <div key={c} onClick={()=>setColor && setColor(c)} style={{width:24, height:24, background:c, borderRadius:'50%', cursor:'pointer', border: color===c?'2px solid var(--text-main)':'1px solid rgba(0,0,0,0.2)'}}/>
                    ))}
                    <input type="color" value={color} onChange={e=>setColor && setColor(e.target.value)} style={{width:24, height:24, borderRadius:'50%', padding:0, border:'none', cursor:'pointer'}}/>
                </div>
                <input type="range" min="1" max="20" value={lineWidth} onChange={e=>setLineWidth && setLineWidth(Number(e.target.value))} style={{width:'100%', accentColor:'var(--primary-yellow)'}}/>
            </div>

            {/* Advanced Features */}
            <div>
                <label style={{color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:1, display:'block', marginBottom:5}}>ADVANCED</label>
                <button 
                    onClick={onScreenShare} 
                    className={`icon-btn ${isSharing ? 'active' : ''}`}
                    style={{width:'100%', marginBottom:5}}
                >
                    <Monitor size={18} style={{marginRight:8}}/> {isSharing ? 'Stop Share' : 'Screen Share'}
                </button>
                <button 
                    onClick={onRecord} 
                    className={`icon-btn ${isRecording ? 'active' : ''}`}
                    style={{width:'100%', marginBottom:5, borderColor: isRecording ? '#EF4444' : ''}}
                >
                    <Video size={18} style={{marginRight:8}} color={isRecording ? '#EF4444' : 'currentColor'}/> {isRecording ? 'Stop Rec' : 'Record'}
                </button>
                <div style={{position:'relative', width:'100%'}}>
                    <input type="file" id="fileUpload" style={{display:'none'}} onChange={onFileUpload} />
                    <button 
                        onClick={() => document.getElementById('fileUpload').click()} 
                        className="icon-btn" 
                        style={{width:'100%'}}
                    >
                        <Upload size={18} style={{marginRight:8}}/> Share File
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div style={{marginTop:'auto', paddingTop:20, borderTop:'1px solid var(--glass-border)'}}>
                <button 
                    onClick={() => onDownload && onDownload()} 
                    className="icon-btn" 
                    style={{width:'100%', marginBottom:8, justifyContent:'center', color:'var(--accent-green)', borderColor:'var(--accent-green)'}}
                >
                    <Download size={18} style={{marginRight:8}}/> Export
                </button>
                <button 
                    onClick={() => onClear && onClear()} 
                    className="btn-danger" 
                    style={{width:'100%', display:'flex', justifyContent:'center'}}
                >
                    <Trash2 size={18} style={{marginRight:8}}/> Clear
                </button>
            </div>
        </div>
    );
};
export default Toolbar;