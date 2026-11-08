import type {ReportKind} from './reportKinds';
export type ReportStatus='pending'|'verified'|'rejected'|'assigned'|'resolved';
export type WaterSafety='unknown'|'test_pending'|'verified_for_specified_use'|'unsafe';
export type Report={id:string;title:string;area:string;kind:ReportKind;peopleAffected:number;urgency?:'low'|'medium'|'high';status:ReportStatus;createdAt:string;lat?:number;lng?:number;description?:string;contactPhone?:string};
export type Community={id:string;name:string;people:number;dailySupplyLiters:number;storageLiters:number;repairCost:number;repairDays:number;restoredLitersPerDay:number;deliveryCostPerDay:number;deliveryLitersPerDay:number};
export type Scenario={budget:number;days:number;litersPerPersonPerDay:number;communities:Community[]};
export type Action={communityId:string;type:'repair'|'delivery';startDay:number;durationDays:number;cost:number};
export type Plan={actions:Action[];cost:number;unmetLiters:number;unmetPersonDays:number;dailyUnmetLiters:number[];method:string};
