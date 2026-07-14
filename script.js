// =========================================================
// සයිබර් රකුසා - GAME LOGIC (Sinhala Cyber Safety Education Game)
// =========================================================

const gameState = {
  currentScreen: 'splash',
  currentLevel: 1,
  currentDifficulty: 'easy',
  score: 0,
  xp: 0,
  lives: 3,
  combo: 1,
  bestCombo: 1,
  questionIndex: 0,
  currentQuestions: [],
  correctAnswers: 0,
  wrongAnswers: 0,
  isPaused: false,
  timerInterval: null,
  timeRemaining: 30,
  playerName: 'ක්‍රීඩකයා',
  soundEnabled: true,
  musicEnabled: true,
  skipAnimations: false,
  stats: {
    gamesPlayed: 0,
    totalXP: 0,
    totalCorrect: 0,
    totalMistakes: 0,
    bestScore: 0,
  },
  highScores: [],
  achievements: {},
  unlockedLevels: [1],
};

// ============ AUDIO ENGINE (Web Audio API - no external files) ============
const AudioEngine = (() => {
  let ctx = null;
  let musicNodes = null;
  let musicPlaying = false;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type = 'sine', gainVal = 0.15) {
    if (!gameState.soundEnabled) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(gainVal, c.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.05);
  }

  function playSound(name) {
    if (!gameState.soundEnabled) return;
    try {
      switch (name) {
        case 'click':
          tone(600, 0, 0.08, 'square', 0.08);
          break;
        case 'correct':
          tone(523.25, 0, 0.12, 'sine', 0.12);
          tone(659.25, 0.1, 0.12, 'sine', 0.12);
          tone(783.99, 0.2, 0.18, 'sine', 0.14);
          break;
        case 'wrong':
          tone(220, 0, 0.15, 'sawtooth', 0.12);
          tone(180, 0.12, 0.22, 'sawtooth', 0.1);
          break;
        case 'combo':
          tone(880, 0, 0.08, 'sine', 0.1);
          tone(1046.5, 0.06, 0.12, 'sine', 0.12);
          break;
        case 'tick':
          tone(400, 0, 0.04, 'square', 0.04);
          break;
        case 'levelup':
          tone(523.25, 0, 0.12, 'sine', 0.14);
          tone(659.25, 0.12, 0.12, 'sine', 0.14);
          tone(783.99, 0.24, 0.12, 'sine', 0.14);
          tone(1046.5, 0.36, 0.3, 'sine', 0.16);
          break;
        case 'gameover':
          tone(300, 0, 0.2, 'sawtooth', 0.12);
          tone(250, 0.18, 0.2, 'sawtooth', 0.12);
          tone(180, 0.36, 0.35, 'sawtooth', 0.12);
          break;
        case 'badge':
          tone(659.25, 0, 0.1, 'sine', 0.12);
          tone(880, 0.08, 0.1, 'sine', 0.12);
          tone(1174.66, 0.16, 0.25, 'sine', 0.15);
          break;
      }
    } catch (e) { /* audio not available */ }
  }

  function startMusic() {
    if (!gameState.musicEnabled || musicPlaying) return;
    try {
      const c = getCtx();
      musicPlaying = true;
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];
      let step = 0;
      const master = c.createGain();
      master.gain.value = 0.035;
      master.connect(c.destination);

      musicNodes = { master, interval: null };
      musicNodes.interval = setInterval(() => {
        if (!gameState.musicEnabled) return;
        const freq = notes[step % notes.length];
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(1, c.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9);
        osc.connect(g);
        g.connect(master);
        osc.start();
        osc.stop(c.currentTime + 1);
        step++;
      }, 900);
    } catch (e) { /* ignore */ }
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicNodes && musicNodes.interval) {
      clearInterval(musicNodes.interval);
      musicNodes = null;
    }
  }

  return { playSound, startMusic, stopMusic };
})();

function playSound(name) { AudioEngine.playSound(name); }

