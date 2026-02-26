import React from 'react';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

const Toolbar = ({ tool, setTool, color, setColor, lineWidth, setLineWidth, onClear }) => {
    return (
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
            <div>
                <button className={`icon-btn ${tool==='pencil'?'active':''}`} onClick={()=>setTool('pencil')} style={{width:'100%', marginBottom:5}}><Pencil size={18} style={{marginRight:8}}/> Draw</button>
                <button className={`icon-btn ${tool==='eraser'?'active':''}`} onClick={()=>setTool('eraser')} style={{width:'100%'}}><Eraser size={18} style={{marginRight:8}}/> Erase</button>
            </div>
            <div>
                <label style={{color:'#94A3B8', fontSize:'0.8rem'}}>COLOR</label>
                <div style={{display:'flex', gap:5, flexWrap:'wrap', marginTop:5}}>
                    {['#000000','#EF4444','#10B981','#3B82F6','#F59E0B'].map(c => (
                        <div key={c} onClick={()=>setColor(c)} style={{width:24, height:24, background:c, borderRadius:'50%', cursor:'pointer', border: color===c?'2px solid white':'none'}}/>
                    ))}
                    <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:24, height:24, borderRadius:'50%', padding:0, border:'none'}}/>
                </div>
            </div>
            <div>
                <label style={{color:'#94A3B8', fontSize:'0.8rem'}}>SIZE ({lineWidth}px)</label>
                <input type="range" min="1" max="20" value={lineWidth} onChange={e=>setLineWidth(Number(e.target.value))} style={{width:'100%', marginTop:5}}/>
            </div>
            <button className="btn-danger" onClick={onClear} style={{width:'100%', display:'flex', justifyContent:'center'}}><Trash2 size={18} style={{marginRight:8}}/> Clear</button>
        </div>
    );
};
export default Toolbar;