const rewards = [
  {id:1,title:"커피 데이트권",description:"엄마와 함께 따뜻한 커피 한 잔 하러 가는 날이에요.",icon:"☕"},
  {id:2,title:"꽃 선물권",description:"엄마에게 어울리는 예쁜 꽃을 선물해드릴게요.",icon:"🌷"},
  {id:3,title:"맛있는 외식권",description:"엄마가 먹고 싶은 메뉴로 함께 외식하는 날이에요.",icon:"🍽️"},
  {id:4,title:"디저트 선물권",description:"달콤한 디저트로 기분 좋은 하루를 선물해드릴게요.",icon:"🍰"},
  {id:5,title:"산책 동행권",description:"엄마와 천천히 걸으며 이야기를 나누는 시간이에요.",icon:"🚶"},
  {id:6,title:"영화 같이 보기권",description:"엄마가 보고 싶은 영화나 드라마를 함께 보는 날이에요.",icon:"🎬"},
  {id:7,title:"집안일 대신하기권",description:"오늘은 엄마 대신 집안일 하나를 맡아드릴게요.",icon:"🏠"},
  {id:8,title:"손마사지권",description:"고생한 엄마의 손을 따뜻하게 쉬게 해드릴게요.",icon:"🤲"},
  {id:9,title:"사진 찍어드리기권",description:"엄마의 예쁜 오늘을 사진으로 남겨드릴게요.",icon:"📷"},
  {id:10,title:"엄마 마음대로 하루권",description:"오늘 하루는 엄마가 원하는 대로 함께할게요.",icon:"💝"}
];

const KEYS={history:"momGift_selectedHistory",current:"momGift_currentReward",taps:"momGift_easterEggTapCount",easter:"momGift_easterEggOpened"};
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
let currentReward=read(KEYS.current,null), scratchReady=false, scratching=false, points=0, revealTimer=null, adminTaps=0, adminTapTimer=null, resetArmed=false;

function go(id){
  $$('.screen').forEach(screen=>screen.classList.toggle('active',screen.id===id));
  if(id==='intro') updateCount();
  if(id==='vault') renderVault();
  if(id==='scratch') requestAnimationFrame(setupScratch);
  if(id==='result') showResult();
  window.scrollTo(0,0);
}

function history(){return read(KEYS.history,[])}
function updateCount(){ $('#draw-count').textContent=`${history().length} / ${rewards.length}`; }
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(el.timer);el.timer=setTimeout(()=>el.classList.remove('show'),2200)}

$$('[data-go]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.go)));
$('#start-btn').addEventListener('click',()=>{
  if(history().length>=rewards.length){toast('모든 선물을 확인했어요 🎉');setTimeout(()=>go('vault'),700);return}
  $('#gift-box').classList.add('opening');setTimeout(()=>{$('#gift-box').classList.remove('opening');go('anticipation')},650);
});

function tapGift(){
  let taps=read(KEYS.taps,0)+1;write(KEYS.taps,taps);
  if(taps>=8){write(KEYS.easter,true);write(KEYS.taps,0);go('letter')}
  else if(taps>=5) toast(`비밀까지 ${8-taps}번 남았어요…`);
}
$('#gift-box').addEventListener('click',tapGift);
$('#gift-box').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapGift()}});

$$('.pick-card').forEach(card=>card.addEventListener('click',()=>{
  if(card.classList.contains('selected')) return;
  const available=rewards.filter(reward=>!history().some(item=>item.id===reward.id));
  if(!available.length){toast('모든 선물을 확인했어요');setTimeout(()=>go('vault'),600);return}
  currentReward=available[Math.floor(Math.random()*available.length)];write(KEYS.current,currentReward);
  $$('.pick-card').forEach(c=>c.classList.add(c===card?'selected':'dimmed'));
  setTimeout(()=>{$$('.pick-card').forEach(c=>c.classList.remove('selected','dimmed'));go('scratch')},850);
}));

function setupScratch(){
  if(!currentReward){go('intro');return}
  $('#scratch-icon').textContent=currentReward.icon;$('#scratch-name').textContent=currentReward.title;
  const canvas=$('#scratch-canvas'),stage=$('#scratch-stage'),dpr=Math.min(devicePixelRatio||1,2),rect=stage.getBoundingClientRect();
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;canvas.style.width=`${rect.width}px`;canvas.style.height=`${rect.height}px`;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const grad=ctx.createLinearGradient(0,0,rect.width,rect.height);grad.addColorStop(0,'#c9c4c0');grad.addColorStop(.5,'#a9a3a0');grad.addColorStop(1,'#cfcac6');ctx.fillStyle=grad;ctx.fillRect(0,0,rect.width,rect.height);
  ctx.fillStyle='rgba(255,255,255,.78)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 17px Noto Sans KR';ctx.fillText('행운을 긁어보세요 ✦',rect.width/2,rect.height/2);
  scratchReady=true;points=0;$('#scratch-progress').style.width='0%';canvas.style.opacity='1';
}

