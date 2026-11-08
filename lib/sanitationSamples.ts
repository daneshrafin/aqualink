import type {Report} from './types';

/** Fictional local records, never uploaded as real submissions. Coordinates are illustrative. */
export const sanitationReports: (Report & {lat: number; lng: number; assignedTo?: string; notes?: string})[] = [
  {id:'AQ-SAN-001',title:'Demo: shelter latrine slab damaged',area:'Shyamnagar, Satkhira',kind:'sanitation_hygiene',peopleAffected:120,status:'pending',createdAt:'2026-11-07T08:00:00Z',lat:22.336,lng:89.103,description:'FICTIONAL DEMO: A shared shelter latrine has a damaged slab. Request an assessment and a suitable repair through the existing response team.'},
  {id:'AQ-SAN-002',title:'Demo: handwashing point lacks soap and a working tap',area:'Dacope, Khulna',kind:'sanitation_hygiene',peopleAffected:80,status:'verified',createdAt:'2026-11-07T08:10:00Z',lat:22.572,lng:89.511,description:'FICTIONAL DEMO: Handwashing supplies and tap repair requested. Verification is a simulated status, not a field assessment.'},
  {id:'AQ-SAN-003',title:'Demo: sanitation clean-up and handwashing follow-up',area:'Kalapara, Patuakhali',kind:'sanitation_hygiene',peopleAffected:60,status:'assigned',createdAt:'2026-11-07T08:20:00Z',lat:21.987,lng:90.237,assignedTo:'Field team B',description:'FICTIONAL DEMO: A team is assigned to coordinate sanitation maintenance and replenish soap.',notes:'Example follow-up: record the assessed problem, work completed, remaining needs and community confirmation before marking resolved.'},
];