// ============ LEVEL DATA (SINHALA) ============
const levelsData = {
  1: {
    title: 'වංචා ඊමේල් හඳුනාගැනීම',
    icon: '📧',
    description: 'වංචා ඊමේල් ඔබව රවටින්න පෙර හඳුනාගන්න',
    questions: [
      {
        type: 'phishing',
        text: '"your.bank.security@confirms-identity.com" ලිපිනයෙන් ඔබට ඊමේල් එකක් එනවා, ලින්ක් එකක් ක්ලික් කර ගිණුම තහවුරු කරන්න කියලා. මේක ආරක්ෂිතද?',
        extra: { from: 'your.bank.security@confirms-identity.com', subject: 'හදිසි: ඔබේ ගිණුම තහවුරු කරන්න', body: 'ඔබේ අනන්‍යතාව තහවුරු කිරීමට මෙතන ක්ලික් කරන්න: [LINK]' },
        answers: [
          { text: 'ආරක්ෂිතයි - බැංකු මේ විදිහට කතා කරනවා', correct: false },
          { text: 'වංචාවක් - සැක සහිත domain එකක්', correct: true },
          { text: 'ආරක්ෂිතයි - ලිපිනය නිවැරදි වගේ පෙනෙනවා', correct: false },
          { text: 'තීරණය කළ නොහැක', correct: false },
        ],
        tip: 'සැබෑ බැංකු කිසිදාක ඊමේල් ලින්ක් හරහා අනන්‍යතාව තහවුරු කරන්න කියන්නේ නැහැ. sender domain එක හොඳින් පරීක්ෂා කරන්න - "confirms-identity.com" කියන්නේ ඔබේ බැංකුවේ නිල domain එක නෙවෙයි.',
      },
      {
        type: 'phishing',
        text: 'support@paypal.com වෙතින් ඊමේල් එකක් එනවා ඔබේ ගිණුම සීමා වෙනවා කියලා, දැන්ම ක්ලික් කරන්න යළි ලබාගැනීමට. ආරක්ෂිතද වංචාවක්ද?',
        extra: { from: 'support@paypal.com', subject: 'ගිණුම සීමා කර ඇත - ක්‍රියාමාර්ග අවශ්‍යයි', body: 'ඔබේ ගිණුම සීමා කර ඇත. යළි ලබාගැනීමට ක්ලික් කරන්න: [LINK]' },
        answers: [
          { text: 'වංචාවක් - කෘත්‍රිම හදිසිතාවයක් නිර්මාණය කරනවා', correct: true },
          { text: 'ආරක්ෂිතයි - නිල PayPal ඊමේල් එකක්', correct: false },
          { text: 'ආරක්ෂිතයි - නීත්‍යානුකූල අනතුරු ඇඟවීමක්', correct: false },
          { text: 'ලින්ක් එක මතයි තීරණය', correct: false },
        ],
        tip: 'වංචා ඊමේල් "දැන්ම කරන්න!" වගේ කෘත්‍රිම හදිසිතාවයක් නිර්මාණය කරනවා. ඊමේල් ලින්ක් කිසිදාක ක්ලික් නොකර, browser එකේ URL එක ඔබම ටයිප් කරන්න.',
      },
      {
        type: 'phishing',
        text: 'ඔබේ සගයෙක් system update එකක් ගැන ඊමේල් එකක් ෆෝවර්ඩ් කරනවා. එහි අකුරු වැරදි, format එකත් අමුතුයි, login credentials ඉල්ලනවා. මේක ආරක්ෂිතද?',
        extra: { from: 'admin@companysystem.fake', subject: 'SYSEM UPDATE - URGENT', body: 'Plese update your credentails: [FORM]' },
        answers: [
          { text: 'ආරක්ෂිතයි - සගයෙක්ගෙන් ආවා', correct: false },
          { text: 'වංචාවක් - අකුරු වැරදි, credentials ඉල්ලනවා', correct: true },
          { text: 'ආරක්ෂිතයි - system update ගැනයි', correct: false },
          { text: 'නීත්‍යානුකූල සමාගම් සන්නිවේදනයක්', correct: false },
        ],
        tip: 'සැබෑ IT කණ්ඩායම් කිසිදාක ඊමේල් හරහා password ඉල්ලන්නේ නැහැ. නීත්‍යානුකූල සමාගම් නිවැරදි අකුරු පාවිච්චි කරනවා. වංචා ඊමේල් වල එකවර ලකුණු කිහිපයක්ම තියෙනවා.',
      },
      {
        type: 'phishing',
        text: 'Apple Support (support@apple.com) වෙතින් ඊමේල් එකක් එනවා ඔබේ iCloud ගිණුම update කරන්න ඕන කියලා. ආරක්ෂිතද වංචාවක්ද?',
        extra: { from: 'support@apple.com', subject: 'ඔබේ iCloud ගිණුම යාවත්කාලීන කරන්න', body: 'ඔබේ iCloud update කිරීමට අවශ්‍යයි: [LINK]' },
        answers: [
          { text: 'වංචාවක් - නිල වුනත් සැක සහිත ඉල්ලීමක්', correct: true },
          { text: 'ආරක්ෂිතයි - Apple නිල domain එක', correct: false },
          { text: 'ආරක්ෂිතයි - iCloud updates සාමාන්‍යයි', correct: false },
          { text: 'ආරක්ෂිතයි - නීත්‍යානුකූල ඊමේල් එකක්', correct: false },
        ],
        tip: 'sender එක නිල වගේ පෙනුනත්, Apple කිසිදාක ඊමේල් හරහා ගිණුම update කරන්න කියන්නේ නැහැ. ගිණුම් සැකසුම් වෙනස් කිරීමට සැමවිටම නිල app එකෙන් හෝ website එකෙන් යන්න.',
      },
      {
        type: 'phishing',
        text: 'ඔබේ බැංකුවෙන් banking.support.verification@yourbankname.com ඊමේල් එකක් එනවා, vංචා පරීක්ෂණයක් සඳහා recent transactions ඉල්ලනවා. ආරක්ෂිතද වංචාවක්ද?',
        extra: { from: 'banking.support.verification@yourbankname.com', subject: 'වංචා තහවුරු කිරීම අවශ්‍යයි', body: 'තහවුරු කිරීම සඳහා recent transaction විස්තර ලබා දෙන්න' },
        answers: [
          { text: 'ආරක්ෂිතයි - බැංකුවට වංචා පරීක්ෂණයක් අවශ්‍යයි', correct: false },
          { text: 'වංචාවක් - බැංකු කිසිදාක ඊමේල් හරහා transaction විස්තර ඉල්ලන්නේ නැහැ', correct: true },
          { text: 'ආරක්ෂිතයි - නීත්‍යානුකූල ආරක්ෂණ පියවරක්', correct: false },
          { text: 'මුලින්ම තහවුරු කළ යුතුයි', correct: false },
        ],
        tip: 'බැංකු කිසිදාක ගිණුම් විස්තර, transaction ඉතිහාසය, හෝ credentials ඊමේල් හරහා ඉල්ලන්නේ නැහැ. සැකයක් ඇත්නම්, ඔබේ කාඩ්පතේ තියෙන අංකයට කතා කරන්න.',
      },
      {
        type: 'phishing',
        text: 'ඔබ කිසි විටෙක ඇතුල් නොවූ තරගයක ත්‍යාගයක් දිනුවා කියලා ඊමේල් එකක් එනවා. free gift card එකක් claim කරන්න ලින්ක් එකක් තියෙනවා. මේක ආරක්ෂිතද?',
        extra: { from: 'promotions@freegifts.site', subject: 'ඔබ දිනුවා! දැන්ම $500 Gift Card එක claim කරන්න!', body: 'සුභ පැතුම්! ඔබේ ත්‍යාගය දැන්ම claim කරන්න ක්ලික් කරන්න!' },
        answers: [
          { text: 'ආරක්ෂිතයි - මේක නීත්‍යානුකූල promotion එකක්', correct: false },
          { text: 'වංචාවක් - ඔබ ඇතුල් වුනේ නෑ, ඉතාම හොඳ දෙයක් වගේ පෙනෙනවා', correct: true },
          { text: 'ආරක්ෂිතයි - gift cards ඇත්තටම දෙනවා', correct: false },
          { text: 'claim කරන්න කලින් check කරන්න', correct: false },
        ],
        tip: 'ඔබ තරගයකට ඇතුල් වුනේ නැත්නම්, ඔබට දිනන්න බෑ. "ඉතාම හොඳ දෙයක්" වගේ offers සාමාන්‍යයෙන් වංචා. නීත්‍යානුකූල සමාගම් random ත්‍යාග claims cold-email කරන්නේ නැහැ.',
      },
      {
        type: 'phishing',
        text: 'Netflix (noreply@netflix.com) ඊමේල් එකක් එවනවා ඔබේ payment method එක expire වෙලා update කරන්න ඕන කියලා. ආරක්ෂිතද වංචාවක්ද?',
        extra: { from: 'noreply@netflix.com', subject: 'ඔබේ Payment Method එක Expire වෙලා', body: 'සේවාව දිගටම ලබාගැනීමට payment විස්තර update කරන්න' },
        answers: [
          { text: 'වංචාවක් - payment update කරන්න ඕන app එකෙන්මයි, ඊමේල් එකෙන් නෙවෙයි', correct: true },
          { text: 'ආරක්ෂිතයි - Netflix නිල දැනුම්දීමක්', correct: false },
          { text: 'ආරක්ෂිතයි - සාමාන්‍ය renewal ක්‍රියාවලියක්', correct: false },
          { text: 'ආරක්ෂිතයි - නීත්‍යානුකූල මතක් කිරීමක්', correct: false },
        ],
        tip: 'නීත්‍යානුකූල streaming සේවා ඔබට app එකේ හෝ dashboard එකේ දැනුම් දෙනවා, ඊමේල් ලින්ක් හරහා නෙවෙයි. payments සැමවිටම නිල app එකෙන් update කරන්න.',
      },
      {
        type: 'phishing',
        text: 'LinkedIn support වෙතින් කියලා ඊමේල් එකක් එනවා සැක සහිත activity ගැන. sender එක support_linkedin@security-alert.net. ආරක්ෂිතද වංචාවද?',
        extra: { from: 'support_linkedin@security-alert.net', subject: 'සැක සහිත ක්‍රියාකාරකම් හඳුනාගන්නා ලදී', body: 'අසාමාන්‍ය login උත්සාහයන් අපි හඳුනාගත්තා. දැන් තහවුරු කරන්න.' },
        answers: [
          { text: 'ආරක්ෂිතයි - LinkedIn ආරක්ෂණ අනතුරු ඇඟවීමක්', correct: false },
          { text: 'වංචාවක් - නිල LinkedIn domain එකෙන් නෙවෙයි', correct: true },
          { text: 'ආරක්ෂිතයි - නීත්‍යානුකූල අනතුරු ඇඟවීමක්', correct: false },
          { text: 'අන්තර්ගතය මතයි තීරණය', correct: false },
        ],
        tip: 'LinkedIn ගේ නිල domain එක linkedin.com. security-alert.net වගේ domain එකකින් එන ඕනෑම ඊමේල් එකක් ව්‍යාජයි. සැබෑ LinkedIn දැනුම්දීම් ඔබේ ගිණුමේම පෙන්වයි.',
      },
      {
        type: 'phishing',
        text: 'Google Accounts (account-security-noreply@google.com) වෙතින් "ඔබේ recovery email එක තහවුරු කරන්න" කියලා ඊමේල් එකක්. ආරක්ෂිතද වංචාවද?',
        extra: { from: 'account-security-noreply@google.com', subject: 'ඔබේ Recovery Email එක තහවුරු කරන්න', body: 'ගිණුම් ආරක්ෂාව සඳහා recovery email එක verify කරන්න' },
        answers: [
          { text: 'ආරක්ෂිතයි - Google නිල දැනුම්දීමක්', correct: true },
          { text: 'වංචාවක් - ආරක්ෂණ ඊමේල් සියල්ලම වංචා', correct: false },
          { text: 'ආරක්ෂිතයි - recovery email verification සාමාන්‍යයි', correct: false },
          { text: 'තීරණය කළ නොහැක', correct: false },
        ],
        tip: 'Google ගේ නිල domain එක @google.com. සැබෑ ආරක්ෂණ දැනුම්දීම් නිල ලිපිනවලින් එනවා, accounts.google.com වෙත link කරනවා. සැමවිටම Google වෙත කෙලින්ම ගොස් තහවුරු කරන්න.',
      },
      {
        type: 'phishing',
        text: '"Microsoft Security Alert - ඔබේ password එක පැය 24කින් expire වෙනවා. Reset කරන්න click කරන්න." sender: security@microsoft.onmicrosoft.com. ආරක්ෂිතද වංචාවද?',
        extra: { from: 'security@microsoft.onmicrosoft.com', subject: 'Password Expiration Warning', body: 'ඔබේ password එක වහාම reset කරන්න' },
        answers: [
          { text: 'ආරක්ෂිතයි - Microsoft නිල domain එකකින්', correct: false },
          { text: 'වංචාවක් - "onmicrosoft.com" sub-domain එක සැක සහිතයි', correct: true },
          { text: 'ආරක්ෂිතයි - passwords expire වෙනවා නොර්මල්', correct: false },
          { text: 'domain එක verify කරන්න ඕන', correct: false },
        ],
        tip: 'ව්‍යාජ domain names බොහෝවිට හරි domain එකකින් ටිකක් වෙනස්. හදිසි ලෙස time pressure එකක් දාන ඕනෑම ඊමේල් එකක් සැක කරන්න. සැමවිටම නිල website එකට කෙලින්ම ගොස් verify කරන්න.',
      },
    ],
  },

  2: {
    title: 'ශක්තිමත් මුරපද අභියෝගය',
    icon: '🔑',
    description: 'ශක්තිමත් හා ආරක්ෂිත මුරපද තෝරාගන්න ඉගෙන ගන්න',
    questions: [
      {
        type: 'password',
        text: 'මේවායින් වඩාත්ම ශක්තිමත් password එක කුමක්ද?',
        extra: { showPasswords: true },
        answers: [
          { text: '123456', correct: false },
          { text: 'password', correct: false },
          { text: 'Tr@ck9$Vlm42!qP', correct: true },
          { text: 'qwerty', correct: false },
        ],
        tip: 'ශක්තිමත් password එකක ලොකු අකුරු, කුඩා අකුරු, අංක, සහ special characters මිශ්‍ර වෙන්න ඕන. පොදු වචන සහ අනුක්‍රමික අංක වළක්වන්න.',
      },
      {
        type: 'password',
        text: 'ඔබේ උපන් දිනය password එකක් විදිහට පාවිච්චි කරන එක ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, මතක තියාගන්න පහසුයි', correct: false },
          { text: 'නෑ, පහසුවෙන් අනුමාන කරන්න පුළුවන් තොරතුරු', correct: true },
          { text: 'වෙනත් අංක එකතු කළොත් ආරක්ෂිතයි', correct: false },
          { text: 'social media වල දාන්නේ නැත්නම් ආරක්ෂිතයි', correct: false },
        ],
        tip: 'උපන්දිනය, නම, දුරකථන අංක වගේ පුද්ගලික තොරතුරු - social media වලින් හෝ පොදු වශයෙන් හොයාගන්න පුළුවන් නිසා password එකක් විදිහට කිසිදාක පාවිච්චි නොකරන්න.',
      },
      {
        type: 'password',
        text: 'ඔබේ සියලුම accounts වලට එකම password එකක් පාවිච්චි කිරීම ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, මතක තියාගන්න පහසුයි', correct: false },
          { text: 'නෑ, එක account එකක් hack උනොත් හැම account එකම අනතුරේ', correct: true },
          { text: 'password එක strong නම් ප්‍රශ්නයක් නැහැ', correct: false },
          { text: 'important accounts සඳහා විතරක් ප්‍රශ්නයක්', correct: false },
        ],
        tip: 'සෑම account එකකටම වෙනස් password එකක් පාවිච්චි කරන්න. එකම password එකක් හැම තැනම පාවිච්චි කළොත්, එකක් leak උනොත් attacker ට ඔබේ අනිත් සියලුම accounts වලටත් ඇතුල් වෙන්න පුළුවන්.',
      },
      {
        type: 'password',
        text: 'Two-Factor Authentication (2FA) පාවිච්චි කරන එකේ වාසිය මොකක්ද?',
        answers: [
          { text: 'password එක මතක තියාගන්න ඕන නැහැ', correct: false },
          { text: 'password එක leak උනත් අමතර ආරක්ෂණ layer එකක් ලැබෙනවා', correct: true },
          { text: 'login වේගවත් වෙනවා', correct: false },
          { text: 'password reset කරන්න ඕන නැහැ', correct: false },
        ],
        tip: '2FA එකෙන් password එකට අමතරව phone එකට එන code එකක් හෝ authenticator app එකක් ඕන වෙනවා. password එක steal උනත් attacker ට ඔබේ account එකට ඇතුල් වෙන්න බැහැ.',
      },
      {
        type: 'password',
        text: 'password manager එකක් පාවිච්චි කිරීම හොඳ අදහසක්ද?',
        answers: [
          { text: 'නෑ, browser එකේ save කරන එක ප්‍රමාණවත්', correct: false },
          { text: 'ඔව්, strong unique passwords ආරක්ෂිතව store කරන්න පුළුවන්', correct: true },
          { text: 'නෑ, password managers hack කරන්න පහසුයි', correct: false },
          { text: 'important accounts වලට විතරක් ප්‍රමාණවත්', correct: false },
        ],
        tip: 'password managers encryption පාවිච්චි කරලා ඔබේ passwords ආරක්ෂිතව store කරනවා, ඒ නිසා ඔබට හැම account එකකටම වෙනස්, strong password එකක් තියාගන්න පුළුවන් - මතක තියාගන්න අවශ්‍ය නැතුව.',
      },
      {
        type: 'password',
        text: 'මේවායින් වඩාත්ම දුර්වල password එක කුමක්ද?',
        extra: { showPasswords: true },
        answers: [
          { text: 'Bl$7kM#nQ92pXz', correct: false },
          { text: 'admin123', correct: true },
          { text: 'Sky*Purple#Mango77', correct: false },
          { text: 'Wq9$rL3!nBv2', correct: false },
        ],
        tip: 'පොදු වචන + සරල අංක combinations (admin123, password1 වගේ) attackers ලා dictionary attacks වලින් තත්පර කිහිපයකින් crack කරන්න පුළුවන්.',
      },
      {
        type: 'password',
        text: 'password එකක දිග වැදගත්ද?',
        answers: [
          { text: 'නෑ, complexity එක විතරක් වැදගත්', correct: false },
          { text: 'ඔව්, දිග password එකක් crack කරන්න වැඩි කාලයක් යනවා', correct: true },
          { text: 'නෑ, 6 characters ප්‍රමාණවත්', correct: false },
          { text: 'දිග කිසිම බලපෑමක් නැහැ', correct: false },
        ],
        tip: '12-16 characters හෝ ඊට වැඩි password එකක් brute-force attacks වලට ඉතාම අමාරුවෙන් crack කරන්න පුළුවන් වෙනවා. දිග + complexity දෙකම වැදගත්.',
      },
      {
        type: 'password',
        text: '"P@ssw0rd" වගේ පොදුවෙන් predictable substitutions (a→@, o→0) පාවිච්චි කිරීම ඇත්තටම ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, symbols එකතු කිරීම හැමවිටම ආරක්ෂිතයි', correct: false },
          { text: 'නෑ, මේ patterns attackers දන්නවා, easy target', correct: true },
          { text: 'ඔව්, letters වෙනුවට symbols දාන එක crack කරන්න බැහැ', correct: false },
          { text: 'මුල් වචනය මතයි තීරණය', correct: false },
        ],
        tip: 'a→@, o→0, s→$ වගේ පොදු substitutions attackers ලා dictionary attacks වලදී දන්නවා සහ check කරනවා. ඒවා ඇත්තටම extra ආරක්ෂාවක් දෙන්නේ නැහැ.',
      },
    ],
  },

  3: {
    title: 'ආරක්ෂිත වෙබ් අඩවි හඳුනාගැනීම',
    icon: '🌐',
    description: 'ආරක්ෂිත සහ අනාරක්ෂිත websites අතර වෙනස හඳුනාගන්න',
    questions: [
      {
        type: 'website',
        text: 'ඔබ online shopping site එකකට ගිහින් login කරන්න යනවා. URL එක "http://" වලින් පටන් ගන්නවා, "https://" නෙවෙයි. මේක ආරක්ෂිතද?',
        answers: [
          { text: 'ආරක්ෂිතයි, http කියන්නේ home page එක කියලා', correct: false },
          { text: 'අනාරක්ෂිතයි - encryption නැහැ, credentials interception වෙන්න පුළුවන්', correct: true },
          { text: 'ආරක්ෂිතයි, shopping sites වලට https ඕන නැහැ', correct: false },
          { text: 'domain එක නම මතයි', correct: false },
        ],
        tip: '"https://" (S = Secure) කියන්නේ site එකට යන data එක encrypted බවයි. login credentials, card details ඇතුල් කරන ඕනෑම site එකක් https පාවිච්චි කරන්න ඕන. "http://" විතරක් තියෙනවා නම් වළක්වන්න.',
      },
      {
        type: 'website',
        text: 'ඔබ "www.amaz0n-deals.com" කියන website එකකින් message එකක් ලබා ගන්නවා, Amazon ලෙස පෙනුනත්. මේක ආරක්ෂිතද?',
        answers: [
          { text: 'ආරක්ෂිතයි, Amazon ලෙසමයි පෙනෙන්නේ', correct: false },
          { text: 'අනාරක්ෂිතයි - "0" එකෙන් "o" replace කරලා fake domain එකක්', correct: true },
          { text: 'ආරක්ෂිතයි, deals sites මේ විදිහටයි', correct: false },
          { text: 'HTTPS තියෙනවා නම් ආරක්ෂිතයි', correct: false },
        ],
        tip: 'attackers "typosquatting" කියලා technique එකක් පාවිච්චි කරනවා - "o" වෙනුවට "0", "l" වෙනුවට "1" වගේ, ලංකාවේ නමට සමාන fake domains හදනවා. domain spelling හොඳින් check කරන්න.',
      },
      {
        type: 'website',
        text: 'browser එකේ address bar එකේ පදිල් (padlock 🔒) icon එකක් තියෙනවා. මේකේ තේරුම මොකක්ද?',
        answers: [
          { text: 'site එක 100% ආරක්ෂිතයි, scam නැහැ', correct: false },
          { text: 'connection එක encrypted, ඒත් site එකේ content එක verify කරන්නම ඕන', correct: true },
          { text: 'site එකට login කරන්න පුළුවන් කියලා', correct: false },
          { text: 'site එක government verified කියලා', correct: false },
        ],
        tip: 'padlock icon එකෙන් කියන්නේ connection එක encrypted බව විතරයි - site එකේ content එක legitimate කියලා guarantee කරන්නේ නැහැ. scam sites වලටත් HTTPS තියෙන්න පුළුවන්. domain name එකත් check කරන්න ඕන.',
      },
      {
        type: 'website',
        text: 'pop-up window එකක් "ඔබේ device virus infect වෙලා! දැන්ම මෙතන click කරන්න" කියලා පෙන්නනවා. මොකද කරන්න ඕන?',
        answers: [
          { text: 'ක්ලික් කරලා virus remove කරන්න', correct: false },
          { text: 'pop-up එක close කරලා trusted antivirus එකකින් scan කරන්න', correct: true },
          { text: 'phone එකට ring කරන්න', correct: false },
          { text: 'personal details ඇතුල් කරන්න', correct: false },
        ],
        tip: 'මේවා "scareware" pop-ups - ඔබව බය කරලා fake software install කරවීමට හෝ scam sites වලට යැවීමට තැත් කරනවා. legitimate antivirus programs මේ විදිහට pop-up warnings දෙන්නේ නැහැ.',
      },
      {
        type: 'website',
        text: 'website එකක "About Us" page එකක් නැහැ, contact info එකකුත් නැහැ, ඒත් "විශාල discount" එකක් offer කරනවා. මේක trust කරන්න පුළුවන්ද?',
        answers: [
          { text: 'ඔව්, discount එක ලොකුයි නිසා', correct: false },
          { text: 'නෑ, legitimate businesses contact info පෙන්නනවා', correct: true },
          { text: 'ඔව්, sites සියල්ලටම info ඕන නැහැ', correct: false },
          { text: 'reviews තියෙනවා නම් ප්‍රශ්නයක් නැහැ', correct: false },
        ],
        tip: 'legitimate online stores contact details, return policy, සහ business information පැහැදිලිව පෙන්නනවා. මේවා නැති sites, විශේෂයෙන් අසාමාන්‍ය discounts එක්ක, scam වෙන්න පුළුවන් chance එක ලොකුයි.',
      },
      {
        type: 'website',
        text: 'ඔබට email එකක් එනවා bank website එකේ link එකක් සමඟ. ලින්ක් එක click කරන්න කලින් හොඳම දේ මොකක්ද?',
        answers: [
          { text: 'ක්ලික් කරලා පරීක්ෂා කරන්න', correct: false },
          { text: 'browser එකේ URL එක hover කරලා/check කරලා actual destination බලන්න, හෝ manual URL type කරන්න', correct: true },
          { text: 'ලින්ක් එකේ පාට හරි නම් ක්ලික් කරන්න', correct: false },
          { text: 'email එකේ logo එක බලන්න', correct: false },
        ],
        tip: 'ලින්ක් එකක් click කරන්න කලින්, mouse එක link එක උඩ hover කරලා ඇත්තටම කොහෙටද යන්නේ කියලා check කරන්න පුළුවන් (බොහෝ browsers/email clients වල පෙන්නනවා). වඩාත් ආරක්ෂිත ක්‍රමය තමයි site එකේ නම browser එකේ manual එකෙන් type කිරීම.',
      },
      {
        type: 'website',
        text: 'social media platform එකක ඔබට DM එකක් එනවා "unclaimed money" එකක් ගැන, personal bank details ඉල්ලලා. මොකද කරන්න ඕන?',
        answers: [
          { text: 'bank details දෙන්න, money ලැබෙනවා නම්', correct: false },
          { text: 'ignore කරලා/report කරලා block කරන්න', correct: true },
          { text: 'ලිපිනය verify කරන්න reply කරන්න', correct: false },
          { text: 'friends ට share කරන්න', correct: false },
        ],
        tip: 'unsolicited messages වලින් "free money" offer කරලා bank details ඉල්ලන එක classic scam pattern එකක්. කිසිදාක social media DMs හරහා financial details share කරන්න එපා.',
      },
    ],
  },

  4: {
    title: 'වයිරස් හඳුනාගැනීම',
    icon: '🦠',
    description: 'මැල්වෙයාර් සහ අනාරක්ෂිත downloads හඳුනාගන්න',
    questions: [
      {
        type: 'malware',
        text: 'free game download site එකක "Download" button එකක් 5ක් තියෙනවා, ඒත් ඔබට එක software එකක් විතරයි ඕන. මොකද කරන්න ඕන?',
        answers: [
          { text: 'ලොකුම button එක click කරන්න', correct: false },
          { text: 'site එක ඉවතලා official source එකකින් download කරන්න', correct: true },
          { text: 'green button එක click කරන්න', correct: false },
          { text: 'button 5ම click කරලා පරීක්ෂා කරන්න', correct: false },
        ],
        tip: 'බොහෝ fake download buttons ads විතරයි, real download files වෙනුවට malware install කරනවා. සැමවිටම official website එකෙන් හෝ verified app store එකකින් download කරන්න.',
      },
      {
        type: 'malware',
        text: 'ඔබේ computer එක සාමාන්‍යයට වඩා slow, unexpected pop-up ads පෙන්නනවා, browser homepage එකත් වෙනස් වෙලා. මේකෙන් කියන්නේ මොකක්ද?',
        answers: [
          { text: 'internet connection එක slow', correct: false },
          { text: 'computer එකේ malware/adware තියෙන්න පුළුවන්', correct: true },
          { text: 'computer එක update කරන්න ඕන විතරයි', correct: false },
          { text: 'සාමාන්‍ය දෙයක්, ignore කරන්න', correct: false },
        ],
        tip: 'unexpected slowness, pop-ups, browser settings වෙනස් වීම (homepage, search engine) මේවා malware infection වල පොදු symptoms. antivirus scan එකක් වහාම කරන්න.',
      },
      {
        type: 'malware',
        text: 'ඔබට USB drive එකක් lost & found එකකින් හම්බුනා. එය කෙලින්ම ඔබේ computer එකට connect කරන එක ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, USB drives ආරක්ෂිතයි', correct: false },
          { text: 'නෑ, unknown USB drives malware carry කරන්න පුළුවන්', correct: true },
          { text: 'files check කරලා ඇතුල් වුනාට පස්සේ ආරක්ෂිතයි', correct: false },
          { text: 'antivirus තියෙනවා නම් ආරක්ෂිතයි', correct: false },
        ],
        tip: '"USB drop attacks" කියන්නේ attackers infected USB drives ඉවතලා ලා ඒවා දාන අය computer එකට connect කරගන්නවා කියලා බලාපොරොත්තු වීමයි. unknown USB devices කිසිදාක connect කරන්න එපා.',
      },
      {
        type: 'malware',
        text: 'email attachment එකක් .exe file extension එකක් තියෙනවා, sender එක ඔබ දන්නේ නැති කෙනෙක්. එය open කරන එක ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, attachment එකේ නම විශ්වාසදායක නම්', correct: false },
          { text: 'නෑ, .exe files unknown senders ලාගෙන් කිසිදාක open කරන්න එපා', correct: true },
          { text: 'ඔව්, antivirus එකෙන් scan කරලා open කළොත්', correct: false },
          { text: 'file size එකේ මතයි තීරණය', correct: false },
        ],
        tip: '.exe files programs run කරන files. Unknown senders ලාගෙන් එන .exe (හෝ .bat, .scr) attachments කිසිදාක open කරන්න එපා - මේවා malware install කරන ප්‍රධාන ක්‍රමයක්.',
      },
      {
        type: 'malware',
        text: 'ransomware attack එකකදී මොකද වෙන්නේ?',
        answers: [
          { text: 'computer එක වේගවත් වෙනවා', correct: false },
          { text: 'files encrypt වෙලා, ලබාගැනීමට money ඉල්ලනවා', correct: true },
          { text: 'internet connection එක නවත්තනවා', correct: false },
          { text: 'password එක change වෙනවා', correct: false },
        ],
        tip: 'Ransomware ඔබේ files encrypt කරලා ඒවා unlock කිරීමට payment (ransom) එකක් ඉල්ලනවා. වළක්වන්න regular backups තියාගන්න, unknown links/attachments click නොකරන්න.',
      },
      {
        type: 'malware',
        text: 'legitimate looking antivirus software එකක් pop-up එකකින් "install" කරන්න කියලා recommend කරනවා. මොකද කරන්න ඕන?',
        answers: [
          { text: 'ක්ලික් කරලා install කරන්න', correct: false },
          { text: 'pop-up එක ignore කරලා, ඕන නම් trusted source එකකින් antivirus download කරන්න', correct: true },
          { text: 'phone එකට call කරන්න', correct: false },
          { text: 'card details දෙන්න', correct: false },
        ],
        tip: 'fake antivirus pop-ups ("scareware") legitimate බලයි, ඒත් ඇත්තටම malware install කරනවා. antivirus software සැමවිටම official website එකක් හෝ verified app store එකකින් විතරක් download කරන්න.',
      },
      {
        type: 'malware',
        text: 'ඔබේ ෆෝන් එකේ app එකක් permission ඉල්ලනවා camera, microphone, contacts, location - simple flashlight app එකකට. සැක සහිත ලක්ෂණයක්ද?',
        answers: [
          { text: 'නෑ, apps සියල්ලටම permissions ඕන', correct: false },
          { text: 'ඔව්, flashlight app එකකට camera/contacts/location access අවශ්‍ය නැහැ', correct: true },
          { text: 'ඔව්, ඒත් install කරන්න කමක් නැහැ', correct: false },
          { text: 'reviews හොඳ නම් ප්‍රශ්නයක් නැහැ', correct: false },
        ],
        tip: 'app permissions ඒ app එකේ function එකට අදාළ විය යුතුයි. flashlight app එකකට microphone/contacts/location අවශ්‍ය නැහැ - මේ වගේ over-permissioned apps data steal කරන්න පුළුවන්.',
      },
    ],
  },

  5: {
    title: 'අන්තර්ජාල ආරක්ෂණ ප්‍රශ්නාවලිය',
    icon: '🛰️',
    description: 'සාමාන්‍ය අන්තර්ජාල ආරක්ෂණ දැනුම පරීක්ෂා කරගන්න',
    questions: [
      {
        type: 'quiz',
        text: 'public WiFi (coffee shop, mall) එකකින් online banking කරන එක ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, WiFi free නම් ආරක්ෂිතයි', correct: false },
          { text: 'නෑ, public WiFi මත data intercept වෙන්න පුළුවන් - VPN නැතුව එපා', correct: true },
          { text: 'ඔව්, password protected WiFi නම් ආරක්ෂිතයි', correct: false },
          { text: 'incognito mode පාවිච්චි කළොත් ආරක්ෂිතයි', correct: false },
        ],
        tip: 'public WiFi networks encryption දුර්වලයි, එහෙම network එකක් මත ඔබේ data අනිත් අය ට intercept කරන්න පුළුවන්. sensitive දේවල් (banking, passwords) සඳහා mobile data හෝ VPN පාවිච්චි කරන්න.',
      },
      {
        type: 'quiz',
        text: 'social media profile එකේ birth date, home address, school name, daily schedule සියල්ල public කිරීම ආරක්ෂිතද?',
        answers: [
          { text: 'ඔව්, friends ට දැනගන්න පුළුවන් වෙන්න ඕන', correct: false },
          { text: 'නෑ, identity theft සහ physical safety risk එකක්', correct: true },
          { text: 'ඔව්, private account එකක් නම් ආරක්ෂිතයි', correct: false },
          { text: 'age අනුව මතයි', correct: false },
        ],
        tip: 'personal details public කිරීමෙන් identity theft, stalking, සහ social engineering attacks වලට ඔබව exposed කරනවා. privacy settings හොඳින් manage කරලා, essential information විතරක් share කරන්න.',
      },
      {
        type: 'quiz',
        text: 'ඔබට "IT support" කියලා කෙනෙක් call කරලා ඔබේ password එක ඉල්ලනවා "system fix" කරන්න. මොකද කරන්න ඕන?',
        answers: [
          { text: 'password එක දෙන්න, IT support නම්', correct: false },
          { text: 'refuse කරලා official channel එකෙන් verify කරන්න', correct: true },
          { text: 'part of password එක දෙන්න', correct: false },
          { text: 'manager ට අහන්න', correct: false },
        ],
        tip: 'මේක "vishing" (voice phishing) කියලා කියනවා. legitimate IT support කිසිදාක ඔබෙන් password එක කෙලින්ම ඉල්ලන්නේ නැහැ. සැමවිටම company එකේ official number එකට කතා කරලා verify කරන්න.',
      },
      {
        type: 'quiz',
        text: 'children/teens ලාට online strangers ලා සමඟ personal information share කිරීම ගැන හොඳම උපදෙස මොකක්ද?',
        answers: [
          { text: 'friendly stranger නම් share කරන්න පුළුවන්', correct: false },
          { text: 'කිසිදාක personal info strangers ලාට share නොකරන්න, adult එකකුට කියන්න', correct: true },
          { text: 'name විතරක් share කරන එක ආරක්ෂිතයි', correct: false },
          { text: 'gaming platforms වල ආරක්ෂිතයි', correct: false },
        ],
        tip: 'online predators identities fake කරලා friendship build කරන්න (grooming) පුළුවන්. strangers ලා සමඟ personal details, photos, location share කරන්න එපා. සැක සහිත conversation එකක් trusted adult කෙනෙකුට වහාම කියන්න.',
      },
      {
        type: 'quiz',
        text: 'software සහ apps update කිරීම වැදගත්ද?',
        answers: [
          { text: 'නෑ, updates storage space විතරයි ගන්නේ', correct: false },
          { text: 'ඔව්, updates security vulnerabilities fix කරනවා', correct: true },
          { text: 'නෑ, apps වැඩ කරනවා නම් update කරන්න ඕන නැහැ', correct: false },
          { text: 'ලොකු updates විතරක් වැදගත්', correct: false },
        ],
        tip: 'software updates බොහෝවිට security patches ඇතුළත් - hackers ලාට exploit කරන්න පුළුවන් vulnerabilities fix කරනවා. auto-update on කරලා තියන්න වඩාත්ම ආරක්ෂිතයි.',
      },
      {
        type: 'quiz',
        text: 'cyberbullying වලට ලක්වුනොත් හොඳම ප්‍රතිචාරය මොකක්ද?',
        answers: [
          { text: 'ආපහු bully කරන්න', correct: false },
          { text: 'evidence save කරලා, block/report කරලා, trusted adult ට කියන්න', correct: true },
          { text: 'ignore කරලා account එක delete කරන්න', correct: false },
          { text: 'private message හරහා debate කරන්න', correct: false },
        ],
        tip: 'cyberbullying වලට ආපහු react කරන එකෙන් situation එක වඩාත් නරක් වෙන්න පුළුවන්. screenshots ගන්න, block/report features පාවිච්චි කරන්න, ඉක්මනින්ම parent/teacher/trusted adult කෙනෙකුට කියන්න.',
      },
      {
        type: 'quiz',
        text: 'ඔබ install කරන app එකක permissions request එකෙන් "read all your contacts and messages" කියලා ඉල්ලනවා. ඒක accept කරන්න කලින් මොකද කරන්න ඕන?',
        answers: [
          { text: 'ක්ෂණිකව accept කරන්න, app එක ඕන නම්', correct: false },
          { text: 'app එකේ function එකට ඒ permission අවශ්‍යද කියලා සිතන්න', correct: true },
          { text: 'reviews positive නම් accept කරන්න', correct: false },
          { text: 'permissions ignore කරන්න පුළුවන්', correct: false },
        ],
        tip: 'app permissions request කරන දේ ඒ app එකේ actual function එකට logical විය යුතුයි. අනවශ්‍ය permissions (messages access කරන calculator app එකක් වගේ) data misuse වලට ලක් කරන්න පුළුවන්.',
      },
      {
        type: 'quiz',
        text: 'ඔබට SMS එකක් එනවා "ඔබේ package delivery fail උනා, mෙතන click කරලා fee ගෙවන්න" කියලා. මේක trust කරන්න පුළුවන්ද?',
        answers: [
          { text: 'ඔව්, delivery services මේ විදිහට SMS එවනවා', correct: false },
          { text: 'නෑ, smishing (SMS phishing) විය හැක - courier company එකෙන් කෙලින්ම verify කරන්න', correct: true },
          { text: 'ඔව්, fee එක අඩුනම් pay කරන්න පුළුවන්', correct: false },
          { text: 'link එකේ පෙනුම හොඳ නම් trust කරන්න', correct: false },
        ],
        tip: '"smishing" කියන්නේ SMS හරහා වන phishing. delivery fees, account issues ගැන SMS links ඕනෑම විටෙක සැක කරන්න. official app එකෙන් හෝ courier company hotline එකෙන් verify කරන්න.',
      },
    ],
  },

  6: {
    title: 'අවසන් අභියෝගය (මිශ්‍ර ප්‍රශ්න)',
    icon: '🏆',
    description: 'සියලුම මට්ටම් වලින් මිශ්‍ර අභියෝගාත්මක ප්‍රශ්න',
    questions: [
      {
        type: 'phishing',
        text: 'ඔබේ office email එකට CEO ලාගෙන් message එකක් එනවා (actual email එකෙන් නෙවෙයි, "CEO" කියන display name එකෙන්) urgent wire transfer එකක් ඉල්ලලා. ආරක්ෂිතද?',
        answers: [
          { text: 'ආරක්ෂිතයි, CEO ට urgent requests එවන්න පුළුවන්', correct: false },
          { text: 'වංචාවක් - "CEO fraud" / "whaling" attack, actual email verify කරන්න', correct: true },
          { text: 'ආරක්ෂිතයි, display name එක match වෙනවා', correct: false },
          { text: 'transfer කරලා පස්සේ verify කරන්න', correct: false },
        ],
        tip: '"CEO fraud" attacks display names spoof කරලා executives ලෙස pretend කරනවා. urgent financial requests, actual email address check කරලා, phone එකෙන් direct verify කරලා විතරක් proceed කරන්න.',
      },
      {
        type: 'password',
        text: 'password එකක් "correcthorsebatterystaple" (4 random words) වගේ passphrase එකක් හදන එක ආරක්ෂිතද?',
        answers: [
          { text: 'නෑ, dictionary words නිසා crack කරන්න පුළුවන්', correct: false },
          { text: 'ඔව්, දිග passphrases crack කරන්න අමාරුයි, මතක තියාගන්නත් පහසුයි', correct: true },
          { text: 'නෑ, symbols නැති නිසා දුර්වලයි', correct: false },
          { text: 'තනි වචනයක් නම් විතරයි ආරක්ෂිත', correct: false },
        ],
        tip: 'දිග random passphrases (unrelated words 4-5) බොහෝවිට short complex passwords වලට වඩා crack කරන්න අමාරුයි, මතක තියාගන්නත් පහසුයි. දිග = ආරක්ෂාව.',
      },
      {
        type: 'website',
        text: 'ඔබ browser එකේ "This site may be unsafe" warning එකක් දකිනවා. මොකද කරන්න ඕන?',
        answers: [
          { text: 'ignore කරලා proceed කරන්න', correct: false },
          { text: 'warning එක respect කරලා site එකෙන් ඉවත් වෙන්න', correct: true },
          { text: '"Proceed anyway" click කරන්න', correct: false },
          { text: 'incognito mode එකෙන් try කරන්න', correct: false },
        ],
        tip: 'browser security warnings known threats, malware, හෝ invalid certificates මත base වෙනවා. මේ warnings override කිරීම ඔබේ device සහ data risk එකක දාන්න පුළුවන්.',
      },
      {
        type: 'malware',
        text: 'social media app එකක "see who viewed your profile" කියන third-party app එකක් install කරන්න කියලා ask කරනවා. හොඳ අදහසක්ද?',
        answers: [
          { text: 'ඔව්, කවුද profile බැලුවේ කියලා දැනගන්න ලේසියි', correct: false },
          { text: 'නෑ, මේ වගේ apps බොහෝවිට scam/data harvesting apps', correct: true },
          { text: 'ඔව්, official app store එකේ තියෙන්නම', correct: false },
          { text: 'free නම් try කරන්න පුළුවන්', correct: false },
        ],
        tip: '"who viewed your profile" apps සාමාන්‍යයෙන් සියලුම major platforms තුළ possible නැහැ (privacy policy causes). මේ claim කරන apps බොහෝවිට account credentials steal කරන scams.',
      },
      {
        type: 'quiz',
        text: 'ඔබට email එකක් එනවා ඔබේ email account එකෙන්ම (ඔබේම email address එකෙන්) ransom demand එකක් සමඟ. මේක possible ද, පිළිතුරු දෙන්නද?',
        answers: [
          { text: 'ඔව්, account එක hack උනා, ransom pay කරන්න', correct: false },
          { text: 'sender address spoof කරන්න පුළුවන්, ignore කරලා password change කරන්න', correct: true },
          { text: 'ransom එක අඩුනම් pay කරන්න', correct: false },
          { text: 'IT support ට reply කරන්න', correct: false },
        ],
        tip: 'email "From" addresses spoof කරන්න (fake කරන්න) පුළුවන් - ඔබේ email එකෙන්ම එනවා වගේ පෙනුනත් ඇත්තටම එහෙම නෙවෙයි. මේ scam sextortion/ransom emails සාමාන්‍යයෙන් fake. Ignore කරලා, ඕන නම් password එක change කරන්න.',
      },
      {
        type: 'website',
        text: 'ecommerce site එකක ඔබ ගැන ලියලා ඇති reviews සියල්ලම එකම ආකාරයේ generic text, එකම දවසේ posted. සැක සහිතද?',
        answers: [
          { text: 'නෑ, popular products වලට reviews ගොඩක් එනවා', correct: false },
          { text: 'ඔව්, fake reviews pattern එකක් - වෙනත් sources බලන්න', correct: true },
          { text: 'නෑ, positive reviews නම් ප්‍රශ්නයක් නැහැ', correct: false },
          { text: 'star rating එක ඉහළ නම් trust කරන්න', correct: false },
        ],
        tip: 'sudden burst of similar, generic reviews (බොහෝවිට එකම දවසේ) fake review campaign එකක ලක්ෂණයක්. independent review sites බලලා, verified purchase reviews විශ්වාස කරන්න.',
      },
      {
        type: 'quiz',
        text: 'ඔබට Instagram ඉන් DM එකක් එනවා "ඔබේ account එක copyright violation එකකට ලක්වෙලා, දැන්ම login කරලා appeal කරන්න" කියලා fake-looking link එකකින්. මොකද කරන්න ඕන?',
        answers: [
          { text: 'ලින්ක් එකෙන් login කරලා appeal කරන්න', correct: false },
          { text: 'ලින්ක් click නොකර, app එකෙන්ම කෙලින්ම notifications/settings check කරන්න', correct: true },
          { text: 'login details reply කරන්න', correct: false },
          { text: 'account එක delete කරන්න', correct: false },
        ],
        tip: 'fake copyright/policy violation messages account credentials steal කිරීමට පොදු ක්‍රමයක්. official app එකෙන්ම directly notifications check කරන්න, DM links click කරන්න එපා.',
      },
      {
        type: 'quiz',
        text: 'ඔබේ friend ගේ social media account එකෙන් අමුතු message එකක් එනවා "මට money අවශ්‍යයි emergency එකක්, දැන්ම transfer කරන්න" කියලා. මොකද කරන්න ඕන?',
        answers: [
          { text: 'ක්ෂණිකව transfer කරන්න, friend නිසා', correct: false },
          { text: 'call එකකින් හෝ වෙනත් ක්‍රමයකින් directly verify කරන්න, account එක hack වෙන්න පුළුවන්', correct: true },
          { text: 'partial amount එකක් transfer කරන්න', correct: false },
          { text: 'reply කරලා details අහන්න', correct: false },
        ],
        tip: 'hacked accounts බොහෝවිට friends ලා impersonate කරලා emergency money requests යවනවා. money transfer කරන්න කලින් සැමවිටම call එකකින් හෝ face-to-face directly verify කරන්න.',
      },
    ],
  },
};

