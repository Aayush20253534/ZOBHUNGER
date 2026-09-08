import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("public form payloads satisfy server validation and API errors retain actionable fields", () => {
  const script = `
    import assert from 'node:assert/strict';
    import { requirementSchema } from './src/schemas/requirement.schema.ts';
    import { requirementFormSchema } from './src/schemas/requirement-form.schema.ts';
    import { createRequirementSchema } from '../server/src/modules/requirements/requirements.schema.ts';
    import { industries } from './src/data/industries.ts';
    import { solutions } from './src/data/solutions.ts';
    import { ApiError, apiFetch, apiFieldErrors } from './src/lib/api.ts';
    const base={companyName:'Test company',contactPerson:'Test owner',businessEmail:'owner@example.test',mobileNumber:'+91 9876543210',industry:industries[0].slug,serviceRequired:solutions[0].slug,workforceCount:5,locations:[{name:'Delhi'}],projectDuration:'1 day',expectedStartAt:'',details:'Field staffing for five sites.'};
    for(const industry of industries) for(const service of solutions) for(const date of ['', '2026-09-20', '2028-02-29', '2026-09-20T12:30:00Z']) {
      const form=requirementFormSchema.parse({...base,industry:industry.slug,serviceRequired:service.slug,expectedStartAt:date});
      const payload=JSON.parse(JSON.stringify(requirementSchema.parse(form)));
      const stored=createRequirementSchema.parse(payload);
      assert.deepEqual(stored.locations,['Delhi']); assert.equal(stored.workforceCount,5);
      if(!date)assert.equal(stored.expectedStartAt,undefined);
    }
    for(const projectDuration of ['', ' ', '1']) assert.equal(requirementFormSchema.safeParse({...base,projectDuration}).success,false);
    const maximum=requirementFormSchema.parse({...base,companyName:'C'.repeat(160),contactPerson:'O'.repeat(120),workforceCount:100000,locations:Array.from({length:50},(_,i)=>({name:'Location '+i})),projectDuration:'D'.repeat(120),details:'B'.repeat(6000)});
    assert.equal(createRequirementSchema.safeParse(JSON.parse(JSON.stringify(maximum))).success,true);
    globalThis.fetch=async()=>new Response(JSON.stringify({success:false,message:'Request validation failed',error:{code:'VALIDATION_ERROR',details:{fieldErrors:{projectDuration:['Include a duration and unit.'],locations:['Add a valid location.']}}}}),{status:400,headers:{'Content-Type':'application/json'}});
    await assert.rejects(apiFetch('/requirements',{method:'POST',body:'{}'}),error=>{
      assert.ok(error instanceof ApiError); assert.equal(error.status,400);
      assert.deepEqual(apiFieldErrors(error),{projectDuration:['Include a duration and unit.'],locations:['Add a valid location.']}); return true;
    });
    assert.deepEqual(apiFieldErrors(new Error('Not validation')),{});
    assert.deepEqual(apiFieldErrors(new ApiError('Invalid',400,'VALIDATION_ERROR',{fieldErrors:{companyName:42}})),{});
  `;
  const child = spawnSync(process.execPath, ["--import", "../server/node_modules/tsx/dist/loader.mjs", "--input-type=module", "-e", script], {
    cwd: new URL("../../client/", import.meta.url), encoding: "utf8",
  });
  assert.equal(child.status, 0, child.stderr || child.stdout);
});
