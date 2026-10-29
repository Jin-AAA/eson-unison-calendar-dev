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
    monthParts: (date) => ({ month: `${date.getMonth() + 1}月`, year: `${date.getFullYear()}` }),
    seoulTime: '韓國時間 KST',
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
    desktopNotificationTitle: '請使用手機設定通知',
    desktopNotificationMessage: '通知功能主要提供手機推播提醒。\n\n請使用手機開啟網站，並將網頁加入主畫面後，再開啟通知功能。',
    todayEventsKicker: 'TODAY',
    todayEventsTitle: '今天有什麼事件？',
    todayEventsClose: '直接關閉',
    todayEventsDismissToday: '今日不再查看',
    errorTitle: '發生錯誤',
    allDay: '整天',
    allDayKorea: '整天（韓國時間）',
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
    monthParts: (date) => ({ month: `${date.getMonth() + 1}월`, year: `${date.getFullYear()}` }),
    seoulTime: '한국 시간 KST',
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
    desktopNotificationTitle: '휴대폰에서 알림을 설정해 주세요',
    desktopNotificationMessage: '알림 기능은 주로 휴대폰 푸시 알림을 위한 기능입니다.\n\n휴대폰에서 사이트를 열고 홈 화면에 추가한 뒤 알림을 설정해 주세요.',
    todayEventsKicker: 'TODAY',
    todayEventsTitle: '오늘은 어떤 일정이 있나요?',
    todayEventsClose: '닫기',
    todayEventsDismissToday: '오늘 다시 보지 않기',
    errorTitle: '오류가 발생했습니다',
    allDay: '종일',
    allDayKorea: '종일 (한국 시간)',
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
    monthParts: (date) => ({ month: date.toLocaleDateString('en-US', { month: 'long' }), year: `${date.getFullYear()}` }),
    seoulTime: 'Korea time (KST)',
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
    desktopNotificationTitle: 'Please set up notifications on your phone',
    desktopNotificationMessage: 'Notifications are mainly designed for mobile push alerts.\n\nPlease open this site on your phone, add it to your Home Screen, then enable notifications.',
    todayEventsKicker: 'TODAY',
    todayEventsTitle: 'What’s happening today?',
    todayEventsClose: 'Close',
    todayEventsDismissToday: 'Don’t show again today',
    errorTitle: 'Something went wrong',
    allDay: 'All day',
    allDayKorea: 'All day (Korea time)',
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
    monthParts: (date) => ({ month: `${date.getMonth() + 1}月`, year: `${date.getFullYear()}` }),
    seoulTime: '韓国時間 KST',
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
    desktopNotificationTitle: 'スマートフォンで通知を設定してください',
    desktopNotificationMessage: '通知機能は主にスマートフォンのプッシュ通知用です。\n\nスマートフォンでこのサイトを開き、ホーム画面に追加してから通知を設定してください。',
    todayEventsKicker: 'TODAY',
    todayEventsTitle: '今日の予定は？',
    todayEventsClose: '閉じる',
    todayEventsDismissToday: '今日はもう表示しない',
    errorTitle: 'エラーが発生しました',
    allDay: '終日',
    allDayKorea: '終日（韓国時間）',
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
// `today` is refreshed when the app comes back to the foreground (a PWA can stay
// open across midnight), so it must not be a constant.
let today = new Date();
let calendarEvents = [];
let googleColors = null;
let isLoading = false;
let loadError = '';
let lastLoadedRange = '';
let lastLoadedAt = 0;
let loadRequestId = 0;
let currentViewMode = 'calendar';
const STALE_AFTER_MS = 15 * 60 * 1000;
const BASE_TIME_ZONE = 'Asia/Seoul';

const ICONS = {
  chevronRight: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  openInNew: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></svg>'
};

const calendarGrid = document.getElementById('calendarGrid');
const weekdayGrid = document.getElementById('weekdayGrid');
const monthTitle = document.getElementById('monthTitle');
const todayText = document.getElementById('todayText');
const timezoneText = document.getElementById('timezoneText');
const modal = document.getElementById('eventModal');
const appModal = document.getElementById('appModal');
const appModalTitle = document.getElementById('appModalTitle');
const appModalMessage = document.getElementById('appModalMessage');
const todayEventsModal = document.getElementById('todayEventsModal');
const todayEventsDate = document.getElementById('todayEventsDate');
const todayEventsList = document.getElementById('todayEventsList');
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