const ACHIEVEMENTS = {
  firstWin: { icon: '🌟', name: 'පළමු ජයග්‍රහණය' },
  perfectLevel: { icon: '💯', name: 'දෝෂ රහිත මට්ටමක්' },
  comboMaster: { icon: '🔥', name: 'Combo ශූරයා' },
  speedRunner: { icon: '⚡', name: 'වේගවත් ක්‍රීඩකයා' },
  allLevels: { icon: '🏆', name: 'සියලුම මට්ටම් සම්පූර්ණයි' },
  survivor: { icon: '🛡️', name: 'දිවි ගලවාගත් තැනැත්තා' },
};

// ============ PERSISTENCE ============
function saveGameState() {
  try {
    localStorage.setItem('cyberRakusaState', JSON.stringify({
      stats: gameState.stats,
      highScores: gameState.highScores,
      achievements: gameState.achievements,
      unlockedLevels: gameState.unlockedLevels,
      currentLevel: gameState.currentLevel,
    }));
    localStorage.setItem('cyberRakusaSettings', JSON.stringify({
      soundEnabled: gameState.soundEnabled,
      musicEnabled: gameState.musicEnabled,
      skipAnimations: gameState.skipAnimations,
      currentDifficulty: gameState.currentDifficulty,
      playerName: gameState.playerName,
    }));
  } catch (e) { /* storage unavailable */ }
}

