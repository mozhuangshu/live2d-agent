import {clamp} from './core.mjs';
// Original procedural mascot. No portrait, tracking data, model weights or third-party artwork.
export class AvatarRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.pose={expression:'neutral',intensity:.8,mouth:0};this.smooth={mouth:0};this.start=performance.now();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);}
 setPose(pose){Object.assign(this.pose,pose);}
 destroy(){cancelAnimationFrame(this.frame);}
 tick(t){this.draw(t);this.frame=requestAnimationFrame(this.tick);}
 draw(t){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;c.clearRect(0,0,w,h);c.save();c.translate(w/2,h*.46+Math.sin(t*.0017)*3);const scale=Math.min(w/640,h/650);c.scale(scale,scale);const e=this.pose.expression,a=this.pose.intensity,m=this.smooth.mouth+=(clamp(this.pose.mouth)-this.smooth.mouth)*.3;const smile=(e==='smile'?.7:e==='laugh'?1:0)*a,laugh=e==='laugh'?a:0,angry=e==='angry'?a:0,frown=e==='frown'?a:0,serious=e==='serious'?a:0;const blink=((t-this.start)%4600)>4430?Math.sin((((t-this.start)%4600)-4430)/170*Math.PI):0;
 const shape=(fill,stroke,fn,width=3)=>{c.beginPath();fn();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}};
 const ellipse=(x,y,rx,ry,fill,stroke)=>shape(fill,stroke,()=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2));
 // Hair silhouette and jacket
 shape('#4b3973','#262445',()=>{c.moveTo(-120,-104);c.bezierCurveTo(-145,-252,142,-256,132,-105);c.lineTo(154,79);c.quadraticCurveTo(99,121,52,82);c.lineTo(-64,87);c.quadraticCurveTo(-138,112,-154,63);c.closePath();});
 shape('#e2e8fa','#292a47',()=>{c.moveTo(-67,121);c.quadraticCurveTo(-146,129,-172,204);c.lineTo(-190,338);c.lineTo(190,338);c.lineTo(172,204);c.quadraticCurveTo(146,129,67,121);c.closePath();});
 shape('#5668be','#292a47',()=>{c.moveTo(-67,121);c.lineTo(-88,231);c.lineTo(-53,338);c.lineTo(53,338);c.lineTo(88,231);c.lineTo(67,121);c.closePath();});
 shape('#f2c8b9','#292a47',()=>{c.moveTo(-37,64);c.lineTo(-35,135);c.quadraticCurveTo(0,166,35,135);c.lineTo(37,64);c.closePath();});
 shape('#f8fafc','#292a47',()=>{c.moveTo(-62,118);c.lineTo(-15,155);c.lineTo(-51,190);c.lineTo(-84,137);c.closePath();});
 shape('#f8fafc','#292a47',()=>{c.moveTo(62,118);c.lineTo(15,155);c.lineTo(51,190);c.lineTo(84,137);c.closePath();});
 shape('#79d8d0','#292a47',()=>{c.moveTo(0,151);c.lineTo(22,171);c.lineTo(11,214);c.lineTo(-11,214);c.lineTo(-22,171);c.closePath();});
 shape(null,'#acb6d5',()=>{c.moveTo(-133,208);c.lineTo(-120,329);c.moveTo(133,208);c.lineTo(120,329);},3);
 ellipse(103,202,17,17,'#79d8d0','#292a47');shape(null,'#fff',()=>{c.moveTo(95,202);c.lineTo(101,208);c.lineTo(112,196);},3);
 ellipse(-112,-28,18,30,'#f2c8b9','#292a47');ellipse(112,-28,18,30,'#f2c8b9','#292a47');
 shape('#ffddca','#292a47',()=>{c.moveTo(-112,-113);c.bezierCurveTo(-110,-184,110,-184,112,-113);c.lineTo(108,-20);c.bezierCurveTo(102,55,47,98,0,102);c.bezierCurveTo(-47,98,-102,55,-108,-20);c.closePath();});
 // Warm cheek lift reinforces smile without face tracking.
 c.globalAlpha=.25+smile*.34;ellipse(-74,29-smile*8,24,11,'#f49ca4');ellipse(74,29-smile*8,24,11,'#f49ca4');c.globalAlpha=1;
 for(const side of [-1,1]){c.save();c.translate(side*49,-24);const eyeClose=Math.max(blink,Math.min(1,laugh*1.2));const eyeOpen=1-eyeClose;
 if(eyeOpen>.15){ellipse(0,0,24,28*eyeOpen,'#fff9f6','#292a47');c.save();c.beginPath();c.ellipse(0,0,23,27*eyeOpen,0,0,Math.PI*2);c.clip();ellipse(0,3,12,21,'#7567b6');ellipse(0,5,6,13,'#292a47');ellipse(-4,-5,4,5,'#fff');c.restore();}
 else shape(null,'#292a47',()=>{c.moveTo(-23,2);c.quadraticCurveTo(0,eyeClose>0.8&&laugh>.3?-17:9,23,2);},5);
 if(eyeOpen>.15)shape(null,'#292a47',()=>{c.moveTo(-23,-22*eyeOpen);c.quadraticCurveTo(0,-33*eyeOpen,23,-21*eyeOpen);},4);
 c.translate(0,-48);const slope=(angry*.9+frown*.65+serious*.23)*side;shape(null,'#4b3973',()=>{c.moveTo(-24,-8*slope);c.quadraticCurveTo(0,-6+smile*3,24,8*slope);},6);c.restore();}
 shape(null,'#d79889',()=>{c.moveTo(-3,18);c.quadraticCurveTo(-9,29,2,30);},2);
 // Expression determines smile curvature and width; speech independently controls aperture.
 const mw=21+smile*17+ m*7, mouthY=58, cornerY=mouthY-smile*10+frown*5, aperture=m*(25+smile*18);
 if(m<.045){shape(null,'#633b50',()=>{c.moveTo(-mw,cornerY);c.quadraticCurveTo(0,mouthY+smile*8-frown*7,mw,cornerY);},3.5);}else{
 shape('#71384e','#633b50',()=>{c.moveTo(-mw,cornerY);c.quadraticCurveTo(0,mouthY+smile*4,mw,cornerY);c.quadraticCurveTo(mw*.65,mouthY+aperture,0,mouthY+aperture);c.quadraticCurveTo(-mw*.65,mouthY+aperture,-mw,cornerY);},3);
 c.save();c.beginPath();c.moveTo(-mw,cornerY);c.quadraticCurveTo(0,mouthY+smile*4,mw,cornerY);c.quadraticCurveTo(mw*.65,mouthY+aperture,0,mouthY+aperture);c.quadraticCurveTo(-mw*.65,mouthY+aperture,-mw,cornerY);c.clip();shape('#fff6ee',null,()=>{c.moveTo(-mw-1,cornerY-4);c.lineTo(mw+1,cornerY-4);c.lineTo(mw,cornerY+8);c.quadraticCurveTo(0,mouthY+11,-mw,cornerY+8);c.closePath();});ellipse(0,mouthY+aperture+3,mw*.7,aperture*.4,'#e8879a');c.restore();}
 // Layered fringe, headset and original star hair pin.
 shape('#66508d','#292a47',()=>{c.moveTo(-119,-106);c.quadraticCurveTo(-125,-212,-16,-210);c.quadraticCurveTo(110,-229,123,-117);c.lineTo(108,-55);c.quadraticCurveTo(81,-86,65,-147);c.quadraticCurveTo(56,-103,29,-81);c.lineTo(24,-131);c.quadraticCurveTo(6,-101,-26,-80);c.lineTo(-16,-135);c.quadraticCurveTo(-47,-91,-84,-71);c.lineTo(-83,-111);c.quadraticCurveTo(-103,-95,-119,-68);c.closePath();});
 shape('#8e79ad',null,()=>{c.moveTo(-95,-145);c.quadraticCurveTo(-62,-194,-4,-190);c.quadraticCurveTo(-54,-171,-95,-145);});
 c.save();c.translate(90,-118);shape('#f6cf82','#292a47',()=>{for(let i=0;i<10;i++){const r=i%2?7:15,an=i*Math.PI/5-Math.PI/2;const x=Math.cos(an)*r,y=Math.sin(an)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();},2);c.restore();
 ellipse(-123,-23,13,27,'#79d8d0','#292a47');shape(null,'#292a47',()=>{c.moveTo(-125,-5);c.quadraticCurveTo(-126,48,-65,54);},5);ellipse(-62,54,9,5,'#292a47');c.restore();}
}
