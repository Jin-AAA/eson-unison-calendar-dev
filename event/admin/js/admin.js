window.ESON_EVENT_CONFIG={
  environment:'dev',
  apiUrl:'https://script.google.com/macros/s/AKfycby5Y2iMZPeqT82TLlQk04qrA6AEFjXyCv0K-1A-OGaRemgkL5qGK04cv_Li3mx_u5SQ/exec'
};

const mi=(name)=>`<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
const app=document.querySelector('#app');
let currentLang='zh';
let previewFromEditor=false;
const API_URL='https://script.google.com/macros/s/AKfycby5Y2iMZPeqT82TLlQk04qrA6AEFjXyCv0K-1A-OGaRemgkL5qGK04cv_Li3mx_u5SQ/exec';
const IS_ADMIN_PATH=/\/admin\/?$/.test(location.pathname);
const PUBLIC_EVENT_BASE=location.pathname.replace(/\/admin\/?$/,'/');
let currentEventId=null;
let currentPublicSlug='';
let lastSubmission=null;
let dashboardLoading=false;
let dashboardFilter='all';
let dashboardQuery='';
let editorPublished=false;
let editorPage='form';
let editorSideTab='components';
let adminUiLang='zh';
let responseQuery='';
let paymentFilter='all';
let registrationFilter='all';

const ADMIN_TITLE='Eson Event Admin Dashboard';
const i18n={
  zh:{open:'報名開放中',deadline:'報名截止',email:'Email',emailHint:'每個 Email 僅能報名一次，送出後無法自行修改。',submit:'送出報名',confirmTitle:'確認送出報名？',confirmText:'請再次確認您填寫的資料正確無誤。報名資料送出後將無法自行修改。',back:'返回檢查',confirm:'確認送出',success:'報名成功！',code:'報名編號',summary:'本次填寫內容',save:'請截圖保存',saveText:'本頁面關閉或重新整理後，將無法再次查看此次提交內容。報名資料送出後亦無法自行修改，請截圖保存您的報名編號與填寫內容。',notStarted:'報名尚未開始',full:'本活動已額滿',closed:'本次報名已截止',paused:'報名目前暫停',endPreview:'結束預覽'},
  ko:{open:'신청 접수 중',deadline:'신청 마감',email:'이메일',emailHint:'이메일 1개당 1회만 신청할 수 있으며, 제출 후에는 수정할 수 없습니다.',submit:'신청서 제출',confirmTitle:'신청서를 제출하시겠습니까?',confirmText:'입력한 정보가 정확한지 다시 확인해 주세요. 제출 후에는 신청 내용을 직접 수정할 수 없습니다.',back:'다시 확인',confirm:'제출하기',success:'신청이 완료되었습니다!',code:'신청 번호',summary:'제출한 내용',save:'화면을 캡처해 보관해 주세요',saveText:'이 페이지를 닫거나 새로고침하면 제출 내용을 다시 확인할 수 없습니다. 신청 번호와 작성 내용을 캡처해 보관해 주세요.',notStarted:'아직 신청 기간이 아닙니다',full:'신청이 마감되었습니다',closed:'신청 기간이 종료되었습니다',paused:'현재 신청이 일시 중지되었습니다',endPreview:'미리보기 종료'},
  en:{open:'Registration Open',deadline:'Registration closes',email:'Email',emailHint:'Each email may register once. Submitted responses cannot be edited.',submit:'Submit Registration',confirmTitle:'Submit your registration?',confirmText:'Please confirm that all information is correct. You will not be able to edit your response after submission.',back:'Go Back',confirm:'Confirm & Submit',success:'Registration Complete!',code:'Registration No.',summary:'Your Submitted Information',save:'Please take a screenshot',saveText:'This submission summary will no longer be available after you close or refresh this page. Please save a screenshot of your registration number and responses.',notStarted:'Registration has not opened yet',full:'Registration is full',closed:'Registration has closed',paused:'Registration is temporarily paused',endPreview:'Exit Preview'},
  ja:{open:'受付中',deadline:'受付締切',email:'メールアドレス',emailHint:'1つのメールアドレスにつき1回のみ申込可能です。送信後は内容を変更できません。',submit:'申込を送信',confirmTitle:'申込を送信しますか？',confirmText:'入力内容に誤りがないか、もう一度ご確認ください。送信後は申込内容を変更できません。',back:'確認に戻る',confirm:'確認して送信',success:'申込が完了しました！',code:'申込番号',summary:'今回の入力内容',save:'スクリーンショットを保存してください',saveText:'このページを閉じる、または再読み込みすると、今回の送信内容は再表示できません。申込番号と入力内容をスクリーンショットで保存してください。',notStarted:'まだ受付開始前です',full:'定員に達しました',closed:'受付は終了しました',paused:'現在受付を一時停止しています',endPreview:'プレビューを終了'}
};

let demoEvents=[];

let editorBlocks=[
 {id:'email',type:'email',locked:true,title:'Email',desc:'系統固定欄位・每個 Email 僅能報名一次'},
 {id:'heading1',type:'heading',title:'報名資訊'},
 {id:'short1',type:'short',title:'姓名',placeholder:'請輸入姓名',required:true},
 {id:'radio1',type:'radio',title:'參加場次',required:true,options:['第一場 14:00','第二場 18:00']},
 {id:'para1',type:'paragraph',text:'請確認填寫內容正確無誤。表單送出後將無法自行修改。'}
];
let selectedBlockId='email';
let successNote='管理員可在此加入報名成功後的補充資訊、付款提醒或其他活動說明。';
let activityConfig={name:'ESON Birthday Fan Meeting 2026',slug:'eson-birthday-2026',start:'2026-12-01T20:00',end:'2026-12-05T23:59',capacity:30,showInList:true,showCount:true};


const responses=[
 ['#0001','amy@example.com','Amy','@amy','2026/12/01 20:00:01','已確認','有效',''],
 ['#0002','kim@example.com','Kim','@kim','2026/12/01 20:00:03','未確認','有效','提供餐食應援'],
 ['#0003','mina@example.com','Mina','@minaaa','2026/12/01 20:00:05','已確認','有效',''],
 ['#0004','hana@example.com','Hana','@hana1228','2026/12/01 20:00:08','未確認','取消','已聯絡本人'],
 ['#0005','momo@example.com','Momo','@momo','2026/12/01 20:00:09','已退款','有效','退款完成']
];


async function apiGet(action,params={}) {
  return window.EsonFirebase.apiGet(action,params);
}
async function apiPost(action,payload={}) {
  return window.EsonFirebase.apiPost(action,payload);
}

function kstLocalToIso(v){
  if(!v)return '';
  const s=String(v).trim();
  if(!s)return '';
  // datetime-local entered in admin is explicitly KST (UTC+9).
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s+':00+09:00';
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s+'+09:00';
  return s;
}
function isoToKstLocal(v){
  if(!v)return '';
  const d=new Date(v);
  if(Number.isNaN(d.getTime())){
    const s=String(v);
    return s.slice(0,16);
  }
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Seoul',
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hour12:false
  }).formatToParts(d);
  const get=t=>parts.find(x=>x.type===t)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
function apiDateValue(v=''){
  if(!v)return '';
  if(typeof v==='string')return v.replace(' ','T').replace(/\//g,'-').slice(0,16);
  return '';
}
function formatRange(e){
  if(!e.openTime&&!e.closeTime)return '尚未設定';
  const a=String(e.openTime||'').replace(/-/g,'/').slice(0,16);
  const b=String(e.closeTime||'').replace(/-/g,'/').slice(5,16);
  return `${a||'—'} — ${b||'—'}`;
}
function apiEventToUi(e){
  const dynamicState=window.EsonFirebase?.computeState ? window.EsonFirebase.computeState(e) : (e.status||'draft');
  const statusMap={
    draft:{status:'draft',label:'草稿'},
    open:{status:'open',label:'開放中'},
    notstarted:{status:'upcoming',label:'尚未開放'},
    full:{status:'full',label:'已額滿'},
    closed:{status:'closed',label:'已截止'},
    paused:{status:'paused',label:'暫停'}
  };
  const mapped=statusMap[dynamicState]||statusMap.draft;
  return {
    id:e.eventId,
    name:e.name||'',
    slug:e.slug||'',
    status:mapped.status,
    label:mapped.label,
    range:`${formatKstRange(e.openTime)} — ${formatKstRange(e.closeTime,true)}`,
    count:Number(e.acceptedCount)||0,
    cap:Number(e.totalCapacity)||0,
    raw:e
  };
}

function getDashboardLocalCache(){
  try{
    const raw=sessionStorage.getItem('eson_event_dashboard_cache_v1');
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(!parsed||!Array.isArray(parsed.events))return null;
    return parsed;
  }catch(e){return null}
}
function setDashboardLocalCache(events){
  try{
    sessionStorage.setItem('eson_event_dashboard_cache_v1',JSON.stringify({
      savedAt:Date.now(),
      events:events
    }));
  }catch(e){}
}

async function loadDashboardFromApi(){
  dashboardLoading=true;
  const rows=document.querySelector('#eventRows');
  const local=getDashboardLocalCache();

  if(local&&local.events.length){
    demoEvents=local.events;
    refreshDashboardRows();
  }else if(rows){
    rows.innerHTML=`<tr><td colspan="6"><div class="empty-state">${mi('progress_activity')}<b>正在讀取資料...</b><span>請稍候</span></div></td></tr>`;
  }

  try{
    const data=await apiGet('listEvents');
    demoEvents=(data.events||[]).map(apiEventToUi);
    setDashboardLocalCache(demoEvents);
    refreshDashboardRows();
  }catch(err){
    if(!local&&rows){
      rows.innerHTML=`<tr><td colspan="6"><div class="empty-state">${mi('error')}<b>無法讀取資料</b><span>${esc(err.message)}</span></div></td></tr>`;
    }else{
      console.error(err);
    }
  }finally{
    dashboardLoading=false;
  }
}
function resetNewEventEditor(){
  currentEventId=null;
  editorPublished=false;
  editorPage='form';
  editorSideTab='components';
  activityConfig={name:'',slug:'',start:'',end:'',capacity:30,showInList:true,showCount:true};
  editorBlocks=[
    {id:'email',type:'email',locked:true,title:'Email',desc:'系統固定欄位・每個 Email 僅能報名一次'}
  ];
  selectedBlockId='email';
  successNote='';
}
async function loadEventForEditor(eventId){
  try{
    toast('正在讀取資料...');
    const data=await apiGet('getEvent',{eventId});
    const detail=data.event;
    const e=detail.event||detail;
    currentEventId=e.eventId;
    editorPublished=e.status!=='draft';
    activityConfig={
      name:e.name||'',
      slug:e.slug||'',
      start:apiDateValue(e.openTime),
      end:apiDateValue(e.closeTime),
      capacity:Number(e.initialCapacity)||Number(e.totalCapacity)||30,
      showInList:e.showInEventList!==false,
      showCount:e.showRegistrationCount!==false
    };
    editorBlocks=(detail.blocks&&detail.blocks.length)?detail.blocks:[
      {id:'email',type:'email',locked:true,title:'Email',desc:'系統固定欄位・每個 Email 僅能報名一次'}
    ];
    if(!editorBlocks.some(b=>b.type==='email')){
      editorBlocks.unshift({id:'email',type:'email',locked:true,title:'Email',desc:'系統固定欄位・每個 Email 僅能報名一次'});
    }
    selectedBlockId=editorBlocks[0]?.id||'email';
    successNote=detail.pages?.success?.note||'';
    editorPage='form';
    navigate('editor');
  }catch(err){
    alert('讀取活動失敗：'+err.message);
  }
}
async function saveCurrentEvent(showToast=true){
  const result=await apiPost('saveEvent',{data:{
    eventId:currentEventId||undefined,
    name:activityConfig.name,
    slug:activityConfig.slug,
    openTime:kstLocalToIso(activityConfig.start),
    closeTime:kstLocalToIso(activityConfig.end),
    initialCapacity:activityConfig.capacity,
    showInEventList:activityConfig.showInList,
    showRegistrationCount:activityConfig.showCount,
    paused:false
  }});
  currentEventId=result.eventId;
  if(showToast)toast('活動基本資料已儲存');
  return result;
}
async function saveCurrentBlocks(){
  if(!currentEventId)await saveCurrentEvent(false);
  return apiPost('saveFormBlocks',{eventId:currentEventId,blocks:editorBlocks});
}
async function saveCurrentSuccessPage(){
  if(!currentEventId)await saveCurrentEvent(false);
  return apiPost('savePageContent',{
    eventId:currentEventId,
    pageType:'success',
    content:{note:successNote||''}
  });
}
async function saveDraftLive(){
  try{
    const btn=document.querySelector('#saveDraftBtn');
    if(btn){btn.disabled=true;btn.textContent='儲存中...'}
    await saveCurrentEvent(false);
    await saveCurrentBlocks();
    await saveCurrentSuccessPage();
    sessionStorage.removeItem('eson_event_dashboard_cache_v1');toast('草稿已儲存');
  }catch(err){
    alert('儲存失敗：'+err.message);
  }finally{
    const btn=document.querySelector('#saveDraftBtn');
    if(btn){btn.disabled=false;btn.textContent='儲存草稿'}
  }
}
async function publishLive(){
  try{
    const btn=document.querySelector('#publishBtn');
    if(btn){btn.disabled=true;btn.textContent='發布中...'}
    await saveCurrentEvent(false);
    await saveCurrentBlocks();
    await saveCurrentSuccessPage();
    await apiPost('publishEvent',{eventId:currentEventId});
    editorPublished=true;
    sessionStorage.removeItem('eson_event_dashboard_cache_v1');toast('活動已發布');
    setTimeout(()=>navigate('dashboard'),500);
  }catch(err){
    alert('發布失敗：'+err.message);
  }finally{
    const btn=document.querySelector('#publishBtn');
    if(btn){btn.disabled=false;btn.textContent='發布'}
  }
}
async function savePublishedEditLive(){
  try{
    const btn=document.querySelector('#saveEditBtn');
    if(btn){btn.disabled=true;btn.textContent='儲存中...'}
    await saveCurrentEvent(false);
    await saveCurrentBlocks();
    await saveCurrentSuccessPage();
    await apiPost('syncPublishedEvent',{eventId:currentEventId});
    sessionStorage.removeItem('eson_event_dashboard_cache_v1');toast('編輯內容已儲存');
  }catch(err){
    alert('儲存失敗：'+err.message);
  }finally{
    const btn=document.querySelector('#saveEditBtn');
    if(btn){btn.disabled=false;btn.textContent='儲存編輯'}
  }
}

function protoNav(){return ''}

function adminLangName(code=adminUiLang){return ({zh:'中文',ko:'한국어',en:'English'})[code]||'中文'}
function topbar(){return `<div class="topbar"><div class="brand"><div class="brandmark">E</div><span>${ADMIN_TITLE}</span></div><div class="top-actions"><div class="timezone-label">${mi('schedule')} KST (UTC+9)</div><div class="menu-wrap"><button class="btn profile-btn lang-btn" id="adminLangBtn">${adminLangName()} ${mi('arrow_drop_down')}</button><div class="dropdown-menu lang-menu" id="adminLangMenu"><button class="menu-item ${adminUiLang==='zh'?'active':''}" data-admin-lang="zh">中文</button><button class="menu-item ${adminUiLang==='ko'?'active':''}" data-admin-lang="ko">한국어</button><button class="menu-item ${adminUiLang==='en'?'active':''}" data-admin-lang="en">English</button></div></div><div class="menu-wrap"><button class="btn profile-btn" id="profileBtn">Jiin ${mi('arrow_drop_down')}</button><div class="dropdown-menu profile-menu" id="profileMenu"><div class="menu-title">Jiin · Owner</div><button class="menu-item" id="myAccountBtn">${mi('person')} 我的帳號</button><button class="menu-item" id="adminManageBtn">${mi('manage_accounts')} 管理員管理</button><div class="menu-sep"></div><button class="menu-item" data-nav="login">${mi('logout')} 登出</button></div></div></div></div>`}

function loginStrings(){return {
 zh:{title:'管理員登入',desc:'登入後即可管理活動與報名資料。',account:'帳號',password:'密碼',login:'登入',note:'使用 Firebase Authentication 登入，Owner 與 Admin 權限由系統管理。'},
 ko:{title:'관리자 로그인',desc:'로그인 후 이벤트와 신청 데이터를 관리할 수 있습니다.',account:'계정',password:'비밀번호',login:'로그인',note:'Firebase Authentication으로 로그인하며 Owner와 Admin 권한을 구분합니다.'},
 en:{title:'Admin Login',desc:'Sign in to manage events and registration data.',account:'Account',password:'Password',login:'Sign in',note:'Sign in with Firebase Authentication. Owner and Admin permissions are managed by the system.'}
}[adminUiLang]||this.zh}
function loginLangMenu(){return `<div class="login-lang-wrap menu-wrap"><button class="btn profile-btn lang-btn" id="loginLangBtn">${adminLangName()} ${mi('arrow_drop_down')}</button><div class="dropdown-menu lang-menu" id="loginLangMenu"><button class="menu-item ${adminUiLang==='zh'?'active':''}" data-login-lang="zh">中文</button><button class="menu-item ${adminUiLang==='ko'?'active':''}" data-login-lang="ko">한국어</button><button class="menu-item ${adminUiLang==='en'?'active':''}" data-login-lang="en">English</button></div></div>`}
function renderLogin(){
  const t=loginStrings();
  app.innerHTML=`<div class="login-wrap"><section class="login-panel">${loginLangMenu()}<div class="login-box"><div class="brand login-brand"><span>${ADMIN_TITLE}</span></div><h2>${t.title}</h2><p class="muted">${t.desc}</p><div class="field"><label>Email</label><input id="loginEmail" type="email" autocomplete="username" placeholder="name@example.com"></div><div class="field"><label>${t.password}</label><input id="loginPassword" type="password" autocomplete="current-password"></div><button class="btn primary" id="loginSubmitBtn" style="width:100%;margin-top:7px">${t.login}</button><div class="login-note">Firebase Authentication</div></div></section></div>${protoNav()}`;
  bind();
  bindLoginLang();
  const loginBtn=document.querySelector('#loginSubmitBtn');
  if(loginBtn)loginBtn.onclick=async()=>{
    const email=document.querySelector('#loginEmail').value;
    const password=document.querySelector('#loginPassword').value;
    try{
      loginBtn.disabled=true;
      loginBtn.textContent='登入中...';
      await window.EsonFirebase.login(email,password);
      navigate('dashboard');
    }catch(err){
      alert('登入失敗：'+err.message);
    }finally{
      loginBtn.disabled=false;
      loginBtn.textContent=t.login;
    }
  };
}
function bindLoginLang(){const btn=document.querySelector('#loginLangBtn'),menu=document.querySelector('#loginLangMenu');if(!btn||!menu)return;btn.onclick=e=>{e.stopPropagation();menu.classList.toggle('open')};document.querySelectorAll('[data-login-lang]').forEach(x=>x.onclick=()=>{adminUiLang=x.dataset.loginLang;renderLogin()});document.addEventListener('click',()=>menu.classList.remove('open'),{once:true});}
function dashboardRows(){const q=(dashboardQuery||'').trim().toLowerCase();return demoEvents.filter(e=>{const statusPass=dashboardFilter==='all'||(dashboardFilter==='open'&&e.status==='open')||(dashboardFilter==='upcoming'&&e.status==='upcoming')||(dashboardFilter==='ended'&&['closed','full'].includes(e.status))||(dashboardFilter==='draft'&&e.status==='draft');const haystack=(e.name+' '+(e.slug||'')+' /event/'+(e.slug||'')).toLowerCase();const queryPass=!q||haystack.includes(q);return statusPass&&queryPass})}
function dashboardTableHtml(){const rows=dashboardRows(); if(!rows.length)return `<tr><td colspan="6"><div class="empty-state">${mi('search_off')}<b>找不到符合條件的活動</b><span>請調整搜尋關鍵字或篩選條件。</span></div></td></tr>`;return rows.map(e=>{const publicCell=e.status==='draft'?`<span class="unpublished-label">${mi('hide_source')} 尚未發布</span>`:`<button class="btn small" data-open-public="${e.id}" title="開啟 https://eson1228.com/event/${e.slug}/">${mi('open_in_new')} 開啟前台</button>`;return `<tr><td><b>${e.name}</b><div class="tiny muted" style="margin-top:4px">${e.status==='draft'?'尚未產生公開網址':'/event/'+e.slug+'/'}</div></td><td><span class="badge ${e.status}">${e.label}</span></td><td>${e.range}</td><td><b>${e.count} / ${e.cap}</b><div class="progress"><i style="width:${Math.min(100,e.count/e.cap*100)}%"></i></div></td><td>${publicCell}</td><td><div class="row-actions"><button class="btn small" data-edit-event="${e.id}">編輯</button>${e.status==='draft'?'':`<button class="btn small" data-view-responses="${e.id}">查看資料</button>`}${['full','closed'].includes(e.status)?'<button class="btn small soft" data-capacity="'+e.id+'">再次開放增收</button>':''}</div></td></tr>`}).join('')}
function renderDashboard(){app.innerHTML=`${topbar()}<main class="page"><div class="page-head"><div><h1>活動管理</h1><div class="muted">所有時間皆以 KST（UTC+9）顯示</div></div><div class="actions"><button class="btn primary" data-nav="editor">${mi('add')}新增活動</button></div></div><div class="toolbar"><div class="search material-search">${mi('search')}<input id="dashboardSearch" placeholder="搜尋活動名稱或網址" value="${dashboardQuery.replaceAll('"','&quot;')}" /></div><div class="seg" id="dashboardFilters"><button data-filter="all" class="${dashboardFilter==='all'?'active':''}">全部</button><button data-filter="open" class="${dashboardFilter==='open'?'active':''}">開放中</button><button data-filter="upcoming" class="${dashboardFilter==='upcoming'?'active':''}">未開始</button><button data-filter="ended" class="${dashboardFilter==='ended'?'active':''}">已結束</button><button data-filter="draft" class="${dashboardFilter==='draft'?'active':''}">草稿</button></div></div><div class="card table-card"><table class="table"><thead><tr><th>活動名稱</th><th>狀態</th><th>報名期間（KST）</th><th>報名</th><th>前台頁面</th><th>操作</th></tr></thead><tbody id="eventRows">${dashboardTableHtml()}</tbody></table></div></main>${protoNav()}`;bind();bindTopMenus();document.querySelector('#dashboardSearch').addEventListener('input',e=>{dashboardQuery=e.target.value;refreshDashboardRows()});document.querySelectorAll('#dashboardFilters [data-filter]').forEach(b=>b.onclick=()=>{dashboardFilter=b.dataset.filter;document.querySelectorAll('#dashboardFilters button').forEach(x=>x.classList.toggle('active',x===b));refreshDashboardRows()});bindCapacityButtons();bindDashboardEditors();bindPublicButtons();loadDashboardFromApi();}
function refreshDashboardRows(){document.querySelector('#eventRows').innerHTML=dashboardTableHtml();bind();bindCapacityButtons();bindDashboardEditors();bindPublicButtons();}
function bindCapacityButtons(){document.querySelectorAll('[data-capacity]').forEach(b=>b.onclick=()=>showCapacityModal(b.dataset.capacity));}
function bindPublicButtons(){document.querySelectorAll('[data-open-public]').forEach(btn=>btn.onclick=()=>{const ev=demoEvents.find(x=>x.id===btn.dataset.openPublic);if(!ev||!ev.slug)return;window.open(PUBLIC_EVENT_BASE+'?event='+encodeURIComponent(ev.slug),'_blank')})}
function bindDashboardEditors(){
  document.querySelectorAll('[data-edit-event]').forEach(b=>b.onclick=()=>loadEventForEditor(b.dataset.editEvent));
  document.querySelectorAll('[data-view-responses]').forEach(b=>b.onclick=()=>{currentEventId=b.dataset.viewResponses;navigate('responses')});
  const add=document.querySelector('[data-nav="editor"]');
  if(add&&add.closest('.page-head'))add.onclick=()=>{resetNewEventEditor();navigate('editor')};
}

