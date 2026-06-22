const APP_CONFIG = window.APP_CONFIG || {};
const GOOGLE_API_KEY = APP_CONFIG.GOOGLE_API_KEY;
const GOOGLE_CALENDAR_ID = APP_CONFIG.GOOGLE_CALENDAR_ID;
const firebaseConfig = APP_CONFIG.FIREBASE_CONFIG;
const FIREBASE_VAPID_KEY = APP_CONFIG.FIREBASE_VAPID_KEY;
const TOKEN_COLLECTION = APP_CONFIG.TOKEN_COLLECTION || 'tokens';
let deferredInstallPrompt = null;
let swRegistration = null;
let messaging = null;
let firestoreDb = null;

const i18n = {
  zh: {
    install: '',
    refresh: '重新整理',
    todayLabel: '今天',
    timezoneLabel: '偵測時區',
        loadingEvents: '正在取得最新資料…',
    loadError: '資料讀取失敗，請稍後再試。',
    noEvents: '這個月份目前沒有公開事件。',
    calendarKicker: 'Calendar',
    todayButton: '回到今天',
    listMode: '列表模式',
    calendarMode: '月曆模式',
    listEmpty: '這個月份目前沒有事件。',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    monthFormat: (date) => `${date.getFullYear()}年 ${date.getMonth() + 1}月`,
    installHint: '請先將網頁加入主畫面後即可接收通知。',
    enableNotifications: '接收通知',
    notificationEnabled: '通知設定成功',
    notificationDenied: '通知權限被拒絕，請到瀏覽器或手機設定中重新允許通知。',
    notificationUnavailable: '請先將網頁加入主畫面後即可接收通知。',
    installReady: '可以安裝到主畫面了',
    refreshDone: '已取得最新資料',
    modalOk: '知道了',
    syncSuccessTitle: '同步完成',
    syncSuccessMessage: '已取得最新資料。',
    notificationSuccessTitle: '通知設定成功',
    notificationSuccessMessage: '未來有新的活動或公告時，將會自動收到通知提醒。',
    installGuideTitle: '接收通知前需要先安裝 App',
    installGuideIos: '1. 點擊 Safari 的「分享」\n2. 選擇「加入主畫面」\n3. 從主畫面開啟 App\n4. 再點擊「接收通知」',
    installGuideAndroid: '1. 點擊 Chrome 選單（⋮）\n2. 選擇「加入主畫面」\n3. 選擇「安裝應用程式」\n4. 從安裝後的 App 開啟\n5. 再點擊「接收通知」\n\n※ 請勿選擇「建立捷徑」',
    installGuideGeneric: '請先將網頁加入主畫面後，再從主畫面開啟並接收通知。',
    errorTitle: '發生錯誤',
    allDay: '整天',
    followEson: 'follow ESON',
    uncategorized: '未分類',
    openLink: '開啟連結',
    tags: {
      live: '直播', birthday: '生日', anniversary: '紀念日', fan: '粉絲活動', notice: '公告', schedule: '行程', release: '發行', travel: '行程'
    }
  },
  ko: {
    install: '홈 화면에 추가',
    refresh: '새로고침',
    todayLabel: '오늘',
    timezoneLabel: '감지된 시간대',
        loadingEvents: '최신 데이터를 불러오는 중…',
    loadError: '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    noEvents: '이 달에는 공개 일정이 없습니다.',
    calendarKicker: 'Calendar',
    todayButton: '오늘로 이동',
    listMode: '리스트 보기',
    calendarMode: '달력 보기',
    listEmpty: '이 달에는 일정이 없습니다.',
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    monthFormat: (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
    installHint: '현재 브라우저에서 설치 안내를 제공하지 않습니다. 브라우저 메뉴에서 홈 화면에 추가해 주세요.',
    enableNotifications: '알림 받기',
    notificationEnabled: '알림 설정이 완료되었습니다.',
    notificationDenied: '알림 권한이 거부되었습니다. 브라우저 또는 휴대폰 설정에서 다시 허용해 주세요.',
    notificationUnavailable: '알림을 받으려면 먼저 이 페이지를 홈 화면에 추가해 주세요.',
    installReady: '홈 화면에 설치할 수 있습니다',
    refreshDone: '최신 데이터를 불러왔습니다.',
    modalOk: '확인',
    syncSuccessTitle: '동기화 완료',
    syncSuccessMessage: '최신 데이터를 불러왔습니다.',
    notificationSuccessTitle: '알림 설정 완료',
    notificationSuccessMessage: '새로운 일정이나 공지가 있으면 자동으로 알림을 받을 수 있습니다.',
    installGuideTitle: '알림을 받으려면 먼저 앱을 설치해 주세요',
    installGuideIos: '1. Safari의 공유 버튼을 누르세요\n2. 「홈 화면에 추가」를 선택하세요\n3. 홈 화면에서 App을 다시 여세요\n4. 다시 「알림 받기」를 눌러 주세요',
    installGuideAndroid: '1. Chrome 메뉴(⋮)를 누르세요\n2. 「홈 화면에 추가」를 선택하세요\n3. 「앱 설치」를 선택하세요\n4. 설치된 App에서 다시 여세요\n5. 다시 「알림 받기」를 눌러 주세요\n\n※ 「바로가기 추가」가 아닌 「앱 설치」를 선택해 주세요',
    installGuideGeneric: '알림을 받으려면 먼저 이 페이지를 홈 화면에 추가한 뒤 다시 열어 주세요.',
    errorTitle: '오류가 발생했습니다',
    allDay: '종일',
    followEson: 'follow ESON',
    uncategorized: '미분류',
    openLink: '링크 열기',
    tags: {
      live: '라이브', birthday: '생일', anniversary: '기념일', fan: '팬 이벤트', notice: '공지', schedule: '스케줄', release: '발매', travel: '스케줄'
    }
  },
  en: {
    install: 'Add to Home Screen',
    refresh: 'Refresh',
    todayLabel: 'Today',
    timezoneLabel: 'Detected timezone',
        loadingEvents: 'Getting the latest data…',
    loadError: 'Failed to load data. Please try again later.',
    noEvents: 'No public events for this month yet.',
    calendarKicker: 'Calendar',
    todayButton: 'Today',
    listMode: 'List view',
    calendarMode: 'Calendar view',
    listEmpty: 'No events for this month.',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    monthFormat: (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    installHint: 'Your browser is not showing an install prompt yet. Use the browser menu to add this page to your home screen.',
    enableNotifications: 'Receive notifications',
    notificationEnabled: 'Notification settings saved.',
    notificationDenied: 'Notification permission was denied. Please allow it again from your browser or device settings.',
    notificationUnavailable: 'Please add this page to your Home Screen first to receive notifications.',
    installReady: 'Ready to install',
    refreshDone: 'Latest data loaded.',
    modalOk: 'OK',
    syncSuccessTitle: 'Sync complete',
    syncSuccessMessage: 'Latest data has been loaded.',
    notificationSuccessTitle: 'Notifications enabled',
    notificationSuccessMessage: 'You will receive notifications when new events or notices are available.',
    installGuideTitle: 'Install the app before receiving notifications',
    installGuideIos: '1. Tap the Safari Share button\n2. Choose “Add to Home Screen”\n3. Open the app from your Home Screen\n4. Tap “Receive notifications” again',
    installGuideAndroid: '1. Tap the Chrome menu (⋮)\n2. Choose “Add to Home screen”\n3. Choose “Install app”\n4. Open the installed app\n5. Tap “Receive notifications” again\n\n※ Please choose “Install app”, not “Create shortcut”.',
    installGuideGeneric: 'Please add this page to your Home Screen, then open it from there to receive notifications.',
    errorTitle: 'Something went wrong',
    allDay: 'All day',
    followEson: 'follow ESON',
    uncategorized: 'Uncategorized',
    openLink: 'Open Link',
    tags: {
      live: 'Live', birthday: 'Birthday', anniversary: 'Anniversary', fan: 'Fan event', notice: 'Notice', schedule: 'Schedule', release: 'Release', travel: 'Schedule'
    }
  },
  ja: {
    install: 'ホーム画面に追加',
    refresh: '更新',
    todayLabel: '今日',
    timezoneLabel: '検出されたタイムゾーン',
        loadingEvents: '最新データを取得中…',
    loadError: 'データを読み込めませんでした。時間をおいて再度お試しください。',
    noEvents: 'この月には公開予定がありません。',
    calendarKicker: 'Calendar',
    todayButton: '今日に戻る',
    listMode: 'リスト表示',
    calendarMode: 'カレンダー表示',
    listEmpty: 'この月には予定がありません。',
    weekdays: ['日', '月', '火', '水', '木', '金', '土'],
    monthFormat: (date) => `${date.getFullYear()}年 ${date.getMonth() + 1}月`,
    installHint: '現在ブラウザのインストール案内が表示されていません。ブラウザメニューからホーム画面に追加してください。',
    enableNotifications: '通知を受け取る',
    notificationEnabled: '通知設定が完了しました。',
    notificationDenied: '通知権限が拒否されました。ブラウザまたは端末設定から再度許可してください。',
    notificationUnavailable: '通知を受け取るには、先にこのページをホーム画面に追加してください。',
    installReady: 'ホーム画面に追加できます',
    refreshDone: '最新データを取得しました。',
    modalOk: 'OK',
    syncSuccessTitle: '同期完了',
    syncSuccessMessage: '最新データを取得しました。',
    notificationSuccessTitle: '通知設定が完了しました',
    notificationSuccessMessage: '新しい予定やお知らせがあると、自動で通知を受け取れます。',
    installGuideTitle: '通知を受け取る前に App をインストールしてください',
    installGuideIos: '1. Safari の共有ボタンをタップ\n2. 「ホーム画面に追加」を選択\n3. ホーム画面から App を開く\n4. もう一度「通知を受け取る」をタップ',
    installGuideAndroid: '1. Chrome メニュー（⋮）をタップ\n2. 「ホーム画面に追加」を選択\n3. 「アプリをインストール」を選択\n4. インストール後の App から開く\n5. もう一度「通知を受け取る」をタップ\n\n※ 「ショートカットを作成」ではなく「アプリをインストール」を選択してください',
    installGuideGeneric: '通知を受け取るには、先にこのページをホーム画面に追加してから開いてください。',
    errorTitle: 'エラーが発生しました',
    allDay: '終日',
    followEson: 'follow ESON',
    uncategorized: '未分類',
    openLink: 'リンクを開く',
    tags: {
      live: 'ライブ', birthday: '誕生日', anniversary: '記念日', fan: 'ファンイベント', notice: 'お知らせ', schedule: 'スケジュール', release: 'リリース', travel: 'スケジュール'
    }
  }
};


function detectInitialLanguage() {
  const timeZone = getUserTimeZone();
  const timezoneLanguageMap = {
    'Asia/Taipei': 'zh',
    'Asia/Shanghai': 'zh',
    'Asia/Chongqing': 'zh',
    'Asia/Harbin': 'zh',
    'Asia/Urumqi': 'zh',
    'Asia/Seoul': 'ko',
    'Asia/Tokyo': 'ja'
  };

  if (timezoneLanguageMap[timeZone]) return timezoneLanguageMap[timeZone];

  const languages = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];

  const normalized = languages.map(lang => String(lang).toLowerCase());
  if (normalized.some(lang => lang === 'zh-tw' || lang === 'zh-hant' || lang === 'zh-cn' || lang === 'zh-hans' || lang.startsWith('zh-'))) return 'zh';
  if (normalized.some(lang => lang === 'ko' || lang.startsWith('ko-'))) return 'ko';
  if (normalized.some(lang => lang === 'ja' || lang.startsWith('ja-'))) return 'ja';
  return 'en';
}

let currentLang = detectInitialLanguage();
let viewDate = new Date();
const today = new Date();
let calendarEvents = [];
let googleColors = null;
let isLoading = false;
let loadError = '';
let lastLoadedRange = '';
let currentViewMode = 'calendar';

const calendarGrid = document.getElementById('calendarGrid');
const weekdayGrid = document.getElementById('weekdayGrid');
const monthTitle = document.getElementById('monthTitle');
const todayText = document.getElementById('todayText');
const timezoneText = document.getElementById('timezoneText');
const modal = document.getElementById('eventModal');
const appModal = document.getElementById('appModal');
const appModalTitle = document.getElementById('appModalTitle');
const appModalMessage = document.getElementById('appModalMessage');
const appModalOk = document.getElementById('appModalOk');
const eventListView = document.getElementById('eventListView');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const calendarPanel = document.querySelector('.calendar-panel');

const fallbackColors = {
  blue: { background: 'rgba(43,114,255,.12)', border: 'rgba(43,114,255,.74)' },
  skyblue: { background: '#d8edfc', border: '#0ba7f0' },
  orange: { background: 'rgba(255,155,69,.14)', border: 'rgba(255,155,69,.78)' },
  orangered: { background: '#ffebea', border: '#fc5043'},
  pink: { background: 'rgba(255,122,182,.13)', border: 'rgba(255,122,182,.78)' },
  mint: { background: 'rgba(119,216,189,.15)', border: 'rgba(119,216,189,.78)' },
  gray: { background: 'rgba(104,112,130,.10)', border: 'rgba(104,112,130,.52)' }
};

const categoryFallbackColor = {
  live: fallbackColors.skyblue,
  birthday: fallbackColors.orange,
  anniversary: fallbackColors.pink,
  fan: { background: 'rgba(150,126,255,.13)', border: 'rgba(150,126,255,.70)' },
  notice: fallbackColors.blue,
  schedule: fallbackColors.mint,
  travel: fallbackColors.mint,
  release: fallbackColors.orangered
};

function pad(num) { return String(num).padStart(2, '0'); }
function dateKey(date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
function sameDay(a, b) { return dateKey(a) === dateKey(b); }
function getLocale() { return currentLang === 'zh' ? 'zh-TW' : currentLang === 'ko' ? 'ko-KR' : currentLang === 'ja' ? 'ja-JP' : 'en-US'; }
function getUserTimeZone() { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function formatModalMessage(message = '') {
  return escapeHtml(message).replace(/\n/g, '<br>');
}

function showAppModal(title, message) {
  if (!appModal) {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return;
  }
  appModalTitle.textContent = title || '';
  appModalMessage.innerHTML = formatModalMessage(message || '');
  appModalOk.textContent = i18n[currentLang].modalOk || 'OK';
  appModal.showModal();
}

function showInstallGuideModal() {
  const platform = getDevicePlatform();
  let message = i18n[currentLang].installGuideGeneric;
  if (platform === 'iOS / iPadOS') message = i18n[currentLang].installGuideIos;
  if (platform === 'Android') message = i18n[currentLang].installGuideAndroid;
  showAppModal(i18n[currentLang].installGuideTitle, message);
}

function stripHtml(value = '') {
  const normalized = String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<(p|div|li)[^>]*>/gi, '');
  const div = document.createElement('div');
  div.innerHTML = normalized;
  return (div.textContent || div.innerText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n');
}

function renderDescriptionHtml(description = '') {
  const plain = String(description).trim();
  if (!plain) return '—';

  const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+)/g;
  const links = [];
  let body = plain.replace(urlRegex, (match) => {
    const trailingMatch = match.match(/[.,!?，。；;：:)）】]+$/);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const urlText = trailing ? match.slice(0, -trailing.length) : match;
    const href = urlText.startsWith('www.') ? `https://${urlText}` : urlText;
    links.push({ href, text: urlText });
    return trailing;
  }).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  const bodyHtml = body
    ? `<div class="modal-desc-text">${escapeHtml(body).replace(/\n/g, '<br>')}</div>`
    : '';

  const uniqueLinks = links.filter((link, index, array) =>
    array.findIndex(item => item.href === link.href) === index
  );

  const linkHtml = uniqueLinks.length
    ? `<div class="modal-link-list">${uniqueLinks.map((link, index) => `
        <a class="modal-link-btn" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">
          <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
          ${escapeHtml(i18n[currentLang].openLink)}${uniqueLinks.length > 1 ? ` ${index + 1}` : ''}
        </a>
      `).join('')}</div>`
    : '';

  return bodyHtml || linkHtml ? `${bodyHtml}${linkHtml}` : '—';
}
function startOfCalendarGrid(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}
function endOfCalendarGrid(date) {
  const start = startOfCalendarGrid(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 42);
  return end;
}

function getDescriptionLines(description = '') {
  return stripHtml(description)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function extractCategory(description = '') {
  const lines = getDescriptionLines(description);
  const categoryLine = lines.find(line => /^CATEGORY\s*:/i.test(line));
  if (!categoryLine) return '';
  const match = categoryLine.match(/^CATEGORY\s*:\s*([a-zA-Z0-9_-]+)/i);
  return match ? match[1].toLowerCase() : '';
}

function cleanDescription(description = '') {
  const lines = stripHtml(description).split('\n');
  const cleaned = lines
    .map(line => line.trim())
    .filter(line => !/^CATEGORY\s*:/i.test(line))
    .filter(line => !/^PUSH\s*:/i.test(line))
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned;
}

function normalizeGoogleEvent(item) {
  const isAllDay = Boolean(item.start?.date);
  const startRaw = item.start?.dateTime || item.start?.date;
  const endRaw = item.end?.dateTime || item.end?.date;
  const startDate = isAllDay ? new Date(`${startRaw}T00:00:00`) : new Date(startRaw);
  const endDate = endRaw ? (isAllDay ? new Date(`${endRaw}T00:00:00`) : new Date(endRaw)) : null;
  const category = extractCategory(item.description || '');
  const cleanDesc = cleanDescription(item.description || '');

  return {
    id: item.id,
    title: item.summary || i18n[currentLang].uncategorized,
    description: cleanDesc,
    category,
    colorId: item.colorId || '',
    start: startDate,
    end: endDate,
    isAllDay,
    htmlLink: item.htmlLink || '',
    reminders: item.reminders || {}
  };
}

function hexToRgba(hex, alpha = 0.14) {
  if (!hex || !hex.startsWith('#')) return null;
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return null;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getEventColor(event) {
  if (event.colorId && googleColors?.event?.[event.colorId]) {
    const backgroundHex = googleColors.event[event.colorId].background;
    return {
      background: hexToRgba(backgroundHex, 0.18) || backgroundHex,
      border: backgroundHex
    };
  }
  return categoryFallbackColor[event.category] || fallbackColors.blue;
}

function eventStyle(event) {
  const color = getEventColor(event);
  return `background:${color.background};border-left-color:${color.border};`;
}

function eventOccursOnDate(event, key) {
  if (event.isAllDay) {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : new Date(start);
    if (event.end) end.setDate(end.getDate() - 1);
    const target = new Date(`${key}T00:00:00`);
    return target >= start && target <= end;
  }
  return dateKey(event.start) === key;
}

function formatEventTime(event) {
  if (event.isAllDay) return i18n[currentLang].allDay;
  const locale = getLocale();
  const options = { hour: '2-digit', minute: '2-digit', hour12: false };
  if (event.end && dateKey(event.start) === dateKey(event.end)) {
    return `${event.start.toLocaleTimeString(locale, options)}–${event.end.toLocaleTimeString(locale, options)}`;
  }
  return event.start.toLocaleTimeString(locale, options);
}

function applyLanguage() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-Hant' : currentLang;
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = i18n[currentLang][key] || node.textContent;
  });
  renderWeekdays();
  renderCalendar();
  renderMeta();
  updateViewModeUi();
}

