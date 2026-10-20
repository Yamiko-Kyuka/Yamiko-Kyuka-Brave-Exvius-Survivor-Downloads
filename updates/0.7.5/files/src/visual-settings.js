export function playerEffectsOpacity(value){return Number.isFinite(value)?Math.max(.01,Math.min(1,value)):1;}
export function normalizeVisualSettings(options={}){return {playerEffects:playerEffectsOpacity(options?.playerEffects)};}
