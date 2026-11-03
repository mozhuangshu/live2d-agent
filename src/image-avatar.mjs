import {clamp, EXPRESSIONS} from './core.mjs';
const FEATURES=['leftEye','rightEye','leftBrow','rightBrow','mouth'];
export function validateAvatar(input){
 if(!input||input.version!==1||input.kind!=='raster-puppet')throw Error('需要 version 1 的 raster-puppet 角色包，不支持 Cubism 模型');
 for(const k of ['width','height'])if(!Number.isInteger(input[k])||input[k]<64||input[k]>1536)throw Error('角色尺寸需在 64–1536 之间');
 if(typeof input.image!=='string'||input.image.length>16*1024*1024||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.image))throw Error('角色包只允许内嵌 PNG，不允许远程图片');
 const bytes=atob(input.image.slice(22,66));
 const u32=offset=>Array.from(bytes.slice(offset,offset+4)).reduce((n,ch)=>n*256+ch.charCodeAt(0),0);
 if(bytes.length<24||bytes.slice(0,8)!=='\x89PNG\r\n\x1a\n'||bytes.slice(12,16)!=='IHDR'||u32(16)!==input.width||u32(20)!==input.height)throw Error('PNG 头部尺寸不合法或与角色包不一致');
 const features={};
 for(const k of FEATURES){const f=input.features?.[k],b=f?.box;if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]<0||b[1]<0||b[2]<.005||b[3]<.005||b[0]+b[2]>1||b[1]+b[3]>1||!/^#[0-9a-f]{6}$/i.test(f?.fill||''))throw Error(`无效的 ${k} 校准区域`);features[k]={box:[...b],fill:f.fill};}
 return {version:1,kind:'raster-puppet',name:typeof input.name==='string'?input.name.slice(0,80):'My avatar',width:input.width,height:input.height,image:input.image,features};
}
// Pure parameters shared by live playback and deterministic tests. Not facial tracking.
export function imagePose({expression='neutral',intensity=.8,mouth=0}={},blink=0){
 const e=EXPRESSIONS.includes(expression)?expression:'neutral',a=Number.isFinite(intensity)?clamp(intensity):.8;
 return {eye:Math.max(.04,(1-clamp(blink))*(e==='laugh'?1-.94*a:e==='serious'?1-.22*a:e==='angry'?1-.35*a:1)),
  brow:(e==='angry'?.28:e==='frown'?-.22:e==='serious'?.1:0)*a,
  smile:(e==='smile'?.65:e==='laugh'?1:e==='frown'?-.55:0)*a,
  mouth:Number.isFinite(mouth)?clamp(mouth):0};
}
export async function decodeAvatar(input){
 const pack=validateAvatar(input),image=new Image();
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('角色 PNG 无法解码'));image.src=pack.image;});
 if(image.naturalWidth!==pack.width||image.naturalHeight!==pack.height)throw Error('图片实际尺寸与角色包不一致');
 return {pack,image};
}
export class ImageAvatarRenderer {
 constructor(canvas,{pack,image}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.pack=pack;this.image=image;this.pose={expression:'neutral',intensity:.8,mouth:0};this.start=performance.now();this.smooth=0;this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);}
 setPose(pose){Object.assign(this.pose,pose);}
 destroy(){cancelAnimationFrame(this.frame);}
 tick(t){this.draw(t);this.frame=requestAnimationFrame(this.tick);}
 draw(t){const c=this.ctx,{width:w,height:h,features}=this.pack,elapsed=(t-this.start)%4600;
 this.smooth+=(clamp(this.pose.mouth)-this.smooth)*.3;
 const p=imagePose({...this.pose,mouth:this.smooth},elapsed>4430?Math.sin((elapsed-4430)/170*Math.PI):0);
 c.clearRect(0,0,this.canvas.width,this.canvas.height);c.save();
 const scale=Math.min(this.canvas.width/w,this.canvas.height/h)*.94;
 c.translate(this.canvas.width/2,this.canvas.height/2+Math.sin(t*.0017)*2);c.scale(scale,scale);c.translate(-w/2,-h/2);c.drawImage(this.image,0,0,w,h);
 const feature=(name,sy=1,angle=0)=>{if(sy===1&&angle===0)return;const f=features[name],[x,y,fw,fh]=f.box.map((v,i)=>v*(i%2?h:w));
 c.fillStyle=f.fill;c.fillRect(x,y,fw,fh);c.save();c.translate(x+fw/2,y+fh/2);c.rotate(angle);c.scale(1,sy);c.drawImage(this.image,x,y,fw,fh,-fw/2,-fh/2,fw,fh);c.restore();};
 feature('leftEye',p.eye);feature('rightEye',p.eye);feature('leftBrow',1,p.brow);feature('rightBrow',1,-p.brow);
 if(p.smile!==0||p.mouth>.025){const f=features.mouth,[x,y,mw,mh]=f.box.map((v,i)=>v*(i%2?h:w));
 c.fillStyle=f.fill;c.fillRect(x,y,mw,mh);const cx=x+mw/2,cy=y+mh/2,half=mw*.42,corner=cy-p.smile*mh*.25;
 c.beginPath();c.moveTo(cx-half,corner);c.quadraticCurveTo(cx,cy+p.smile*mh*.4,cx+half,corner);
 if(p.mouth>.025){c.quadraticCurveTo(cx,cy+mh*p.mouth*1.5,cx-half,corner);c.fillStyle='#572b3b';c.fill();}
 c.strokeStyle='#633b50';c.lineWidth=Math.max(1,mw*.035);c.stroke();}
 c.restore();
 }
}
