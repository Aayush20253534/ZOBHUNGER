import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";

export interface PlacementCandidate { id:string;fullName:string;email:string;mobileNumber:string;qualification:string;course:string;department:string|null;skills:string[];interests:string[];city:string;state:string;availability:string;experience:string|null;preferredWorkTypes:string[];createdAt:string;updatedAt:string; }
export interface PlacementCandidateInput { fullName:string;email:string;mobileNumber:string;qualification:string;course:string;department?:string;skills:string[];interests:string[];city:string;state:string;availability:string;experience?:string;preferredWorkTypes:string[]; }
export interface PlacementCandidateListParams { page?:number;pageSize?:number;search?:string;city?:string;workType?:string;signal?:AbortSignal; }
export interface PlacementCandidateListData { candidates:PlacementCandidate[];total:number;page:number;pageSize:number;totalPages:number; }

const root="/placement-cell-applications/portal/candidates";

export function listPlacementCandidates(params:PlacementCandidateListParams={}) {
  const q=new URLSearchParams();
  q.set("page",String(params.page??1));
  q.set("pageSize",String(params.pageSize??25));
  for (const [key,value] of [["search",params.search],["city",params.city],["workType",params.workType]] as const) {
    if (value?.trim()) q.set(key,value.trim());
  }
  return apiFetch<ApiSuccessEnvelope<PlacementCandidateListData>>(`${root}?${q.toString()}`,{signal:params.signal});
}
export function createPlacementCandidate(input:PlacementCandidateInput){return apiFetch<ApiSuccessEnvelope<{candidate:PlacementCandidate}>>(root,{method:"POST",body:JSON.stringify(input)})}
export function updatePlacementCandidate(id:string,input:PlacementCandidateInput){return apiFetch<ApiSuccessEnvelope<{candidate:PlacementCandidate}>>(`${root}/${id}`,{method:"PUT",body:JSON.stringify(input)})}
export function deletePlacementCandidate(id:string){return apiFetch<ApiSuccessEnvelope<{deleted:boolean}>>(`${root}/${id}`,{method:"DELETE"})}
