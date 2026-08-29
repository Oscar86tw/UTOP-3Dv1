export class NeedleBall3D {
  constructor(canvas,{onNodeClick,onEdgeClick}={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.nodes=[];this.edges=[];this.projected=new Map();
    this.camera={yaw:-0.45,pitch:0.35,zoom:1,panX:0,panY:0};this.drag=null;this.focusEdge=null;this.focusNode=null;
    this.lineWidth=3;this.showLabels=true;this.showPorts=true;this.onNodeClick=onNodeClick;this.onEdgeClick=onEdgeClick;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.bind();this.resize();
  }
  setGraph(nodes,edges){this.nodes=nodes.map(n=>({...n,x:n.x||0,y:n.y||0,z:n.z||0,r:n.r||34,ports:n.ports||[]}));this.edges=edges.map(e=>({...e}));this.render();}
  setFocusEdge(id){this.focusEdge=id;this.focusNode=null;this.render()}
  setFocusNode(id){this.focusNode=id;this.focusEdge=null;this.render()}
  clearFocus(){this.focusEdge=null;this.focusNode=null;this.render()}
  resetCamera(){this.camera={yaw:-0.45,pitch:0.35,zoom:1,panX:0,panY:0};this.render()}
  resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.max(1,r.width*dpr);this.canvas.height=Math.max(1,r.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.w=r.width;this.h=r.height;this.render()}
  bind(){
    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.camera.zoom=Math.max(.35,Math.min(3.2,this.camera.zoom*(e.deltaY>0?.9:1.1)));this.render()},{passive:false});
    this.canvas.addEventListener('pointerdown',e=>{this.canvas.setPointerCapture(e.pointerId);const hit=this.hitNode(e.offsetX,e.offsetY);this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,button:e.button,node:hit?.node||null,moved:false};});
    this.canvas.addEventListener('pointermove',e=>{if(!this.drag||this.drag.id!==e.pointerId)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.x=e.clientX;this.drag.y=e.clientY;if(Math.abs(dx)+Math.abs(dy)>2)this.drag.moved=true;
      if(this.drag.node){const s=1.7/this.camera.zoom;this.drag.node.x+=dx*s;this.drag.node.z+=dy*s;}
      else if(this.drag.button===2||e.shiftKey){this.camera.panX+=dx;this.camera.panY+=dy;}
      else{this.camera.yaw+=dx*.008;this.camera.pitch=Math.max(-1.15,Math.min(1.15,this.camera.pitch+dy*.006));}
      this.render();
    });
    this.canvas.addEventListener('pointerup',e=>{if(!this.drag)return;const d=this.drag;this.drag=null;if(!d.moved){const hit=this.hitNode(e.offsetX,e.offsetY);if(hit){this.focusNode=hit.node.id;this.focusEdge=null;this.onNodeClick?.(hit.node);}else{const edge=this.hitEdge(e.offsetX,e.offsetY);if(edge){this.focusEdge=edge.id;this.focusNode=null;this.onEdgeClick?.(edge);}else this.clearFocus();}this.render();}});
    let touches=new Map(),lastDist=0,lastMid=null;
    this.canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const a=[...touches.values()];lastDist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);lastMid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};}}});
    this.canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const a=[...touches.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(lastDist)this.camera.zoom=Math.max(.35,Math.min(3.2,this.camera.zoom*dist/lastDist));if(lastMid){this.camera.panX+=mid.x-lastMid.x;this.camera.panY+=mid.y-lastMid.y}lastDist=dist;lastMid=mid;this.render();}});
    const clear=e=>{touches.delete(e.pointerId);if(touches.size<2){lastDist=0;lastMid=null}};this.canvas.addEventListener('pointerup',clear);this.canvas.addEventListener('pointercancel',clear);
  }
  project(p){const {yaw,pitch,zoom,panX,panY}=this.camera,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);let x=p.x*cy-p.z*sy,z=p.x*sy+p.z*cy,y=p.y;const y2=y*cp-z*sp,z2=y*sp+z*cp;const depth=850+z2,scale=zoom*700/Math.max(220,depth);return{x:this.w/2+panX+x*scale,y:this.h/2+panY-y2*scale,scale,depth:z2}}
  hitNode(x,y){let best=null;for(const n of this.nodes){const p=this.projected.get(n.id);if(!p)continue;const d=Math.hypot(x-p.x,y-p.y);if(d<p.r*p.scale+12&&(!best||p.depth>best.p.depth))best={node:n,p};}return best}
  hitEdge(x,y){let best=null;for(const e of this.edges){const a=this.projected.get(e.source),b=this.projected.get(e.target);if(!a||!b)continue;const d=segDist(x,y,a.x,a.y,b.x,b.y);if(d<10)best=e;}return best}
  render(){if(!this.ctx||!this.w)return;const c=this.ctx;c.clearRect(0,0,this.w,this.h);this.grid();this.projected.clear();for(const n of this.nodes)this.projected.set(n.id,this.project(n));const sorted=[...this.nodes].sort((a,b)=>this.projected.get(a.id).depth-this.projected.get(b.id).depth);
    for(const e of this.edges)this.drawEdge(e);
    for(const n of sorted)this.drawNode(n);
  }
  grid(){const c=this.ctx;c.save();c.strokeStyle='rgba(43,121,171,.18)';c.lineWidth=1;const gap=48;for(let x=-this.h;x<this.w+this.h;x+=gap){c.beginPath();c.moveTo(x,0);c.lineTo(x-this.h*.55,this.h);c.stroke()}for(let y=0;y<this.h;y+=gap){c.beginPath();c.moveTo(0,y);c.lineTo(this.w,y);c.stroke()}c.restore()}
  drawEdge(e){const a=this.projected.get(e.source),b=this.projected.get(e.target);if(!a||!b)return;const focused=this.focusEdge===e.id||(!this.focusEdge&&this.focusNode&&(e.source===this.focusNode||e.target===this.focusNode));const dim=(this.focusEdge||this.focusNode)&&!focused;const c=this.ctx;c.save();c.globalAlpha=dim?.08:1;c.lineWidth=(focused?8:this.lineWidth)*Math.min(1.5,(a.scale+b.scale)/2);c.strokeStyle=focused?'#73f4ff':(e.color||'#2ca8ff');c.shadowColor=c.strokeStyle;c.shadowBlur=focused?20:7;const mx=(a.x+b.x)/2,my=Math.min(a.y,b.y)-Math.min(110,Math.abs(a.x-b.x)*.18)-20*(e.level||0);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(mx,my,b.x,b.y);c.stroke();if(focused){for(let t=.18;t<.95;t+=.18){const q=quad(a,{x:mx,y:my},b,t);const q2=quad(a,{x:mx,y:my},b,Math.min(.99,t+.02));const ang=Math.atan2(q2.y-q.y,q2.x-q.x);c.fillStyle='#d9ffff';c.beginPath();c.moveTo(q.x+Math.cos(ang)*9,q.y+Math.sin(ang)*9);c.lineTo(q.x+Math.cos(ang+2.5)*7,q.y+Math.sin(ang+2.5)*7);c.lineTo(q.x+Math.cos(ang-2.5)*7,q.y+Math.sin(ang-2.5)*7);c.closePath();c.fill();}}
    c.restore();
  }
  drawNode(n){const p=this.projected.get(n.id);if(!p)return;const focused=!this.focusNode||this.focusNode===n.id||this.edges.some(e=>this.focusNode&&(e.source===this.focusNode||e.target===this.focusNode)&&(e.source===n.id||e.target===n.id));const c=this.ctx,r=Math.max(12,n.r*p.scale);c.save();c.globalAlpha=focused?1:.12;
    if(this.showPorts){const count=Math.min(14,n.ports.length);for(let i=0;i<count;i++){const a=i/count*Math.PI*2,rr=r+12;const x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;c.strokeStyle='#8beaff';c.lineWidth=2;c.beginPath();c.moveTo(p.x+Math.cos(a)*r*.75,p.y+Math.sin(a)*r*.75);c.lineTo(x,y);c.stroke();c.fillStyle='#dfffff';c.beginPath();c.arc(x,y,Math.max(2,4*p.scale),0,Math.PI*2);c.fill();}}
    const g=c.createRadialGradient(p.x-r*.35,p.y-r*.4,r*.08,p.x,p.y,r);g.addColorStop(0,'#b8f7ff');g.addColorStop(.25,n.color||'#2aaaff');g.addColorStop(1,'#071c35');c.fillStyle=g;c.strokeStyle=this.focusNode===n.id?'#fff59b':'#64e8ff';c.lineWidth=this.focusNode===n.id?5:2;c.shadowColor=n.color||'#29b6ff';c.shadowBlur=20;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;
    if(this.showLabels){c.font=`${Math.max(11,Math.min(19,13*p.scale+7))}px Microsoft JhengHei`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.strokeStyle='rgba(0,0,0,.8)';c.lineWidth=4;c.strokeText(n.name,p.x,p.y);c.fillText(n.name,p.x,p.y);}
    c.restore();
  }
}
function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;if(!l)return Math.hypot(px-x1,py-y1);let t=((px-x1)*dx+(py-y1)*dy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(x1+t*dx),py-(y1+t*dy))}
function quad(a,m,b,t){const u=1-t;return{x:u*u*a.x+2*u*t*m.x+t*t*b.x,y:u*u*a.y+2*u*t*m.y+t*t*b.y}}
