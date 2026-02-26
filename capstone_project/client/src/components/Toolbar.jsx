import React from 'react';
import { Pencil, Eraser, Trash2, Download, Grid, FileText, Square } from 'lucide-react';

const Toolbar = ({ 
    tool, setTool, 
    color, setColor, 
    lineWidth, setLineWidth, 
    onClear, 
    onDownload, 
    bgType, setBgType 
}) => {
    return (
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
            {/* Drawing Tools */}
            <div>
                <label style={{color:'#94A3B8', fontSize:'0.7rem', letterSpacing:1, marginBottom:5, display:'block'}}>TOOLS</label>
                <button className={`icon-btn ${tool==='pencil'?'active':''}`} onClick={()=>setTool('pencil')} style={{width:'100%', marginBottom:5}}><Pencil size={18} style={{marginRight:8}}/> Draw</button>
                <button className={`icon-btn ${tool==='eraser'?'active':''}`} onClick={()=>setTool('eraser')} style={{width:'100%'}}><Eraser size={18} style={{marginRight:8}}/> Erase</button>
            </div>

            {/* Stroke Properties */}
            <div>
                <label style={{color:'#94A3B8', fontSize:'0.7rem', letterSpacing:1, marginBottom:5, display:'block'}}>STROKE</label>
                <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:10}}>
                    {['#000000','#EF4444','#10B981','#3B82F6','#F59E0B', '#FFFFFF'].map(c => (
                        <div key={c} onClick={()=>setColor(c)} style={{width:24, height:24, background:c, borderRadius:'50%', cursor:'pointer', border: color===c?'2px solid white':'1px solid #333'}}/>
                    ))}
                    <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:24, height:24, borderRadius:'50%', padding:0, border:'none', cursor:'pointer'}}/>
                </div>
                <input type="range" min="1" max="20" value={lineWidth} onChange={e=>setLineWidth(Number(e.target.value))} style={{width:'100%', accentColor:'#F59E0B'}}/>
            </div>

            {/* Background Controls (New Feature) */}
            <div>
                <label style={{color:'#94A3B8', fontSize:'0.7rem', letterSpacing:1, marginBottom:5, display:'block'}}>CANVAS BG</label>
                <div style={{display:'flex', gap:5}}>
                    <button onClick={()=>setBgType('grid')} className={`icon-btn ${bgType==='grid'?'active':''}`} style={{flex:1, justifyContent:'center'}} title="Grid"><Grid size={18}/></button>
                    <button onClick={()=>setBgType('lines')} className={`icon-btn ${bgType==='lines'?'active':''}`} style={{flex:1, justifyContent:'center'}} title="Lined"><FileText size={18}/></button>
                    <button onClick={()=>setBgType('plain')} className={`icon-btn ${bgType==='plain'?'active':''}`} style={{flex:1, justifyContent:'center'}} title="Plain"><Square size={18}/></button>
                </div>
            </div>

            {/* Actions: Export & Clear */}
            <div style={{marginTop:'auto', paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                <button onClick={onDownload} className="icon-btn" style={{width:'100%', marginBottom:8, justifyContent:'center', color:'#10B981', borderColor:'#10B981'}}>
                    <Download size={18} style={{marginRight:8}}/> Export
                </button>
                <button className="btn-danger" onClick={onClear} style={{width:'100%', display:'flex', justifyContent:'center'}}>
                    <Trash2 size={18} style={{marginRight:8}}/> Clear
                </button>
            </div>
        </div>
    );
};
export default Toolbar;