function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function currentBlock(){return editorBlocks.find(b=>b.id===selectedBlockId)||editorBlocks[0]}
function req(b){return b.required?' <span class="req">*</span>':''}
function descHtml(b){return b.desc?`<div class="block-desc">${esc(b.desc)}</div>`:''}
function renderEditorBlock(b){
  const drag=b.locked?`<div class="locked-handle" title="Email 為固定第一欄，無法移動">${mi('lock')}</div>`:`<div class="drag-handle" title="拖曳調整順序" draggable="true">${mi('drag_indicator')}<span>拖曳排序</span></div>`;
  let body='';
  if(b.type==='email')body=`<div class="q-title">${esc(b.title||'Email')} <span class="req">*</span></div><div class="form-input">example@email.com</div><div class="email-lock">${mi('lock')} ${esc(b.desc||'系統固定欄位・每個 Email 僅能報名一次')}</div>`;
  if(b.type==='heading')body=`<div class="heading-block ${b.align==='center'?'align-center':''}">${esc(b.title||'大標題')}</div>`;
  if(b.type==='subheading')body=`<div class="subheading-block ${b.align==='center'?'align-center':''}">${esc(b.title||'小標題')}</div>`;
  if(b.type==='short')body=`<div class="q-title">${esc(b.title||'簡答')}${req(b)}</div>${descHtml(b)}<div class="form-input">${esc(b.placeholder||'請輸入內容')}</div>`;
  if(b.type==='long')body=`<div class="q-title">${esc(b.title||'詳答')}${req(b)}</div>${descHtml(b)}<div class="form-textarea long-${b.height||'medium'}">${esc(b.placeholder||'請輸入內容')}</div>`;
  if(b.type==='radio')body=`<div class="q-title">${esc(b.title||'單選')}${req(b)}</div>${descHtml(b)}${(b.options||[]).map(o=>`<div class="choice"><span class="radio-dot"></span>${esc(o)}</div>`).join('')}${b.other?`<div class="choice"><span class="radio-dot"></span>其他：[________]</div>`:''}`;
  if(b.type==='checkbox')body=`<div class="q-title">${esc(b.title||'複選')}${req(b)}</div>${descHtml(b)}${(b.options||[]).map(o=>`<div class="choice"><span class="check-dot"></span>${esc(o)}</div>`).join('')}${b.other?`<div class="choice"><span class="check-dot"></span>其他：[________]</div>`:''}`;
  if(b.type==='select')body=`<div class="q-title">${esc(b.title||'下拉選單')}${req(b)}</div>${descHtml(b)}<div class="form-select">${esc(b.placeholder||'請選擇')} ${mi('arrow_drop_down')}</div>`;
  if(b.type==='grid'){
    const rows=b.rows||['列 1','列 2'], cols=b.cols||['選項 A','選項 B'];
    body=`<div class="q-title">${esc(b.title||'單選表格')}${req(b)}</div>${descHtml(b)}<div class="grid-preview" style="grid-template-columns:1.4fr repeat(${cols.length},1fr)"><span></span>${cols.map(c=>`<b>${esc(c)}</b>`).join('')}${rows.map(r=>`<span>${esc(r)}</span>${cols.map(()=>'<i>○</i>').join('')}`).join('')}</div>`;
  }
  if(b.type==='date')body=`<div class="q-title">${esc(b.title||'日期')}${req(b)}</div>${descHtml(b)}<div class="form-input">YYYY / MM / DD</div>`;
  if(b.type==='time')body=`<div class="q-title">${esc(b.title||'時間')}${req(b)}</div>${descHtml(b)}<div class="form-input">HH : MM</div>`;
  if(b.type==='paragraph')body=`<div class="paragraph-block ${b.align==='center'?'align-center':''}">${esc(b.text||'內文')}</div>`;
  if(b.type==='image')body=b.dataUrl?`<div class="image-preview-block size-${b.size||'large'}"><img src="${b.dataUrl}" alt="${esc(b.alt||'')}" /></div>`:`<div class="image-placeholder size-${b.size||'large'}">${mi('image')}<span>圖片區塊</span></div>`;
  if(b.type==='divider')body=`<div class="divider"></div>`;
  if(b.type==='spacer')body=`<div class="spacer" style="height:${b.height==='small'?16:b.height==='large'?54:30}px"></div>`;
  return `<div class="block ${b.id===selectedBlockId?'selected':''}" data-id="${b.id}" data-block="${b.type}" draggable="${b.locked?'false':'true'}">${drag}${b.locked?'':`<button class="block-menu" title="刪除區塊">${mi('delete')}</button>`}${body}</div>`;
}
function formBlocks(){return editorBlocks.map(renderEditorBlock).join('')}
function toggleRow(label,key,on,locked=false,help=''){return `<div class="toggle-row"><div><b class="small">${label}</b>${help?`<div class="help">${help}</div>`:''}</div><div class="switch ${on?'on':''} ${locked?'locked-switch':''} ${locked?'':'setting-switch'}" ${locked?'':`data-toggle="${key}"`}></div></div>`}
function optionRows(values,key){return `<div class="option-list">${(values||[]).map((v,i)=>`<div class="option-row"><input data-list="${key}" data-index="${i}" value="${esc(v)}"><button class="icon-mini" data-remove-list="${key}" data-index="${i}" title="刪除選項">${mi('delete')}</button></div>`).join('')}</div><button class="btn soft" style="width:100%" data-add-list="${key}">${mi('add')}新增${key==='rows'?'列':key==='cols'?'欄':'選項'}</button>`}
function settingsPanel(block=currentBlock()){
  if(!block)return '<p class="help">請選擇一個元件。</p>';
  const title=block.type==='email'?'系統 Email 欄位':({short:'簡答設定',long:'詳答設定',radio:'單選設定',checkbox:'複選設定',select:'下拉選單設定',grid:'單選表格設定',date:'日期設定',time:'時間設定',heading:'大標題設定',subheading:'小標題設定',paragraph:'內文設定',image:'圖片設定',divider:'分隔線',spacer:'留白設定'})[block.type];
  let h=`<div class="settings-title">${title}</div>`;
  const textField=(label,key,value,textarea=false)=>`<div class="field"><label>${label}</label>${textarea?`<textarea data-prop="${key}" placeholder="選填">${esc(value||'')}</textarea>`:`<input data-prop="${key}" value="${esc(value||'')}">`}</div>`;
  if(block.type==='email') return h+textField('顯示名稱','title',block.title)+textField('說明文字','desc',block.desc,true)+toggleRow('必填','required',true,true,'此設定無法更改')+toggleRow('重複報名判定','dedupe',true,true,'系統固定用途');
  if(['short','long','radio','checkbox','select','grid','date','time'].includes(block.type))h+=textField('題目','title',block.title)+textField('說明文字','desc',block.desc,true);
  if(['short','long'].includes(block.type))h+=textField('Placeholder','placeholder',block.placeholder);
  if(block.type==='long')h+=`<div class="field"><label>輸入框初始高度</label><select data-prop="height"><option value="small" ${block.height==='small'?'selected':''}>小</option><option value="medium" ${(!block.height||block.height==='medium')?'selected':''}>中</option><option value="large" ${block.height==='large'?'selected':''}>大</option></select></div>`;
  if(['radio','checkbox'].includes(block.type)){h+=`<div class="settings-subtitle">選項</div>${optionRows(block.options,'options')}`+toggleRow('加入「其他」','other',!!block.other);}
  if(block.type==='select'){h+=textField('Placeholder','placeholder',block.placeholder)+`<div class="settings-subtitle">選項</div>${optionRows(block.options,'options')}`;}
  if(block.type==='grid'){h+=`<div class="settings-subtitle">列</div>${optionRows(block.rows,'rows')}<div class="settings-subtitle">欄</div>${optionRows(block.cols,'cols')}`+toggleRow('每一列都必須回答','everyRow',!!block.everyRow);}
  if(['short','long','radio','checkbox','select','grid','date','time'].includes(block.type))h+=toggleRow('必填','required',!!block.required);
  if(['heading','subheading'].includes(block.type)){h+=textField('文字','title',block.title)+`<div class="field"><label>對齊</label><select data-prop="align"><option value="left" ${block.align!=='center'?'selected':''}>靠左</option><option value="center" ${block.align==='center'?'selected':''}>置中</option></select></div>`;}
  if(block.type==='paragraph'){h+=textField('內容','text',block.text,true)+`<div class="field"><label>對齊</label><select data-prop="align"><option value="left" ${block.align!=='center'?'selected':''}>靠左</option><option value="center" ${block.align==='center'?'selected':''}>置中</option></select></div>`;}
  if(block.type==='image'){h+=`<input type="file" id="imageFileInput" accept="image/*" style="display:none"><button class="btn soft" style="width:100%" id="chooseImageBtn">${mi('upload')}選擇圖片</button><div class="field"><label>替代文字</label><input data-prop="alt" value="${esc(block.alt||'')}"></div><div class="field"><label>尺寸</label><select data-prop="size"><option value="small" ${block.size==='small'?'selected':''}>小</option><option value="medium" ${block.size==='medium'?'selected':''}>中</option><option value="large" ${(!block.size||block.size==='large')?'selected':''}>大</option><option value="full" ${block.size==='full'?'selected':''}>滿寬</option></select></div><p class="help">此頁面只在瀏覽器內預覽圖片；正式版儲存草稿時才會上傳 GitHub。</p>`;}
  if(block.type==='divider')h+=`<p class="help">此元件沒有額外設定。</p>`;
  if(block.type==='spacer')h+=`<div class="field"><label>高度</label><select data-prop="height"><option value="small" ${block.height==='small'?'selected':''}>小</option><option value="medium" ${(!block.height||block.height==='medium')?'selected':''}>中</option><option value="large" ${block.height==='large'?'selected':''}>大</option></select></div>`;
  return h;
}
function editorActionButtons(){return editorPublished?`<button class="btn primary" id="saveEditBtn">儲存編輯</button>`:`<button class="btn" id="saveDraftBtn">儲存草稿</button><button class="btn primary" id="publishBtn">發布</button>`}
function editorPageSwitch(){return `<div class="page-switch-wrap"><span class="page-switch-label">編輯頁面</span><div class="page-switch"><button class="${editorPage==='form'?'active':''}" data-editor-page="form">${mi('description')} 報名表單</button><button class="${editorPage==='success'?'active':''}" data-editor-page="success">${mi('task_alt')} 報名成功頁</button></div></div>`}
function successPageCanvas(){return `<div class="form-sheet"><div class="form-accent"></div><div class="form-body"><div class="success-editor-fixed"><div class="success-icon">${mi('check_circle')}</div><div class="event-title" style="font-size:30px">報名成功！</div><div class="event-desc">您的報名資料已成功送出。</div><div class="success-code-box"><span class="muted small">報名編號</span><b>#0028</b></div><div class="summary-preview"><b>本次填寫內容</b><div class="summary-line"><span>Email</span><span>amy@example.com</span></div><div class="summary-line"><span>姓名</span><span>Amy</span></div></div><div class="save-reminder">${mi('photo_camera')} <div><b>請截圖保存</b><div class="help">本頁面關閉或重新整理後，將無法再次查看此次提交內容。</div></div></div></div><div class="editable-success-note"><div class="drag-handle static">${mi('edit')}<span>管理員補充說明</span></div><div class="paragraph-block">${esc(successNote)}</div></div></div></div>`}

