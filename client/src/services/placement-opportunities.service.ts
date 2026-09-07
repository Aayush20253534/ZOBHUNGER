import { apiFetch, type ApiSuccessEnvelope } from "@/lib/api";
import type { PlacementCandidate } from "@/services/placement-candidates.service";

export interface PlacementOpportunity {
  id:string;slug:string;title:string;location:string;city:string;state:string|null;category:string;engagementType:string;description:string;responsibilities:string[];requirements:string[];compensation:string|null;status:"OPEN";publishedAt:string|null;
}
export interface PlacementOpportunityApplication {
  id:string;status:"SUBMITTED"|"REVIEWED"|"SHORTLISTED"|"REJECTED";createdAt:string;updatedAt:string;
  job:{id:string;slug:string;title:string;engagementType:string;location:string;status:"DRAFT"|"OPEN"|"CLOSED"};
  placementCandidate:Pick<PlacementCandidate,"id"|"fullName"|"email"|"course"|"qualification">|null;
}
const root="/placement-cell-applications/portal";
export function listPlacementOpportunities(params?:{search?:string;city?:string;opportunityType?:string}){const q=new URLSearchParams();Object.entries(params??{}).forEach(([k,v])=>{if(v)q.set(k,v)});return apiFetch<ApiSuccessEnvelope<{opportunities:PlacementOpportunity[]}>>(`${root}/opportunities${q.size?`?${q}`:""}`)}
export function submitCandidateForOpportunity(jobId:string,candidateId:string,message?:string){return apiFetch<ApiSuccessEnvelope<{application:PlacementOpportunityApplication}>>(`${root}/opportunities/${jobId}/applications`,{method:"POST",body:JSON.stringify({candidateId,message})})}
export function listPlacementApplications(params?:{search?:string;status?:string}){const q=new URLSearchParams();Object.entries(params??{}).forEach(([k,v])=>{if(v)q.set(k,v)});return apiFetch<ApiSuccessEnvelope<{applications:PlacementOpportunityApplication[]}>>(`${root}/applications${q.size?`?${q}`:""}`)}
