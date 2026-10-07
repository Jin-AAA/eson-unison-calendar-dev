const mi=(name)=>`<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
const app=document.querySelector('#app');
let currentLang='en';
let previewFromEditor=false;
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

let currentAdminProfile=null;
let adminContextUid='';
let editorLastSavedAt='';
let publicLanguageReady=false;

const LANG_NAMES={ko:'한국어',en:'English',zh:'中文'};

function defaultAdminLanguage(profile){
  const name=String(profile?.name||'').trim().toLowerCase();
  if(name.includes('jiin'))return 'zh';
  if(name.includes('eson'))return 'en';
  return profile?.role==='owner'?'zh':'en';
}
async function ensureAdminContext(){
  const user=window.EsonFirebase.currentUser();
  if(!user)return null;
  if(!currentAdminProfile||adminContextUid!==user.uid){
    currentAdminProfile=await window.EsonFirebase.getProfile();
    adminContextUid=user.uid;
    adminUiLang=localStorage.getItem('eson_admin_lang_'+user.uid)||localStorage.getItem('eson_login_lang')||defaultAdminLanguage(currentAdminProfile);
  }
  return currentAdminProfile;
}
function currentAdminName(){
  return currentAdminProfile?.name||window.EsonFirebase.currentUser()?.email||'Admin';
}
function currentAdminRole(){
  return currentAdminProfile?.role==='owner'?'Owner':'Admin';
}

function formatEditorSavedAt(v){
  if(!v)return ({zh:'尚未儲存',ko:'저장되지 않음',en:'Not Saved Yet',ja:'未保存'}[adminUiLang]||'Not Saved Yet');
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
async function refreshEditorLastSaved(){
  if(!currentEventId)return;
  try{
    const data=await apiGet('getEvent',{eventId:currentEventId});
    const detail=data.event;
    const e=detail.event||detail;
    editorLastSavedAt=e.updatedAt||new Date().toISOString();
  }catch(e){
    editorLastSavedAt=new Date().toISOString();
  }
  const el=document.querySelector('.save-note');
  if(el){
    const label={zh:'最後儲存：',ko:'마지막 저장: ',en:'Last Saved: ',ja:'最終保存：'}[adminUiLang]||'Last Saved: ';
    el.textContent=label+formatEditorSavedAt(editorLastSavedAt);
  }
}


const ADMIN_UI_TEXT={
  ko:{
    "活動管理":"이벤트 관리",
    "所有時間皆以 KST（UTC+9）顯示":"모든 시간은 KST (UTC+9) 기준입니다",
    "新增活動":"이벤트 추가",
    "搜尋活動名稱或網址":"이벤트명 또는 URL 검색",
    "全部":"전체",
    "開放中":"접수 중",
    "未開始":"시작 전",
    "已結束":"종료",
    "草稿":"초안",
    "活動名稱":"이벤트명",
    "狀態":"상태",
    "報名期間（KST）":"신청 기간 (KST)",
    "報名":"신청",
    "前台頁面":"공개 페이지",
    "操作":"작업",
    "開啟前台":"공개 페이지 열기",
    "編輯":"편집",
    "查看資料":"신청 데이터",
    "再次開放增收":"재오픈 / 인원 추가",
    "刪除":"삭제",
    "預覽表單":"폼 미리보기",
    "儲存編輯":"변경 저장",
    "儲存草稿":"초안 저장",
    "發布":"게시",
    "編輯頁面":"페이지 편집",
    "報名表單":"신청 폼",
    "報名成功頁":"신청 완료 페이지",
    "手機版預覽來源":"모바일 미리보기",
    "元件設定":"컴포넌트 설정",
    "活動基本設定":"이벤트 기본 설정",
    "專屬網址":"전용 URL",
    "表單開放時間（KST）":"신청 시작 시간 (KST)",
    "表單關閉時間（KST）":"신청 마감 시간 (KST)",
    "初始名額":"정원",
    "前台活動列表":"공개 이벤트 목록",
    "顯示":"표시",
    "不顯示":"숨김",
    "顯示目前報名人數":"현재 신청 인원 표시",
    "取消":"취소",
    "儲存設定":"설정 저장",
    "報名資料":"신청 데이터",
    "報名資料管理 · KST":"신청 데이터 관리 · KST",
    "活動列表":"이벤트 목록",
    "開啟表單頁面":"신청 페이지 열기",
    "編輯表單":"폼 편집",
    "目前名額":"현재 정원",
    "目前報名 / 設定總名額":"현재 신청 / 총 정원",
    "已確認入金":"입금 확인",
    "尚未入金":"미입금",
    "搜尋 Email、姓名或回答內容":"이메일, 이름 또는 답변 검색",
    "全部入金狀態":"전체 입금 상태",
    "未確認":"미확인",
    "已確認":"확인",
    "已退款":"환불",
    "全部報名狀態":"전체 신청 상태",
    "有效":"유효",
    "作廢":"무효",
    "編號":"번호",
    "第一回答":"첫 번째 답변",
    "報名時間（KST）":"신청 시간 (KST)",
    "入金":"입금",
    "備註":"메모",
    "報名者提交資料":"신청자 제출 내용",
    "管理資料":"관리 정보",
    "入金狀態":"입금 상태",
    "報名狀態":"신청 상태",
    "管理員備註":"관리자 메모",
    "儲存變更":"변경 저장",
    "找不到符合條件的活動":"조건에 맞는 이벤트가 없습니다",
    "請調整搜尋關鍵字或篩選條件。":"검색어 또는 필터를 조정해 주세요.",
    "尚未設定":"설정 안 됨",
    "尚未開放":"오픈 전",
    "已額滿":"마감",
    "已截止":"접수 종료",
    "暫停":"일시 중지",
    "正在讀取資料...":"데이터를 불러오는 중...",
    "請稍候":"잠시만 기다려 주세요",
    "無法讀取資料":"데이터를 불러올 수 없습니다",
    "系統固定欄位・每個 Email 僅能報名一次":"시스템 고정 항목 · 이메일 1개당 1회만 신청 가능",
    "讀取活動失敗：":"이벤트 불러오기 실패: ",
    "儲存失敗：":"저장 실패: ",
    "發布失敗：":"게시 실패: ",
    "刪除失敗：":"삭제 실패: ",
    "登入失敗：":"로그인 실패: ",
    "再次開放失敗：":"재오픈 실패: ",
    "操作失敗：":"작업 실패: ",
    "修改失敗：":"변경 실패: ",
    "寄送失敗：":"전송 실패: ",
    "活動基本資料已儲存":"이벤트 기본 정보가 저장되었습니다",
    "儲存中...":"저장 중...",
    "草稿已儲存":"초안이 저장되었습니다",
    "發布中...":"게시 중...",
    "活動已發布":"이벤트가 게시되었습니다",
    "編輯內容已儲存":"변경 내용이 저장되었습니다",
    "我的帳號":"내 계정",
    "管理員管理":"관리자 관리",
    "登出":"로그아웃",
    "登入中...":"로그인 중...",
    "尚未發布":"미게시",
    "尚未產生公開網址":"공개 URL이 아직 없습니다",
    "確認刪除活動？":"이벤트를 삭제하시겠습니까?",
    "此操作無法復原。":"이 작업은 되돌릴 수 없습니다.",
    "刪除後將一併移除活動設定、前台頁面、所有報名資料與 Email 重複報名鎖定資料。":"삭제하면 이벤트 설정, 공개 페이지, 모든 신청 데이터와 이메일 중복 신청 잠금 데이터가 함께 삭제됩니다.",
    "永久刪除":"영구 삭제",
    "刪除中...":"삭제 중...",
    "正在刪除活動…":"이벤트를 삭제하는 중…",
    "活動已刪除":"이벤트가 삭제되었습니다",
    "Email 為固定第一欄，無法移動":"이메일은 첫 번째 고정 항목이라 이동할 수 없습니다",
    "拖曳調整順序":"드래그하여 순서 변경",
    "拖曳排序":"드래그 정렬",
    "大標題":"큰 제목",
    "小標題":"작은 제목",
    "簡答":"단답형",
    "詳答":"장문형",
    "單選":"단일 선택",
    "複選":"복수 선택",
    "下拉選單":"드롭다운",
    "單選表格":"선택 표",
    "日期":"날짜",
    "時間":"시간",
    "內文":"본문",
    "圖片":"이미지",
    "圖片區塊":"이미지 블록",
    "分隔線":"구분선",
    "留白":"여백",
    "其他：[________]":"기타: [________]",
    "刪除區塊":"블록 삭제",
    "刪除選項":"옵션 삭제",
    "新增列":"행 추가",
    "新增欄":"열 추가",
    "新增選項":"옵션 추가",
    "請選擇一個元件。":"컴포넌트를 선택해 주세요.",
    "系統 Email 欄位":"시스템 이메일 항목",
    "簡答設定":"단답형 설정",
    "詳答設定":"장문형 설정",
    "單選設定":"단일 선택 설정",
    "複選設定":"복수 선택 설정",
    "下拉選單設定":"드롭다운 설정",
    "單選表格設定":"선택 표 설정",
    "日期設定":"날짜 설정",
    "時間設定":"시간 설정",
    "大標題設定":"큰 제목 설정",
    "小標題設定":"작은 제목 설정",
    "內文設定":"본문 설정",
    "圖片設定":"이미지 설정",
    "留白設定":"여백 설정",
    "選填":"선택 사항",
    "顯示名稱":"표시 이름",
    "說明文字":"설명 문구",
    "必填":"필수",
    "此設定無法更改":"이 설정은 변경할 수 없습니다",
    "重複報名判定":"중복 신청 판정",
    "系統固定用途":"시스템 고정 용도",
    "題目":"질문",
    "輸入框初始高度":"입력창 기본 높이",
    "小":"작게",
    "中":"보통",
    "大":"크게",
    "加入「其他」":"\"기타\" 추가",
    "每一列都必須回答":"모든 행에 답해야 합니다",
    "文字":"텍스트",
    "對齊":"정렬",
    "靠左":"왼쪽",
    "置中":"가운데",
    "內容":"내용",
    "選擇圖片":"이미지 선택",
    "替代文字":"대체 텍스트",
    "尺寸":"크기",
    "滿寬":"전체 너비",
    "圖片會壓縮後直接存放在表單資料中，請避免使用過大的圖片。":"이미지는 압축되어 폼 데이터에 직접 저장됩니다. 너무 큰 이미지는 사용하지 마세요.",
    "此元件沒有額外設定。":"이 컴포넌트에는 추가 설정이 없습니다.",
    "高度":"높이",
    "報名成功！":"신청이 완료되었습니다!",
    "您的報名資料已成功送出。":"신청 정보가 제출되었습니다.",
    "報名編號":"신청 번호",
    "本次填寫內容":"제출한 내용",
    "姓名":"이름",
    "請截圖保存":"화면을 캡처해 보관해 주세요",
    "本頁面關閉或重新整理後，將無法再次查看此次提交內容。":"이 페이지를 닫거나 새로고침하면 제출 내용을 다시 볼 수 없습니다.",
    "管理員補充說明":"관리자 보충 설명",
    "Email（固定）":"이메일 (고정)",
    "未命名區塊":"제목 없는 블록",
    "元件":"컴포넌트",
    "大綱":"개요",
    "點擊項目可快速定位到表單區塊；Email 固定第一欄，其餘項目也可以在大綱中拖曳調整順序。":"항목을 클릭하면 해당 블록으로 이동합니다. 이메일은 항상 첫 번째이며, 나머지 항목은 여기서 드래그하여 순서를 바꿀 수 있습니다.",
    "活動資訊":"이벤트 정보",
    "表單欄位":"폼 항목",
    "內容元件":"콘텐츠 블록",
    "設定活動名稱、專屬網址、開放／截止時間、初始名額與公開設定。時間皆以 KST（UTC+9）為基準。":"이벤트명, URL, 시작/마감 시간, 정원과 공개 설정을 지정합니다. 모든 시간은 KST(UTC+9) 기준입니다.",
    "已從大綱調整區塊順序":"개요에서 블록 순서를 변경했습니다",
    "返回活動管理":"이벤트 관리로 돌아가기",
    "已發布":"게시됨",
    "Email 以外的區塊皆可拖曳排序":"이메일 외의 블록은 모두 드래그로 순서를 바꿀 수 있습니다",
    "成功頁固定資訊不可移除":"완료 페이지의 고정 정보는 삭제할 수 없습니다",
    "請填寫以下報名資訊。活動相關說明由管理員自行編輯並保持原始語言。":"아래 신청 정보를 입력해 주세요. 이벤트 관련 설명은 관리자가 직접 작성한 원문 그대로 표시됩니다.",
    "報名成功、報名編號、填寫摘要與截圖提示為系統固定內容。管理員只需編輯額外補充內容。":"신청 완료 문구, 신청 번호, 제출 내용 요약, 캡처 안내는 시스템 고정 내용입니다. 관리자는 추가 보충 설명만 편집하면 됩니다.",
    "補充說明":"보충 설명",
    "請先切換到「報名表單」再新增元件":"\"신청 폼\"으로 전환한 후 컴포넌트를 추가해 주세요",
    "至少需要保留一個選項":"옵션을 최소 하나는 남겨 주세요",
    "區塊已刪除":"블록이 삭제되었습니다",
    "已新增元件，可在右側調整設定":"컴포넌트가 추가되었습니다. 오른쪽에서 설정을 조정하세요.",
    "此處是整個活動層級的設定，和右側「元件設定」不同。":"여기는 이벤트 전체 설정이며, 오른쪽의 \"컴포넌트 설정\"과는 다릅니다.",
    "僅限英文字母、數字與連字號（-），例如：":"영문, 숫자, 하이픈(-)만 사용할 수 있습니다. 예: ",
    "活動基本設定已更新":"이벤트 기본 설정이 업데이트되었습니다",
    "目前總名額為":"현재 총 정원은",
    "人。增加名額後不會因取消、退款或作廢自動釋出名額。":"명입니다. 정원을 늘려도 취소, 환불, 무효 처리로 생긴 자리는 자동으로 풀리지 않습니다.",
    "本次增加名額":"추가할 정원",
    "新的關閉時間":"새 마감 시간",
    "新的關閉時間（可選）":"새 마감 시간 (선택)",
    "此活動已因時間截止。確認後會立即重新開放，並持續到你設定的「新的關閉時間」。":"이 이벤트는 시간이 지나 마감되었습니다. 확인하면 즉시 다시 열리며, 설정한 \"새 마감 시간\"까지 유지됩니다.",
    "確認再次開放":"재오픈 확인",
    "請輸入大於 0 的增加名額":"0보다 큰 추가 정원을 입력해 주세요",
    "活動已截止，請設定新的關閉時間":"이벤트가 마감되었습니다. 새 마감 시간을 설정해 주세요.",
    "正在儲存中...":"저장 중...",
    "正在儲存中…":"저장 중…",
    "再次開放設定已儲存，正在重新讀取最新資料":"재오픈 설정이 저장되었습니다. 최신 데이터를 다시 불러오는 중입니다…",
    "目前沒有符合條件的報名資料":"조건에 맞는 신청 데이터가 없습니다",
    "讀取失敗":"불러오기 실패",
    "找不到報名資料":"신청 데이터를 찾을 수 없습니다",
    "已允許此 Email 再次報名":"이 이메일은 다시 신청할 수 있습니다",
    "允許此 Email 再次報名":"이 이메일 재신청 허용",
    "報名資料已更新":"신청 데이터가 업데이트되었습니다",
    "允許此 Email 再次報名？":"이 이메일의 재신청을 허용하시겠습니까?",
    "原本的報名紀錄仍會保留，也不會自動釋放名額。":"기존 신청 기록은 유지되며 정원도 자동으로 풀리지 않습니다.",
    "確認允許":"허용 확인",
    "此 Email 已可再次報名":"이 이메일은 이제 다시 신청할 수 있습니다",
    "預覽模式不會真的送出資料":"미리보기 모드에서는 실제로 제출되지 않습니다",
    "帳號":"계정",
    "權限":"권한",
    "目前密碼":"현재 비밀번호",
    "新密碼":"새 비밀번호",
    "再次輸入新密碼":"새 비밀번호 확인",
    "輸入目前密碼":"현재 비밀번호 입력",
    "輸入新密碼":"새 비밀번호 입력",
    "修改密碼":"비밀번호 변경",
    "請填寫所有欄位":"모든 항목을 입력해 주세요",
    "新密碼至少需要 8 個字元":"새 비밀번호는 8자 이상이어야 합니다",
    "兩次輸入的新密碼不一致":"새 비밀번호가 일치하지 않습니다",
    "密碼已更新":"비밀번호가 변경되었습니다",
    "目前密碼不正確":"현재 비밀번호가 올바르지 않습니다",
    "只有 Owner 可以看到此功能。":"Owner만 이 기능을 볼 수 있습니다.",
    "目前登入帳號":"현재 로그인 계정",
    "新的臨時密碼":"새 임시 비밀번호",
    "再次輸入":"다시 입력",
    "至少 8 碼":"8자 이상",
    "確認重置":"재설정 확인",
    "密碼至少需要 8 碼":"비밀번호는 8자 이상이어야 합니다",
    "兩次輸入的密碼不一致":"입력한 비밀번호가 일치하지 않습니다",
    "只有 Owner 可以重置密碼":"Owner만 비밀번호를 재설정할 수 있습니다",
    "找不到此管理員":"해당 관리자를 찾을 수 없습니다",
    "無法重置此帳號":"이 계정은 재설정할 수 없습니다",
    "請重新登入後再試":"다시 로그인한 후 시도해 주세요",
    "尚未部署重置密碼的 Cloud Function（resetAdminPassword），請先部署後再試":"비밀번호 재설정 Cloud Function(resetAdminPassword)이 배포되지 않았습니다. 먼저 배포한 후 다시 시도해 주세요",
    "重置失敗：":"재설정 실패: ",
    "寄送密碼重設信":"비밀번호 재설정 메일 보내기",
    "密碼重設信已寄出":"비밀번호 재설정 메일을 보냈습니다",
    "管理員 Email":"관리자 이메일",
    "寄送重設信":"재설정 메일 보내기",
    "請輸入有效的 Email":"올바른 이메일을 입력해 주세요",
    "重設信會寄到該管理員的 Email，由對方自行設定新密碼。任何人都無法查看他人的密碼。":"재설정 링크가 해당 관리자의 이메일로 전송되며, 본인이 직접 새 비밀번호를 설정합니다. 누구도 다른 사람의 비밀번호를 볼 수 없습니다.",
    "圖片檔案過大，請改用較小的圖片。":"이미지가 너무 큽니다. 더 작은 이미지를 사용해 주세요.",
    "圖片讀取失敗":"이미지를 읽지 못했습니다",
    "找不到活動":"이벤트를 찾을 수 없습니다",
    "請先登入管理員帳號":"먼저 관리자 계정으로 로그인해 주세요",
    "缺少活動網址":"이벤트 URL이 없습니다",
    "總名額至少需要 1 人":"총 정원은 최소 1명이어야 합니다",
    "此帳號沒有後台管理權限":"이 계정에는 관리자 권한이 없습니다",
    "操作失敗":"작업에 실패했습니다",
    "關閉":"닫기",
    "選項":"옵션",
    "列":"행",
    "欄":"열"
  },
  en:{
    "活動管理":"Event Management",
    "所有時間皆以 KST（UTC+9）顯示":"All times are shown in KST (UTC+9)",
    "新增活動":"New Event",
    "搜尋活動名稱或網址":"Search event name or URL",
    "全部":"All",
    "開放中":"Open",
    "未開始":"Not Started",
    "已結束":"Ended",
    "草稿":"Draft",
    "活動名稱":"Event Name",
    "狀態":"Status",
    "報名期間（KST）":"Registration Period (KST)",
    "報名":"Registrations",
    "前台頁面":"Public Page",
    "操作":"Actions",
    "開啟前台":"Open Public Page",
    "編輯":"Edit",
    "查看資料":"View Responses",
    "再次開放增收":"Reopen / Add Capacity",
    "刪除":"Delete",
    "預覽表單":"Preview Form",
    "儲存編輯":"Save Changes",
    "儲存草稿":"Save Draft",
    "發布":"Publish",
    "編輯頁面":"Edit Pages",
    "報名表單":"Registration Form",
    "報名成功頁":"Success Page",
    "手機版預覽來源":"Mobile Preview",
    "元件設定":"Component Settings",
    "活動基本設定":"Event Settings",
    "專屬網址":"Event URL",
    "表單開放時間（KST）":"Form Opens (KST)",
    "表單關閉時間（KST）":"Form Closes (KST)",
    "初始名額":"Capacity",
    "前台活動列表":"Public Event List",
    "顯示":"Show",
    "不顯示":"Hide",
    "顯示目前報名人數":"Show Current Registration Count",
    "取消":"Cancel",
    "儲存設定":"Save Settings",
    "報名資料":"Responses",
    "報名資料管理 · KST":"Registration Management · KST",
    "活動列表":"Event List",
    "開啟表單頁面":"Open Form Page",
    "編輯表單":"Edit Form",
    "目前名額":"Capacity",
    "目前報名 / 設定總名額":"Registered / Total Capacity",
    "已確認入金":"Payment Confirmed",
    "尚未入金":"Payment Pending",
    "搜尋 Email、姓名或回答內容":"Search email, name, or response",
    "全部入金狀態":"All Payment Statuses",
    "未確認":"Unconfirmed",
    "已確認":"Confirmed",
    "已退款":"Refunded",
    "全部報名狀態":"All Registration Statuses",
    "有效":"Valid",
    "作廢":"Void",
    "編號":"No.",
    "第一回答":"First Answer",
    "報名時間（KST）":"Submitted At (KST)",
    "入金":"Payment",
    "備註":"Note",
    "報名者提交資料":"Submitted Information",
    "管理資料":"Admin Data",
    "入金狀態":"Payment Status",
    "報名狀態":"Registration Status",
    "管理員備註":"Admin Note",
    "儲存變更":"Save Changes",
    "找不到符合條件的活動":"No matching events found",
    "請調整搜尋關鍵字或篩選條件。":"Adjust your search or filters.",
    "尚未設定":"Not Set",
    "尚未開放":"Not Open Yet",
    "已額滿":"Full",
    "已截止":"Closed",
    "暫停":"Paused",
    "正在讀取資料...":"Loading data...",
    "請稍候":"Please wait",
    "無法讀取資料":"Unable to load data",
    "系統固定欄位・每個 Email 僅能報名一次":"System field · Each email can register only once",
    "讀取活動失敗：":"Failed to load event: ",
    "儲存失敗：":"Save failed: ",
    "發布失敗：":"Publish failed: ",
    "刪除失敗：":"Delete failed: ",
    "登入失敗：":"Sign-in failed: ",
    "再次開放失敗：":"Reopen failed: ",
    "操作失敗：":"Action failed: ",
    "修改失敗：":"Update failed: ",
    "寄送失敗：":"Send failed: ",
    "活動基本資料已儲存":"Event details saved",
    "儲存中...":"Saving...",
    "草稿已儲存":"Draft saved",
    "發布中...":"Publishing...",
    "活動已發布":"Event published",
    "編輯內容已儲存":"Changes saved",
    "我的帳號":"My Account",
    "管理員管理":"Admin Management",
    "登出":"Sign Out",
    "登入中...":"Signing in...",
    "尚未發布":"Not Published",
    "尚未產生公開網址":"No public URL yet",
    "確認刪除活動？":"Delete this event?",
    "此操作無法復原。":"This action cannot be undone.",
    "刪除後將一併移除活動設定、前台頁面、所有報名資料與 Email 重複報名鎖定資料。":"Deleting this event also removes its settings, public page, all registration data and duplicate-email locks.",
    "永久刪除":"Delete Permanently",
    "刪除中...":"Deleting...",
    "正在刪除活動…":"Deleting event…",
    "活動已刪除":"Event deleted",
    "Email 為固定第一欄，無法移動":"Email is fixed as the first field and cannot be moved",
    "拖曳調整順序":"Drag to reorder",
    "拖曳排序":"Drag to reorder",
    "大標題":"Heading",
    "小標題":"Subheading",
    "簡答":"Short Answer",
    "詳答":"Long Answer",
    "單選":"Single Choice",
    "複選":"Multiple Choice",
    "下拉選單":"Dropdown",
    "單選表格":"Choice Grid",
    "日期":"Date",
    "時間":"Time",
    "內文":"Paragraph",
    "圖片":"Image",
    "圖片區塊":"Image Block",
    "分隔線":"Divider",
    "留白":"Spacer",
    "其他：[________]":"Other: [________]",
    "刪除區塊":"Delete Block",
    "刪除選項":"Delete Option",
    "新增列":"Add Row",
    "新增欄":"Add Column",
    "新增選項":"Add Option",
    "請選擇一個元件。":"Select a component.",
    "系統 Email 欄位":"System Email Field",
    "簡答設定":"Short Answer Settings",
    "詳答設定":"Long Answer Settings",
    "單選設定":"Single Choice Settings",
    "複選設定":"Multiple Choice Settings",
    "下拉選單設定":"Dropdown Settings",
    "單選表格設定":"Choice Grid Settings",
    "日期設定":"Date Settings",
    "時間設定":"Time Settings",
    "大標題設定":"Heading Settings",
    "小標題設定":"Subheading Settings",
    "內文設定":"Paragraph Settings",
    "圖片設定":"Image Settings",
    "留白設定":"Spacer Settings",
    "選填":"Optional",
    "顯示名稱":"Display Name",
    "說明文字":"Help Text",
    "必填":"Required",
    "此設定無法更改":"This setting cannot be changed",
    "重複報名判定":"Duplicate Registration Check",
    "系統固定用途":"Fixed system use",
    "題目":"Question",
    "輸入框初始高度":"Initial Input Height",
    "小":"Small",
    "中":"Medium",
    "大":"Large",
    "加入「其他」":"Add \"Other\"",
    "每一列都必須回答":"Every row must be answered",
    "文字":"Text",
    "對齊":"Alignment",
    "靠左":"Left",
    "置中":"Center",
    "內容":"Content",
    "選擇圖片":"Choose Image",
    "替代文字":"Alt Text",
    "尺寸":"Size",
    "滿寬":"Full Width",
    "圖片會壓縮後直接存放在表單資料中，請避免使用過大的圖片。":"Images are compressed and stored directly in the form data. Please avoid very large images.",
    "此元件沒有額外設定。":"This component has no additional settings.",
    "高度":"Height",
    "報名成功！":"Registration Complete!",
    "您的報名資料已成功送出。":"Your registration has been submitted.",
    "報名編號":"Registration No.",
    "本次填寫內容":"Your Submitted Information",
    "姓名":"Name",
    "請截圖保存":"Please take a screenshot",
    "本頁面關閉或重新整理後，將無法再次查看此次提交內容。":"After this page is closed or refreshed, this submission can no longer be viewed.",
    "管理員補充說明":"Admin Note",
    "Email（固定）":"Email (fixed)",
    "未命名區塊":"Untitled Block",
    "元件":"Components",
    "大綱":"Outline",
    "點擊項目可快速定位到表單區塊；Email 固定第一欄，其餘項目也可以在大綱中拖曳調整順序。":"Click an item to jump to its block. Email is always first; other items can also be reordered by dragging here.",
    "活動資訊":"Event Info",
    "表單欄位":"Form Fields",
    "內容元件":"Content Blocks",
    "設定活動名稱、專屬網址、開放／截止時間、初始名額與公開設定。時間皆以 KST（UTC+9）為基準。":"Set the event name, URL, open/close time, capacity and visibility. All times are in KST (UTC+9).",
    "已從大綱調整區塊順序":"Block order updated from the outline",
    "返回活動管理":"Back to Event Management",
    "已發布":"Published",
    "Email 以外的區塊皆可拖曳排序":"All blocks except Email can be reordered by dragging",
    "成功頁固定資訊不可移除":"Fixed success-page content cannot be removed",
    "請填寫以下報名資訊。活動相關說明由管理員自行編輯並保持原始語言。":"Please fill in the registration details below. Event descriptions are written by admins and kept in their original language.",
    "報名成功、報名編號、填寫摘要與截圖提示為系統固定內容。管理員只需編輯額外補充內容。":"The success message, registration number, summary and screenshot reminder are fixed system content. Admins only edit the additional note.",
    "補充說明":"Additional Note",
    "請先切換到「報名表單」再新增元件":"Switch to \"Registration Form\" before adding components",
    "至少需要保留一個選項":"At least one option is required",
    "區塊已刪除":"Block deleted",
    "已新增元件，可在右側調整設定":"Component added. Adjust it in the right panel.",
    "此處是整個活動層級的設定，和右側「元件設定」不同。":"These are event-level settings, different from the \"Component Settings\" on the right.",
    "僅限英文字母、數字與連字號（-），例如：":"Letters, numbers and hyphens (-) only, e.g. ",
    "活動基本設定已更新":"Event settings updated",
    "目前總名額為":"Current total capacity is",
    "人。增加名額後不會因取消、退款或作廢自動釋出名額。":"spots. Increasing capacity will not automatically release spots from cancellations, refunds or voided entries.",
    "本次增加名額":"Spots to Add",
    "新的關閉時間":"New Closing Time",
    "新的關閉時間（可選）":"New Closing Time (optional)",
    "此活動已因時間截止。確認後會立即重新開放，並持續到你設定的「新的關閉時間」。":"This event closed because its time ran out. Confirming reopens it immediately until the \"New Closing Time\" you set.",
    "確認再次開放":"Confirm Reopen",
    "請輸入大於 0 的增加名額":"Enter a number greater than 0",
    "活動已截止，請設定新的關閉時間":"The event has closed. Please set a new closing time.",
    "正在儲存中...":"Saving...",
    "正在儲存中…":"Saving…",
    "再次開放設定已儲存，正在重新讀取最新資料":"Reopen settings saved. Reloading the latest data…",
    "目前沒有符合條件的報名資料":"No matching registrations",
    "讀取失敗":"Failed to load",
    "找不到報名資料":"Registration not found",
    "已允許此 Email 再次報名":"This email is now allowed to register again",
    "允許此 Email 再次報名":"Allow This Email to Register Again",
    "報名資料已更新":"Registration updated",
    "允許此 Email 再次報名？":"Allow this email to register again?",
    "原本的報名紀錄仍會保留，也不會自動釋放名額。":"The original registration is kept and its spot is not released automatically.",
    "確認允許":"Confirm",
    "此 Email 已可再次報名":"This email can now register again",
    "預覽模式不會真的送出資料":"Preview mode does not actually submit data",
    "帳號":"Account",
    "權限":"Role",
    "目前密碼":"Current Password",
    "新密碼":"New Password",
    "再次輸入新密碼":"Confirm New Password",
    "輸入目前密碼":"Enter current password",
    "輸入新密碼":"Enter new password",
    "修改密碼":"Change Password",
    "請填寫所有欄位":"Please fill in all fields",
    "新密碼至少需要 8 個字元":"New password must be at least 8 characters",
    "兩次輸入的新密碼不一致":"The new passwords do not match",
    "密碼已更新":"Password updated",
    "目前密碼不正確":"Current password is incorrect",
    "只有 Owner 可以看到此功能。":"Only Owners can see this feature.",
    "目前登入帳號":"Currently signed in",
    "新的臨時密碼":"New temporary password",
    "再次輸入":"Re-enter password",
    "至少 8 碼":"At least 8 characters",
    "確認重置":"Confirm Reset",
    "密碼至少需要 8 碼":"Password must be at least 8 characters",
    "兩次輸入的密碼不一致":"The two passwords do not match",
    "只有 Owner 可以重置密碼":"Only the Owner can reset passwords",
    "找不到此管理員":"Admin not found",
    "無法重置此帳號":"This account cannot be reset",
    "請重新登入後再試":"Please sign in again and retry",
    "尚未部署重置密碼的 Cloud Function（resetAdminPassword），請先部署後再試":"The reset-password Cloud Function (resetAdminPassword) is not deployed yet. Please deploy it and try again",
    "重置失敗：":"Reset failed: ",
    "寄送密碼重設信":"Send Password Reset Email",
    "密碼重設信已寄出":"Password reset email sent",
    "管理員 Email":"Admin Email",
    "寄送重設信":"Send Reset Email",
    "請輸入有效的 Email":"Enter a valid email",
    "重設信會寄到該管理員的 Email，由對方自行設定新密碼。任何人都無法查看他人的密碼。":"A reset link is emailed to the admin, who sets a new password themselves. Nobody can view anyone's password.",
    "圖片檔案過大，請改用較小的圖片。":"The image is too large. Please use a smaller image.",
    "圖片讀取失敗":"Failed to read the image",
    "找不到活動":"Event not found",
    "請先登入管理員帳號":"Please sign in as an admin first",
    "缺少活動網址":"Missing event URL",
    "總名額至少需要 1 人":"Capacity must be at least 1",
    "此帳號沒有後台管理權限":"This account has no admin access",
    "操作失敗":"Action failed",
    "關閉":"Close",
    "選項":"Options",
    "列":"Rows",
    "欄":"Columns"
  }
};
// Words that mean something different in a status column / status dropdown than on a button.
const ADMIN_UI_STATUS_VARIANT={en:{'取消':'Cancelled'},ko:{'取消':'취소됨'}};
// Sentences that contain a variable part. Matched as a whole, then rebuilt in the target language.
const ADMIN_UI_PATTERNS=[
  {re:/^重置 ([\s\S]+) 密碼$/,en:m=>`Reset ${m[1]}'s password`,ko:m=>`${m[1]} 비밀번호 재설정`},
  {re:/^請設定新的臨時密碼，並自行告知 ([\s\S]+)。對方登入後可到「我的帳號」自行更改。$/,en:m=>`Set a new temporary password and let ${m[1]} know. They can change it later under "My Account" after signing in.`,ko:m=>`새 임시 비밀번호를 설정하고 ${m[1]}님께 직접 알려 주세요. 로그인 후 '내 계정'에서 변경할 수 있습니다.`},
  {re:/^已重置 ([\s\S]+) 密碼$/,en:m=>`Password reset for ${m[1]}`,ko:m=>`${m[1]} 비밀번호를 재설정했습니다`},
  {re:/^重置失敗：([\s\S]*)$/,en:m=>`Reset failed: ${m[1]}`,ko:m=>`재설정 실패: ${m[1]}`},
  {re:/^請輸入活動名稱「([\s\S]*)」以確認刪除$/,en:m=>`Type the event name "${m[1]}" to confirm deletion`,ko:m=>`확인을 위해 이벤트명 "${m[1]}"을(를) 입력해 주세요`},
  {re:/^活動名稱不一致，請輸入完整活動名稱「([\s\S]*)」$/,en:m=>`The name does not match. Please enter the full event name "${m[1]}"`,ko:m=>`이벤트명이 일치하지 않습니다. 전체 이벤트명 "${m[1]}"을(를) 입력해 주세요`},
  {re:/^已增加\s*(\d+)\s*個名額，總名額為\s*(\d+)$/,en:m=>`Added ${m[1]} spots. New total capacity: ${m[2]}`,ko:m=>`정원 ${m[1]}명이 추가되어 총 정원은 ${m[2]}명입니다`},
  {re:/^總名額不可小於目前已報名人數（(\d+) 人）$/,en:m=>`Capacity cannot be lower than the current registrations (${m[1]})`,ko:m=>`총 정원은 현재 신청 인원(${m[1]}명)보다 적을 수 없습니다`},
  {re:/^開啟 (https?:\/\/\S+)$/,en:m=>`Open ${m[1]}`,ko:m=>`${m[1]} 열기`}
];
// Authored content (questions, option text, answers, event names, notes) must never be translated.
const ADMIN_TR_SKIP='.public-shell,#confirmModal,script,style,textarea,input,.q-title,.heading-block,.subheading-block,.paragraph-block,.choice,.form-input,.form-textarea,.form-select,.grid-preview,.outline-label,.event-title,.editor-title,#responseEventTitle,.drawer .data-pair,#eventRows td:first-child b,#responseRows td:nth-child(2),#responseRows td:nth-child(3),#responseRows td:nth-child(7),.option-row,.admin-user-card b';
// Attributes (placeholder/title) are UI text even on inputs and option rows, so those two selectors are dropped.
const ADMIN_TR_SKIP_ATTR=ADMIN_TR_SKIP.replace('textarea,input,','').replace('.option-row,','');
const ADMIN_HAN_RE=/[\u4e00-\u9fff]/;
function adminTr(text,el){
  if(typeof text!=='string'||!text||adminUiLang==='zh')return text;
  const dict=ADMIN_UI_TEXT[adminUiLang];
  if(!dict)return text;
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  if(el&&(el.tagName==='OPTION'||(el.closest&&el.closest('td')))){
    const v=ADMIN_UI_STATUS_VARIANT[adminUiLang];
    if(v&&own(v,text))return v[text];
  }
  if(own(dict,text))return dict[text];
  for(const p of ADMIN_UI_PATTERNS){
    const m=text.match(p.re);
    if(m&&p[adminUiLang])return p[adminUiLang](m);
  }
  // "Prefix：message" (error toasts / alerts)
  const i=text.indexOf('：');
  if(i>0){
    const head=text.slice(0,i+1);
    if(own(dict,head))return dict[head]+adminTr(text.slice(i+1));
  }
  return text;
}
function adminTrTextNode(node){
  const raw=node.nodeValue||'';
  const trimmed=raw.trim();
  if(!trimmed||!ADMIN_HAN_RE.test(trimmed))return;
  const parent=node.parentElement;
  if(!parent||parent.closest(ADMIN_TR_SKIP))return;
  const tr=adminTr(trimmed,parent);
  if(tr&&tr!==trimmed)node.nodeValue=raw.replace(trimmed,()=>tr);
}
function adminTrAttrs(el){
  for(const a of ['placeholder','title','alt','aria-label']){
    const v=el.getAttribute&&el.getAttribute(a);
    if(!v||!ADMIN_HAN_RE.test(v)||el.closest(ADMIN_TR_SKIP_ATTR))continue;
    const tr=adminTr(v,el);
    if(tr!==v)el.setAttribute(a,tr);
  }
}
function translateAdminUI(root=document.body){
  if(!IS_ADMIN_PATH||adminUiLang==='zh'||!root)return;
  if(root.nodeType===3){adminTrTextNode(root);return}
  if(root.nodeType!==1)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(adminTrTextNode);
  adminTrAttrs(root);
  root.querySelectorAll('[placeholder],[title],[alt],[aria-label]').forEach(adminTrAttrs);
}
// Translate anything the admin UI adds later (modals, drawers, toasts, rebuilt tables, button states).
function startAdminTranslator(){
  if(!IS_ADMIN_PATH||window.__adminTranslatorStarted)return;
  window.__adminTranslatorStarted=true;
  new MutationObserver(muts=>{
    if(adminUiLang==='zh')return;
    for(const m of muts)for(const n of m.addedNodes)translateAdminUI(n);
  }).observe(document.body,{childList:true,subtree:true});
  const nativeAlert=window.alert.bind(window);
  window.alert=msg=>nativeAlert(adminTr(String(msg)));
}
startAdminTranslator();