function blockOutlineLabel(b){if(b.type==='email')return 'Email（固定）';if(['short','long','radio','checkbox','select','grid','date','time','heading','subheading'].includes(b.type))return b.title||'未命名區塊';if(b.type==='paragraph')return (b.text||'內文').slice(0,18);return ({image:'圖片',divider:'分隔線',spacer:'留白'})[b.type]||b.type}
function editorSideContent(){if(editorSideTab==='outline'){return `<div class="seg editor-tabs" style="margin-bottom:12px"><button data-side-tab="components">元件</button><button class="active" data-side-tab="outline">大綱</button></div><div class="outline-help">點擊項目可快速定位到表單區塊；Email 固定第一欄，其餘項目也可以在大綱中拖曳調整順序。</div><div class="outline-list" id="outlineList">${editorBlocks.map(b=>`<button class="outline-item ${b.id===selectedBlockId?'active':''}" data-outline-id="${b.id}" draggable="${b.locked?'false':'true'}">${b.locked?`<span class="outline-lock">${mi('lock')}</span>`:`<span class="outline-drag">${mi('drag_indicator')}</span>`}<span class="outline-label">${esc(blockOutlineLabel(b))}</span></button>`).join('')}</div><div class="side-title">活動資訊</div><button class="btn soft" style="width:100%" id="activitySettingsBtn">${mi('settings')}活動基本設定</button>`}
return `<div class="seg editor-tabs" style="margin-bottom:12px"><button class="active" data-side-tab="components">元件</button><button data-side-tab="outline">大綱</button></div><div class="side-title">表單欄位</div><div class="tool-list"><button class="tool" data-add="short">${mi('short_text')}簡答</button><button class="tool" data-add="long">${mi('notes')}詳答</button><button class="tool" data-add="radio">${mi('radio_button_checked')}單選</button><button class="tool" data-add="checkbox">${mi('check_box')}複選</button><button class="tool" data-add="select">${mi('arrow_drop_down_circle')}下拉選單</button><button class="tool" data-add="grid">${mi('grid_on')}單選表格</button><button class="tool" data-add="date">${mi('calendar_month')}日期</button><button class="tool" data-add="time">${mi('schedule')}時間</button></div><div class="side-title">內容元件</div><div class="tool-list"><button class="tool" data-add="heading">${mi('title')}大標題</button><button class="tool" data-add="subheading">${mi('text_fields')}小標題</button><button class="tool" data-add="paragraph">${mi('subject')}內文</button><button class="tool" data-add="image">${mi('image')}圖片</button><button class="tool" data-add="divider">${mi('horizontal_rule')}分隔線</button><button class="tool" data-add="spacer">${mi('height')}留白</button></div><div class="side-title">活動資訊</div><button class="btn soft" style="width:100%" id="activitySettingsBtn">${mi('settings')}活動基本設定</button><div class="help" style="margin-top:10px">設定活動名稱、專屬網址、開放／截止時間、初始名額與公開設定。時間皆以 KST（UTC+9）為基準。</div>`}
function bindOutline(){document.querySelectorAll('[data-side-tab]').forEach(b=>b.onclick=()=>{editorSideTab=b.dataset.sideTab;renderEditor()});if(editorSideTab!=='outline')return;document.querySelectorAll('[data-outline-id]').forEach(item=>{item.onclick=e=>{if(e.target.closest('.outline-drag'))return;selectedBlockId=item.dataset.outlineId;const target=document.querySelector(`[data-id="${selectedBlockId}"]`);document.querySelectorAll('.outline-item').forEach(x=>x.classList.toggle('active',x===item));document.querySelectorAll('.block').forEach(x=>x.classList.toggle('selected',x.dataset.id===selectedBlockId));if(target)target.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('#settingsPanel').innerHTML=settingsPanel();bindSettingsPanel()};if(item.draggable){item.addEventListener('dragstart',()=>item.classList.add('dragging'));item.addEventListener('dragend',()=>item.classList.remove('dragging'));item.addEventListener('dragover',e=>e.preventDefault());item.addEventListener('drop',e=>{e.preventDefault();const dragged=document.querySelector('.outline-item.dragging');if(!dragged||dragged===item)return;const from=editorBlocks.findIndex(b=>b.id===dragged.dataset.outlineId),to=editorBlocks.findIndex(b=>b.id===item.dataset.outlineId);const [moved]=editorBlocks.splice(from,1);editorBlocks.splice(to,0,moved);renderEditor();toast('已從大綱調整區塊順序')})}})}

