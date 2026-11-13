/* Port da base matemática KLITZKE WoodCalc v4.1. EMC é a chave interna para TUE. */
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; root.WoodCalcMath=api; })(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const P_KPA=101.325;
const LIMITES={TBS:[0,130],TBU:[0,130],UR:[0.01,100],EMC:[0.01,35]};
function emc(tbs,ur){const h=ur/100,w=349+1.29*tbs+0.0135*tbs*tbs,k=0.805+0.000736*tbs-0.00000273*tbs*tbs,k1=6.27-0.00938*tbs-0.000303*tbs*tbs,k2=1.91+0.0407*tbs-0.000293*tbs*tbs,q=k*h;return 1800/w*(q/(1-q)+(k1*q+2*k1*k2*q*q)/(1+k1*q+k1*k2*q*q));}
function psat(t){return 0.61094*Math.exp(17.625*t/(t+243.04));}
function urBulbos(tbs,tbu){const a=0.000660*(1+0.00115*tbu);return 100*(psat(tbu)-a*P_KPA*(tbs-tbu))/psat(tbs);}
function raizes(f,lo,hi,passos=900){const found=[];let prev=null;for(let i=0;i<=passos;i++){const x=lo+(hi-lo)*i/passos;let y;try{y=f(x);if(!Number.isFinite(y)){prev=null;continue;}}catch(e){prev=null;continue;}if(Math.abs(y)<1e-8)found.push(x);if(prev&&prev.y*y<0){let a=prev.x,b=x,fa=prev.y;for(let j=0;j<65;j++){const m=(a+b)/2,fm=f(m);if(fa*fm<=0)b=m;else{a=m;fa=fm;}}found.push((a+b)/2);}prev={x,y};}found.sort((a,b)=>a-b);return found.filter((r,i)=>i===0||r-found[i-1]>1e-3);}
function calcular(entradas){const nomes=Object.keys(entradas);if(nomes.length!==2)throw Error('Preencha exatamente dois campos e deixe os outros dois vazios.');for(const [nome,v] of Object.entries(entradas)){if(!Object.prototype.hasOwnProperty.call(LIMITES,nome))throw Error('Grandeza desconhecida.');const [lo,hi]=LIMITES[nome];if(!Number.isFinite(v)||v<lo||v>hi)throw Error(`${nome==='EMC'?'TUE':nome}: utilize valores entre ${lo} e ${hi}.`);}
const s=nomes.slice().sort().join('|'),solutions=[];let t,tw,rh,m;
if(s==='TBS|TBU'){t=entradas.TBS;tw=entradas.TBU;if(tw>t)throw Error('TBU não pode ser maior que TBS.');solutions.push([t,tw,urBulbos(t,tw)]);}
else if(s==='TBS|UR'){t=entradas.TBS;rh=entradas.UR;for(tw of raizes(w=>urBulbos(t,w)-rh,0,t))solutions.push([t,tw,rh]);}
else if(s==='EMC|TBS'){t=entradas.TBS;m=entradas.EMC;for(rh of raizes(h=>emc(t,h)-m,0.01,100))for(tw of raizes(w=>urBulbos(t,w)-rh,0,t))solutions.push([t,tw,rh]);}
else if(s==='TBU|UR'){tw=entradas.TBU;rh=entradas.UR;for(t of raizes(v=>urBulbos(v,tw)-rh,tw,130))solutions.push([t,tw,rh]);}
else if(s==='EMC|TBU'){tw=entradas.TBU;m=entradas.EMC;for(t of raizes(v=>{const h=urBulbos(v,tw);return h>=0.01&&h<=100?emc(v,h)-m:NaN;},tw,130))solutions.push([t,tw,urBulbos(t,tw)]);}
else if(s==='EMC|UR'){rh=entradas.UR;m=entradas.EMC;for(t of raizes(v=>emc(v,rh)-m,0,130))for(tw of raizes(w=>urBulbos(t,w)-rh,0,t))solutions.push([t,tw,rh]);}
const valid=solutions.filter(([a,b,c])=>0<=b&&b<=a&&a<=130&&c>0&&c<=100&&Number.isFinite(c)).map(([a,b,c])=>({TBS:a,TBU:b,UR:c,EMC:emc(a,c)}));if(!valid.length)throw Error('Nenhuma solução física encontrada no intervalo do gráfico (0–130 °C). Verifique os dados informados.');
const avisos=[];if(valid.length>1)avisos.push('Há mais de uma solução matemática. Confira todas as alternativas.');if('EMC'in entradas&&!('TBS'in entradas))avisos.push('Cálculo inverso com TUE: pequenas diferenças de leitura podem alterar bastante a temperatura.');if(valid.some(v=>v.UR>=90))avisos.push('UR elevada: a estimativa de TUE fica sensível à umidade e ao histórico da madeira.');if(valid.some(v=>v.TBS>100))avisos.push('Temperatura elevada: verifique a aplicabilidade da equação e do método de bulbo úmido.');if(valid.some(v=>v.TBU<=0.5&&v.TBS>20))avisos.push('TBU próxima do limite inferior do gráfico; o cálculo pode ser sensível.');avisos.push('Psicrometria aproximada: pressão fixa de 101,325 kPa e psicrômetro ventilado (>2 m/s).');return {solucoes:valid,avisos};}
return {emc,psat,urBulbos,raizes,calcular,LIMITES};
});