function renderMeta() {
  const locale = getLocale();
  todayText.textContent = today.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  timezoneText.textContent = getUserTimeZone();
}

function renderWeekdays() {
  weekdayGrid.innerHTML = i18n[currentLang].weekdays
    .map(day => `<div class="weekday">${day}</div>`)
    .join('');
}


function eventOverlapsMonth(event, year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(event.start);
  if (event.isAllDay && event.end) end.setDate(end.getDate() - 1);
  return start <= monthEnd && end >= monthStart;
}

function getVisibleMonthEvents() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  return calendarEvents
    .filter(event => eventOverlapsMonth(event, year, month))
    .sort((a, b) => a.start - b.start);
}

function updateViewModeUi() {
  if (!eventListView || !viewToggleBtn) return;
  const isList = currentViewMode === 'list';
  weekdayGrid.hidden = isList;
  calendarGrid.hidden = isList;
  eventListView.hidden = !isList;
  calendarPanel?.classList.toggle('list-mode', isList);
  document.body.classList.toggle('is-list-view', isList);
  viewToggleBtn.textContent = isList ? i18n[currentLang].calendarMode : i18n[currentLang].listMode;
}

function renderEventListView() {
  if (!eventListView) return;
  const locale = getLocale();
  const events = getVisibleMonthEvents();

  if (events.length === 0) {
    eventListView.innerHTML = `<p class="list-empty">${escapeHtml(i18n[currentLang].listEmpty)}</p>`;
    return;
  }

  eventListView.innerHTML = events.map(event => {
    const dateText = event.start.toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' });
    const tagLabel = event.category ? (i18n[currentLang].tags[event.category] || event.category) : i18n[currentLang].uncategorized;
    return `
      <button class="event-list-card" data-event-id="${escapeHtml(event.id)}" type="button">
        <span class="event-list-date">${escapeHtml(dateText)}</span>
        <span class="event-list-title">${escapeHtml(event.title)}</span>
        <span class="event-list-meta">${escapeHtml(formatEventTime(event))}</span>
        <span class="event-list-tag" style="${eventStyle(event)}">${escapeHtml(tagLabel)}</span>
      </button>
    `;
  }).join('');

  eventListView.querySelectorAll('.event-list-card').forEach(button => {
    button.addEventListener('click', () => {
      const eventData = calendarEvents.find(item => item.id === button.dataset.eventId);
      if (eventData) openEvent(eventData);
    });
  });
}