function loadGameState() {
  try {
    const saved = localStorage.getItem('cyberRakusaState');
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(gameState.stats, data.stats || {});
      gameState.highScores = data.highScores || [];
      gameState.achievements = data.achievements || {};
      gameState.unlockedLevels = data.unlockedLevels || [1];
      gameState.currentLevel = data.currentLevel || 1;
    }
    const settings = localStorage.getItem('cyberRakusaSettings');
    if (settings) {
      const s = JSON.parse(settings);
      gameState.soundEnabled = s.soundEnabled !== undefined ? s.soundEnabled : true;
      gameState.musicEnabled = s.musicEnabled !== undefined ? s.musicEnabled : true;
      gameState.skipAnimations = s.skipAnimations || false;
      gameState.currentDifficulty = s.currentDifficulty || 'easy';
      gameState.playerName = s.playerName || 'ක්‍රීඩකයා';
    }
  } catch (e) { /* storage unavailable */ }
  updateHomeStats();
}

// ============ SCREEN NAVIGATION ============
function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  gameState.currentScreen = screenId;
  window.scrollTo(0, 0);
}

// ============ SPLASH SCREEN ============
function runSplashScreen() {
  const bar = document.getElementById('loadingBar');
  const text = document.getElementById('loadingText');
  let pct = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 18 + 8;
    if (pct >= 100) {
      pct = 100;
      clearInterval(iv);
      setTimeout(() => {
        switchScreen('homeScreen');
        AudioEngine.startMusic();
      }, 350);
    }
    bar.style.width = pct + '%';
    text.textContent = `සූදානම් වෙමින්... ${Math.floor(pct)}%`;
  }, 220);
}