const PUBLIC_SYS={
  zh:{home:'活動報名列表',loading:'正在讀取資料...',wait:'請稍候',none:'目前沒有公開活動。',loadFail:'目前無法讀取活動列表',open:'開放中',notstarted:'尚未開放',full:'已額滿',closed:'已截止',paused:'暫停',startAt:'將於 {time} KST (UTC+9) 開放報名',closedAt:'報名已於 {time} KST (UTC+9) 截止',fullDesc:'目前名額已額滿。',pausedDesc:'請稍後再試。'},
  ko:{home:'이벤트 신청 목록',loading:'데이터를 불러오는 중...',wait:'잠시만 기다려 주세요',none:'현재 공개된 이벤트가 없습니다.',loadFail:'이벤트 목록을 불러올 수 없습니다',open:'접수 중',notstarted:'시작 전',full:'마감',closed:'접수 종료',paused:'일시 중지',startAt:'{time} KST (UTC+9)에 신청이 시작됩니다',closedAt:'{time} KST (UTC+9)에 신청이 마감되었습니다',fullDesc:'현재 신청 정원이 모두 찼습니다.',pausedDesc:'잠시 후 다시 시도해 주세요.'},
  en:{home:'Event Registration',loading:'Loading data...',wait:'Please wait',none:'There are no public events right now.',loadFail:'Unable to load the event list',open:'Open',notstarted:'Not Started',full:'Full',closed:'Closed',paused:'Paused',startAt:'Registration opens at {time} KST (UTC+9)',closedAt:'Registration closed at {time} KST (UTC+9)',fullDesc:'Registration is currently full.',pausedDesc:'Please try again later.'},
  ja:{home:'イベント申込一覧',loading:'データを読み込んでいます...',wait:'しばらくお待ちください',none:'現在公開中のイベントはありません。',loadFail:'イベント一覧を読み込めません',open:'受付中',notstarted:'受付開始前',full:'満員',closed:'受付終了',paused:'一時停止',startAt:'{time} KST (UTC+9) に受付を開始します',closedAt:'{time} KST (UTC+9) に受付を終了しました',fullDesc:'現在、定員に達しています。',pausedDesc:'しばらくしてからもう一度お試しください。'}
};
function P(k){return PUBLIC_SYS[currentLang]?.[k]||PUBLIC_SYS.en[k]||k}
async function initPublicLanguage(){
  if(publicLanguageReady)return currentLang;
  const manual=localStorage.getItem('eson_public_lang_manual');
  if(['ko','en','zh','ja'].includes(manual)){
    currentLang=manual;publicLanguageReady=true;return currentLang;
  }
  const cached=sessionStorage.getItem('eson_public_lang_auto');
  if(['ko','en','zh','ja'].includes(cached)){
    currentLang=cached;publicLanguageReady=true;return currentLang;
  }
  // 1) A Korean / Chinese / Japanese browser language decides instantly (no network call).
  const navLang=String((navigator.languages&&navigator.languages[0])||navigator.language||'').toLowerCase();
  let lang='';
  if(navLang.startsWith('ko'))lang='ko';
  else if(navLang.startsWith('zh'))lang='zh';
  else if(navLang.startsWith('ja'))lang='ja';
  // 2) Otherwise (e.g. English browser) fall back to the visitor's country, with a short timeout.
  if(!lang){
    lang='en';
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),1500);
      const res=await fetch('https://ipwho.is/?fields=success,country_code',{cache:'no-store',signal:controller.signal});
      clearTimeout(timer);
      const geo=await res.json();
      const c=String(geo?.country_code||'').toUpperCase();
      if(c==='KR')lang='ko';
      else if(c==='TW'||c==='CN'||c==='HK'||c==='MO')lang='zh';
      else if(c==='JP')lang='ja';
    }catch(e){}
  }
  currentLang=lang;
  sessionStorage.setItem('eson_public_lang_auto',lang);
  publicLanguageReady=true;
  return lang;
}


