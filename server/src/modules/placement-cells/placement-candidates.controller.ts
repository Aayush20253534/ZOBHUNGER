import type { RequestHandler } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import { addPlacementCandidate, editPlacementCandidate, getPlacementCandidates, removePlacementCandidate } from "./placement-candidates.service.js";
import type { PlacementCandidateInput, PlacementCandidateQuery } from "./placement-candidates.schema.js";
const userId=(res:any)=>(res.locals.authUser as {id:string}).id;
export const listPlacementCandidatesController: RequestHandler=async(_req,res)=>res.json(apiSuccessResponse("Candidates retrieved",{candidates:await getPlacementCandidates(userId(res),res.locals.validated.query as PlacementCandidateQuery)}));
export const createPlacementCandidateController: RequestHandler=async(_req,res)=>res.status(201).json(apiSuccessResponse("Candidate added",{candidate:await addPlacementCandidate(userId(res),res.locals.validated.body as PlacementCandidateInput)}));
export const updatePlacementCandidateController: RequestHandler=async(_req,res)=>res.json(apiSuccessResponse("Candidate updated",{candidate:await editPlacementCandidate(userId(res),(res.locals.validated.params as {id:string}).id,res.locals.validated.body as PlacementCandidateInput)}));
export const deletePlacementCandidateController: RequestHandler=async(_req,res)=>res.json(apiSuccessResponse("Candidate deleted",await removePlacementCandidate(userId(res),(res.locals.validated.params as {id:string}).id)));
