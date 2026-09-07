import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
export interface PlacementCandidate { id:string;fullName:string;email:string;mobileNumber:string;qualification:string;course:string;department:string|null;skills:string[];interests:string[];city:string;state:string;availability:string;experience:string|null;preferredWorkTypes:string[];createdAt:string;updatedAt:string; }
export interface PlacementCandidateInput { fullName:string;email:string;mobileNumber:string;qualification:string;course:string;department?:string;skills:string[];interests:string[];city:string;state:string;availability:string;experience?:string;preferredWorkTypes:string[]; }
const root="/placement-cell-applications/portal/candidates";
export function listPlacementCandidates(params?:{search?:string;city?:string;workType?:string}){const q=new URLSearchParams();Object.entries(params??{}).forEach(([k,v])=>{if(v)q.set(k,v)});return apiFetch<ApiSuccessEnvelope<{candidates:PlacementCandidate[]}>>(`${root}${q.size?`?${q}`:""}`)}
export function createPlacementCandidate(input:PlacementCandidateInput){return apiFetch<ApiSuccessEnvelope<{candidate:PlacementCandidate}>>(root,{method:"POST",body:JSON.stringify(input)})}
export function updatePlacementCandidate(id:string,input:PlacementCandidateInput){return apiFetch<ApiSuccessEnvelope<{candidate:PlacementCandidate}>>(`${root}/${id}`,{method:"PUT",body:JSON.stringify(input)})}
export function deletePlacementCandidate(id:string){return apiFetch<ApiSuccessEnvelope<{deleted:boolean}>>(`${root}/${id}`,{method:"DELETE"})}
