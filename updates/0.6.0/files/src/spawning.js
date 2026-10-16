/** Keep the existing wave sizes; ramp their arrival rate to twice the previous rate. */
export function spawnDensity(time){return 1+Math.max(0,Math.min(1,time/60));}
export function spawnInterval(s){return Math.max(.2,1-s.time/400)/s.stage.rate/spawnDensity(s.time);}