function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  monthTitle.textContent = i18n[currentLang].monthFormat(viewDate);

  const start = startOfCalendarGrid(viewDate);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + i);
    cells.push(cellDate);
  }

  calendarGrid.innerHTML = cells.map((cellDate) => {
    const key = dateKey(cellDate);
    const events = calendarEvents.filter(event => eventOccursOnDate(event, key));
    const isMuted = cellDate.getMonth() !== month;
    const isToday = sameDay(cellDate, today);
    const eventHtml = events.map(event => `
      <button class="event-pill" style="${eventStyle(event)}" data-event-id="${escapeHtml(event.id)}">
        ${escapeHtml(event.title)}
      </button>
    `).join('');

    return `
      <article class="day-cell ${isMuted ? 'muted' : ''} ${isToday ? 'today' : ''}" data-date="${key}">
        <div class="day-number">${cellDate.getDate()}</div>
        <div class="event-list">${eventHtml}</div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.event-pill').forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const eventData = calendarEvents.find(item => item.id === button.dataset.eventId);
      if (eventData) openEvent(eventData);
    });
  });

  renderEventListView();
  updateViewModeUi();
  renderCalendarStatus();
}

function renderCalendarStatus() {
  const oldStatus = document.querySelector('.calendar-status');
  if (oldStatus) oldStatus.remove();

  let message = '';
  let type = '';
  const monthEvents = calendarEvents.filter(event => event.start.getMonth() === viewDate.getMonth() && event.start.getFullYear() === viewDate.getFullYear());
  if (isLoading) {
    message = i18n[currentLang].loadingEvents;
    type = 'loading';
  } else if (loadError) {
    message = i18n[currentLang].loadError;
    type = 'error';
  } else if (monthEvents.length === 0) {
    message = i18n[currentLang].noEvents;
    type = 'empty';
  }

  if (!message) return;
  const status = document.createElement('p');
  status.className = `calendar-status ${type}`;
  status.textContent = message;
  (currentViewMode === 'list' ? eventListView : calendarGrid).after(status);
}

function openEvent(eventData) {
  const locale = getLocale();
  document.getElementById('modalDate').textContent = eventData.start.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  document.getElementById('modalTitle').textContent = eventData.title;
  document.getElementById('modalTime').textContent = formatEventTime(eventData);
  document.getElementById('modalDesc').innerHTML = renderDescriptionHtml(eventData.description);
  const tagLabel = eventData.category ? (i18n[currentLang].tags[eventData.category] || eventData.category) : i18n[currentLang].uncategorized;
  document.getElementById('modalTags').innerHTML = `<span>${escapeHtml(tagLabel)}</span>`;
  modal.showModal();
}

async function loadGoogleColors() {
  if (googleColors) return googleColors;
  const url = new URL('https://www.googleapis.com/calendar/v3/colors');
  url.searchParams.set('key', GOOGLE_API_KEY);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Colors API error: ${response.status}`);
  googleColors = await response.json();
  return googleColors;
}