const ADMIN_TITLE='Eson Event Admin Dashboard';
const i18n={
  zh:{open:'報名開放中',deadline:'報名截止',email:'Email',emailHint:'每個 Email 僅能報名一次，送出後無法自行修改。',submit:'送出報名',confirmTitle:'確認送出報名？',confirmText:'請再次確認您填寫的資料正確無誤。報名資料送出後將無法自行修改。',back:'返回檢查',confirm:'確認送出',success:'報名成功！',code:'報名編號',summary:'本次填寫內容',save:'請截圖保存',saveText:'本頁面關閉或重新整理後，將無法再次查看此次提交內容。報名資料送出後亦無法自行修改，請截圖保存您的報名編號與填寫內容。',notStarted:'報名尚未開始',full:'本活動已額滿',closed:'本次報名已截止',paused:'報名目前暫停',endPreview:'結束預覽',other:'其他',otherPh:'其他內容',choose:'請選擇',inputPh:'請輸入內容',emailRequired:'Email 為必填',required:'請完成必填欄位：{title}',sending:'送出中...',errNotStarted:'報名尚未開始。',errPaused:'目前暫停接受報名。',errClosed:'報名已截止。',errFull:'名額已額滿。',errDuplicate:'這個 Email 已經有報名紀錄。若你剛剛才送出，可能其實已經報名成功。',submitFailed:'送出失敗：',badFormat:'活動資料格式不完整',notOpen:'活動目前無法開啟',cannotOpenForm:'無法開啟表單',readFail:'讀取失敗',reload:'重新讀取',imageBlock:'圖片區塊'},
  ko:{open:'신청 접수 중',deadline:'신청 마감',email:'이메일',emailHint:'이메일 1개당 1회만 신청할 수 있으며, 제출 후에는 수정할 수 없습니다.',submit:'신청서 제출',confirmTitle:'신청서를 제출하시겠습니까?',confirmText:'입력한 정보가 정확한지 다시 확인해 주세요. 제출 후에는 신청 내용을 직접 수정할 수 없습니다.',back:'다시 확인',confirm:'제출하기',success:'신청이 완료되었습니다!',code:'신청 번호',summary:'제출한 내용',save:'화면을 캡처해 보관해 주세요',saveText:'이 페이지를 닫거나 새로고침하면 제출 내용을 다시 확인할 수 없습니다. 신청 번호와 작성 내용을 캡처해 보관해 주세요.',notStarted:'아직 신청 기간이 아닙니다',full:'신청이 마감되었습니다',closed:'신청 기간이 종료되었습니다',paused:'현재 신청이 일시 중지되었습니다',endPreview:'미리보기 종료',other:'기타',otherPh:'기타 내용',choose:'선택해 주세요',inputPh:'내용을 입력해 주세요',emailRequired:'이메일은 필수 입력 항목입니다',required:'필수 항목을 입력해 주세요: {title}',sending:'제출 중...',errNotStarted:'아직 신청이 시작되지 않았습니다.',errPaused:'현재 신청이 일시 중지되었습니다.',errClosed:'신청이 마감되었습니다.',errFull:'정원이 모두 찼습니다.',errDuplicate:'이 이메일로 이미 신청 내역이 있습니다. 방금 제출하셨다면 이미 신청이 완료되었을 수 있습니다.',submitFailed:'제출에 실패했습니다: ',badFormat:'이벤트 데이터 형식이 올바르지 않습니다',notOpen:'현재 이벤트를 열 수 없습니다',cannotOpenForm:'신청서를 열 수 없습니다',readFail:'불러오지 못했습니다',reload:'다시 불러오기',imageBlock:'이미지'},
  en:{open:'Registration Open',deadline:'Registration closes',email:'Email',emailHint:'Each email may register once. Submitted responses cannot be edited.',submit:'Submit Registration',confirmTitle:'Submit your registration?',confirmText:'Please confirm that all information is correct. You will not be able to edit your response after submission.',back:'Go Back',confirm:'Confirm & Submit',success:'Registration Complete!',code:'Registration No.',summary:'Your Submitted Information',save:'Please take a screenshot',saveText:'This submission summary will no longer be available after you close or refresh this page. Please save a screenshot of your registration number and responses.',notStarted:'Registration has not opened yet',full:'Registration is full',closed:'Registration has closed',paused:'Registration is temporarily paused',endPreview:'Exit Preview',other:'Other',otherPh:'Other',choose:'Select an option',inputPh:'Enter your answer',emailRequired:'Email is required',required:'Please complete the required field: {title}',sending:'Submitting...',errNotStarted:'Registration has not started yet.',errPaused:'Registration is temporarily paused.',errClosed:'Registration has closed.',errFull:'Registration is full.',errDuplicate:'This email has already been registered. If you just submitted, your registration may already have gone through.',submitFailed:'Submission failed: ',badFormat:'The event data is incomplete',notOpen:'This event cannot be opened right now',cannotOpenForm:'Unable to open the form',readFail:'Failed to load',reload:'Reload',imageBlock:'Image'},
  ja:{open:'受付中',deadline:'受付締切',email:'メールアドレス',emailHint:'1つのメールアドレスにつき1回のみ申込可能です。送信後は内容を変更できません。',submit:'申込を送信',confirmTitle:'申込を送信しますか？',confirmText:'入力内容に誤りがないか、もう一度ご確認ください。送信後は申込内容を変更できません。',back:'確認に戻る',confirm:'確認して送信',success:'申込が完了しました！',code:'申込番号',summary:'今回の入力内容',save:'スクリーンショットを保存してください',saveText:'このページを閉じる、または再読み込みすると、今回の送信内容は再表示できません。申込番号と入力内容をスクリーンショットで保存してください。',notStarted:'まだ受付開始前です',full:'定員に達しました',closed:'受付は終了しました',paused:'現在受付を一時停止しています',endPreview:'プレビューを終了',other:'その他',otherPh:'その他の内容',choose:'選択してください',inputPh:'内容を入力してください',emailRequired:'メールアドレスは必須です',required:'必須項目を入力してください：{title}',sending:'送信中...',errNotStarted:'受付はまだ開始されていません。',errPaused:'現在、受付を一時停止しています。',errClosed:'受付は終了しました。',errFull:'定員に達しました。',errDuplicate:'このメールアドレスでは既に申込があります。先ほど送信した場合、すでに申込が完了している可能性があります。',submitFailed:'送信に失敗しました：',badFormat:'イベントデータの形式が正しくありません',notOpen:'現在このイベントを開けません',cannotOpenForm:'フォームを開けません',readFail:'読み込みに失敗しました',reload:'再読み込み',imageBlock:'画像'}
};