const TODAY_EVENTS_HIDDEN_KEY = 'esonUnisonTodayEventsHiddenDate';

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
  appModal.showModal();
}

function showInstallGuideModal() {
  const platform = getDevicePlatform();
  let message = i18n[currentLang].installGuideGeneric;
  if (platform === 'iOS / iPadOS') message = i18n[currentLang].installGuideIos;
  if (platform === 'Android') message = i18n[currentLang].installGuideAndroid;
  showAppModal(i18n[currentLang].installGuideTitle, message);
}

function showDesktopNotificationGuideModal() {
  showAppModal(
    i18n[currentLang].desktopNotificationTitle,
    i18n[currentLang].desktopNotificationMessage
  );
}

function stripHtml(value = '') {
  const normalized = String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<(p|div|li)[^>]*>/gi, '');
  // DOMParser creates an inert document: unlike div.innerHTML it never loads
  // images or runs inline handlers (e.g. <img onerror>) found in descriptions.
  const doc = new DOMParser().parseFromString(normalized, 'text/html');
  return (doc.body?.textContent || '')
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
          ${ICONS.openInNew}
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
    .filter(line => !/^PUSH_TZ\s*:/i.test(line))
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
  // "PUSH_TZ: KST" on an all-day event: it still shows as all-day on its date,
  // but the push follows Korea's date (see the push worker).
  const followsKoreaDate = isAllDay && getDescriptionLines(item.description || '')
    .some(line => /^PUSH_TZ\s*:\s*(kst|korea|seoul|asia\/seoul)\s*$/i.test(line));

  return {
    id: item.id,
    title: item.summary || i18n[currentLang].uncategorized,
    description: cleanDesc,
    category,
    colorId: item.colorId || '',
    start: startDate,
    end: endDate,
    isAllDay,
    followsKoreaDate,
    allDayStartKey: isAllDay ? startRaw : '',
    allDayEndKey: isAllDay ? (endRaw || '') : '',
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
  // Categories are told apart by background tint only (no side bar).
  return `background:${color.background};`;
}

