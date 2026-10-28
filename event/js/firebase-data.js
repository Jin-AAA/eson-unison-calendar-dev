(() => {
  'use strict';

  const cfg = window.ESON_FIREBASE_CONFIG;
  if (!cfg || !cfg.firebase || !cfg.firebase.projectId || cfg.firebase.projectId.startsWith('PASTE_')) {
    console.warn('[ESON] Firebase config has not been filled in yet.');
  }

  if (!firebase.apps.length) firebase.initializeApp(cfg.firebase);

  const db = firebase.firestore();
  const auth = firebase.auth();
  const fn = firebase.app().functions(cfg.functionsRegion || 'asia-northeast3');

  // IndexedDB cache improves repeat-load speed and allows already-read public data
  // to remain available during a temporary network interruption.
  try {
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
      if (!['failed-precondition', 'unimplemented'].includes(err.code)) console.warn(err);
    });
  } catch (e) {}

  if (cfg.recaptchaSiteKey && firebase.appCheck) {
    try {
      const appCheck = firebase.appCheck();
      appCheck.activate(cfg.recaptchaSiteKey, true);
    } catch (e) {
      console.warn('[ESON] App Check init skipped:', e);
    }
  }

  let authReadyResolve;
  const authReady = new Promise(resolve => { authReadyResolve = resolve; });
  let authInitialized = false;
  auth.onAuthStateChanged(() => {
    if (!authInitialized) {
      authInitialized = true;
      authReadyResolve();
    }
  });

  const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

  function normalizedEmail(v='') {
    return String(v || '').trim().toLowerCase();
  }

  function parseKstDate(v) {
    if (!v) return null;
    if (v.toDate) return v.toDate();
    const s = String(v).trim();
    if (!s) return null;
    if (/^\d{4}[/-]\d{2}[/-]\d{2}\s\d{2}:\d{2}/.test(s)) {
      return new Date(s.replace(/\//g, '-').replace(' ', 'T') + ':00+09:00');
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(s)) {
      return new Date(s + '+09:00');
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(s)) {
      return new Date(s + ':00+09:00');
    }
    return new Date(s);
  }

  function formatKst(v) {
    const d = parseKstDate(v);
    if (!d || Number.isNaN(d.getTime())) return v ? String(v) : '';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(d);
    const g = type => parts.find(x => x.type === type)?.value || '';
    return `${g('year')}/${g('month')}/${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
  }

  function computeState(e) {
    if (!e) return 'draft';
    if (e.status === 'draft') return 'draft';
    if (e.paused) return 'paused';

    const now = new Date();
    const open = parseKstDate(e.openTime);
    const close = parseKstDate(e.closeTime);

    if (open && now < open) return 'notstarted';
    if (close && now >= close) return 'closed';
    if (Number(e.totalCapacity) > 0 && Number(e.acceptedCount) >= Number(e.totalCapacity)) return 'full';
    return 'open';
  }

  function plainEvent(id, d={}) {
    return {
      eventId: d.eventId || id,
      name: d.name || '',
      slug: d.slug || '',
      status: d.status || 'draft',
      openTime: d.openTime || '',
      closeTime: d.closeTime || '',
      initialCapacity: Number(d.initialCapacity) || 0,
      totalCapacity: Number(d.totalCapacity) || 0,
      acceptedCount: Number(d.acceptedCount) || 0,
      paused: !!d.paused,
      showInEventList: d.showInEventList !== false,
      showRegistrationCount: d.showRegistrationCount !== false,
      createdAt: formatKst(d.createdAt),
      updatedAt: formatKst(d.updatedAt),
      blocks: Array.isArray(d.blocks) ? d.blocks : [],
      pages: d.pages || {},
      paymentCounts: d.paymentCounts || { unconfirmed:0, confirmed:0, refunded:0 },
      publishedSlug: d.publishedSlug || ''
    };
  }

  function callableError(err) {
    const code = err?.details?.code || err?.details || '';
    const msg = code || err?.message || '操作失敗';
    const e = new Error(msg);
    e.original = err;
    return e;
  }

  async function call(name, payload={}) {
    await authReady;
    try {
      const res = await fn.httpsCallable(name)(payload);
      return res.data;
    } catch (err) {
      throw callableError(err);
    }
  }

  async function requireUser() {
    await authReady;
    if (!auth.currentUser) throw new Error('請先登入管理員帳號');
    return auth.currentUser;
  }

  async function apiGet(action, params={}) {
    switch (action) {
      case 'ping':
        return {
          success:true,
          message:'ESON Firebase data layer is running',
          version:'v11-firestore'
        };

      case 'listPublicEvents': {
        const snap = await db.collection('publicEvents')
          .where('showInEventList', '==', true)
          .get();
        const events = [];
        snap.forEach(doc => {
          const e = plainEvent(doc.id, doc.data());
          if (e.status !== 'draft') {
            events.push({
              eventId:e.eventId, name:e.name, slug:e.slug,
              state:computeState(e),
              openTime:e.openTime, closeTime:e.closeTime,
              totalCapacity:e.totalCapacity, acceptedCount:e.acceptedCount,
              showRegistrationCount:e.showRegistrationCount
            });
          }
        });
        events.sort((a,b) => String(b.openTime).localeCompare(String(a.openTime)));
        return { success:true, events };
      }

      case 'getPublicEvent': {
        const slug = String(params.slug || '').trim().toLowerCase();
        if (!slug) throw new Error('缺少活動網址');
        const snap = await db.collection('publicEvents').doc(slug).get();
        if (!snap.exists) throw new Error('找不到活動');
        const e = plainEvent(snap.id, snap.data());
        const detail = {
          event:e,
          blocks:e.blocks,
          pages:e.pages,
          state:computeState(e)
        };
        return { success:true, event:detail };
      }

      case 'listEvents': {
        await requireUser();
        const snap = await db.collection('events').get();
        const events = [];
        snap.forEach(doc => events.push(plainEvent(doc.id, doc.data())));
        events.sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
        return { success:true, events };
      }

      case 'getEvent': {
        await requireUser();
        const id = String(params.eventId || '');
        const snap = await db.collection('events').doc(id).get();
        if (!snap.exists) throw new Error('找不到活動');
        const e = plainEvent(snap.id, snap.data());
        return { success:true, event:{event:e,blocks:e.blocks,pages:e.pages} };
      }

      case 'getResponses': {
        await requireUser();
        const eventId = String(params.eventId || '');
        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) throw new Error('找不到活動');
        const event = plainEvent(eventSnap.id, eventSnap.data());

        // V11 deliberately limits each admin read to 100 rows.
        // This prevents a large event from loading thousands of documents at once.
        const snap = await db.collection('events').doc(eventId)
          .collection('registrations')
          .orderBy('submittedAt', 'desc')
          .limit(100)
          .get();

        const items = [];
        snap.forEach(doc => {
          const d = doc.data();
          items.push({
            responseId:d.responseId || doc.id,
            registrationNumber:d.registrationNumber || '',
            submittedAt:formatKst(d.submittedAt),
            email:d.email || '',
            paymentStatus:d.paymentStatus || '未確認',
            registrationStatus:d.registrationStatus || '有效',
            adminNote:d.adminNote || '',
            allowEmailReuse:!!d.allowEmailReuse,
            answers:d.answers || {},
            columns:{}
          });
        });

        const pc = event.paymentCounts || {};
        return {
          success:true,
          data:{
            event,
            blocks:event.blocks || [],
            stats:{
              acceptedCount:event.acceptedCount,
              totalCapacity:event.totalCapacity,
              paidConfirmed:Number(pc.confirmed)||0,
              unpaid:Number(pc.unconfirmed)||0
            },
            items,
            hasMore:snap.size === 100
          }
        };
      }

      default:
        throw new Error('未知讀取 action：' + action);
    }
  }

  async function apiPost(action, payload={}) {
    switch (action) {
      case 'resetAdminPassword':
        return call('resetAdminPassword', {uid: payload.uid, newPassword: payload.newPassword});
      case 'saveEvent': {
        await requireUser();
        const data = payload.data || {};
        let ref;
        let old = null;

        if (data.eventId) {
          ref = db.collection('events').doc(String(data.eventId));
          const snap = await ref.get();
          if (snap.exists) old = snap.data();
        } else {
          ref = db.collection('events').doc();
        }

        const initialCapacity = Number(data.initialCapacity) || Number(old?.initialCapacity) || 0;
        if (initialCapacity < 1) throw new Error('總名額至少需要 1 人');

        const acceptedCount = Number(old?.acceptedCount) || 0;
        if (old && initialCapacity < acceptedCount) {
          throw new Error(`總名額不可小於目前已報名人數（${acceptedCount} 人）`);
        }

        const eventId = ref.id;
        const doc = {
          eventId,
          name:String(data.name || '').trim(),
          slug:String(data.slug || '').trim().toLowerCase(),
          openTime:data.openTime || '',
          closeTime:data.closeTime || '',
          initialCapacity,
          totalCapacity:initialCapacity,
          paused:!!data.paused,
          showInEventList:data.showInEventList !== false,
          showRegistrationCount:data.showRegistrationCount !== false,
          updatedAt:serverTimestamp()
        };

        if (!old) {
          Object.assign(doc, {
            status:'draft',
            totalCapacity:initialCapacity,
            acceptedCount:0,
            blocks:[],
            pages:{},
            paymentCounts:{unconfirmed:0,confirmed:0,refunded:0},
            createdAt:serverTimestamp(),
            publishedSlug:''
          });
        }

        await ref.set(doc, {merge:true});
        return { eventId, slug:doc.slug, status:old?.status || 'draft' };
      }

      case 'saveFormBlocks': {
        await requireUser();
        const ref = db.collection('events').doc(String(payload.eventId || ''));
        await ref.set({ blocks:Array.isArray(payload.blocks)?payload.blocks:[], updatedAt:serverTimestamp() }, {merge:true});
        return { eventId:ref.id, count:(payload.blocks||[]).length };
      }

      case 'savePageContent': {
        await requireUser();
        const eventId = String(payload.eventId || '');
        const pageType = String(payload.pageType || 'success');
        const update = { updatedAt:serverTimestamp() };
        update[`pages.${pageType}`] = payload.content || {};
        await db.collection('events').doc(eventId).update(update);
        return { eventId, pageType };
      }

      case 'publishEvent':
        return call('publishEvent', {eventId:payload.eventId});

      case 'syncPublishedEvent':
        return call('syncPublishedEvent', {eventId:payload.eventId});

      case 'submitRegistration':
        return call('submitRegistration', {
          slug:payload.slug,
          answers:payload.answers || {}
        });

      case 'updateResponse':
        return call('updateResponse', payload);

      case 'allowEmailReuse':
        return call('allowEmailReuse', payload);

      case 'increaseCapacity':
        return call('increaseCapacity', payload);

      case 'deleteEvent':
        return call('deleteEvent', payload);

      default:
        throw new Error('未知寫入 action：' + action);
    }
  }

  async function login(email, password) {
    const cred = await auth.signInWithEmailAndPassword(
      normalizedEmail(email),
      String(password || '')
    );
    // Verify the account is actually in /admins.
    const adminDoc = await db.collection('admins').doc(cred.user.uid).get();
    if (!adminDoc.exists) {
      await auth.signOut();
      throw new Error('此帳號沒有後台管理權限');
    }
    return { user:cred.user, profile:adminDoc.data() };
  }

  async function logout() {
    await auth.signOut();
  }

  async function getProfile() {
    await authReady;
    if (!auth.currentUser) return null;
    const snap = await db.collection('admins').doc(auth.currentUser.uid).get();
    return snap.exists ? {uid:auth.currentUser.uid,email:auth.currentUser.email,...snap.data()} : null;
  }

  window.EsonFirebase = {
    db,
    auth,
    apiGet,
    apiPost,
    login,
    logout,
    getProfile,
    ready:() => authReady,
    currentUser:() => auth.currentUser,
    computeState
  };
})();