function PT(k,vars){
  let v=(i18n[currentLang]&&i18n[currentLang][k])??i18n.en[k]??k;
  if(vars)for(const [a,b] of Object.entries(vars))v=v.split('{'+a+'}').join(b);
  return v;
}
function syncHtmlLang(){
  const m={zh:'zh-Hant',ko:'ko',en:'en',ja:'ja'};
  document.documentElement.lang=m[(IS_ADMIN_PATH&&!previewFromEditor)?adminUiLang:currentLang]||'en';
}
function snapshotPublicForm(){
  const out=[];
  document.querySelectorAll('.public-form [name],.public-form [data-other-for]').forEach(el=>{
    const key=el.name?('n:'+el.name):('o:'+el.dataset.otherFor);
    if(el.type==='radio'||el.type==='checkbox'){if(el.checked)out.push({key,value:el.value,checked:true})}
    else out.push({key,value:el.value});
  });
  return out;
}
function restorePublicForm(snap){
  if(!snap||!snap.length)return;
  const els=[...document.querySelectorAll('.public-form [name],.public-form [data-other-for]')];
  for(const x of snap){
    for(const el of els){
      const key=el.name?('n:'+el.name):('o:'+el.dataset.otherFor);
      if(key!==x.key)continue;
      if(el.type==='radio'||el.type==='checkbox'){if(x.checked&&el.value===x.value)el.checked=true}
      else el.value=x.value;
    }
  }
}

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

