import {NextResponse} from 'next/server';
import {optimize,repairOnly} from '@/lib/optimizer';
import {validateScenario} from '@/lib/scenarioValidation';

export async function POST(req:Request){
  try {
    const input:unknown = await req.json();
    validateScenario(input);
    return NextResponse.json({
      joint:optimize(input),
      baseline:repairOnly(input),
      disclaimer:'Scenario-based planning only. Requires human review and field-verified water safety.'
    });
  } catch(e) {
    return NextResponse.json({error:e instanceof Error?e.message:'Invalid input'},{status:400});
  }
}
