const clamp=(value,fallback)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
export function normalizeAudioSettings(options={}){
 options=options&&typeof options==='object'?options:{};
 return {masterVolume:clamp(options.masterVolume,1),musicVolume:clamp(options.musicVolume,.4),soundVolume:clamp(options.soundVolume,1),combatVolume:clamp(options.combatVolume,1)};
}
export function effectiveVolume(options={},channel){
 const volumes=normalizeAudioSettings(options),key=channel==='music'?'musicVolume':channel==='combat'?'combatVolume':'soundVolume';
 return volumes.masterVolume*volumes[key];
}