// ============ PARTICLES / FIREFLIES ============
function createParticles() {
  const container = document.getElementById('fireflies');
  const count = 22;
  for (let i = 0; i < count; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.left = Math.random() * 100 + '%';
    f.style.bottom = '-10px';
    f.style.animationDuration = (12 + Math.random() * 10) + 's';
    f.style.animationDelay = (Math.random() * 12) + 's';
    container.appendChild(f);
  }
}

// ============ RIPPLE EFFECT ============
function addRippleEffect(e) {
  const btn = e.target.classList.contains('ripple') ? e.target : e.target.closest('.ripple');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  ripple.className = 'ripple-effect';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
  playSound('click');
}

// ============ TOAST ============
function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============ HOME STATS ============
function updateHomeStats() {
  document.getElementById('homeHighScore').textContent = gameState.stats.bestScore;
  document.getElementById('homeLevel').textContent = Math.max(...gameState.unlockedLevels, 1);
  document.getElementById('homeXP').textContent = gameState.stats.totalXP;
}

// ============ LEVEL SELECT GRID ============
function buildLevelGrid() {
  const grid = document.getElementById('levelGrid');
  grid.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const level = levelsData[i];
    const locked = !gameState.unlockedLevels.includes(i);
    const card = document.createElement('div');
    card.className = 'level-card ripple zoom-in' + (locked ? ' locked' : '');
    const stars = gameState.achievements[`level${i}stars`] || 0;
    card.innerHTML = `
      <div class="level-icon">${locked ? '🔒' : level.icon}</div>
      <div class="level-num">මට්ටම ${i}</div>
      <div class="level-name">${level.title}</div>
      <div class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    `;
    if (!locked) {
      card.addEventListener('click', () => startLevel(i));
    }
    grid.appendChild(card);
  }
}