function renderEditor(){app.innerHTML=`<div class="editor"><div class="topbar editor-topbar"><div class="brand editor-brand"><div class="brandmark">E</div><span>FORM BUILDER</span></div><button class="btn icon" data-nav="dashboard" title="返回活動管理">${mi('arrow_back')}</button><div class="editor-title">${esc(activityConfig.name)}</div><span class="badge ${editorPublished?'open':'draft'}">${editorPublished?'已發布':'草稿'}</span><span class="save-note">最後儲存：${editorPublished?'2026/08/20 22:10':'尚未儲存'}</span><div class="top-actions"><button class="btn" id="previewBtn">${mi('visibility')}預覽表單</button>${editorActionButtons()}</div></div><div class="editor-shell"><aside class="side">${editorSideContent()}</aside><main class="canvas-wrap"><div class="canvas">${editorPageSwitch()}<div class="canvas-head secondary"><span class="badge upcoming">手機版預覽來源</span><span class="drag-tip">${mi('drag_indicator')} ${editorPage==='form'?'Email 以外的區塊皆可拖曳排序':'成功頁固定資訊不可移除'}</span></div>${editorPage==='form'?`<div class="form-sheet"><div class="form-accent"></div><div class="form-body"><div class="event-title">${esc(activityConfig.name)}</div><div class="event-desc">請填寫以下報名資訊。活動相關說明由管理員自行編輯並保持原始語言。</div><div id="blocksContainer">${formBlocks()}</div></div></div>`:successPageCanvas()}</div></main><aside class="side right" id="settingsPanel">${editorPage==='form'?settingsPanel():`<h3>報名成功頁</h3><p class="help">報名成功、報名編號、填寫摘要與截圖提示為系統固定內容。管理員只需編輯額外補充內容。</p><div class="field"><label>補充說明</label><textarea id="successNoteInput">${esc(successNote)}</textarea></div>`}</aside></div></div>${protoNav()}`;bind();bindEditor();}
function bindEditor(){
  bindOutline();
  if(editorPage==='form'){bindEditorBlocks();bindSettingsPanel();}
  else document.querySelector('#successNoteInput')?.addEventListener('input',e=>{successNote=e.target.value;const p=document.querySelector('.editable-success-note .paragraph-block');if(p)p.textContent=successNote});
  document.querySelector('#previewBtn').onclick=()=>{previewFromEditor=true;editorPage==='success'?renderSuccess():renderPublic()};
  document.querySelector('#activitySettingsBtn').onclick=showActivitySettings;
  document.querySelectorAll('[data-editor-page]').forEach(b=>b.onclick=()=>{editorPage=b.dataset.editorPage;renderEditor()});
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(editorPage!=='form'){toast('請先切換到「報名表單」再新增元件');return}addBlock(b.dataset.add)});
  document.querySelector('#saveDraftBtn')?.addEventListener('click',saveDraftLive);
  document.querySelector('#publishBtn')?.addEventListener('click',publishLive);
  document.querySelector('#saveEditBtn')?.addEventListener('click',savePublishedEditLive);
}
function bindSettingsPanel(){
  const panel=document.querySelector('#settingsPanel'), block=currentBlock(); if(!panel||!block)return;
  panel.querySelectorAll('[data-prop]').forEach(el=>{const ev=el.tagName==='SELECT'?'change':'input';el.addEventListener(ev,e=>{block[e.target.dataset.prop]=e.target.value;refreshSelectedBlock(false)});});
  panel.querySelectorAll('[data-toggle]').forEach(el=>el.onclick=()=>{const key=el.dataset.toggle;block[key]=!block[key];el.classList.toggle('on',!!block[key]);refreshSelectedBlock(false)});
  panel.querySelectorAll('[data-list]').forEach(el=>el.addEventListener('input',e=>{const key=e.target.dataset.list, idx=+e.target.dataset.index;block[key][idx]=e.target.value;refreshSelectedBlock(false)}));
  panel.querySelectorAll('[data-add-list]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.addList;block[key]=block[key]||[];block[key].push(key==='rows'?`列 ${block[key].length+1}`:key==='cols'?`選項 ${block[key].length+1}`:`選項 ${block[key].length+1}`);renderSettingsOnly()});
  panel.querySelectorAll('[data-remove-list]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.removeList, idx=+btn.dataset.index;if((block[key]||[]).length<=1){toast('至少需要保留一個選項');return}block[key].splice(idx,1);renderSettingsOnly()});
  const choose=panel.querySelector('#chooseImageBtn'), file=panel.querySelector('#imageFileInput'); if(choose&&file){choose.onclick=()=>file.click();file.onchange=e=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{block.dataUrl=reader.result;refreshSelectedBlock();};reader.readAsDataURL(f)}}
}
function renderSettingsOnly(){const p=document.querySelector('#settingsPanel');if(p){p.innerHTML=settingsPanel();bindSettingsPanel()}refreshSelectedBlock(false)}
function refreshSelectedBlock(rebind=true){const old=document.querySelector(`[data-id="${selectedBlockId}"]`);if(old){old.outerHTML=renderEditorBlock(currentBlock());bindEditorBlocks();} if(rebind)renderSettingsOnly();}
function bindEditorBlocks(){
  const container=document.querySelector('#blocksContainer'); if(!container)return;
  document.querySelectorAll('.block').forEach(el=>{
    const menuBtn=el.querySelector('.block-menu');
    if(menuBtn)menuBtn.addEventListener('click',e=>{e.stopPropagation();const id=el.dataset.id;editorBlocks=editorBlocks.filter(b=>b.id!==id);selectedBlockId=editorBlocks.find(b=>!b.locked)?.id||'email';refreshEditorBlocks();toast('區塊已刪除')});
    el.addEventListener('click',e=>{if(e.target.closest('.drag-handle')||e.target.closest('.block-menu'))return;selectedBlockId=el.dataset.id;document.querySelectorAll('.block').forEach(x=>x.classList.toggle('selected',x.dataset.id===selectedBlockId));const p=document.querySelector('#settingsPanel');p.innerHTML=settingsPanel();bindSettingsPanel();});
    if(el.dataset.id!=='email'){
      el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.id);el.classList.add('dragging')});
      el.addEventListener('dragend',()=>el.classList.remove('dragging'));
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over')});
      el.addEventListener('dragleave',()=>el.classList.remove('drag-over'));
      el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drag-over');const fromId=e.dataTransfer.getData('text/plain'),toId=el.dataset.id;if(!fromId||fromId==='email'||toId==='email'||fromId===toId)return;const from=editorBlocks.findIndex(x=>x.id===fromId),to=editorBlocks.findIndex(x=>x.id===toId);const [moved]=editorBlocks.splice(from,1);editorBlocks.splice(to,0,moved);selectedBlockId=fromId;refreshEditorBlocks();});
    }
  });
  container.addEventListener('dragover',e=>e.preventDefault());
}
function refreshEditorBlocks(){const c=document.querySelector('#blocksContainer');if(!c)return;c.innerHTML=formBlocks();bindEditorBlocks();const p=document.querySelector('#settingsPanel');if(p){p.innerHTML=settingsPanel();bindSettingsPanel()}}
function addBlock(type){
  const id=type+'_'+Date.now();const defaults={short:{title:'簡答題目',desc:'',placeholder:'請輸入內容',required:false},long:{title:'詳答題目',desc:'',placeholder:'請輸入內容',required:false,height:'medium'},radio:{title:'單選題目',desc:'',required:false,options:['選項 1','選項 2'],other:false},checkbox:{title:'複選題目',desc:'',required:false,options:['選項 1','選項 2'],other:false},select:{title:'下拉選單',desc:'',placeholder:'請選擇',required:false,options:['選項 1','選項 2']},grid:{title:'單選表格',desc:'',required:false,rows:['列 1','列 2'],cols:['選項 A','選項 B'],everyRow:false},date:{title:'日期',desc:'',required:false},time:{title:'時間',desc:'',required:false},heading:{title:'大標題',align:'left'},subheading:{title:'小標題',align:'left'},paragraph:{text:'請輸入內文',align:'left'},image:{size:'large',alt:'',dataUrl:''},divider:{},spacer:{height:'medium'}};editorBlocks.push({id,type,...(defaults[type]||{})});selectedBlockId=id;refreshEditorBlocks();document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});toast('已新增元件，可在右側調整設定');}