function formatKstRange(v, omitYear=false){
  if(!v)return '—';
  const d=new Date(v);
  if(Number.isNaN(d.getTime()))return String(v);

  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Seoul',
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    hour:'2-digit',
    minute:'2-digit',
    hour12:false
  }).formatToParts(d);

  const get=t=>parts.find(x=>x.type===t)?.value||'';
  const date=omitYear
    ? `${get('month')}/${get('day')}`
    : `${get('year')}/${get('month')}/${get('day')}`;

  return `${date} ${get('hour')}:${get('minute')}`;
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
    const raw=sessionStorage.getItem('eson_event_dashboard_cache_v2');
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(!parsed||!Array.isArray(parsed.events))return null;
    return parsed;
  }catch(e){return null}
}
function setDashboardLocalCache(events){
  try{
    sessionStorage.setItem('eson_event_dashboard_cache_v2',JSON.stringify({
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
  editorLastSavedAt='';
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
    editorLastSavedAt=e.updatedAt||'';
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
    setDocumentTitle(activityConfig.name||'ESON Events');
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
    await refreshEditorLastSaved();
    sessionStorage.removeItem('eson_event_dashboard_cache_v2');toast('草稿已儲存');
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
    sessionStorage.removeItem('eson_event_dashboard_cache_v2');toast('活動已發布');
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
    await refreshEditorLastSaved();
    sessionStorage.removeItem('eson_event_dashboard_cache_v2');toast('編輯內容已儲存');
  }catch(err){
    alert('儲存失敗：'+err.message);
  }finally{
    const btn=document.querySelector('#saveEditBtn');
    if(btn){btn.disabled=false;btn.textContent='儲存編輯'}
  }
}

function protoNav(){return ''}

function adminLangName(code=adminUiLang){return LANG_NAMES[code]||'English'}
function topbar(){
  const name=esc(currentAdminName());
  const role=currentAdminRole();
  const canManage=currentAdminProfile?.role==='owner';
  return `<div class="topbar"><div class="brand"><div class="brandmark">E</div><span>${ADMIN_TITLE}</span></div><div class="top-actions"><div class="timezone-label">${mi('schedule')} KST (UTC+9)</div><div class="menu-wrap"><button class="btn profile-btn lang-btn" id="adminLangBtn">${adminLangName()} ${mi('arrow_drop_down')}</button><div class="dropdown-menu lang-menu" id="adminLangMenu"><button class="menu-item ${adminUiLang==='ko'?'active':''}" data-admin-lang="ko">한국어</button><button class="menu-item ${adminUiLang==='en'?'active':''}" data-admin-lang="en">English</button><button class="menu-item ${adminUiLang==='zh'?'active':''}" data-admin-lang="zh">中文</button></div></div><div class="menu-wrap"><button class="btn profile-btn" id="profileBtn">${name} ${mi('arrow_drop_down')}</button><div class="dropdown-menu profile-menu" id="profileMenu"><div class="menu-title">${name} · ${role}</div><button class="menu-item" id="myAccountBtn">${mi('person')} ${adminUiLang==='ko'?'내 계정':adminUiLang==='en'?'My Account':adminUiLang==='ja'?'マイアカウント':'我的帳號'}</button>${canManage?`<button class="menu-item" id="adminManageBtn">${mi('manage_accounts')} ${adminUiLang==='ko'?'관리자 관리':adminUiLang==='en'?'Admin Management':adminUiLang==='ja'?'管理者管理':'管理員管理'}</button>`:''}<div class="menu-sep"></div><button class="menu-item" data-nav="login">${mi('logout')} ${adminUiLang==='ko'?'로그아웃':adminUiLang==='en'?'Sign Out':adminUiLang==='ja'?'ログアウト':'登出'}</button></div></div></div></div>`;
}

function loginStrings(){return {
 zh:{title:'管理員登入',desc:'登入後即可管理活動與報名資料。',account:'帳號',password:'密碼',login:'登入',note:'使用 Firebase Authentication 登入，Owner 與 Admin 權限由系統管理。'},
 ko:{title:'관리자 로그인',desc:'로그인 후 이벤트와 신청 데이터를 관리할 수 있습니다.',account:'계정',password:'비밀번호',login:'로그인',note:'Firebase Authentication으로 로그인하며 Owner와 Admin 권한을 구분합니다.'},
 en:{title:'Admin Login',desc:'Sign in to manage events and registration data.',account:'Account',password:'Password',login:'Sign in',note:'Sign in with Firebase Authentication. Owner and Admin permissions are managed by the system.'},
 ja:{title:'管理者ログイン',desc:'ログイン後、イベントと申込データを管理できます。',account:'アカウント',password:'パスワード',login:'ログイン',note:'Firebase Authenticationでログインし、OwnerとAdminの権限を管理します。'}
}[adminUiLang]||this.zh}
function loginLangMenu(){return `<div class="login-lang-wrap menu-wrap"><button class="btn profile-btn lang-btn" id="loginLangBtn">${adminLangName()} ${mi('arrow_drop_down')}</button><div class="dropdown-menu lang-menu" id="loginLangMenu"><button class="menu-item ${adminUiLang==='ko'?'active':''}" data-login-lang="ko">한국어</button><button class="menu-item ${adminUiLang==='en'?'active':''}" data-login-lang="en">English</button><button class="menu-item ${adminUiLang==='zh'?'active':''}" data-login-lang="zh">中文</button></div></div>`}
function renderLogin(){
  syncHtmlLang();
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
      currentAdminProfile=null;adminContextUid='';
      await ensureAdminContext();
      navigate('dashboard');
    }catch(err){
      alert('登入失敗：'+err.message);
    }finally{
      loginBtn.disabled=false;
      loginBtn.textContent=t.login;
    }
  };
}
function bindLoginLang(){
  if(!window.__menuOutsideClickBound){window.__menuOutsideClickBound=true;document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap'))document.querySelectorAll('.dropdown-menu.open').forEach(m=>m.classList.remove('open'))})}
  const btn=document.querySelector('#loginLangBtn'),menu=document.querySelector('#loginLangMenu');if(!btn||!menu)return;btn.onclick=e=>{e.stopPropagation();menu.classList.toggle('open')};document.querySelectorAll('[data-login-lang]').forEach(x=>x.onclick=()=>{adminUiLang=x.dataset.loginLang;localStorage.setItem('eson_login_lang',adminUiLang);renderLogin()});}
function dashboardRows(){const q=(dashboardQuery||'').trim().toLowerCase();return demoEvents.filter(e=>{const statusPass=dashboardFilter==='all'||(dashboardFilter==='open'&&e.status==='open')||(dashboardFilter==='upcoming'&&e.status==='upcoming')||(dashboardFilter==='ended'&&['closed','full'].includes(e.status))||(dashboardFilter==='draft'&&e.status==='draft');const haystack=(e.name+' '+(e.slug||'')+' /event/'+(e.slug||'')).toLowerCase();const queryPass=!q||haystack.includes(q);return statusPass&&queryPass})}
function dashboardTableHtml(){const rows=dashboardRows(); if(!rows.length)return `<tr><td colspan="6"><div class="empty-state">${mi('search_off')}<b>找不到符合條件的活動</b><span>請調整搜尋關鍵字或篩選條件。</span></div></td></tr>`;return rows.map(e=>{const publicCell=e.status==='draft'?`<span class="unpublished-label">${mi('hide_source')} 尚未發布</span>`:`<button class="btn small" data-open-public="${esc(e.id)}" title="開啟 https://eson1228.com/event/${esc(e.slug)}/">${mi('open_in_new')} 開啟前台</button>`;return `<tr><td><b>${esc(e.name)}</b><div class="tiny muted" style="margin-top:4px">${e.status==='draft'?'尚未產生公開網址':'/event/'+esc(e.slug)+'/'}</div></td><td><span class="badge ${e.status}">${e.label}</span></td><td>${e.range}</td><td><b>${e.count} / ${e.cap}</b><div class="progress"><i style="width:${e.cap>0?Math.min(100,e.count/e.cap*100):0}%"></i></div></td><td>${publicCell}</td><td><div class="row-actions"><button class="btn small" data-edit-event="${esc(e.id)}">編輯</button>${e.status==='draft'?'':`<button class="btn small" data-view-responses="${esc(e.id)}">查看資料</button>`}${['full','closed'].includes(e.status)?'<button class="btn small soft" data-capacity="'+esc(e.id)+'">再次開放增收</button>':''}<button class="btn small danger" data-delete-event="${esc(e.id)}">刪除</button></div></td></tr>`}).join('')}

function bindTopMenus(){
  const profileBtn=document.querySelector('#profileBtn');
  const profileMenu=document.querySelector('#profileMenu');
  const langBtn=document.querySelector('#adminLangBtn');
  const langMenu=document.querySelector('#adminLangMenu');

  const closeMenus=()=>{
    document.querySelectorAll('.dropdown-menu.open').forEach(menu=>menu.classList.remove('open'));
  };

  if(profileBtn && profileMenu){
    profileBtn.onclick=e=>{
      e.stopPropagation();
      const shouldOpen=!profileMenu.classList.contains('open');
      closeMenus();
      profileMenu.classList.toggle('open',shouldOpen);
    };
  }

  if(langBtn && langMenu){
    langBtn.onclick=e=>{
      e.stopPropagation();
      const shouldOpen=!langMenu.classList.contains('open');
      closeMenus();
      langMenu.classList.toggle('open',shouldOpen);
    };
  }

  document.querySelectorAll('[data-admin-lang]').forEach(btn=>{
    btn.onclick=e=>{
      e.stopPropagation();
      adminUiLang=btn.dataset.adminLang;
      const uid=window.EsonFirebase.currentUser()?.uid;
      if(uid)localStorage.setItem('eson_admin_lang_'+uid,adminUiLang);
      closeMenus();
      renderRoute();
      setTimeout(()=>translateAdminUI(document.body),0);
    };
  });

  document.querySelector('#myAccountBtn')?.addEventListener('click',()=>{
    closeMenus();
    showMyAccount();
  });

  document.querySelector('#adminManageBtn')?.addEventListener('click',()=>{
    closeMenus();
    showAdminManage();
  });

  if(!window.__menuOutsideClickBound){
    window.__menuOutsideClickBound=true;
    document.addEventListener('click',e=>{
      if(!e.target.closest('.menu-wrap'))document.querySelectorAll('.dropdown-menu.open').forEach(m=>m.classList.remove('open'));
    });
  }
}

function renderDashboard(){app.innerHTML=`${topbar()}<main class="page"><div class="page-head"><div><h1>活動管理</h1><div class="muted">所有時間皆以 KST（UTC+9）顯示</div></div><div class="actions"><button class="btn primary" data-nav="editor">${mi('add')}新增活動</button></div></div><div class="toolbar"><div class="search material-search">${mi('search')}<input id="dashboardSearch" placeholder="搜尋活動名稱或網址" value="${esc(dashboardQuery)}" /></div><div class="seg" id="dashboardFilters"><button data-filter="all" class="${dashboardFilter==='all'?'active':''}">全部</button><button data-filter="open" class="${dashboardFilter==='open'?'active':''}">開放中</button><button data-filter="upcoming" class="${dashboardFilter==='upcoming'?'active':''}">未開始</button><button data-filter="ended" class="${dashboardFilter==='ended'?'active':''}">已結束</button><button data-filter="draft" class="${dashboardFilter==='draft'?'active':''}">草稿</button></div></div><div class="card table-card"><table class="table"><thead><tr><th>活動名稱</th><th>狀態</th><th>報名期間（KST）</th><th>報名</th><th>前台頁面</th><th>操作</th></tr></thead><tbody id="eventRows">${dashboardTableHtml()}</tbody></table></div></main>${protoNav()}`;bind();bindTopMenus();document.querySelector('#dashboardSearch').addEventListener('input',e=>{dashboardQuery=e.target.value;refreshDashboardRows()});document.querySelectorAll('#dashboardFilters [data-filter]').forEach(b=>b.onclick=()=>{dashboardFilter=b.dataset.filter;document.querySelectorAll('#dashboardFilters button').forEach(x=>x.classList.toggle('active',x===b));refreshDashboardRows()});bindCapacityButtons();bindDashboardEditors();bindPublicButtons();loadDashboardFromApi();}
function refreshDashboardRows(){document.querySelector('#eventRows').innerHTML=dashboardTableHtml();bind();bindCapacityButtons();bindDashboardEditors();bindPublicButtons();}
function bindCapacityButtons(){document.querySelectorAll('[data-capacity]').forEach(b=>b.onclick=()=>showCapacityModal(b.dataset.capacity));}
function bindPublicButtons(){document.querySelectorAll('[data-open-public]').forEach(btn=>btn.onclick=()=>{const ev=demoEvents.find(x=>x.id===btn.dataset.openPublic);if(!ev||!ev.slug)return;window.open(PUBLIC_EVENT_BASE+'?event='+encodeURIComponent(ev.slug),'_blank')})}
function bindDashboardEditors(){
  document.querySelectorAll('[data-edit-event]').forEach(b=>b.onclick=()=>loadEventForEditor(b.dataset.editEvent));
  document.querySelectorAll('[data-view-responses]').forEach(b=>b.onclick=()=>{currentEventId=b.dataset.viewResponses;navigate('responses')});
  document.querySelectorAll('[data-delete-event]').forEach(b=>b.onclick=()=>showDeleteEventModal(b.dataset.deleteEvent));
  const add=document.querySelector('[data-nav="editor"]');
  if(add&&add.closest('.page-head'))add.onclick=()=>{resetNewEventEditor();navigate('editor')};
}


function showDeleteEventModal(eventId){
  const ev=demoEvents.find(x=>String(x.id)===String(eventId));
  if(!ev)return;

  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-backdrop" id="deleteEventModal">
      <div class="modal">
        <div class="modal-title-row">
          <div>
            <h3>確認刪除活動？</h3>
            <p>此操作無法復原。</p>
          </div>
          <button class="btn icon" id="deleteEventClose">${mi('close')}</button>
        </div>

        <div class="reuse-confirm-note" style="margin-top:12px">
          刪除後將一併移除活動設定、前台頁面、所有報名資料與 Email 重複報名鎖定資料。
        </div>

        <div class="field" style="margin-top:18px">
          <label>請輸入活動名稱「${esc(ev.name)}」以確認刪除</label>
          <input id="deleteEventNameConfirm" autocomplete="off">
          <div id="deleteEventNameError" class="field-error" style="display:none;margin-top:8px">
            活動名稱不一致，請輸入完整活動名稱「${esc(ev.name)}」
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn" id="deleteEventCancel">取消</button>
          <button class="btn danger" id="deleteEventConfirm" disabled>永久刪除</button>
        </div>
      </div>
    </div>
  `);

  const close=()=>document.querySelector('#deleteEventModal')?.remove();
  document.querySelector('#deleteEventClose').onclick=close;
  document.querySelector('#deleteEventCancel').onclick=close;

  const input=document.querySelector('#deleteEventNameConfirm');
  const confirmBtn=document.querySelector('#deleteEventConfirm');
  const errorText=document.querySelector('#deleteEventNameError');

  input.oninput=()=>{
    const value=input.value.trim();
    const isMatch=value===ev.name;
    confirmBtn.disabled=!isMatch;

    const shouldShowError=value.length>0&&!isMatch;
    errorText.style.display=shouldShowError?'block':'none';
    input.classList.toggle('is-error',shouldShowError);
  };

  input.onblur=()=>{
    const value=input.value.trim();
    const shouldShowError=value.length>0&&value!==ev.name;
    errorText.style.display=shouldShowError?'block':'none';
    input.classList.toggle('is-error',shouldShowError);
  };

  confirmBtn.onclick=async()=>{
    try{
      confirmBtn.disabled=true;
      confirmBtn.textContent='刪除中...';
      showSavingNotice('正在刪除活動…');

      await apiPost('deleteEvent',{eventId:ev.id});

      hideSavingNotice();
      close();
      sessionStorage.removeItem('eson_event_dashboard_cache_v2');
      toast('活動已刪除');
      await loadDashboardFromApi();
    }catch(err){
      hideSavingNotice();
      confirmBtn.disabled=false;
      confirmBtn.textContent='永久刪除';
      alert('刪除失敗：'+err.message);
    }
  };
}

function compressImageFile(file,maxW=1200,maxBytes=700*1024){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const scale=Math.min(1,maxW/img.width);
      const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      let out=c.toDataURL('image/webp',0.85);
      if(!out.startsWith('data:image/webp'))out=c.toDataURL('image/jpeg',0.85);
      if(out.length*0.75>maxBytes){const retry=c.toDataURL('image/jpeg',0.7);if(retry.length<out.length)out=retry}
      if(out.length*0.75>maxBytes)return reject(new Error('圖片檔案過大，請改用較小的圖片。'));
      resolve(out);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('圖片讀取失敗'))};
    img.src=url;
  });
}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function currentBlock(){return editorBlocks.find(b=>b.id===selectedBlockId)||editorBlocks[0]}
function req(b){return b.required?' <span class="req">*</span>':''}
function descHtml(b){return b.desc?`<div class="block-desc">${esc(b.desc)}</div>`:''}
function renderEditorBlock(b){
  const drag=b.locked?`<div class="locked-handle" title="Email 為固定第一欄，無法移動">${mi('lock')}</div>`:`<div class="drag-handle" title="拖曳調整順序" draggable="true">${mi('drag_indicator')}<span>拖曳排序</span></div>`;
  let body='';
  if(b.type==='email')body=`<div class="q-title">${esc(b.title||'Email')} <span class="req">*</span></div><div class="form-input">example@email.com</div><div class="email-lock">${mi('lock')} 系統固定欄位・每個 Email 僅能報名一次</div>`;
  if(b.type==='heading')body=`<div class="heading-block ${b.align==='center'?'align-center':''}">${esc(b.title||'大標題')}</div>`;
  if(b.type==='subheading')body=`<div class="subheading-block ${b.align==='center'?'align-center':''}">${esc(b.title||'小標題')}</div>`;
  if(b.type==='short')body=`<div class="q-title">${esc(b.title||'簡答')}${req(b)}</div>${descHtml(b)}<div class="form-input">${esc(b.placeholder||'請輸入內容')}</div>`;
  if(b.type==='long')body=`<div class="q-title">${esc(b.title||'詳答')}${req(b)}</div>${descHtml(b)}<div class="form-textarea long-${b.height||'medium'}">${esc(b.placeholder||'請輸入內容')}</div>`;
  if(b.type==='radio')body=`<div class="q-title">${esc(b.title||'單選')}${req(b)}</div>${descHtml(b)}${(b.options||[]).map(o=>`<div class="choice"><span class="radio-dot"></span>${esc(o)}</div>`).join('')}${b.other?`<div class="choice"><span class="radio-dot"></span>${adminTr('其他：[________]')}</div>`:''}`;
  if(b.type==='checkbox')body=`<div class="q-title">${esc(b.title||'複選')}${req(b)}</div>${descHtml(b)}${(b.options||[]).map(o=>`<div class="choice"><span class="check-dot"></span>${esc(o)}</div>`).join('')}${b.other?`<div class="choice"><span class="check-dot"></span>${adminTr('其他：[________]')}</div>`:''}`;
  if(b.type==='select')body=`<div class="q-title">${esc(b.title||'下拉選單')}${req(b)}</div>${descHtml(b)}<div class="form-select">${esc(b.placeholder||'請選擇')} ${mi('arrow_drop_down')}</div>`;
  if(b.type==='grid'){
    const rows=b.rows||['列 1','列 2'], cols=b.cols||['選項 A','選項 B'];
    body=`<div class="q-title">${esc(b.title||'單選表格')}${req(b)}</div>${descHtml(b)}<div class="grid-preview" style="grid-template-columns:1.4fr repeat(${cols.length},1fr)"><span></span>${cols.map(c=>`<b>${esc(c)}</b>`).join('')}${rows.map(r=>`<span>${esc(r)}</span>${cols.map(()=>'<i>○</i>').join('')}`).join('')}</div>`;
  }
  if(b.type==='date')body=`<div class="q-title">${esc(b.title||'日期')}${req(b)}</div>${descHtml(b)}<div class="form-input">YYYY / MM / DD</div>`;
  if(b.type==='time')body=`<div class="q-title">${esc(b.title||'時間')}${req(b)}</div>${descHtml(b)}<div class="form-input">HH : MM</div>`;
  if(b.type==='paragraph')body=`<div class="paragraph-block ${b.align==='center'?'align-center':''}">${esc(b.text||'內文')}</div>`;
  if(b.type==='image')body=b.dataUrl?`<div class="image-preview-block size-${b.size||'large'}"><img src="${esc(b.dataUrl)}" alt="${esc(b.alt||'')}" /></div>`:`<div class="image-placeholder size-${b.size||'large'}">${mi('image')}<span>圖片區塊</span></div>`;
  if(b.type==='divider')body=`<div class="divider"></div>`;
  if(b.type==='spacer')body=`<div class="spacer" style="height:${b.height==='small'?16:b.height==='large'?54:30}px"></div>`;
  return `<div class="block ${b.id===selectedBlockId?'selected':''}" data-id="${esc(b.id)}" data-block="${esc(b.type)}" draggable="${b.locked?'false':'true'}">${drag}${b.locked?'':`<button class="block-menu" title="刪除區塊">${mi('delete')}</button>`}${body}</div>`;
}
function formBlocks(){return editorBlocks.map(renderEditorBlock).join('')}
function toggleRow(label,key,on,locked=false,help=''){return `<div class="toggle-row"><div><b class="small">${label}</b>${help?`<div class="help">${help}</div>`:''}</div><div class="switch ${on?'on':''} ${locked?'locked-switch':''} ${locked?'':'setting-switch'}" ${locked?'':`data-toggle="${key}"`}></div></div>`}
function optionRows(values,key){return `<div class="option-list">${(values||[]).map((v,i)=>`<div class="option-row"><input data-list="${key}" data-index="${i}" value="${esc(v)}"><button class="icon-mini" data-remove-list="${key}" data-index="${i}" title="刪除選項">${mi('delete')}</button></div>`).join('')}</div><button class="btn soft" style="width:100%" data-add-list="${key}">${mi('add')}新增${key==='rows'?'列':key==='cols'?'欄':'選項'}</button>`}
function settingsPanel(block=currentBlock()){
  if(!block)return '<p class="help">請選擇一個元件。</p>';
  const title=block.type==='email'?'系統 Email 欄位':({short:'簡答設定',long:'詳答設定',radio:'單選設定',checkbox:'複選設定',select:'下拉選單設定',grid:'單選表格設定',date:'日期設定',time:'時間設定',heading:'大標題設定',subheading:'小標題設定',paragraph:'內文設定',image:'圖片設定',divider:'分隔線',spacer:'留白設定'})[block.type];
  let h=`<div class="settings-title">${title}</div>`;
  const textField=(label,key,value,textarea=false)=>`<div class="field"><label>${label}</label>${textarea?`<textarea data-prop="${key}" placeholder="選填">${esc(value||'')}</textarea>`:`<input data-prop="${key}" value="${esc(value||'')}">`}</div>`;
  if(block.type==='email') return h+`<div class="info-note">${mi('lock')}<span>系統固定欄位・每個 Email 僅能報名一次</span></div>`+toggleRow('必填','required',true,true,'此設定無法更改')+toggleRow('重複報名判定','dedupe',true,true,'系統固定用途');
  if(['short','long','radio','checkbox','select','grid','date','time'].includes(block.type))h+=textField('題目','title',block.title)+textField('說明文字','desc',block.desc,true);
  if(['short','long'].includes(block.type))h+=textField('Placeholder','placeholder',block.placeholder);
  if(block.type==='long')h+=`<div class="field"><label>輸入框初始高度</label><select data-prop="height"><option value="small" ${block.height==='small'?'selected':''}>小</option><option value="medium" ${(!block.height||block.height==='medium')?'selected':''}>中</option><option value="large" ${block.height==='large'?'selected':''}>大</option></select></div>`;
  if(['radio','checkbox'].includes(block.type)){h+=`<div class="settings-subtitle">選項</div>${optionRows(block.options,'options')}`+toggleRow('加入「其他」','other',!!block.other);}
  if(block.type==='select'){h+=textField('Placeholder','placeholder',block.placeholder)+`<div class="settings-subtitle">選項</div>${optionRows(block.options,'options')}`;}
  if(block.type==='grid'){h+=`<div class="settings-subtitle">列</div>${optionRows(block.rows,'rows')}<div class="settings-subtitle">欄</div>${optionRows(block.cols,'cols')}`+toggleRow('每一列都必須回答','everyRow',!!block.everyRow);}
  if(['short','long','radio','checkbox','select','grid','date','time'].includes(block.type))h+=toggleRow('必填','required',!!block.required);
  if(['heading','subheading'].includes(block.type)){h+=textField('文字','title',block.title)+`<div class="field"><label>對齊</label><select data-prop="align"><option value="left" ${block.align!=='center'?'selected':''}>靠左</option><option value="center" ${block.align==='center'?'selected':''}>置中</option></select></div>`;}
  if(block.type==='paragraph'){h+=textField('內容','text',block.text,true)+`<div class="field"><label>對齊</label><select data-prop="align"><option value="left" ${block.align!=='center'?'selected':''}>靠左</option><option value="center" ${block.align==='center'?'selected':''}>置中</option></select></div>`;}
  if(block.type==='image'){h+=`<input type="file" id="imageFileInput" accept="image/*" style="display:none"><button class="btn soft" style="width:100%" id="chooseImageBtn">${mi('upload')}選擇圖片</button><div class="field"><label>替代文字</label><input data-prop="alt" value="${esc(block.alt||'')}"></div><div class="field"><label>尺寸</label><select data-prop="size"><option value="small" ${block.size==='small'?'selected':''}>小</option><option value="medium" ${block.size==='medium'?'selected':''}>中</option><option value="large" ${(!block.size||block.size==='large')?'selected':''}>大</option><option value="full" ${block.size==='full'?'selected':''}>滿寬</option></select></div><p class="help">圖片會壓縮後直接存放在表單資料中，請避免使用過大的圖片。</p>`;}
  if(block.type==='divider')h+=`<p class="help">此元件沒有額外設定。</p>`;
  if(block.type==='spacer')h+=`<div class="field"><label>高度</label><select data-prop="height"><option value="small" ${block.height==='small'?'selected':''}>小</option><option value="medium" ${(!block.height||block.height==='medium')?'selected':''}>中</option><option value="large" ${block.height==='large'?'selected':''}>大</option></select></div>`;
  return h;
}
function editorActionButtons(){return editorPublished?`<button class="btn primary" id="saveEditBtn">儲存編輯</button>`:`<button class="btn" id="saveDraftBtn">儲存草稿</button><button class="btn primary" id="publishBtn">發布</button>`}
function editorPageSwitch(){return `<div class="page-switch-wrap"><span class="page-switch-label">編輯頁面</span><div class="page-switch"><button class="${editorPage==='form'?'active':''}" data-editor-page="form">${mi('description')} 報名表單</button><button class="${editorPage==='success'?'active':''}" data-editor-page="success">${mi('task_alt')} 報名成功頁</button></div></div>`}
function successPageCanvas(){return `<div class="form-sheet"><div class="form-accent"></div><div class="form-body"><div class="success-editor-fixed"><div class="success-icon">${mi('check_circle')}</div><div class="event-title" style="font-size:30px">${adminTr('報名成功！')}</div><div class="event-desc">您的報名資料已成功送出。</div><div class="success-code-box"><span class="muted small">報名編號</span><b>#0028</b></div><div class="summary-preview"><b>本次填寫內容</b><div class="summary-line"><span>Email</span><span>amy@example.com</span></div><div class="summary-line"><span>姓名</span><span>Amy</span></div></div><div class="save-reminder">${mi('photo_camera')} <div><b>請截圖保存</b><div class="help">本頁面關閉或重新整理後，將無法再次查看此次提交內容。</div></div></div></div><div class="editable-success-note"><div class="drag-handle static">${mi('edit')}<span>管理員補充說明</span></div><div class="paragraph-block">${esc(successNote)}</div></div></div></div>`}

function blockOutlineLabel(b){if(b.type==='email')return adminTr('Email（固定）');if(['short','long','radio','checkbox','select','grid','date','time','heading','subheading'].includes(b.type))return b.title||adminTr('未命名區塊');if(b.type==='paragraph')return (b.text||adminTr('內文')).slice(0,18);return ({image:adminTr('圖片'),divider:adminTr('分隔線'),spacer:adminTr('留白')})[b.type]||b.type}
function editorSideContent(){if(editorSideTab==='outline'){return `<div class="seg editor-tabs" style="margin-bottom:12px"><button data-side-tab="components">元件</button><button class="active" data-side-tab="outline">大綱</button></div><div class="outline-help">點擊項目可快速定位到表單區塊；Email 固定第一欄，其餘項目也可以在大綱中拖曳調整順序。</div><div class="outline-list" id="outlineList">${editorBlocks.map(b=>`<button class="outline-item ${b.id===selectedBlockId?'active':''}" data-outline-id="${esc(b.id)}" draggable="${b.locked?'false':'true'}">${b.locked?`<span class="outline-lock">${mi('lock')}</span>`:`<span class="outline-drag">${mi('drag_indicator')}</span>`}<span class="outline-label">${esc(blockOutlineLabel(b))}</span></button>`).join('')}</div><div class="side-title">活動資訊</div><button class="btn soft" style="width:100%" id="activitySettingsBtn">${mi('settings')}活動基本設定</button>`}
return `<div class="seg editor-tabs" style="margin-bottom:12px"><button class="active" data-side-tab="components">元件</button><button data-side-tab="outline">大綱</button></div><div class="side-title">表單欄位</div><div class="tool-list"><button class="tool" data-add="short">${mi('short_text')}簡答</button><button class="tool" data-add="long">${mi('notes')}詳答</button><button class="tool" data-add="radio">${mi('radio_button_checked')}單選</button><button class="tool" data-add="checkbox">${mi('check_box')}複選</button><button class="tool" data-add="select">${mi('arrow_drop_down_circle')}下拉選單</button><button class="tool" data-add="grid">${mi('grid_on')}單選表格</button><button class="tool" data-add="date">${mi('calendar_month')}日期</button><button class="tool" data-add="time">${mi('schedule')}時間</button></div><div class="side-title">內容元件</div><div class="tool-list"><button class="tool" data-add="heading">${mi('title')}大標題</button><button class="tool" data-add="subheading">${mi('text_fields')}小標題</button><button class="tool" data-add="paragraph">${mi('subject')}內文</button><button class="tool" data-add="image">${mi('image')}圖片</button><button class="tool" data-add="divider">${mi('horizontal_rule')}分隔線</button><button class="tool" data-add="spacer">${mi('height')}留白</button></div><div class="side-title">活動資訊</div><button class="btn soft" style="width:100%" id="activitySettingsBtn">${mi('settings')}活動基本設定</button><div class="help" style="margin-top:10px">設定活動名稱、專屬網址、開放／截止時間、初始名額與公開設定。時間皆以 KST（UTC+9）為基準。</div>`}
function bindOutline(){document.querySelectorAll('[data-side-tab]').forEach(b=>b.onclick=()=>{editorSideTab=b.dataset.sideTab;renderEditor()});if(editorSideTab!=='outline')return;document.querySelectorAll('[data-outline-id]').forEach(item=>{item.onclick=e=>{if(e.target.closest('.outline-drag'))return;selectedBlockId=item.dataset.outlineId;const target=document.querySelector(`[data-id="${selectedBlockId}"]`);document.querySelectorAll('.outline-item').forEach(x=>x.classList.toggle('active',x===item));document.querySelectorAll('.block').forEach(x=>x.classList.toggle('selected',x.dataset.id===selectedBlockId));if(target)target.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('#settingsPanel').innerHTML=settingsPanel();bindSettingsPanel()};if(item.draggable){item.addEventListener('dragstart',()=>item.classList.add('dragging'));item.addEventListener('dragend',()=>item.classList.remove('dragging'));item.addEventListener('dragover',e=>e.preventDefault());item.addEventListener('drop',e=>{e.preventDefault();const dragged=document.querySelector('.outline-item.dragging');if(!dragged||dragged===item)return;const from=editorBlocks.findIndex(b=>b.id===dragged.dataset.outlineId),to=editorBlocks.findIndex(b=>b.id===item.dataset.outlineId);const [moved]=editorBlocks.splice(from,1);editorBlocks.splice(to,0,moved);renderEditor();toast('已從大綱調整區塊順序')})}})}

function renderEditor(){app.innerHTML=`<div class="editor"><div class="topbar editor-topbar"><div class="brand editor-brand"><div class="brandmark">E</div><span>FORM BUILDER</span></div><button class="btn icon" data-nav="dashboard" title="返回活動管理">${mi('arrow_back')}</button><div class="editor-title">${esc(activityConfig.name)}</div><span class="badge ${editorPublished?'open':'draft'}">${editorPublished?'已發布':'草稿'}</span><span class="save-note">${({zh:'最後儲存：',ko:'마지막 저장: ',en:'Last Saved: ',ja:'最終保存：'}[adminUiLang]||'Last Saved: ')+formatEditorSavedAt(editorLastSavedAt)}</span><div class="top-actions"><button class="btn" id="previewBtn">${mi('visibility')}預覽表單</button>${editorActionButtons()}</div></div><div class="editor-shell"><aside class="side">${editorSideContent()}</aside><main class="canvas-wrap"><div class="canvas">${editorPageSwitch()}<div class="canvas-head secondary"><span class="badge upcoming">手機版預覽來源</span><span class="drag-tip">${mi('drag_indicator')} ${editorPage==='form'?'Email 以外的區塊皆可拖曳排序':'成功頁固定資訊不可移除'}</span></div>${editorPage==='form'?`<div class="form-sheet"><div class="form-accent"></div><div class="form-body"><div class="event-title">${esc(activityConfig.name)}</div><div class="event-desc">請填寫以下報名資訊。活動相關說明由管理員自行編輯並保持原始語言。</div><div id="blocksContainer">${formBlocks()}</div></div></div>`:successPageCanvas()}</div></main><aside class="side right" id="settingsPanel">${editorPage==='form'?settingsPanel():`<h3>報名成功頁</h3><p class="help">報名成功、報名編號、填寫摘要與截圖提示為系統固定內容。管理員只需編輯額外補充內容。</p><div class="field"><label>補充說明</label><textarea id="successNoteInput">${esc(successNote)}</textarea></div>`}</aside></div></div>${protoNav()}`;bind();bindEditor();}
function bindEditor(){
  bindOutline();
  if(editorPage==='form'){bindEditorBlocks();bindSettingsPanel();}
  else document.querySelector('#successNoteInput')?.addEventListener('input',e=>{successNote=e.target.value;const p=document.querySelector('.editable-success-note .paragraph-block');if(p)p.textContent=successNote});
  document.querySelector('#previewBtn').onclick=()=>{previewFromEditor=true;currentLang=({zh:'zh',ko:'ko',en:'en'})[adminUiLang]||'en';renderPublic()};
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
  const choose=panel.querySelector('#chooseImageBtn'), file=panel.querySelector('#imageFileInput'); if(choose&&file){choose.onclick=()=>file.click();file.onchange=e=>{const f=e.target.files?.[0];if(!f)return;compressImageFile(f).then(url=>{block.dataUrl=url;refreshSelectedBlock()}).catch(err=>alert(err&&err.message?err.message:'圖片讀取失敗'))}}
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
      sessionStorage.removeItem('eson_event_dashboard_cache_v2');
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
    return `<tr data-response-row="${esc(r.responseId)}" tabindex="0" role="button" style="cursor:pointer">
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
function renderResponses(){if(!currentEventId){navigate('dashboard');return}app.innerHTML=`${topbar()}<main class="page"><div class="page-head"><div><button class="btn small" data-nav="dashboard">${mi('arrow_back')} 活動列表</button><h1 id="responseEventTitle" style="margin-top:18px">報名資料</h1><div class="muted">報名資料管理 · KST</div></div><div class="actions"><button class="btn" id="openResponsePublicBtn">${mi('open_in_new')} 開啟表單頁面</button><button class="btn" id="editPublishedFormBtn">編輯表單</button></div></div><div class="response-top compact"><div class="card metric"><div class="muted small">目前名額</div><div class="num" id="statCapacity">—</div><div class="tiny muted">目前報名 / 設定總名額</div></div><div class="card metric"><div class="muted small">已確認入金</div><div class="num" id="statPaid">—</div></div><div class="card metric"><div class="muted small">尚未入金</div><div class="num" id="statUnpaid">—</div></div></div><div class="toolbar"><div class="search material-search">${mi('search')}<input id="responseSearch" placeholder="搜尋 Email、姓名或回答內容"></div><div class="filter-row"><select id="paymentFilter"><option value="all">全部入金狀態</option><option value="未確認">未確認</option><option value="已確認">已確認</option><option value="已退款">已退款</option></select><select id="statusFilter"><option value="all">全部報名狀態</option><option value="有效">有效</option><option value="取消">取消</option><option value="作廢">作廢</option></select></div></div><div class="card table-card"><table class="table"><thead><tr><th>編號</th><th>Email</th><th>第一回答</th><th>報名時間（KST）</th><th>入金</th><th>狀態</th><th>備註</th></tr></thead><tbody id="responseRows"></tbody></table></div></main>${protoNav()}`;bind();bindTopMenus();document.querySelector('#responseSearch').oninput=e=>{responseSearchText=e.target.value;refreshResponseRowsLive()};document.querySelector('#paymentFilter').onchange=e=>{responsePaymentFilter=e.target.value;refreshResponseRowsLive()};document.querySelector('#statusFilter').onchange=e=>{responseStatusFilter=e.target.value;refreshResponseRowsLive()};document.querySelector('#editPublishedFormBtn').onclick=()=>loadEventForEditor(currentEventId);document.querySelector('#openResponsePublicBtn').onclick=()=>{const ev=demoEvents.find(x=>x.id===currentEventId);if(ev?.slug)window.open(PUBLIC_EVENT_BASE+'?event='+encodeURIComponent(ev.slug),'_blank')};loadResponsesLive()}
function openResponseDrawerLive(responseId){
  const r=liveResponses.find(x=>String(x.responseId)===String(responseId));
  if(!r){
    console.warn('找不到報名資料',responseId);
    return;
  }
  const answers=orderedAnswerEntries(r).map(item=>
    `<div class="data-pair"><b>${esc(item.label)}</b><span>${esc(prettyAnswer(item.value))}</span></div>`
  ).join('');document.body.insertAdjacentHTML('beforeend',`<div class="drawer-backdrop" id="drawerBg"></div><aside class="drawer" id="drawer"><div class="drawer-head"><div><b style="font-size:20px">${esc(r.registrationNumber)} · ${esc(r.email)}</b><div class="tiny muted">${esc(r.submittedAt)} KST</div></div><button class="btn icon close" id="drawerClose">${mi('close')}</button></div><div class="section-label">報名者提交資料</div>${answers}<div class="section-label">管理資料</div><div class="field"><label>入金狀態</label><select id="drawerPayment"><option value="未確認" ${r.paymentStatus==='未確認'?'selected':''}>未確認</option><option value="已確認" ${r.paymentStatus==='已確認'?'selected':''}>已確認</option><option value="已退款" ${r.paymentStatus==='已退款'?'selected':''}>已退款</option></select></div><div class="field"><label>報名狀態</label><select id="drawerStatus"><option value="有效" ${r.registrationStatus==='有效'?'selected':''}>有效</option><option value="取消" ${r.registrationStatus==='取消'?'selected':''}>取消</option><option value="作廢" ${r.registrationStatus==='作廢'?'selected':''}>作廢</option></select></div><div class="field"><label>管理員備註</label><textarea class="notearea" id="drawerNote">${esc(r.adminNote||'')}</textarea></div><button class="btn primary" style="width:100%;margin-top:12px" id="drawerSave">儲存變更</button><button class="btn danger" style="width:100%;margin-top:16px" id="reuseEmailBtn" ${r.allowEmailReuse?'disabled':''}>${r.allowEmailReuse?'已允許此 Email 再次報名':'允許此 Email 再次報名'}</button></aside>`);const close=()=>{document.querySelector('#drawerBg')?.remove();document.querySelector('#drawer')?.remove()};document.querySelector('#drawerClose').onclick=close;document.querySelector('#drawerBg').onclick=close;document.querySelector('#drawerSave').onclick=async()=>{
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

async function renderPublicHome(){
  setDocumentTitle('ESON Events');
  app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="public-content"><div class="event-title">ESON Events</div><div class="event-desc">${P('home')}</div><div id="publicEventList"><div class="muted">${P('loading')}</div></div></div></section></div>`;
  langOptSelected(renderPublicHome);
  try{
    const events=(await apiGet('listPublicEvents')).events||[];
    const el=document.querySelector('#publicEventList');
    if(!events.length){el.innerHTML=`<div class="info-box">${P('none')}</div>`;return}
    el.innerHTML=events.map(e=>{const s=P(e.state)||e.state;return `<button class="card" data-public-slug="${esc(e.slug)}" style="width:100%;text-align:left;padding:18px;margin-top:12px;cursor:pointer"><b style="font-size:18px">${esc(e.name)}</b><div class="tiny muted" style="margin-top:6px">${esc(s)}${e.showRegistrationCount?` · ${e.acceptedCount}/${e.totalCapacity}`:''}</div></button>`}).join('');
    document.querySelectorAll('[data-public-slug]').forEach(b=>b.onclick=()=>location.href=PUBLIC_EVENT_BASE+'?event='+encodeURIComponent(b.dataset.publicSlug));
  }catch(err){
    document.querySelector('#publicEventList').innerHTML=`<div class="info-box">${P('loadFail')}：${esc(err.message)}</div>`;
  }
}

async function loadPublicEventBySlug(slug){
  currentPublicSlug=slug;
  app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi('progress_activity')}</div><h2>${P('loading')}</h2><p class="muted">${P('wait')}</p></div></section></div>`;
  try{
    const data=await apiGet('getPublicEvent',{slug});
    const detail=data&&data.event;
    if(!detail||!detail.event)throw new Error(PT('badFormat'));

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
    if(detail.state!=='open')throw new Error(PT('notOpen'));

    renderPublic();
  }catch(err){
    app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi('error')}</div><h2>${esc(PT('cannotOpenForm'))}</h2><p>${esc(err.message||PT('readFail'))}</p><button class="btn primary" onclick="location.reload()">${esc(PT('reload'))}</button></div></section></div>`;
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
    if(b.type==='email'&&!String(v||'').trim())return PT('emailRequired');
    if(!b.required)continue;
    if(b.type==='checkbox'&&(!Array.isArray(v)||!v.length))return PT('required',{title:b.title||b.type});
    if(b.type==='grid'&&(b.rows||[]).some(r=>!v?.[r]))return PT('required',{title:b.title||b.type});
    if(!['checkbox','grid'].includes(b.type)&&!String(v||'').trim())return PT('required',{title:b.title||b.type});
  }
  return '';
}
async function submitPublicRegistration(){
  const answers=collectPublicAnswers();
  const err=validatePublicAnswers(answers);
  if(err){alert(err);return}
  const btn=document.querySelector('#submitBtn');
  if(btn){btn.disabled=true;btn.textContent=PT('sending')}
  try{
    const result=await apiPost('submitRegistration',{slug:currentPublicSlug||activityConfig.slug,answers});
    const summary=(editorBlocks||[])
      .filter(b=>['email','short','long','radio','checkbox','select','grid','date','time'].includes(b.type))
      .map(b=>({
        label:b.title||b.type,
        value:Object.prototype.hasOwnProperty.call(answers,b.id)?answers[b.id]:''
      }));

    lastSubmission={
      ...result,
      eventName:activityConfig.name,
      summary
    };
    renderSuccess();
  }catch(err){
    const map={NOT_STARTED:PT('errNotStarted'),PAUSED:PT('errPaused'),CLOSED:PT('errClosed'),FULL:PT('errFull'),DUPLICATE_EMAIL:PT('errDuplicate')};
    alert(map[err.message]||(PT('submitFailed')+err.message));
    if(btn){btn.disabled=false;btn.textContent=i18n[currentLang].submit}
  }
}

function publicHeader(){const exit=previewFromEditor?`<button class="btn preview-exit" id="exitPreview">${mi('close')} ${i18n[currentLang].endPreview}</button>`:'';return `<div class="public-top">${exit}<select class="lang" id="langSelect"><option value="ko">한국어</option><option value="en">English</option><option value="zh">中文</option><option value="ja">日本語</option></select></div>`}
function langOptSelected(renderFn=renderPublic){setTimeout(()=>{syncHtmlLang();const sel=document.querySelector('#langSelect');if(sel){sel.value=currentLang;sel.onchange=()=>{const snap=snapshotPublicForm();currentLang=sel.value;if(!previewFromEditor)localStorage.setItem('eson_public_lang_manual',currentLang);renderFn();restorePublicForm(snap);syncHtmlLang();}}const exit=document.querySelector('#exitPreview');if(exit)exit.onclick=()=>{previewFromEditor=false;renderEditor()}},0)}
function publicEmailHint(b){
  return PT('emailHint');
}
function publicPlaceholder(b,fallbackKey){
  const p=String(b.placeholder||'').trim();
  const defaults=['','請輸入內容','請選擇'];
  return defaults.includes(p)?PT(fallbackKey):p;
}
function publicBlockHtml(b){
 const name=publicAnswerName(b.id);
 const required=b.required?' required':'';
 if(b.type==='email')return `<div class="public-field"><label>${esc(b.title||'Email')} <span class="req">*</span></label><input name="${name}" type="email" placeholder="example@email.com" required><div class="help">${esc(publicEmailHint(b))}</div></div>`;
 if(b.type==='heading')return `<div class="event-title ${b.align==='center'?'align-center':''}" style="font-size:26px">${esc(b.title||'大標題')}</div>`;
 if(b.type==='subheading')return `<h3 class="${b.align==='center'?'align-center':''}">${esc(b.title||'小標題')}</h3>`;
 if(b.type==='paragraph')return `<div class="event-desc ${b.align==='center'?'align-center':''}">${esc(b.text||'')}</div>`;
 if(b.type==='short')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><input name="${name}" placeholder="${esc(publicPlaceholder(b,'inputPh'))}"${required}>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='long')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><textarea name="${name}" class="long-${b.height||'medium'}" placeholder="${esc(publicPlaceholder(b,'inputPh'))}"${required}></textarea>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='radio')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label>${(b.options||[]).map(o=>`<label class="choice"><input type="radio" name="${name}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}${b.other?`<label class="choice"><input type="radio" name="${name}" value="__other__"> ${esc(PT('other'))}</label><input data-other-for="${esc(b.id)}" placeholder="${esc(PT('otherPh'))}">`:''}</div>`;
 if(b.type==='checkbox')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label>${(b.options||[]).map(o=>`<label class="choice"><input type="checkbox" name="${name}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}${b.other?`<div class="choice">${esc(PT('other'))}</div><input data-other-for="${esc(b.id)}" placeholder="${esc(PT('otherPh'))}">`:''}</div>`;
 if(b.type==='select')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><select name="${name}"${required}><option value="">${esc(publicPlaceholder(b,'choose'))}</option>${(b.options||[]).map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;
 if(b.type==='grid'){const rows=b.rows||[],cols=b.cols||[];return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><div class="grid-preview" style="grid-template-columns:1.4fr repeat(${cols.length},1fr)"><span></span>${cols.map(c=>`<b>${esc(c)}</b>`).join('')}${rows.map((r,i)=>`<span>${esc(r)}</span>${cols.map(c=>`<label><input type="radio" name="${name}_${i}" value="${esc(c)}"></label>`).join('')}`).join('')}</div></div>`;}
 if(b.type==='date')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><input name="${name}" type="date"${required}>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='time')return `<div class="public-field"><label>${esc(b.title)}${req(b)}</label><input name="${name}" type="time"${required}>${b.desc?`<div class="help">${esc(b.desc)}</div>`:''}</div>`;
 if(b.type==='image')return b.dataUrl?`<div class="image-preview-block size-${b.size||'large'}"><img src="${esc(b.dataUrl)}" alt="${esc(b.alt||'')}"></div>`:`<div class="image-placeholder">${mi('image')}<span>${esc(PT('imageBlock'))}</span></div>`;
 if(b.type==='divider')return '<div class="divider" style="margin:18px 0"></div>';
 if(b.type==='spacer')return `<div style="height:${b.height==='small'?16:b.height==='large'?54:30}px"></div>`;
 return '';
}
function renderPublic(){setDocumentTitle(activityConfig.name||'ESON Events');const t=i18n[currentLang];app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="public-content"><div class="event-title">${esc(activityConfig.name)}</div><div class="info-box"><b>${t.open}</b>${activityConfig.end?`<br>${t.deadline}: ${String(activityConfig.end).replace('T',' ')} KST (UTC+9)`:''}</div>${editorBlocks.map(publicBlockHtml).join('')}<button class="public-submit" id="submitBtn">${t.submit}</button></div></section></div>${protoNav()}`;bind();langOptSelected();document.querySelector('#submitBtn').onclick=()=>previewFromEditor?toast('預覽模式不會真的送出資料'):showConfirm();}
function showConfirm(){const t=i18n[currentLang];const answers=collectPublicAnswers();const err=validatePublicAnswers(answers);if(err){alert(err);return}document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="confirmModal"><div class="modal"><h3>${t.confirmTitle}</h3><p>${t.confirmText}</p><div class="modal-actions"><button class="btn" id="confirmBack">${t.back}</button><button class="btn primary" id="confirmYes">${t.confirm}</button></div></div></div>`);document.querySelector('#confirmBack').onclick=()=>document.querySelector('#confirmModal').remove();document.querySelector('#confirmYes').onclick=()=>{document.querySelector('#confirmModal').remove();submitPublicRegistration();}}
function renderSuccess(){setDocumentTitle(activityConfig.name||lastSubmission?.eventName||'ESON Events');const t=i18n[currentLang];const s=lastSubmission;if(!s){app.innerHTML=`<div class="public-shell"><section class="public-form"><div class="public-accent"></div><div class="status-page"><h2>${t.success}</h2></div></section></div>`;return}const rows=(s.summary||[]).map(x=>`<div class="item"><b>${esc(x.label)}</b>${esc(Array.isArray(x.value)?x.value.join('、'):(x.value&&typeof x.value==='object'?Object.entries(x.value).map(([k,v])=>k+': '+v).join(' / '):x.value||''))}</div>`).join('');app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi('check_circle')}</div><h2>${t.success}</h2><p>${esc(s.eventName||activityConfig.name)}</p><div class="success-code">${esc(s.registrationNumber)}</div><div class="tiny muted">${t.code}</div><div class="summary"><h3>${t.summary}</h3>${rows}</div>${successNote?`<div class="paragraph-block">${esc(successNote)}</div>`:''}<div class="screenshot-tip"><b>${t.save}</b><br>${t.saveText}</div></div></section></div>`;langOptSelected(renderSuccess);}

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
  setDocumentTitle(activityConfig.name||'ESON Events');
  const t=i18n[currentLang]||i18n.en;
  const openTime=formatKstDateTimeDisplay(kstLocalToIso(activityConfig.start));
  const closeTime=formatKstDateTimeDisplay(kstLocalToIso(activityConfig.end));
  const map={
    notstarted:{icon:'schedule',title:t.notStarted,desc:P('startAt').replace('{time}',openTime)},
    full:{icon:'group_off',title:t.full,desc:P('fullDesc')},
    closed:{icon:'event_busy',title:t.closed,desc:P('closedAt').replace('{time}',closeTime)},
    paused:{icon:'pause_circle',title:t.paused,desc:P('pausedDesc')}
  };
  const s=map[type]||map.closed;
  app.innerHTML=`<div class="public-shell">${publicHeader()}<section class="public-form"><div class="public-accent"></div><div class="status-page"><div class="status-icon">${mi(s.icon)}</div><h2>${esc(s.title)}</h2><p class="muted">${esc(s.desc)}</p></div></section></div>`;
  langOptSelected(()=>renderStatus(type));
}
function showMyAccount(){
  const user=window.EsonFirebase.currentUser();
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="accountModal"><div class="modal"><div class="modal-title-row"><h3>我的帳號</h3><button class="btn icon" id="accountClose">${mi('close')}</button></div><div class="data-pair"><b>帳號</b><span>${esc(currentAdminName())}</span></div><div class="data-pair"><b>Email</b><span>${esc(user?.email||'')}</span></div><div class="data-pair"><b>權限</b><span>${esc(currentAdminRole())}</span></div><div class="field"><label>目前密碼</label><input type="password" id="pwCurrent" autocomplete="current-password" placeholder="輸入目前密碼"></div><div class="field"><label>新密碼</label><input type="password" id="pwNew" autocomplete="new-password" placeholder="輸入新密碼"></div><div class="field"><label>再次輸入新密碼</label><input type="password" id="pwNew2" autocomplete="new-password" placeholder="再次輸入新密碼"></div><div class="modal-actions"><button class="btn primary" id="changePassword">修改密碼</button></div></div></div>`);
  const close=()=>document.querySelector('#accountModal')?.remove();
  document.querySelector('#accountClose').onclick=close;
  const btn=document.querySelector('#changePassword');
  btn.onclick=async()=>{
    const cur=document.querySelector('#pwCurrent').value;
    const n1=document.querySelector('#pwNew').value;
    const n2=document.querySelector('#pwNew2').value;
    if(!cur||!n1||!n2){alert('請填寫所有欄位');return}
    if(n1.length<8){alert('新密碼至少需要 8 個字元');return}
    if(n1!==n2){alert('兩次輸入的新密碼不一致');return}
    btn.disabled=true;
    try{
      const u=firebase.auth().currentUser;
      await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,cur));
      await u.updatePassword(n1);
      close();toast('密碼已更新');
    }catch(err){
      const code=String(err&&err.code||'');
      if(/wrong-password|invalid-credential|invalid-login/.test(code))alert('目前密碼不正確');
      else alert('修改失敗：'+(err&&err.message||code));
    }finally{btn.disabled=false}
  };
}
async function showAdminManage(){
  if(currentAdminProfile?.role!=='owner')return;
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="adminModal"><div class="modal modal-wide"><div class="modal-title-row"><div><h3>管理員管理</h3><p>只有 Owner 可以看到此功能。</p></div><button class="btn icon" id="adminClose">${mi('close')}</button></div><div id="adminList"><div class="muted small" style="padding:14px 0">正在讀取資料...</div></div></div></div>`);
  const close=()=>document.querySelector('#adminModal')?.remove();
  document.querySelector('#adminClose').onclick=close;
  const me=window.EsonFirebase.currentUser();
  let rows=[{uid:me?.uid||'',name:currentAdminName(),role:currentAdminRole(),email:me?.email||'',self:true}];
  try{
    const snap=await firebase.firestore().collection('admins').get();
    const list=[];
    snap.forEach(d=>{const x=d.data()||{};list.push({uid:d.id,name:x.name||x.email||d.id,role:x.role==='owner'?'Owner':'Admin',email:x.email||'',self:d.id===me?.uid})});
    if(list.length)rows=list;
  }catch(e){/* rules may not allow listing admins */}
  const el=document.querySelector('#adminList');
  if(!el)return;
  el.innerHTML=rows.map((r,i)=>`<div class="admin-user-card"><div><b>${esc(r.name)}</b> ${r.self?'<span class="badge open">目前登入帳號</span>':''}<div class="tiny muted">${esc(r.role)}${r.email?' · '+esc(r.email):''}</div></div>${r.self?'':`<button class="btn" data-reset-idx="${i}">${mi('lock_reset')}<span>重置 ${esc(r.name)} 密碼</span></button>`}</div>`).join('');
  el.querySelectorAll('[data-reset-idx]').forEach(b=>b.onclick=()=>showResetPassword(rows[Number(b.dataset.resetIdx)]));
}
function showResetPassword(target){
  document.querySelector('#resetPwModal')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="resetPwModal"><div class="modal"><h3>重置 ${esc(target.name)} 密碼</h3><p>請設定新的臨時密碼，並自行告知 ${esc(target.name)}。對方登入後可到「我的帳號」自行更改。</p><div class="field"><label>新的臨時密碼</label><input id="rpNew" type="password" autocomplete="new-password" placeholder="至少 8 碼"></div><div class="field"><label>再次輸入</label><input id="rpConfirm" type="password" autocomplete="new-password"></div><div class="modal-actions"><button class="btn" id="rpCancel">取消</button><button class="btn primary" id="rpOk">確認重置</button></div></div></div>`);
  const m=document.querySelector('#resetPwModal');
  m.querySelector('#rpCancel').onclick=()=>m.remove();
  m.querySelector('#rpOk').onclick=async()=>{
    const a=m.querySelector('#rpNew').value,b=m.querySelector('#rpConfirm').value;
    if(a.length<8){alert('密碼至少需要 8 碼');return}
    if(a!==b){alert('兩次輸入的密碼不一致');return}
    const btn=m.querySelector('#rpOk');btn.disabled=true;
    try{
      await window.EsonFirebase.apiPost('resetAdminPassword',{uid:target.uid,newPassword:a});
      m.remove();toast('已重置 '+target.name+' 密碼');
    }catch(err){
      btn.disabled=false;
      const c=String(err&&err.message||err);
      const map={FORBIDDEN:'只有 Owner 可以重置密碼',WEAK_PASSWORD:'密碼至少需要 8 碼',ADMIN_NOT_FOUND:'找不到此管理員',INVALID_TARGET:'無法重置此帳號',UNAUTHENTICATED:'請重新登入後再試'};
      if(map[c])alert(map[c]);
      else if(/not-found|NOT_FOUND|404|Failed to fetch|internal/i.test(c)&&!/ADMIN_NOT_FOUND/.test(c))alert('尚未部署重置密碼的 Cloud Function（resetAdminPassword），請先部署後再試');
      else alert('重置失敗：'+c);
    }
  };
}

function showSavingNotice(text='正在儲存中…'){
  document.querySelector('.saving-notice')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="toast saving-notice">${mi('progress_activity')} ${text}</div>`);
}
function hideSavingNotice(){document.querySelector('.saving-notice')?.remove();}
function toast(text){document.querySelector('.toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="toast">${mi('check_circle')} ${text}</div>`);setTimeout(()=>document.querySelector('.toast')?.remove(),2200)}

function bind(){
  setTimeout(()=>translateAdminUI(document.body),0);
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
      currentAdminProfile=null;adminContextUid='';
    }
    navigate(route);
  });
}
function navigate(route){previewFromEditor=false;location.hash=route;renderRoute()}
function setDocumentTitle(title){document.title=title||'ESON Events';}

async function renderRoute(){
  const publicSlug=new URLSearchParams(location.search).get('event');
  if(!IS_ADMIN_PATH){
    await initPublicLanguage();
    syncHtmlLang();
    if(publicSlug)await loadPublicEventBySlug(publicSlug);
    else await renderPublicHome();
    return;
  }

  setDocumentTitle('Eson Event Admin Dashboard');
  await window.EsonFirebase.ready();
  const r=location.hash.replace('#','')||'login';
  const user=window.EsonFirebase.currentUser();

  if(r!=='login'&&!user){
    if(location.hash!=='#login')location.hash='login';
    adminUiLang=localStorage.getItem('eson_login_lang')||'en';
    renderLogin();
    return;
  }

  if(user)await ensureAdminContext();
  syncHtmlLang();

  if(r==='login'&&user){
    if(location.hash!=='#dashboard')location.hash='dashboard';
    renderDashboard();
    return;
  }

  ({login:renderLogin,dashboard:renderDashboard,editor:renderEditor,responses:renderResponses,public:renderPublic,success:renderSuccess,notstarted:()=>renderStatus('notstarted'),full:()=>renderStatus('full'),closed:()=>renderStatus('closed'),paused:()=>renderStatus('paused')}[r]||renderLogin)();
}
window.addEventListener('hashchange',()=>renderRoute());
renderRoute();