function scratchAt(event){
  if(!scratchReady||!scratching)return;
  const canvas=$('#scratch-canvas'),rect=canvas.getBoundingClientRect(),touch=event.touches?.[0]||event;
  const x=touch.clientX-rect.left,y=touch.clientY-rect.top,ctx=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2);
  ctx.save();ctx.scale(dpr,dpr);ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.fill();ctx.restore();
  points++;const progress=Math.min(100,points*1.65);$('#scratch-progress').style.width=`${progress}%`;
  if(progress>=55) reveal();event.preventDefault();
}
const canvas=$('#scratch-canvas');
canvas.addEventListener('pointerdown',e=>{scratching=true;canvas.setPointerCapture?.(e.pointerId);scratchAt(e)});
canvas.addEventListener('pointermove',scratchAt);canvas.addEventListener('pointerup',()=>scratching=false);canvas.addEventListener('pointercancel',()=>scratching=false);
$('#skip-scratch').addEventListener('click',reveal);

function saveWin(){
  if(!currentReward)return;
  const items=history();if(!items.some(item=>item.id===currentReward.id)){items.push({...currentReward,wonAt:new Date().toISOString()});write(KEYS.history,items)}
}
function reveal(){
  if(revealTimer)return;scratchReady=false;saveWin();
  const canvas=$('#scratch-canvas');canvas.style.transition='.65s';canvas.style.opacity='0';
  revealTimer=setTimeout(()=>{revealTimer=null;go('result')},900);
}

function showResult(){
  if(!currentReward){go('intro');return}
  $('#result-icon').textContent=currentReward.icon;$('#result-name').textContent=currentReward.title;$('#result-description').textContent=currentReward.description;
  const box=$('#confetti');box.innerHTML='';const colors=['#9e3f55','#c69a4a','#f3c8cb','#7f9b73'];
  for(let i=0;i<34;i++){const piece=document.createElement('i');piece.style.left=`${Math.random()*100}%`;piece.style.background=colors[i%colors.length];piece.style.animationDelay=`${Math.random()*1.2}s`;piece.style.animationDuration=`${2.2+Math.random()*1.8}s`;box.appendChild(piece)}
}

$('#capture-btn').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(`${currentReward.title} 당첨!\n${currentReward.description}\n유효기간: 엄마가 원할 때까지`);toast('당첨 내용을 복사했어요. 화면도 캡처해 주세요!')}
  catch{toast('이 화면을 캡처해서 간직해 주세요 📷')}
});

function renderVault(){
  const won=history(),grid=$('#vault-grid');grid.innerHTML='';
  $('#vault-summary').textContent=won.length?`${rewards.length}개 중 ${won.length}개의 행운을 만났어요`:'엄마의 선물 보관함이에요';
  $('#empty-state').hidden=won.length>0;
  rewards.forEach(reward=>{
    const item=won.find(entry=>entry.id===reward.id),button=document.createElement('button');button.className=`vault-item ${item?'unlocked':'locked'}`;
    button.innerHTML=`<span>${item?reward.icon:'🔒'}</span><b>${item?reward.title:'아직 비밀이에요'}</b>`;button.disabled=!item;if(item)button.addEventListener('click',()=>openDetail(item));grid.appendChild(button);
  });
}
function openDetail(item){
  $('#modal-icon').textContent=item.icon;$('#modal-title').textContent=item.title;$('#modal-description').textContent=item.description;
  $('#modal-date').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric'}).format(new Date(item.wonAt));$('#detail-modal').hidden=false;
}
function closeModal(el){const modal=el.closest('.modal');if(modal)modal.hidden=true;resetArmed=false;$('#admin-warning').hidden=true;$('#admin-reset').textContent='전체 초기화'}
$$('[data-close-modal]').forEach(el=>el.addEventListener('click',()=>closeModal(el)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal').forEach(modal=>modal.hidden=true)});

function openAdmin(){
  const won=history(),list=$('#admin-gift-list');
  $('#admin-summary').textContent=`현재 ${rewards.length}개 중 ${won.length}개의 선물을 뽑았습니다.`;
  list.innerHTML=won.length?won.map((item,index)=>`<div class="admin-gift"><span>${item.icon}</span><div><b>${index+1}. ${item.title}</b><small>${new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'short',day:'numeric'}).format(new Date(item.wonAt))}</small></div></div>`).join(''):'<div class="admin-empty">아직 뽑은 선물이 없습니다.</div>';
  resetArmed=false;$('#admin-warning').hidden=true;$('#admin-reset').textContent='전체 초기화';$('#admin-modal').hidden=false;
}
function tapAdmin(){
  adminTaps++;clearTimeout(adminTapTimer);adminTapTimer=setTimeout(()=>adminTaps=0,10000);
  if(adminTaps===7)toast('관리자 모드까지 3번 남았어요');
  if(adminTaps>=10){adminTaps=0;clearTimeout(adminTapTimer);openAdmin()}
}
$('#vault-title').addEventListener('click',tapAdmin);
$('#vault-title').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapAdmin()}});
$('#admin-reset').addEventListener('click',()=>{
  if(!resetArmed){resetArmed=true;$('#admin-warning').hidden=false;$('#admin-reset').textContent='정말 초기화하기';return}
  Object.values(KEYS).forEach(key=>localStorage.removeItem(key));currentReward=null;resetArmed=false;$('#admin-modal').hidden=true;renderVault();updateCount();toast('모든 선물 기록을 초기화했어요');
});
window.addEventListener('resize',()=>{if($('#scratch').classList.contains('active'))setupScratch()});
updateCount();

// 개발 중 저장 상태 초기화가 필요할 때 콘솔에서 resetMomGift()를 실행하세요.
window.resetMomGift=()=>{Object.values(KEYS).forEach(key=>localStorage.removeItem(key));location.reload()};
