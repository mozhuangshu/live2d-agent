export const EXPRESSIONS = Object.freeze(['neutral','smile','laugh','serious','frown','angry']);
export const LABELS = Object.freeze({neutral:'自然',smile:'微笑',laugh:'大笑',serious:'认真',frown:'皱眉',angry:'愤怒'});
export const clamp = (n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
export function validateScript(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('脚本必须是 JSON 对象');
  if(input.version!==1)throw Error('脚本 version 必须为 1');
  if(!Array.isArray(input.segments)||input.segments.length<1||input.segments.length>100)throw Error('需要 1–100 个段落');
  const segments=input.segments.map((s,i)=>{
    const error=m=>{throw Error(`第 ${i+1} 段：${m}`)};
    if(!s||typeof s!=='object')error('格式不正确');
    if(typeof s.text!=='string'||!s.text.trim()||s.text.length>2000)error('文本需为 1–2000 个字符');
    const expression=s.expression??'neutral';if(!EXPRESSIONS.includes(expression))error('表情不支持');
    const number=(key,fallback,min,max)=>{let v=s[key]??fallback;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)error(`${key} 需在 ${min}–${max} 之间`);return v;};
    return {text:s.text.trim(),expression,intensity:number('intensity',.8,0,1),rate:number('rate',1,.5,2),pitch:number('pitch',1,.5,2),pauseMs:number('pauseMs',350,0,5000),durationMs:number('durationMs',Math.max(1400,s.text.length*160),300,120000)};
  });
  if(segments.reduce((n,s)=>n+s.text.length,0)>20000)throw Error('脚本总长度不能超过 20000 字符');
  return {version:1,title:typeof input.title==='string'?input.title.slice(0,120):'未命名口播',segments};
}
export function textToScript(text){
  if(typeof text!=='string'||!text.trim())throw Error('请先输入口播稿');
  const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  return validateScript({version:1,title:'我的口播稿',segments:lines.map(text=>({text,expression:'neutral'}))});
}
export function timeline(script){let start=0;return validateScript(script).segments.map((s,index)=>{const item={...s,index,startMs:start,endMs:start+s.durationMs};start=item.endMs+s.pauseMs;return item;});}
export function cueAt(cues,ms){if(!Number.isFinite(ms)||ms<0)return null;return cues.find(c=>ms>=c.startMs&&ms<c.endMs)||null;}
export function rms(samples){if(!samples.length)return 0;return Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);}
export function audioMouth(samples){return clamp((rms(samples)-.012)*8);}
export function speechMouth(elapsed){return clamp(.18+Math.abs(Math.sin(elapsed*.024))* .55+Math.sin(elapsed*.041)*.12);}
export const SAMPLE = validateScript({version:1,title:'欢迎来到虚拟主播工作台',segments:[
 {text:'你好，欢迎来到虚拟主播工作台。我是由脚本驱动的虚拟主持人。',expression:'smile',durationMs:5700},
 {text:'你只需要准备口播稿，Agent 就能安排每一段的表情、语速和停顿。',expression:'serious',durationMs:5800},
 {text:'当然，也可以轻松一点。让我们一起，把文字变成有表情的讲述吧！',expression:'laugh',durationMs:5600},
 {text:'现在，试着替换这份稿件，开始你的第一场口播。',expression:'smile',durationMs:4300}
]});
