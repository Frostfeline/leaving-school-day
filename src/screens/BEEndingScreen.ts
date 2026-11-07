import {HEEndingScreen} from './HEEndingScreen';
import {privateBundle,privateBlockText,privateSpeaker} from '../utils/private-commission-content';
import {getGameState,saveBeScene} from '../state/game-state';
export function BEEndingScreen(review=false){const screen=HEEndingScreen(review,{bundle:{...privateBundle,resolveBlock:privateBlockText,speakerName:privateSpeaker},progress:()=>({endingSceneId:getGameState().privateCommission.be.sceneId,endingScrollTop:getGameState().privateCommission.be.scrollTop}),save:saveBeScene});screen.classList.add('be-ending');return screen;}