async function loadEvents(force = false) {
  const start = startOfCalendarGrid(viewDate);
  const end = endOfCalendarGrid(viewDate);
  const rangeKey = `${start.toISOString()}_${end.toISOString()}`;
  if (!force && rangeKey === lastLoadedRange && calendarEvents.length) return;

  isLoading = true;
  loadError = '';
  renderCalendar();

  try {
    await loadGoogleColors();
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`);
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('timeMin', start.toISOString());
    url.searchParams.set('timeMax', end.toISOString());
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeZone', getUserTimeZone());
    url.searchParams.set('maxResults', '250');

    const response = await fetch(url.toString());
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Events API error: ${response.status} ${details}`);
    }

    const data = await response.json();
    calendarEvents = (data.items || []).map(normalizeGoogleEvent);
    lastLoadedRange = rangeKey;
  } catch (error) {
    console.error(error);
    calendarEvents = [];
    loadError = error.message;
  } finally {
    isLoading = false;
    renderCalendar();
  }
}

document.getElementById('prevMonth').addEventListener('click', async () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  await loadEvents();
});

document.getElementById('nextMonth').addEventListener('click', async () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  await loadEvents();
});

document.getElementById('todayBtn').addEventListener('click', async () => {
  viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  await loadEvents();
});