function eventOccursOnDate(event, key) {
  if (event.isAllDay) {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : new Date(start);
    if (event.end) end.setDate(end.getDate() - 1);
    const target = new Date(`${key}T00:00:00`);
    return target >= start && target <= end;
  }
  // Timed events that cross midnight (e.g. 22:00–02:00) appear on every day they touch.
  const dayStart = new Date(`${key}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const end = event.end && event.end > event.start ? event.end : new Date(event.start.getTime() + 1);
  return event.start < dayEnd && end > dayStart;
}

const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

function formatStartTime(event) {
  return event.start.toLocaleTimeString(getLocale(), TIME_OPTIONS);
}

function formatEventTime(event) {
  if (event.isAllDay) {
    return event.followsKoreaDate && getUserTimeZone() !== BASE_TIME_ZONE
      ? i18n[currentLang].allDayKorea
      : i18n[currentLang].allDay;
  }
  const locale = getLocale();
  // hourCycle 'h23' instead of hour12:false — the latter renders midnight as "24:00" in en-US.
  const options = TIME_OPTIONS;
  if (event.end && dateKey(event.start) === dateKey(event.end)) {
    return `${event.start.toLocaleTimeString(locale, options)}–${event.end.toLocaleTimeString(locale, options)}`;
  }
  return event.start.toLocaleTimeString(locale, options);
}

function getKoreaDateKey(date = new Date()) {
  // sv-SE formats as YYYY-MM-DD
  return date.toLocaleDateString('sv-SE', { timeZone: BASE_TIME_ZONE });
}

function getTodayEvents() {
  const key = dateKey(new Date());
  const koreaKey = getKoreaDateKey();
  // Korea-time all-day events are pushed when that date starts in Korea, which
  // can still be "yesterday" locally (e.g. 23:00 in Taiwan). Include them here
  // so tapping that notification shows the event.
  const isKoreaToday = event => event.followsKoreaDate &&
    koreaKey >= event.allDayStartKey && (!event.allDayEndKey || koreaKey < event.allDayEndKey);
  return calendarEvents
    .filter(event => eventOccursOnDate(event, key) || isKoreaToday(event))
    .sort((a, b) => {
      if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
      return a.start - b.start;
    });
}

function isTodayEventsHidden() {
  try {
    return localStorage.getItem(TODAY_EVENTS_HIDDEN_KEY) === dateKey(new Date());
  } catch (error) {
    console.warn('Unable to read today events preference:', error);
    return false;
  }
}

function hideTodayEventsForToday() {
  try {
    localStorage.setItem(TODAY_EVENTS_HIDDEN_KEY, dateKey(new Date()));
  } catch (error) {
    console.warn('Unable to save today events preference:', error);
  }
  todayEventsModal?.close();
}

function renderTodayEventsModal() {
  if (!todayEventsModal || !todayEventsDate || !todayEventsList) return;
  const now = new Date();
  const events = getTodayEvents();
  const locale = getLocale();

  const badge = document.getElementById('todayEventsBadge');
  if (badge) badge.textContent = String(now.getDate());
  todayEventsDate.textContent = now.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  todayEventsList.innerHTML = events.map(event => {
    const tagLabel = event.category
      ? (i18n[currentLang].tags[event.category] || event.category)
      : i18n[currentLang].uncategorized;
    return `
      <button class="today-event-card" style="${eventStyle(event)}" data-event-id="${escapeHtml(event.id)}" type="button">
        <span class="today-event-content">
          <span class="today-event-time">${escapeHtml(formatEventTime(event))}</span>
          <strong class="today-event-title">${escapeHtml(event.title)}</strong>
          <span class="today-event-tag">${escapeHtml(tagLabel)}</span>
        </span>
        <span class="today-event-arrow">${ICONS.chevronRight}</span>
      </button>
    `;
  }).join('');

  todayEventsList.querySelectorAll('.today-event-card').forEach(button => {
    button.addEventListener('click', () => {
      const eventData = calendarEvents.find(item => item.id === button.dataset.eventId);
      if (!eventData) return;
      todayEventsModal.close();
      openEvent(eventData);
    });
  });
}

function cleanTodayOpenParameter() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('open')) return;
  url.searchParams.delete('open');
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function maybeShowTodayEvents() {
  const requestedFromNotification = new URLSearchParams(window.location.search).get('open') === 'today';
  if (requestedFromNotification) cleanTodayOpenParameter();
  // Tapping a notification always shows today's events, even if the user chose
  // "don't show again today" earlier.
  if (loadError || (!requestedFromNotification && isTodayEventsHidden())) return;

  const events = getTodayEvents();
  if (!events.length || !todayEventsModal || todayEventsModal.open) return;

  renderTodayEventsModal();
  if (appModal?.open) appModal.close();
  if (modal?.open) modal.close();
  todayEventsModal.showModal();
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
  if (todayEventsModal?.open) renderTodayEventsModal();
  updateStoredTokenLanguage();
}

function renderMeta() {
  const locale = getLocale();
  todayText.textContent = today.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  timezoneText.textContent = getUserTimeZone();
}

function renderWeekdays() {
  weekdayGrid.innerHTML = i18n[currentLang].weekdays
    .map((day, i) => `<div class="weekday${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}">${day}</div>`)
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
  const parts = i18n[currentLang].monthParts(viewDate);
  monthTitle.innerHTML = `<span class="month-name">${escapeHtml(parts.month)}</span><span class="month-year">${escapeHtml(parts.year)}</span>`;
  monthTitle.setAttribute('aria-label', i18n[currentLang].monthFormat(viewDate));

  const start = startOfCalendarGrid(viewDate);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + i);
    cells.push(cellDate);
  }

  calendarGrid.innerHTML = cells.map((cellDate) => {
    const key = dateKey(cellDate);
    const events = calendarEvents
      .filter(event => eventOccursOnDate(event, key))
      .sort((a, b) => (a.isAllDay === b.isAllDay ? a.start - b.start : a.isAllDay ? -1 : 1));
    const isMuted = cellDate.getMonth() !== month;
    const isToday = sameDay(cellDate, today);
    const weekday = cellDate.getDay();
    const eventHtml = events.map(event => `
      <button class="event-pill" style="${eventStyle(event)}" data-event-id="${escapeHtml(event.id)}" type="button">
        ${event.isAllDay || dateKey(event.start) !== key ? '' : `<span class="pill-time">${escapeHtml(formatStartTime(event))}</span>`}<span class="pill-title">${escapeHtml(event.title)}</span>
      </button>
    `).join('');

    return `
      <article class="day-cell ${isMuted ? 'muted' : ''} ${isToday ? 'today' : ''} ${weekday === 0 ? 'sun' : ''} ${weekday === 6 ? 'sat' : ''}" data-date="${key}">
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
  // Includes multi-day events that started in the previous month.
  const monthEvents = getVisibleMonthEvents();
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
  const modalTime = document.getElementById('modalTime');
  modalTime.textContent = formatEventTime(eventData);
  // Schedules are announced in KST; show the Seoul time too when the viewer is elsewhere.
  if (!eventData.isAllDay && getUserTimeZone() !== BASE_TIME_ZONE) {
    const seoul = eventData.start.toLocaleString(locale, { timeZone: BASE_TIME_ZONE, month: 'numeric', day: 'numeric', ...TIME_OPTIONS });
    const note = document.createElement('span');
    note.className = 'modal-time-base';
    note.textContent = `${i18n[currentLang].seoulTime} ${seoul}`;
    modalTime.appendChild(note);
  }
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

async function loadEvents(force = false, { showToday = false } = {}) {
  const start = startOfCalendarGrid(viewDate);
  const end = endOfCalendarGrid(viewDate);
  const rangeKey = `${start.toISOString()}_${end.toISOString()}`;
  if (!force && rangeKey === lastLoadedRange && calendarEvents.length) return;

  // Rapid month switching can resolve requests out of order; only the newest
  // request is allowed to write its result.
  const requestId = ++loadRequestId;
  isLoading = true;
  loadError = '';
  renderCalendar();
  refreshBtnEl?.classList.add('is-spinning');

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
    if (requestId !== loadRequestId) return;
    calendarEvents = (data.items || []).map(normalizeGoogleEvent);
    lastLoadedRange = rangeKey;
    lastLoadedAt = Date.now();
  } catch (error) {
    if (requestId !== loadRequestId) return;
    console.error(error);
    calendarEvents = [];
    lastLoadedRange = '';
    loadError = error.message;
  } finally {
    if (requestId === loadRequestId) {
      isLoading = false;
      refreshBtnEl?.classList.remove('is-spinning');
      renderCalendar();
      // Only pop the "today" sheet on app open / notification tap / a new day —
      // not on every month switch or manual refresh.
      if (showToday) maybeShowTodayEvents();
    }
  }
}

function syncToday() {
  const now = new Date();
  if (sameDay(now, today)) return false;
  const wasViewingToday = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();
  today = now;
  if (wasViewingToday) viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
  renderMeta();
  return true;
}

const refreshBtnEl = document.getElementById('refreshBtn');

document.getElementById('prevMonth').addEventListener('click', async () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  await loadEvents();
});