// ============ GAME START / LEVEL LOGIC ============
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTimeForDifficulty() {
  if (gameState.currentDifficulty === 'easy') return 35;
  if (gameState.currentDifficulty === 'medium') return 25;
  return 15;
}

function getLivesForDifficulty() {
  if (gameState.currentDifficulty === 'easy') return 4;
  if (gameState.currentDifficulty === 'medium') return 3;
  return 2;
}

function startLevel(levelNum) {
  const level = levelsData[levelNum];
  if (!level) return;

  gameState.currentLevel = levelNum;
  gameState.score = 0;
  gameState.xp = 0;
  gameState.combo = 1;
  gameState.bestCombo = 1;
  gameState.questionIndex = 0;
  gameState.correctAnswers = 0;
  gameState.wrongAnswers = 0;
  gameState.lives = getLivesForDifficulty();

  const shuffled = shuffleArray(level.questions);
  gameState.currentQuestions = shuffled.slice(0, Math.min(10, shuffled.length));

  document.getElementById('hudLevelName').textContent = `මට්ටම ${levelNum} — ${level.title}`;
  renderHearts();
  updateHUD();
  switchScreen('gameScreen');
  loadQuestion();
}

function renderHearts() {
  const wrap = document.getElementById('heartsWrap');
  wrap.innerHTML = '';
  for (let i = 0; i < gameState.lives; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = '❤️';
    wrap.appendChild(h);
  }
}

