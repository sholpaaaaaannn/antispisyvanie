import { API_BASE } from './config.js?v=2';
const KEY='antispisyvanie.session';
export const getToken=()=>sessionStorage.getItem(KEY)||'';
export const setToken=token=>token?sessionStorage.setItem(KEY,token):sessionStorage.removeItem(KEY);
export const isConfigured=()=>/^https:\/\/[^\s]+/.test(API_BASE);
export class ApiError extends Error{constructor(code,message,status){super(message);this.code=code;this.status=status}}
export async function api(path,{method='GET',body=null,headers={},timeout=25000}={}){
 if(!isConfigured())throw new ApiError('not_configured','Cloudflare Worker URL әлі орнатылмаған. Сайт иесі js/config.js файлын бір рет баптауы керек.',503);
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);
 const token=getToken();
 try{
  const h={...headers};if(token)h.Authorization=`Bearer ${token}`;
  if(body!==null&&! (body instanceof Blob) && ! (body instanceof ArrayBuffer))h['Content-Type']='application/json';
  const res=await fetch(API_BASE+path,{method,headers:h,body:body===null?undefined:(body instanceof Blob||body instanceof ArrayBuffer?body:JSON.stringify(body)),signal:ctrl.signal});
  let data=null;try{data=await res.json()}catch{}
  if(!res.ok)throw new ApiError(data?.error?.code||'http_error',data?.error?.message||`Сервер қатесі (${res.status})`,res.status);
  return data;
 }catch(e){if(e.name==='AbortError')throw new ApiError('timeout','Сервер уақытында жауап бермеді.',504);if(e instanceof ApiError)throw e;throw new ApiError('network','Серверге қосылу мүмкін болмады. Интернет пен Worker мекенжайын тексеріңіз.',0)}finally{clearTimeout(timer)}
}
export const mediaUrl=key=>key&&isConfigured()?API_BASE+'/api/media/'+encodeURI(key):null;