document.getElementById('nextMonth').addEventListener('click', async () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  await loadEvents();
});

document.getElementById('todayBtn').addEventListener('click', async () => {
  syncToday();
  viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  await loadEvents();
});

viewToggleBtn.addEventListener('click', () => {
  currentViewMode = currentViewMode === 'list' ? 'calendar' : 'list';
  renderCalendar();
});

document.getElementById('closeModal').addEventListener('click', () => modal.close());
const appModalClose = document.getElementById('appModalClose');
if (appModalClose) appModalClose.addEventListener('click', () => appModal.close());
document.getElementById('todayEventsClose')?.addEventListener('click', () => todayEventsModal.close());
document.getElementById('todayEventsCloseButton')?.addEventListener('click', () => todayEventsModal.close());
document.getElementById('todayEventsDismissToday')?.addEventListener('click', hideTodayEventsForToday);

document.addEventListener('visibilitychange', () => {
  if (document.hidden || isLoading) return;
  // An installed PWA is often resumed hours or days later: roll "today" forward
  // and refetch instead of showing yesterday's data.
  const dayChanged = syncToday();
  const stale = Date.now() - lastLoadedAt > STALE_AFTER_MS;
  if (dayChanged || stale) {
    loadEvents(true, { showToday: dayChanged && !modal?.open && !appModal?.open });
  }
});