function loseHeart() {
  const hearts = document.querySelectorAll('#heartsWrap .heart');
  if (hearts.length > 0) {
    const last = hearts[hearts.length - 1];
    last.classList.add('lost');
    setTimeout(() => last.remove(), 480);
  }
  gameState.lives--;
}

function updateHUD() {
  document.getElementById('hudScore').textContent = gameState.score;
  document.getElementById('hudXP').textContent = gameState.xp;
  document.getElementById('hudCombo').textContent = 'x' + gameState.combo;
  const comboEl = document.querySelector('.combo-stat');
  if (gameState.combo >= 3) comboEl.classList.add('combo-hot');
  else comboEl.classList.remove('combo-hot');
}

function loadQuestion() {
  if (gameState.questionIndex >= gameState.currentQuestions.length) {
    finishLevel();
    return;
  }
  const q = gameState.currentQuestions[gameState.questionIndex];
  document.getElementById('questionCounter').textContent = `ප්‍රශ්නය ${gameState.questionIndex + 1} / ${gameState.currentQuestions.length}`;
  const diffLabel = { easy: 'පහසු', medium: 'මධ්‍යම', hard: 'දුෂ්කර' }[gameState.currentDifficulty];
  document.getElementById('questionDiffBadge').textContent = diffLabel;
  document.getElementById('questionText').textContent = q.text;

  const progressPct = (gameState.questionIndex / gameState.currentQuestions.length) * 100;
  document.getElementById('gameProgressFill').style.width = progressPct + '%';

  const extraEl = document.getElementById('questionExtra');
  extraEl.innerHTML = '';
  extraEl.style.display = 'block';
  if (q.extra && q.extra.from) {
    extraEl.innerHTML = `
      <div class="qe-row"><span class="qe-label">යවන්නා:</span><span>${escapeHtml(q.extra.from)}</span></div>
      <div class="qe-row"><span class="qe-label">මාතෘකාව:</span><span>${escapeHtml(q.extra.subject)}</span></div>
      <div class="qe-row"><span class="qe-label">පණිවුඩය:</span><span>${escapeHtml(q.extra.body)}</span></div>
    `;
  } else if (q.extra && q.extra.showPasswords) {
    extraEl.innerHTML = `<div class="qe-row"><span class="qe-label">👇</span><span>පිළිතුරු අතරින් තෝරන්න</span></div>`;
  } else {
    extraEl.style.display = 'none';
  }

  const answersGrid = document.getElementById('answersGrid');
  answersGrid.innerHTML = '';
  document.getElementById('feedbackBox').className = 'feedback-box';
  document.getElementById('feedbackBox').textContent = '';

  const shuffledAnswers = shuffleArray(q.answers);
  shuffledAnswers.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn ripple';
    btn.textContent = ans.text;
    btn.dataset.correct = ans.correct;
    btn.addEventListener('click', () => handleAnswer(btn, ans, q));
    answersGrid.appendChild(btn);
  });

  startTimer();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function startTimer() {
  clearInterval(gameState.timerInterval);
  gameState.timeRemaining = getTimeForDifficulty();
  document.getElementById('hudTimer').textContent = gameState.timeRemaining;
  gameState.timerInterval = setInterval(() => {
    if (gameState.isPaused) return;
    gameState.timeRemaining--;
    document.getElementById('hudTimer').textContent = gameState.timeRemaining;
    if (gameState.timeRemaining <= 5 && gameState.timeRemaining > 0) {
      playSound('tick');
    }
    if (gameState.timeRemaining <= 0) {
      clearInterval(gameState.timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  const q = gameState.currentQuestions[gameState.questionIndex];
  const answersGrid = document.getElementById('answersGrid');
  Array.from(answersGrid.children).forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.correct === 'true') btn.classList.add('correct');
  });
  showFeedback(false, q.tip, true);
  gameState.combo = 1;
  gameState.wrongAnswers++;
  gameState.stats.totalMistakes++;
  loseHeart();
  updateHUD();
  playSound('wrong');
  setTimeout(() => proceedNext(), 2200);
}

function handleAnswer(btn, ans, q) {
  clearInterval(gameState.timerInterval);
  const answersGrid = document.getElementById('answersGrid');
  Array.from(answersGrid.children).forEach(b => (b.disabled = true));

  if (ans.correct) {
    btn.classList.add('correct');
    const basePoints = { easy: 10, medium: 15, hard: 20 }[gameState.currentDifficulty];
    const comboBonus = Math.floor(basePoints * (gameState.combo - 1) * 0.5);
    const timeBonus = Math.max(0, Math.floor(gameState.timeRemaining / 3));
    const totalPoints = basePoints + comboBonus + timeBonus;

    gameState.score += totalPoints;
    gameState.xp += Math.floor(totalPoints * 0.8);
    gameState.correctAnswers++;
    gameState.stats.totalCorrect++;
    gameState.combo++;
    if (gameState.combo > gameState.bestCombo) gameState.bestCombo = gameState.combo;

    showFloatingPoints(btn, '+' + totalPoints);
    showFeedback(true, q.tip, false);
    playSound(gameState.combo >= 4 ? 'combo' : 'correct');
  } else {
    btn.classList.add('wrong');
    Array.from(answersGrid.children).forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('correct');
    });
    gameState.combo = 1;
    gameState.wrongAnswers++;
    gameState.stats.totalMistakes++;
    loseHeart();
    showFeedback(false, q.tip, false);
    playSound('wrong');
  }

  updateHUD();

  if (gameState.lives <= 0) {
    setTimeout(() => gameOver(), 1600);
    return;
  }

  setTimeout(() => proceedNext(), 2200);
}