viewToggleBtn.addEventListener('click', () => {
  currentViewMode = currentViewMode === 'list' ? 'calendar' : 'list';
  renderCalendar();
});

document.getElementById('closeModal').addEventListener('click', () => modal.close());
if (appModalOk) appModalOk.addEventListener('click', () => appModal.close());
const appModalClose = document.getElementById('appModalClose');
if (appModalClose) appModalClose.addEventListener('click', () => appModal.close());

document.querySelectorAll('.lang-btn').forEach(button => {
  button.addEventListener('click', () => {
    currentLang = button.dataset.lang;
    applyLanguage();
  });
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
  await loadEvents(true);
  if (!loadError) showAppModal(i18n[currentLang].syncSuccessTitle, i18n[currentLang].syncSuccessMessage);
});


window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});


async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser.');
    return null;
  }
  try {
    swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js?v=18', { scope: './' });
    console.log('Service Worker registered:', swRegistration.scope);
    return swRegistration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

function ensureFirebaseApp() {
  if (!window.firebase) {
    console.warn('Firebase SDK is not loaded.');
    return false;
  }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  return true;
}

function initFirestore() {
  if (!ensureFirebaseApp() || !firebase.firestore) {
    console.warn('Firebase Firestore SDK is not loaded.');
    firestoreDb = null;
    return null;
  }
  if (!firestoreDb) firestoreDb = firebase.firestore();
  return firestoreDb;
}

async function initFirebaseMessaging() {
  if (!window.firebase || !firebase.messaging) {
    console.warn('Firebase Messaging SDK is not loaded.');
    messaging = null;
    return;
  }

  try {
    let supported = true;
    if (typeof firebase.messaging.isSupported === 'function') {
      supported = await firebase.messaging.isSupported();
    }

    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser/context.');
      messaging = null;
      return;
    }

    if (!ensureFirebaseApp()) return;
    initFirestore();
    messaging = firebase.messaging();

    messaging.onMessage((payload) => {
      const title = payload.notification?.title || 'ESON × UNISON Calendar';
      const body = payload.notification?.body || '';
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: './icons/icon-192.png',
          badge: './icons/icon-192.png',
          data: payload.data || {}
        });
      }
    });

    console.log('Firebase Messaging initialized.');
  } catch (error) {
    console.error('Firebase Messaging init failed:', error);
    messaging = null;
  }
}

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getDevicePlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS / iPadOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'Unknown';
}

