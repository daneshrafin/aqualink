import type {Report,Scenario} from './types';
export const demoReports:Report[]=[
{id:'AQ-101',title:'Community handpump not functioning',area:'Coastal Ward 03',kind:'broken_pump',peopleAffected:450,status:'pending',createdAt:'2026-11-05T10:00:00Z'},
{id:'AQ-102',title:'Drinking-water shortage',area:'Coastal Ward 05',kind:'shortage',peopleAffected:800,status:'verified',createdAt:'2026-11-05T11:00:00Z'},
{id:'AQ-103',title:'Possible saline intrusion',area:'Coastal Ward 07',kind:'suspected_contamination',peopleAffected:260,status:'assigned',createdAt:'2026-11-05T12:00:00Z'}];
export const demoScenario:Scenario={budget:45000,days:7,litersPerPersonPerDay:15,communities:[
{id:'a',name:'Ward 03',people:450,dailySupplyLiters:1000,storageLiters:4000,repairCost:17000,repairDays:2,restoredLitersPerDay:7000,deliveryCostPerDay:3200,deliveryLitersPerDay:5000},
{id:'b',name:'Ward 05',people:800,dailySupplyLiters:2000,storageLiters:5000,repairCost:23000,repairDays:4,restoredLitersPerDay:12000,deliveryCostPerDay:4800,deliveryLitersPerDay:8000},
{id:'c',name:'Ward 07',people:260,dailySupplyLiters:500,storageLiters:2000,repairCost:12000,repairDays:3,restoredLitersPerDay:4500,deliveryCostPerDay:2500,deliveryLitersPerDay:3500}]};