function showFloatingPoints(btn, text) {
  const rect = btn.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-points';
  el.textContent = text;
  el.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  el.style.top = (rect.top) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showFeedback(correct, tip, isTimeout) {
  const box = document.getElementById('feedbackBox');
  box.className = 'feedback-box show ' + (correct ? 'correct-fb' : 'wrong-fb');
  const prefix = isTimeout ? '⏰ කාලය ඉවරයි! ' : (correct ? '✅ නිවැරදියි! ' : '❌ වැරදියි. ');
  box.innerHTML = `<strong>${prefix}</strong><br>${escapeHtml(tip)}`;
}

function proceedNext() {
  gameState.questionIndex++;
  loadQuestion();
}

function finishLevel() {
  clearInterval(gameState.timerInterval);
  gameState.stats.gamesPlayed++;
  gameState.stats.totalXP += gameState.xp;
  if (gameState.score > gameState.stats.bestScore) gameState.stats.bestScore = gameState.score;

  const nextLevel = gameState.currentLevel + 1;
  if (nextLevel <= 6 && !gameState.unlockedLevels.includes(nextLevel)) {
    gameState.unlockedLevels.push(nextLevel);
  }

  const total = gameState.correctAnswers + gameState.wrongAnswers;
  const accuracy = total > 0 ? gameState.correctAnswers / total : 0;
  let stars = 1;
  if (accuracy >= 0.9) stars = 3;
  else if (accuracy >= 0.6) stars = 2;
  gameState.achievements[`level${gameState.currentLevel}stars`] = Math.max(
    gameState.achievements[`level${gameState.currentLevel}stars`] || 0, stars
  );

  checkAchievements(accuracy);
  addHighScore();
  saveGameState();
  showResults(accuracy);
  playSound('levelup');
}

function checkAchievements(accuracy) {
  const newly = [];
  if (!gameState.achievements.firstWin) {
    gameState.achievements.firstWin = true;
    newly.push(ACHIEVEMENTS.firstWin);
  }
  if (accuracy === 1 && !gameState.achievements.perfectLevel) {
    gameState.achievements.perfectLevel = true;
    newly.push(ACHIEVEMENTS.perfectLevel);
  }
  if (gameState.bestCombo >= 5 && !gameState.achievements.comboMaster) {
    gameState.achievements.comboMaster = true;
    newly.push(ACHIEVEMENTS.comboMaster);
  }
  if (gameState.unlockedLevels.length >= 6 && !gameState.achievements.allLevels) {
    gameState.achievements.allLevels = true;
    newly.push(ACHIEVEMENTS.allLevels);
  }
  newly.forEach((a, idx) => {
    setTimeout(() => {
      showToast(`${a.icon} සම්මානය අගුළු ඇරුනා: ${a.name}`);
      playSound('badge');
    }, idx * 900);
  });
}

function addHighScore() {
  gameState.highScores.push({
    name: gameState.playerName,
    score: gameState.score,
    level: gameState.currentLevel,
    date: new Date().toLocaleDateString('si-LK'),
  });
  gameState.highScores.sort((a, b) => b.score - a.score);
  gameState.highScores = gameState.highScores.slice(0, 10);
}

function showResults(accuracy) {
  document.getElementById('resultScore').textContent = gameState.score;
  document.getElementById('resultXP').textContent = gameState.xp;
  document.getElementById('resultAccuracy').textContent = Math.round(accuracy * 100) + '%';
  document.getElementById('resultCombo').textContent = 'x' + gameState.bestCombo;

  const icon = document.getElementById('resultIcon');
  const title = document.getElementById('resultTitle');
  const sub = document.getElementById('resultSub');
  if (accuracy >= 0.9) {
    icon.textContent = '🏆';
    title.textContent = 'විශිෂ්ට ජයග්‍රහණයක්!';
    sub.textContent = 'ඔබ සයිබර් රකුසාට එරෙහිව අති විශිෂ්ට ලෙස ජාලය ආරක්ෂා කළා!';
  } else if (accuracy >= 0.6) {
    icon.textContent = '🎉';
    title.textContent = 'මෙහෙයුම සම්පූර්ණයි!';
    sub.textContent = 'හොඳ වැඩක්! ඔබ ජාලය සාර්ථකව ආරක්ෂා කළා.';
  } else {
    icon.textContent = '📘';
    title.textContent = 'මට්ටම නිම විය';
    sub.textContent = 'ඉඟි ආයෙත් කියවලා නැවත උත්සාහ කරන්න!';
  }

  document.getElementById('nextLevelBtn').style.display =
    gameState.currentLevel < 6 ? 'block' : 'none';
  document.getElementById('prevLevelBtn').style.display =
    gameState.currentLevel > 1 ? 'block' : 'none';

  switchScreen('resultsScreen');
}

function gameOver() {
  clearInterval(gameState.timerInterval);
  gameState.stats.gamesPlayed++;
  gameState.stats.totalXP += gameState.xp;
  if (gameState.score > gameState.stats.bestScore) gameState.stats.bestScore = gameState.score;
  saveGameState();

  document.getElementById('gameOverScore').textContent = gameState.score;
  document.getElementById('gameOverQuestion').textContent = `ප්‍ර${gameState.questionIndex + 1}`;
  switchScreen('gameOverScreen');
  playSound('gameover');
}

// ============ PAUSE ============
function pauseGame() {
  gameState.isPaused = true;
  document.getElementById('pauseOverlay').classList.add('show');
}
function resumeGame() {
  gameState.isPaused = false;
  document.getElementById('pauseOverlay').classList.remove('show');
}

// ============ STATS SCREEN ============
function updateStats() {
  const total = gameState.stats.totalCorrect + gameState.stats.totalMistakes;
  const accuracy = total > 0 ? Math.round((gameState.stats.totalCorrect / total) * 100) : 0;
  document.getElementById('accuracyLabel').textContent = accuracy + '%';
  const circle = document.getElementById('accuracyCircle');
  const circumference = 326.7;
  const offset = circumference - (accuracy / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  document.getElementById('statCorrect').textContent = gameState.stats.totalCorrect;
  document.getElementById('statMistakes').textContent = gameState.stats.totalMistakes;
  document.getElementById('statBestScore').textContent = gameState.stats.bestScore;
  document.getElementById('statGamesPlayed').textContent = gameState.stats.gamesPlayed;
  document.getElementById('statTotalXP').textContent = gameState.stats.totalXP;

  const badgesGrid = document.getElementById('badgesGrid');
  badgesGrid.innerHTML = '';
  Object.keys(ACHIEVEMENTS).forEach(key => {
    const a = ACHIEVEMENTS[key];
    const unlocked = !!gameState.achievements[key];
    const badge = document.createElement('div');
    badge.className = 'badge' + (unlocked ? ' unlocked' : '');
    badge.title = a.name;
    badge.textContent = a.icon;
    badgesGrid.appendChild(badge);
  });
}

// ============ HIGH SCORE TABLE ============
function updateHighScoreTable() {
  const tbody = document.getElementById('highScoreTableBody');
  tbody.innerHTML = '';
  gameState.highScores.forEach((score, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(score.name || 'ක්‍රීඩකයා')}</td>
      <td>${score.score}</td>
      <td>මට්ටම ${score.level}</td>
      <td>${score.date}</td>
    `;
    tbody.appendChild(row);
  });
  if (gameState.highScores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#a9bad4;">තවම ලකුණු නැහැ. සෙල්ලම් කරලා ඉහළම ලකුණු ලබාගන්න!</td></tr>';
  }
}

function showCertificate() {
  const level = levelsData[gameState.currentLevel];
  document.getElementById('certName').textContent = gameState.playerName;
  document.getElementById('certLevel').textContent = `මට්ටම ${gameState.currentLevel}: ${level.title}`;
  document.getElementById('certScore').textContent = gameState.score;
  document.getElementById('certDate').textContent = new Date().toLocaleDateString('si-LK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  switchScreen('certificateScreen');
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
  loadGameState();
  createParticles();
  runSplashScreen();

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('ripple') || e.target.closest('.ripple')) {
      addRippleEffect(e);
    }
  });

  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.back));
  });

  document.getElementById('startGameBtn').addEventListener('click', () => {
    switchScreen('levelSelectScreen');
    buildLevelGrid();
  });
  document.getElementById('levelSelectBtn').addEventListener('click', () => {
    switchScreen('levelSelectScreen');
    buildLevelGrid();
  });
  document.getElementById('instructionsBtn').addEventListener('click', () => {
    switchScreen('instructionsScreen');
  });
  document.getElementById('statsBtn').addEventListener('click', () => {
    switchScreen('statsScreen');
    updateStats();
  });
  document.getElementById('highScoreBtn').addEventListener('click', () => {
    switchScreen('highScoreScreen');
    updateHighScoreTable();
  });
  document.getElementById('settingsBtn').addEventListener('click', () => {
    switchScreen('settingsScreen');
    document.getElementById('settingSound').checked = gameState.soundEnabled;
    document.getElementById('settingMusic').checked = gameState.musicEnabled;
    document.getElementById('settingSkipAnim').checked = gameState.skipAnimations;
    document.getElementById('settingDifficulty').value = gameState.currentDifficulty;
    document.getElementById('settingName').value = gameState.playerName;
  });
  document.getElementById('creditsBtn').addEventListener('click', () => {
    switchScreen('creditsScreen');
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      gameState.currentDifficulty = e.target.dataset.diff;
    });
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    gameState.soundEnabled = document.getElementById('settingSound').checked;
    gameState.musicEnabled = document.getElementById('settingMusic').checked;
    gameState.skipAnimations = document.getElementById('settingSkipAnim').checked;
    gameState.currentDifficulty = document.getElementById('settingDifficulty').value;
    gameState.playerName = document.getElementById('settingName').value || 'ක්‍රීඩකයා';
    saveGameState();
    if (gameState.musicEnabled) AudioEngine.startMusic();
    else AudioEngine.stopMusic();
    showToast('⚙ සැකසුම් සුරකින ලදී!');
  });

  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (confirm('ඔබට විශ්වාසද? මෙයින් සියලුම ප්‍රගතිය, ලකුණු, සම්මාන මකා දමනු ලැබේ.')) {
      gameState.score = 0;
      gameState.xp = 0;
      gameState.stats = { gamesPlayed: 0, totalXP: 0, totalCorrect: 0, totalMistakes: 0, bestScore: 0 };
      gameState.highScores = [];
      gameState.achievements = {};
      gameState.unlockedLevels = [1];
      saveGameState();
      showToast('🗑 ප්‍රගතිය මකා දමන ලදී!');
      switchScreen('homeScreen');
      updateHomeStats();
    }
  });

  document.getElementById('soundToggleBtn').addEventListener('click', (e) => {
    gameState.soundEnabled = !gameState.soundEnabled;
    e.target.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    playSound('correct');
    saveGameState();
  });

  document.getElementById('musicToggleBtn').addEventListener('click', (e) => {
    gameState.musicEnabled = !gameState.musicEnabled;
    e.target.textContent = gameState.musicEnabled ? '🎵' : '🔇';
    if (gameState.musicEnabled) AudioEngine.startMusic();
    else AudioEngine.stopMusic();
    saveGameState();
  });

  document.getElementById('pauseBtn').addEventListener('click', pauseGame);
  document.getElementById('resumeBtn').addEventListener('click', resumeGame);

  document.getElementById('restartLevelBtn').addEventListener('click', () => {
    resumeGame();
    startLevel(gameState.currentLevel);
  });

  document.getElementById('quitToMenuBtn').addEventListener('click', () => {
    clearInterval(gameState.timerInterval);
    resumeGame();
    switchScreen('homeScreen');
    updateHomeStats();
  });

  document.getElementById('nextLevelBtn').addEventListener('click', () => {
    if (gameState.currentLevel < 6) {
      startLevel(gameState.currentLevel + 1);
    } else {
      showToast('🎉 සියලුම මට්ටම් සම්පූර්ණයි!');
      switchScreen('homeScreen');
      updateHomeStats();
    }
  });

  document.getElementById('prevLevelBtn').addEventListener('click', () => {
    if (gameState.currentLevel > 1) {
      startLevel(gameState.currentLevel - 1);
    }
  });

  document.getElementById('retryLevelBtn').addEventListener('click', () => {
    startLevel(gameState.currentLevel);
  });

  document.getElementById('certificateBtn').addEventListener('click', showCertificate);

  document.getElementById('resultMenuBtn').addEventListener('click', () => {
    switchScreen('homeScreen');
    updateHomeStats();
  });

  document.getElementById('gameOverRetryBtn').addEventListener('click', () => {
    startLevel(gameState.currentLevel);
  });

  document.getElementById('gameOverMenuBtn').addEventListener('click', () => {
    switchScreen('homeScreen');
    updateHomeStats();
  });
});