function isMobileDevice() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod|Android/i.test(ua);
}

function isInstalledWebApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
}

async function saveFcmToken(token) {
  const db = initFirestore();
  if (!db) throw new Error('Firestore is not initialized.');

  const tokenHash = await sha256Hex(token);
  const ref = db.collection(TOKEN_COLLECTION).doc(tokenHash);
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const existingToken = localStorage.getItem('esonUnisonFcmToken');

  await ref.set({
    token,
    tokenHash,
    project: 'ESON × UNISON Calendar',
    platform: getDevicePlatform(),
    userAgent: navigator.userAgent || '',
    language: currentLang,
    browserLanguage: navigator.language || '',
    timezone: getUserTimeZone(),
    pageUrl: location.href,
    permission: Notification.permission,
    enabled: true,
    createdAt: existingToken === token ? firebase.firestore.FieldValue.delete() : now,
    updatedAt: now
  }, { merge: true });

  // Ensure createdAt exists for existing devices that registered before v14.
  const snap = await ref.get();
  if (!snap.exists || !snap.data().createdAt) {
    await ref.set({ createdAt: now }, { merge: true });
  }

  return tokenHash;
}

async function enableNotifications() {
  const isSecureContextForPush = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (isMobileDevice() && !isInstalledWebApp()) {
    showInstallGuideModal();
    return;
  }

  if (!isSecureContextForPush || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push prerequisites failed:', {
      isSecureContext: window.isSecureContext,
      hasNotification: 'Notification' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      location: location.href
    });
    showInstallGuideModal();
    return;
  }

  const registration = swRegistration || await registerServiceWorker();
  if (!registration) {
    showInstallGuideModal();
    return;
  }

  if (!messaging) {
    await initFirebaseMessaging();
  }

  if (!messaging) {
    showInstallGuideModal();
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    showAppModal(i18n[currentLang].errorTitle, i18n[currentLang].notificationDenied);
    return;
  }

  try {
    const token = await messaging.getToken({
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    if (!token) throw new Error('No FCM token returned');
    await saveFcmToken(token);
    localStorage.setItem('esonUnisonFcmToken', token);
    console.log('FCM token saved:', token);
    showAppModal(i18n[currentLang].notificationSuccessTitle, i18n[currentLang].notificationSuccessMessage);
  } catch (error) {
    console.error('FCM token error:', error);
    showInstallGuideModal();
  }
}

document.getElementById('notifyBtn').addEventListener('click', enableNotifications);

applyLanguage();
registerServiceWorker().then(initFirebaseMessaging);
loadEvents(true);
