import {normalizeSave} from './model.js';

export const SAVE_SLOT_COUNT=3;
export function validSlot(slot){return Number.isInteger(slot)&&slot>=0&&slot<SAVE_SLOT_COUNT;}
export function normalizeSlots(raw,legacy=null){
 if(raw&&Array.isArray(raw.slots))return {version:1,activeSlot:validSlot(raw.activeSlot)?raw.activeSlot:0,slots:Array.from({length:SAVE_SLOT_COUNT},(_,i)=>{
  const entry=raw.slots[i];return entry?.save&&typeof entry.save==='object'?{save:normalizeSave(entry.save),updatedAt:typeof entry.updatedAt==='string'?entry.updatedAt:null}:null;
 })};
 return {version:1,activeSlot:0,slots:[legacy&&typeof legacy==='object'?{save:normalizeSave(legacy),updatedAt:null}:null,null,null]};
}
export function loadSlots(storage){
 let raw=null,legacy=null;try{raw=JSON.parse(storage.getItem('bes-save-slots'));}catch{}
 try{legacy=JSON.parse(storage.getItem('bes-save'));}catch{}
 return normalizeSlots(raw,legacy);
}
// Snapshot each profile: later mutations of the active run cannot leak into another slot.
export function writeSlot(store,slot,data,now=new Date().toISOString()){
 if(!validSlot(slot))throw new RangeError('Invalid save slot');
 const next=normalizeSlots(structuredClone(store));
 next.slots[slot]=data===null?null:{save:normalizeSave(structuredClone(data)),updatedAt:now};
 if(data!==null)next.activeSlot=slot;
 return next;
}