document.querySelectorAll('.lang-btn').forEach(button => {
  button.addEventListener('click', () => {
    currentLang = button.dataset.lang;
    applyLanguage();
  });
});

refreshBtnEl.addEventListener('click', async () => {
  syncToday();
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
    swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js?v=33.1', { scope: './' });
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

    messaging.onMessage(async (payload) => {
      const title = payload.notification?.title || 'ESON × UNISON Calendar';
      const body = payload.notification?.body || '';
      if (Notification.permission !== 'granted') return;
      // `new Notification()` throws "Illegal constructor" on Android Chrome and is
      // unavailable in iOS web apps, so foreground messages used to be lost.
      // Show it through the service worker; its notificationclick handler opens today.
      try {
        const registration = swRegistration || await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: './icons/icon-192.png',
          badge: './icons/icon-192.png',
          data: payload.data || {}
        });
      } catch (error) {
        console.error('Foreground notification failed:', error);
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
  const isTouchMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod|Android/i.test(ua) || isTouchMac;
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

  // Field list must match firestore.rules (hasAll / hasOnly).
  const fields = {
    token,
    tokenHash,
    project: 'ESON × UNISON Calendar',
    platform: getDevicePlatform(),
    userAgent: (navigator.userAgent || '').slice(0, 1024),
    language: currentLang,
    browserLanguage: (navigator.language || '').slice(0, 100),
    timezone: getUserTimeZone(),
    pageUrl: location.href.slice(0, 2048),
    permission: Notification.permission,
    enabled: true,
    updatedAt: now
  };

  // Clients can't read token docs (rules deny reads), so: try to update an
  // existing doc and keep its createdAt; if that fails (doc doesn't exist, or
  // the deployed rules require createdAt == request.time on every write),
  // write the whole doc with a fresh createdAt.
  try {
    await ref.update(fields);
  } catch (error) {
    await ref.set({ ...fields, createdAt: now });
  }

  return tokenHash;
}

const FCM_TOKEN_KEY = 'esonUnisonFcmToken';
function readStoredToken() { try { return localStorage.getItem(FCM_TOKEN_KEY) || ''; } catch (e) { return ''; } }
function writeStoredToken(token) { try { localStorage.setItem(FCM_TOKEN_KEY, token); } catch (e) { /* ignore */ } }

// FCM tokens rotate. Previously the token was only saved when the button was
// tapped, so after a rotation the backend kept sending to a dead token.
// Re-check silently on every launch once permission has been granted.
async function syncTokenIfGranted() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!isMobileDevice() || !isInstalledWebApp() || !messaging || !swRegistration) return;
  try {
    const token = await messaging.getToken({ vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: swRegistration });
    if (!token) return;
    await saveFcmToken(token);
    writeStoredToken(token);
  } catch (error) {
    console.warn('Token refresh failed:', error);
  }
}

let languageSyncTimer = null;
// Push messages are sent in the language saved with the token, so re-save the
// token doc when the user switches language.
function updateStoredTokenLanguage() {
  const token = readStoredToken();
  if (!token || !window.firebase) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  clearTimeout(languageSyncTimer);
  languageSyncTimer = setTimeout(async () => {
    try {
      await saveFcmToken(token);
    } catch (error) {
      console.warn('Unable to update notification language:', error);
    }
  }, 800);
}

async function enableNotifications() {
  const isSecureContextForPush = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (!isMobileDevice()) {
    showDesktopNotificationGuideModal();
    return;
  }

  if (!isInstalledWebApp()) {
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
    writeStoredToken(token);
    console.log('FCM token saved:', token);
    showAppModal(i18n[currentLang].notificationSuccessTitle, i18n[currentLang].notificationSuccessMessage);
  } catch (error) {
    console.error('FCM token error:', error);
    showInstallGuideModal();
  }
}

document.getElementById('notifyBtn').addEventListener('click', enableNotifications);

applyLanguage();
registerServiceWorker().then(initFirebaseMessaging).then(syncTokenIfGranted);
loadEvents(true, { showToday: true });