function showActivitySettings(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="activitySettingsModal"><div class="modal modal-wide"><div class="modal-title-row"><div><h3>活動基本設定</h3><p>此處是整個活動層級的設定，和右側「元件設定」不同。</p></div><button class="btn icon" id="closeActivitySettings">${mi('close')}</button></div><div class="settings-grid"><div class="field"><label>活動名稱</label><input id="cfgName" value="${esc(activityConfig.name)}"></div><div></div><div class="field full-span"><label>專屬網址</label><div class="url-field-wrap"><span class="url-prefix">https://eson1228.com/event/</span><input id="cfgSlug" value="${esc(activityConfig.slug)}" placeholder="eson-birthday-2026"></div><div class="url-help">僅限英文字母、數字與連字號（-），例如：<b>eson-birthday-2026</b></div></div><div class="field"><label>表單開放時間（KST）</label><input id="cfgStart" type="datetime-local" value="${activityConfig.start}"></div><div class="field"><label>表單關閉時間（KST）</label><input id="cfgEnd" type="datetime-local" value="${activityConfig.end}"></div><div class="field"><label>初始名額</label><input id="cfgCapacity" type="number" min="1" value="${activityConfig.capacity}"></div><div class="field"><label>前台活動列表</label><select id="cfgList"><option value="yes" ${activityConfig.showInList?'selected':''}>顯示</option><option value="no" ${!activityConfig.showInList?'selected':''}>不顯示</option></select></div></div>${toggleRow('顯示目前報名人數','cfgShowCount',activityConfig.showCount)}<div class="modal-actions"><button class="btn" id="cancelActivitySettings">取消</button><button class="btn primary" id="saveActivitySettings">儲存設定</button></div></div></div>`);const close=()=>document.querySelector('#activitySettingsModal')?.remove();document.querySelector('#closeActivitySettings').onclick=close;document.querySelector('#cancelActivitySettings').onclick=close;const sw=document.querySelector('[data-toggle="cfgShowCount"]');if(sw)sw.onclick=()=>sw.classList.toggle('on');const slugInput=document.querySelector('#cfgSlug');if(slugInput)slugInput.addEventListener('input',()=>{slugInput.value=slugInput.value.toLowerCase().replace(/[^a-z0-9-]/g,'')});document.querySelector('#saveActivitySettings').onclick=()=>{activityConfig={...activityConfig,name:document.querySelector('#cfgName').value,slug:document.querySelector('#cfgSlug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,''),start:document.querySelector('#cfgStart').value,end:document.querySelector('#cfgEnd').value,capacity:+document.querySelector('#cfgCapacity').value||1,showInList:document.querySelector('#cfgList').value==='yes',showCount:sw?.classList.contains('on')};close();renderEditor();toast('活動基本設定已更新')};}

function showCapacityModal(eventId){
  const ev=demoEvents.find(x=>x.id===eventId);
  if(!ev)return;

  const currentTotal=Number(ev.cap)||0;
  const raw=ev.raw||{};
  const now=new Date();
  const close=raw.closeTime?new Date(String(raw.closeTime).replace(/\//g,'-').replace(' ','T')+'+09:00'):null;
  const alreadyClosed=!!(close&&now>=close);

  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="capacityModal"><div class="modal">
    <h3>再次開放增收</h3>
    <p>目前總名額為 <b>${currentTotal}</b> 人。增加名額後不會因取消、退款或作廢自動釋出名額。</p>
    <div class="field"><label>本次增加名額</label><input id="capAddCount" type="number" min="1" step="1" value="5"></div>
    <div class="field"><label>${alreadyClosed?'新的關閉時間':'新的關閉時間（可選）'} <span class="tiny muted">KST</span></label><input id="capNewClose" type="datetime-local"></div>
    ${alreadyClosed?'<div class="reuse-confirm-note">此活動已因時間截止。確認後會立即重新開放，並持續到你設定的「新的關閉時間」。</div>':''}
    <div class="modal-actions"><button class="btn" id="capCancel">取消</button><button class="btn primary" id="capConfirm">確認再次開放</button></div>
  </div></div>`);

  const closeModal=()=>document.querySelector('#capacityModal')?.remove();
  document.querySelector('#capCancel').onclick=closeModal;

  document.querySelector('#capConfirm').onclick=async()=>{
    const btn=document.querySelector('#capConfirm');
    const addCount=Number(document.querySelector('#capAddCount').value);
    const newCloseTime=kstLocalToIso(document.querySelector('#capNewClose').value);

    if(!Number.isInteger(addCount)||addCount<=0){
      alert('請輸入大於 0 的增加名額');
      return;
    }
    if(alreadyClosed&&!newCloseTime){
      alert('活動已截止，請設定新的關閉時間');
      return;
    }

    try{
      btn.disabled=true;
      btn.textContent='正在儲存中...';
      showSavingNotice('正在儲存中…');
      const result=await apiPost('increaseCapacity',{eventId,addCount,newCloseTime});
      hideSavingNotice();
      closeModal();
      sessionStorage.removeItem('eson_event_dashboard_cache_v1');
      if(result&&typeof result.added!=='undefined'&&typeof result.newTotal!=='undefined'){
        toast(`已增加 ${result.added} 個名額，總名額為 ${result.newTotal}`);
      }else{
        toast('再次開放設定已儲存，正在重新讀取最新資料');
      }
      await loadDashboardFromApi();
    }catch(err){
      hideSavingNotice();
      btn.disabled=false;
      btn.textContent='確認再次開放';
      alert('再次開放失敗：'+err.message);
    }
  };
}
let liveResponses=[];
let responseSearchText='';
let responsePaymentFilter='all';
let responseStatusFilter='all';
function responseQuestionLabel(key){
  const block=(editorBlocks||[]).find(b=>String(b.id)===String(key));
  if(block){
    if(block.type==='email') return block.title||'Email';
    return block.title||block.text||block.content||String(key);
  }
  return String(key)==='email' ? 'Email' : String(key);
}

function answerBlocksInFormOrder(){
  return (editorBlocks||[]).filter(b=>
    ['email','short','long','radio','checkbox','select','grid','date','time'].includes(b.type)
  );
}

function orderedAnswerEntries(response){
  const answers=response?.answers||{};
  const blocks=answerBlocksInFormOrder();
  const seen=new Set();
  const ordered=[];

  for(const block of blocks){
    const key=String(block.id);
    seen.add(key);
    ordered.push({
      key,
      label:responseQuestionLabel(key),
      value:Object.prototype.hasOwnProperty.call(answers,key) ? answers[key] : ''
    });
  }

  // Safe fallback for legacy/unknown fields not present in current Form Builder.
  for(const [key,value] of Object.entries(answers)){
    if(seen.has(String(key))) continue;
    ordered.push({
      key:String(key),
      label:responseQuestionLabel(key),
      value
    });
  }
  return ordered;
}

function firstResponseAnswer(response){
  const answers=response?.answers||{};
  const firstBlock=answerBlocksInFormOrder().find(b=>b.type!=='email');
  if(!firstBlock) return '—';
  const value=answers[firstBlock.id];
  const display=prettyAnswer(value);
  return display || '—';
}
function prettyAnswer(v){if(Array.isArray(v))return v.join('、');if(v&&typeof v==='object')return Object.entries(v).map(([k,x])=>`${k}: ${x}`).join(' / ');return v==null?'':String(v)}
function filteredResponses(){const q=String(typeof responseSearchText==='undefined'?'':responseSearchText).trim().toLowerCase();return liveResponses.filter(r=>{const a=Object.values(r.answers||{}).map(prettyAnswer).join(' ');const hay=[r.registrationNumber,r.email,a,r.adminNote].join(' ').toLowerCase();return(!q||hay.includes(q))&&(responsePaymentFilter==='all'||r.paymentStatus===responsePaymentFilter)&&(responseStatusFilter==='all'||r.registrationStatus===responseStatusFilter)})}
function responseRowsHtmlLive(){
  const rows=filteredResponses();
  if(!rows.length)return `<tr><td colspan="7"><div class="empty-state">${mi('inbox')}<b>目前沒有符合條件的報名資料</b></div></td></tr>`;
  return rows.map(r=>{
    const display=firstResponseAnswer(r);
    return `<tr data-response-row="${r.responseId}" tabindex="0" role="button" style="cursor:pointer">
      <td><b>${esc(r.registrationNumber)}</b></td>
      <td>${esc(r.email)}</td>
      <td>${esc(display)}</td>
      <td>${esc(r.submittedAt)}</td>
      <td><span class="badge ${r.paymentStatus==='已確認'?'open':r.paymentStatus==='已退款'?'closed':'upcoming'}">${esc(r.paymentStatus)}</span></td>
      <td>${esc(r.registrationStatus)}</td>
      <td>${esc(r.adminNote||'—')}</td>
    </tr>`;
  }).join('');
}
async function loadResponsesLive(){const body=document.querySelector('#responseRows');if(body)body.innerHTML=`<tr><td colspan="7"><div class="empty-state">${mi('progress_activity')}<b>正在讀取資料...</b></div></td></tr>`;try{const d=(await apiGet('getResponses',{eventId:currentEventId})).data;liveResponses=d.items||[];editorBlocks=d.blocks||editorBlocks||[];document.querySelector('#responseEventTitle').textContent=d.event?.name||'報名資料';document.querySelector('#statCapacity').textContent=`${d.stats.acceptedCount} / ${d.stats.totalCapacity}`;document.querySelector('#statPaid').textContent=d.stats.paidConfirmed;document.querySelector('#statUnpaid').textContent=d.stats.unpaid;refreshResponseRowsLive()}catch(err){if(body)body.innerHTML=`<tr><td colspan="7"><div class="empty-state">${mi('error')}<b>讀取失敗</b><span>${esc(err.message)}</span></div></td></tr>`}}
function refreshResponseRowsLive(){
  const body=document.querySelector('#responseRows');
  if(!body)return;
  body.innerHTML=responseRowsHtmlLive();
  body.onclick=e=>{
    const row=e.target.closest('[data-response-row]');
    if(!row||!body.contains(row))return;
    openResponseDrawerLive(row.dataset.responseRow);
  };
  body.onkeydown=e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const row=e.target.closest('[data-response-row]');
    if(!row||!body.contains(row))return;
    e.preventDefault();
    openResponseDrawerLive(row.dataset.responseRow);
  };
}
function resetResponseSearchState(){
  responseSearchText='';
  try{ if('responseSearch' in window && typeof window.responseSearch!=='string'){} }catch(e){}
}
function renderResponses(){if(!currentEventId){navigate('dashboard');return}app.innerHTML=`${topbar()}<main class="page"><div class="page-head"><div><button class="btn small" data-nav="dashboard">${mi('arrow_back')} 活動列表</button><h1 id="responseEventTitle" style="margin-top:18px">報名資料</h1><div class="muted">報名資料管理 · KST</div></div><div class="actions"><button class="btn" id="openResponsePublicBtn">${mi('open_in_new')} 開啟表單頁面</button><button class="btn" id="editPublishedFormBtn">編輯表單</button></div></div><div class="response-top compact"><div class="card metric"><div class="muted small">目前名額</div><div class="num" id="statCapacity">—</div><div class="tiny muted">目前報名 / 設定總名額</div></div><div class="card metric"><div class="muted small">已確認入金</div><div class="num" id="statPaid">—</div></div><div class="card metric"><div class="muted small">尚未入金</div><div class="num" id="statUnpaid">—</div></div></div><div class="toolbar"><div class="search material-search">${mi('search')}<input id="responseSearch" placeholder="搜尋 Email、姓名或回答內容"></div><div class="filter-row"><select id="paymentFilter"><option value="all">全部入金狀態</option><option>未確認</option><option>已確認</option><option>已退款</option></select><select id="statusFilter"><option value="all">全部報名狀態</option><option>有效</option><option>取消</option><option>作廢</option></select></div></div><div class="card table-card"><table class="table"><thead><tr><th>編號</th><th>Email</th><th>第一回答</th><th>報名時間（KST）</th><th>入金</th><th>狀態</th><th>備註</th></tr></thead><tbody id="responseRows"></tbody></table></div></main>${protoNav()}`;bind();bindTopMenus();document.querySelector('#responseSearch').oninput=e=>{responseSearchText=e.target.value;refreshResponseRowsLive()};document.querySelector('#paymentFilter').onchange=e=>{responsePaymentFilter=e.target.value;refreshResponseRowsLive()};document.querySelector('#statusFilter').onchange=e=>{responseStatusFilter=e.target.value;refreshResponseRowsLive()};document.querySelector('#editPublishedFormBtn').onclick=()=>loadEventForEditor(currentEventId);document.querySelector('#openResponsePublicBtn').onclick=()=>{const ev=demoEvents.find(x=>x.id===currentEventId);if(ev?.slug)window.open(PUBLIC_EVENT_BASE+'?event='+encodeURIComponent(ev.slug),'_blank')};loadResponsesLive()}
function openResponseDrawerLive(responseId){
  const r=liveResponses.find(x=>String(x.responseId)===String(responseId));
  if(!r){
    console.warn('找不到報名資料',responseId);
    return;
  }
  const answers=orderedAnswerEntries(r).map(item=>
    `<div class="data-pair"><b>${esc(item.label)}</b><span>${esc(prettyAnswer(item.value))}</span></div>`
  ).join('');document.body.insertAdjacentHTML('beforeend',`<div class="drawer-backdrop" id="drawerBg"></div><aside class="drawer" id="drawer"><div class="drawer-head"><div><b style="font-size:20px">${esc(r.registrationNumber)} · ${esc(r.email)}</b><div class="tiny muted">${esc(r.submittedAt)} KST</div></div><button class="btn icon close" id="drawerClose">${mi('close')}</button></div><div class="section-label">報名者提交資料</div>${answers}<div class="section-label">管理資料</div><div class="field"><label>入金狀態</label><select id="drawerPayment"><option ${r.paymentStatus==='未確認'?'selected':''}>未確認</option><option ${r.paymentStatus==='已確認'?'selected':''}>已確認</option><option ${r.paymentStatus==='已退款'?'selected':''}>已退款</option></select></div><div class="field"><label>報名狀態</label><select id="drawerStatus"><option ${r.registrationStatus==='有效'?'selected':''}>有效</option><option ${r.registrationStatus==='取消'?'selected':''}>取消</option><option ${r.registrationStatus==='作廢'?'selected':''}>作廢</option></select></div><div class="field"><label>管理員備註</label><textarea class="notearea" id="drawerNote">${esc(r.adminNote||'')}</textarea></div><button class="btn primary" style="width:100%;margin-top:12px" id="drawerSave">儲存變更</button><button class="btn danger" style="width:100%;margin-top:16px" id="reuseEmailBtn" ${r.allowEmailReuse?'disabled':''}>${r.allowEmailReuse?'已允許此 Email 再次報名':'允許此 Email 再次報名'}</button></aside>`);const close=()=>{document.querySelector('#drawerBg')?.remove();document.querySelector('#drawer')?.remove()};document.querySelector('#drawerClose').onclick=close;document.querySelector('#drawerBg').onclick=close;document.querySelector('#drawerSave').onclick=async()=>{
      const btn=document.querySelector('#drawerSave');
      try{
        btn.disabled=true;
        btn.textContent='正在儲存中...';
        showSavingNotice('正在儲存中…');
        await apiPost('updateResponse',{eventId:currentEventId,responseId:r.responseId,data:{
          paymentStatus:document.querySelector('#drawerPayment').value,
          registrationStatus:document.querySelector('#drawerStatus').value,
          adminNote:document.querySelector('#drawerNote').value
        }});
        hideSavingNotice();
        close();
        toast('報名資料已更新');
        loadResponsesLive();
      }catch(err){
        hideSavingNotice();
        btn.disabled=false;
        btn.textContent='儲存變更';
        alert('儲存失敗：'+err.message);
      }
    };const reuse=document.querySelector('#reuseEmailBtn');if(reuse&&!r.allowEmailReuse)reuse.onclick=()=>{document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="reuseModal"><div class="modal"><h3>允許此 Email 再次報名？</h3><div class="reuse-confirm-note">原本的報名紀錄仍會保留，也不會自動釋放名額。</div><div class="modal-actions"><button class="btn" id="reuseCancel">取消</button><button class="btn danger" id="reuseConfirm">確認允許</button></div></div></div>`);const cm=()=>document.querySelector('#reuseModal')?.remove();document.querySelector('#reuseCancel').onclick=cm;document.querySelector('#reuseConfirm').onclick=async()=>{try{await apiPost('allowEmailReuse',{eventId:currentEventId,responseId:r.responseId});cm();close();toast('此 Email 已可再次報名');loadResponsesLive()}catch(err){alert('操作失敗：'+err.message)}}}}

async function renderPublicHome(){app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="public-content"><div class="event-title">ESON Events</div><div class="event-desc">活動報名列表</div><div id="publicEventList"><div class="muted">正在讀取資料...</div></div></div></section></div>`;try{const events=(await apiGet('listPublicEvents')).events||[];const el=document.querySelector('#publicEventList');if(!events.length){el.innerHTML='<div class="info-box">目前沒有公開活動。</div>';return}el.innerHTML=events.map(e=>{const s={open:'開放中',notstarted:'尚未開放',full:'已額滿',closed:'已截止',paused:'暫停'}[e.state]||e.state;return `<button class="card" data-public-slug="${esc(e.slug)}" style="width:100%;text-align:left;padding:18px;margin-top:12px;cursor:pointer"><b style="font-size:18px">${esc(e.name)}</b><div class="tiny muted" style="margin-top:6px">${esc(s)}${e.showRegistrationCount?` · ${e.acceptedCount}/${e.totalCapacity}`:''}</div></button>`}).join('');document.querySelectorAll('[data-public-slug]').forEach(b=>b.onclick=()=>location.href=PUBLIC_EVENT_BASE+'?event='+encodeURIComponent(b.dataset.publicSlug))}catch(err){document.querySelector('#publicEventList').innerHTML=`<div class="info-box">目前無法讀取活動列表：${esc(err.message)}</div>`}}

async function loadPublicEventBySlug(slug){
  currentPublicSlug=slug;
  app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi('progress_activity')}</div><h2>正在讀取資料...</h2><p class="muted">請稍候</p></div></section></div>`;
  try{
    const data=await apiGet('getPublicEvent',{slug});
    const detail=data&&data.event;
    if(!detail||!detail.event)throw new Error('活動資料格式不完整');

    currentEventId=detail.event.eventId;
    activityConfig={
      name:detail.event.name||'',
      slug:detail.event.slug||slug,
      start:apiDateValue(detail.event.openTime),
      end:apiDateValue(detail.event.closeTime),
      capacity:Number(detail.event.totalCapacity)||0,
      showInList:detail.event.showInEventList!==false,
      showCount:detail.event.showRegistrationCount!==false
    };
    editorBlocks=Array.isArray(detail.blocks)?detail.blocks:[];
    successNote=detail.pages?.success?.note||'';

    if(detail.state==='notstarted')return renderStatus('notstarted');
    if(detail.state==='full')return renderStatus('full');
    if(detail.state==='closed')return renderStatus('closed');
    if(detail.state==='paused')return renderStatus('paused');
    if(detail.state!=='open')throw new Error('活動目前無法開啟');

    renderPublic();
  }catch(err){
    app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi('error')}</div><h2>無法開啟表單</h2><p>${esc(err.message||'讀取失敗')}</p><button class="btn primary" onclick="location.reload()">重新讀取</button></div></section></div>`;
  }
}
function publicAnswerName(id){return 'ans_'+String(id).replace(/[^A-Za-z0-9_-]/g,'_')}
function collectPublicAnswers(){
  const answers={};
  for(const b of editorBlocks){
    if(!['email','short','long','radio','checkbox','select','grid','date','time'].includes(b.type))continue;
    const name=publicAnswerName(b.id);
    if(b.type==='checkbox'){
      answers[b.id]=[...document.querySelectorAll(`[name="${name}"]:checked`)].map(x=>x.value);
      const other=document.querySelector(`[data-other-for="${b.id}"]`);
      if(other&&other.value.trim())answers[b.id].push(other.value.trim());
    }else if(b.type==='radio'){
      const checked=document.querySelector(`[name="${name}"]:checked`);
      let v=checked?checked.value:'';
      if(v==='__other__'){
        const other=document.querySelector(`[data-other-for="${b.id}"]`);
        v=other?other.value.trim():'';
      }
      answers[b.id]=v;
    }else if(b.type==='grid'){
      const obj={};
      (b.rows||[]).forEach((r,i)=>{
        const checked=document.querySelector(`[name="${name}_${i}"]:checked`);
        obj[r]=checked?checked.value:'';
      });
      answers[b.id]=obj;
    }else{
      const el=document.querySelector(`[name="${name}"]`);
      answers[b.id]=el?el.value:'';
    }
  }
  return answers;
}
function validatePublicAnswers(answers){
  for(const b of editorBlocks){
    if(!['email','short','long','radio','checkbox','select','grid','date','time'].includes(b.type))continue;
    const v=answers[b.id];
    if(b.type==='email'&&!String(v||'').trim())return 'Email 為必填';
    if(!b.required)continue;
    if(b.type==='checkbox'&&(!Array.isArray(v)||!v.length))return '請完成必填欄位：'+(b.title||'複選');
    if(b.type==='grid'&&(b.rows||[]).some(r=>!v?.[r]))return '請完成必填欄位：'+(b.title||'單選表格');
    if(!['checkbox','grid'].includes(b.type)&&!String(v||'').trim())return '請完成必填欄位：'+(b.title||b.type);
  }
  return '';
}
async function submitPublicRegistration(){
  const answers=collectPublicAnswers();
  const err=validatePublicAnswers(answers);
  if(err){alert(err);return}
  const btn=document.querySelector('#submitBtn');
  if(btn){btn.disabled=true;btn.textContent='送出中...'}
  try{
    lastSubmission=await apiPost('submitRegistration',{slug:currentPublicSlug||activityConfig.slug,answers});
    renderSuccess();
  }catch(err){
    const map={NOT_STARTED:'報名尚未開始。',PAUSED:'目前暫停接受報名。',CLOSED:'報名已截止。',FULL:'名額已額滿。',DUPLICATE_EMAIL:'這個 Email 已經有報名紀錄。若你剛剛才送出，可能其實已經報名成功。'};
    alert(map[err.message]||('送出失敗：'+err.message));
    if(btn){btn.disabled=false;btn.textContent=i18n[currentLang].submit}
  }
}

function publicHeader(){const exit=previewFromEditor?`<button class="btn preview-exit" id="exitPreview">${mi('close')} ${i18n[currentLang].endPreview}</button>`:'';return `<div class="public-top">${exit}<select class="lang" id="langSelect"><option value="ko">한국어</option><option value="en">English</option><option value="zh">中文</option><option value="ja">日本語</option></select></div>`}
function langOptSelected(renderFn=renderPublic){setTimeout(()=>{const sel=document.querySelector('#langSelect');if(sel){sel.value=currentLang;sel.onchange=()=>{currentLang=sel.value;renderFn();}}const exit=document.querySelector('#exitPreview');if(exit)exit.onclick=()=>{previewFromEditor=false;renderEditor()}},0)}
function publicBlockHtml(b){
 const name=publicAnswerName(b.id);
 const required=b.required?' required':'';
 if(b.type==='email')return `<div class="public-field"><label>${esc(b.title||'Email')} <span class="req">*</span></label><input name="${name}" type="email" placeholder="example@email.com" required><div class="help">${esc(b.desc||'每個 Email 僅能報名一次')}</div></div>`;
 if(b.type==='heading')return `<div class="event-title ${b.align==='center'?'align-center':''}" style="font-size:26px">${esc(b.title||'大標題')}</div>`;
 if(b.type==='subheading')return `<h3 class="${b.align==='center'?'align-center':''}">${esc(b.title||'小標題')}</h3>`;
 if(b.type==='paragraph')return `<div class="event-desc ${b.align==='center'?'align-center':''}">${esc(b.text||'')}</div>`;
 if(b.type==='short')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><input name="${name}" placeholder="${esc(b.placeholder||'')}"${required}>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='long')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><textarea name="${name}" class="long-${b.height||'medium'}" placeholder="${esc(b.placeholder||'')}"${required}></textarea>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='radio')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label>${(b.options||[]).map(o=>`<label class="choice"><input type="radio" name="${name}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}${b.other?`<label class="choice"><input type="radio" name="${name}" value="__other__"> 其他</label><input data-other-for="${b.id}" placeholder="其他內容">`:''}</div>`;
 if(b.type==='checkbox')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label>${(b.options||[]).map(o=>`<label class="choice"><input type="checkbox" name="${name}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}${b.other?`<div class="choice">其他</div><input data-other-for="${b.id}" placeholder="其他內容">`:''}</div>`;
 if(b.type==='select')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><select name="${name}"${required}><option value="">${esc(b.placeholder||'請選擇')}</option>${(b.options||[]).map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;
 if(b.type==='grid'){const rows=b.rows||[],cols=b.cols||[];return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><div class="grid-preview" style="grid-template-columns:1.4fr repeat(${cols.length},1fr)"><span></span>${cols.map(c=>`<b>${esc(c)}</b>`).join('')}${rows.map((r,i)=>`<span>${esc(r)}</span>${cols.map(c=>`<label><input type="radio" name="${name}_${i}" value="${esc(c)}"></label>`).join('')}`).join('')}</div></div>`;}
 if(b.type==='date')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><input name="${name}" type="date"${required}>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='time')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><input name="${name}" type="time"${required}>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='image')return b.dataUrl?`<div class="image-preview-block size-${b.size||'large'}"><img src="${b.dataUrl}" alt="${esc(b.alt||'')}"></div>`:`<div class="image-placeholder">${mi('image')}<span>圖片區塊</span></div>`;
 if(b.type==='divider')return '<div class="divider" style="margin:18px 0"></div>';
 if(b.type==='spacer')return `<div style="height:${b.height==='small'?16:b.height==='large'?54:30}px"></div>`;
 return '';
}
function renderPublic(){const t=i18n[currentLang];app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="public-content"><div class="event-title">${esc(activityConfig.name)}</div><div class="info-box"><b>${t.open}</b><br>${t.deadline}: ${activityConfig.end.replace('T',' ')} KST (UTC+9)</div>${editorBlocks.map(publicBlockHtml).join('')}<button class="public-submit" id="submitBtn">${t.submit}</button></div></section></div>${protoNav()}`;bind();langOptSelected();document.querySelector('#submitBtn').onclick=()=>previewFromEditor?toast('預覽模式不會真的送出資料'):showConfirm();}
function showConfirm(){const t=i18n[currentLang];const answers=collectPublicAnswers();const err=validatePublicAnswers(answers);if(err){alert(err);return}document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="confirmModal"><div class="modal"><h3>${t.confirmTitle}</h3><p>${t.confirmText}</p><div class="modal-actions"><button class="btn" id="confirmBack">${t.back}</button><button class="btn primary" id="confirmYes">${t.confirm}</button></div></div></div>`);document.querySelector('#confirmBack').onclick=()=>document.querySelector('#confirmModal').remove();document.querySelector('#confirmYes').onclick=()=>{document.querySelector('#confirmModal').remove();submitPublicRegistration();}}
function renderSuccess(){const t=i18n[currentLang];const s=lastSubmission;if(!s){app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="status-page"><h2>${t.success}</h2></div></section></div>`;return}const rows=(s.summary||[]).map(x=>`<div class="item"><b>${esc(x.label)}</b>${esc(Array.isArray(x.value)?x.value.join('、'):(x.value&&typeof x.value==='object'?Object.entries(x.value).map(([k,v])=>k+': '+v).join(' / '):x.value||''))}</div>`).join('');app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi('check_circle')}</div><h2>${t.success}</h2><p>${esc(s.eventName||activityConfig.name)}</p><div class="success-code">${esc(s.registrationNumber)}</div><div class="tiny muted">${t.code}</div><div class="summary"><h3>${t.summary}</h3>${rows}</div>${successNote?`<div class="paragraph-block">${esc(successNote)}</div>`:''}<div class="screenshot-tip"><b>${t.save}</b><br>${t.saveText}</div></div></section></div>`;langOptSelected(renderSuccess);}

function formatKstDateTimeDisplay(v){
  if(!v)return '';
  const d=new Date(v);
  if(Number.isNaN(d.getTime()))return String(v);
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Seoul',
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hour12:false
  }).formatToParts(d);
  const get=t=>parts.find(x=>x.type===t)?.value||'';
  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
}
function renderStatus(type){
  const t=i18n[currentLang]||i18n.zh;
  const map={
    notstarted:{
      icon:'schedule',
      title:t.notStartedTitle||'報名尚未開始',
      desc:`將於 ${formatKstDateTimeDisplay(kstLocalToIso(activityConfig.start))} KST (UTC+9) 開放報名`
    },
    full:{
      icon:'group_off',
      title:t.fullTitle||'報名已額滿',
      desc:t.fullDesc||'目前名額已額滿。'
    },
    closed:{
      icon:'event_busy',
      title:t.closedTitle||'報名已截止',
      desc:activityConfig.end ? `報名已於 ${formatKstDateTimeDisplay(kstLocalToIso(activityConfig.end))} KST (UTC+9) 截止` : (t.closedDesc||'報名已截止。')
    },
    paused:{
      icon:'pause_circle',
      title:t.pausedTitle||'目前暫停報名',
      desc:t.pausedDesc||'請稍後再試。'
    }
  };
  const s=map[type]||map.closed;
  app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi(s.icon)}</div><h2>${esc(s.title)}</h2><p class="muted">${esc(s.desc)}</p></div></section></div>`;
  langOptSelected(()=>renderStatus(type));
}
function showMyAccount(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="accountModal"><div class="modal"><div class="modal-title-row"><h3>我的帳號</h3><button class="btn icon" id="accountClose">${mi('close')}</button></div><div class="data-pair"><b>帳號</b>Jiin</div><div class="data-pair"><b>權限</b>Owner</div><div class="field"><label>目前密碼</label><input type="password" placeholder="輸入目前密碼"></div><div class="field"><label>新密碼</label><input type="password" placeholder="輸入新密碼"></div><div class="field"><label>再次輸入新密碼</label><input type="password" placeholder="再次輸入新密碼"></div><div class="modal-actions"><button class="btn primary" id="changePassword">修改密碼</button></div></div></div>`);const close=()=>document.querySelector('#accountModal')?.remove();document.querySelector('#accountClose').onclick=close;document.querySelector('#changePassword').onclick=()=>{close();toast('密碼修改流程示意（正式版接 Firebase Auth）')};}
function showAdminManage(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="adminModal"><div class="modal modal-wide"><div class="modal-title-row"><div><h3>管理員管理</h3><p>只有 Owner 可以看到此功能。</p></div><button class="btn icon" id="adminClose">${mi('close')}</button></div><div class="admin-user-card"><div><b>Jiin</b><div class="tiny muted">Owner · 目前登入帳號</div></div><span class="badge open">Owner</span></div><div class="admin-user-card"><div><b>ESON</b><div class="tiny muted">Admin · 可修改自己的密碼</div></div><button class="btn" id="resetEsonPassword">${mi('lock_reset')}重置 ESON 密碼</button></div></div></div>`);const close=()=>document.querySelector('#adminModal')?.remove();document.querySelector('#adminClose').onclick=close;document.querySelector('#resetEsonPassword').onclick=()=>{close();showResetPassword()};}
function showResetPassword(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="resetModal"><div class="modal"><h3>重置 ESON 密碼</h3><p>你無法查看 ESON 目前的密碼。重置後原密碼將立即失效。</p><div class="field"><label>新的臨時密碼</label><input type="password"></div><div class="field"><label>再次輸入</label><input type="password"></div><div class="modal-actions"><button class="btn" id="resetCancel">取消</button><button class="btn primary" id="resetConfirm">確認重置</button></div></div></div>`);const close=()=>document.querySelector('#resetModal')?.remove();document.querySelector('#resetCancel').onclick=close;document.querySelector('#resetConfirm').onclick=()=>{close();toast('已重置 ESON 密碼')};}

function showSavingNotice(text='正在儲存中…'){
  document.querySelector('.saving-notice')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="toast saving-notice">${mi('progress_activity')} ${text}</div>`);
}
function hideSavingNotice(){document.querySelector('.saving-notice')?.remove();}
function toast(text){document.querySelector('.toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="toast">${mi('check_circle')} ${text}</div>`);setTimeout(()=>document.querySelector('.toast')?.remove(),2200)}

function bind(){
  const sel=document.querySelector('#protoSelect');
  if(sel){
    const route=location.hash.replace('#','')||'login';
    sel.value=route;
    sel.onchange=()=>navigate(sel.value);
  }
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=async()=>{
    const route=b.dataset.nav;
    if(route==='login'&&IS_ADMIN_PATH&&window.EsonFirebase?.currentUser()){
      await window.EsonFirebase.logout();
    }
    navigate(route);
  });
}
function navigate(route){previewFromEditor=false;location.hash=route;renderRoute()}
async function renderRoute(){
  const publicSlug=new URLSearchParams(location.search).get('event');
  if(!IS_ADMIN_PATH){
    if(publicSlug)loadPublicEventBySlug(publicSlug);
    else renderPublicHome();
    return;
  }

  await window.EsonFirebase.ready();
  const r=location.hash.replace('#','')||'login';
  const user=window.EsonFirebase.currentUser();

  if(r!=='login'&&!user){
    if(location.hash!=='#login')location.hash='login';
    renderLogin();
    return;
  }
  if(r==='login'&&user){
    if(location.hash!=='#dashboard')location.hash='dashboard';
    renderDashboard();
    return;
  }

  ({login:renderLogin,dashboard:renderDashboard,editor:renderEditor,responses:renderResponses,public:renderPublic,success:renderSuccess,notstarted:()=>renderStatus('notstarted'),full:()=>renderStatus('full'),closed:()=>renderStatus('closed'),paused:()=>renderStatus('paused')}[r]||renderLogin)();
}
window.addEventListener('hashchange',()=>renderRoute());
renderRoute();