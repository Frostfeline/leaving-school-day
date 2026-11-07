import site from '../content/fortune/site.json';
import profileData from '../content/fortune/profiles.json';
import {storyDates} from './story-dates';
const profiles={...profileData,people:profileData.people.map(p=>({...p,birthDate:storyDates[p.birthDateRef as keyof typeof storyDates]}))};
import result from '../content/fortune/free-result.json';
import paywall from '../content/fortune/paywall.json';
import {characterName} from './wechat-content';
export {site as fortuneSite,profiles as fortuneProfiles,result as fortuneResults,paywall as fortunePaywall};
export const FORTUNE_ROUTE='#/fortune-match';
export interface FortuneInput {name:string;birthDate:string;hourId:string}
const nameKey=(name:string)=>name.normalize('NFKC').trim();
export function validBirthDate(date:string){return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;}
export function matchFortune(inputs:FortuneInput[]){
 for(const pair of profiles.pairs){
  const orders=pair.allowSwappedOrder?[pair.members,[...pair.members].reverse()]:[pair.members];
  for(const order of orders){const people=order.map(id=>profiles.people.find(p=>p.id===id)!);
   if(inputs.length===people.length&&people.every((person,i)=>nameKey(inputs[i].name)===nameKey(characterName(person.characterId))&&inputs[i].birthDate===person.birthDate)){
    const entry=result.results.find(r=>r.id===pair.resultId)!;return {result:entry,enhanced:people.every((person,i)=>inputs[i].hourId===person.correctHourId)};
   }
  }
 }return null;
}
