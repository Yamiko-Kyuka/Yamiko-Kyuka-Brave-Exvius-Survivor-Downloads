/** Single HTTP byte ranges, including suffix and open-ended requests used by audio seeking. */
export function byteRange(header,size){
 if(header===undefined)return null;
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);
 if(!match||(!match[1]&&!match[2])||size<=0)return {invalid:true};
 let start,end;
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return {invalid:true};start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Number(match[2]):size-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start>end)return {invalid:true};end=Math.min(end,size-1);}
 return {start,end};
}
