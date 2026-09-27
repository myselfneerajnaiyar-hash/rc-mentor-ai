// The profile is authoritative. These per-account receipts only bridge offline saves
// and suppress automatic relaunches for the current tab session.
const memory=new Map();
const key=id=>'auctor:product-tour:'+id;
export function tourReceipt(id){try{return JSON.parse(localStorage.getItem(key(id))||'null')||memory.get(key(id))||{};}catch{return memory.get(key(id))||{};}}
export function recordTourFinish(id,pending){const value={completed:true,pending};memory.set(key(id),value);try{localStorage.setItem(key(id),JSON.stringify(value));}catch{/* Storage is optional; the account-scoped memory receipt remains available. */} }
export function tourSeen(id){try{return sessionStorage.getItem(key(id))==='seen'||memory.get(key(id)+':seen')===true;}catch{return memory.get(key(id)+':seen')===true;}}
export function markTourSeen(id){memory.set(key(id)+':seen',true);try{sessionStorage.setItem(key(id),'seen');}catch{/* Storage is optional; the account-scoped memory receipt remains available. */} }
