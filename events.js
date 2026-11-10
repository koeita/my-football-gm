/**
 * events.js - フェーズ4: 選択式ランダムイベントシステム（GM業務イベント）
 * クラブ運営中にGMが決断を迫られるリアルなジレンマ・イベントを提供
 */

// ==========================================================================
// 1. 選択式GMイベントマスターデータ（全10種類）
// ==========================================================================

const RANDOM_GM_EVENTS = [
  {
    id: 'EVENT_TRANSFER_REQUEST',
    title: '主力選手からの直訴：海外移籍の志願',
    category: '人事・移籍',
    icon: 'briefcase',
    getDescription: (club) => {
      const star = (club.players && club.players.slice().sort((a, b) => (b.ovr || 70) - (a.ovr || 70))[0]) || { name: '主力選手' };
      return `チームの支柱である ${star.name} がオフィスを訪れ、「海外メガクラブからの関心を聞いた。自身のキャリアアップのために移籍を前向きに検討してほしい」と直訴してきました。`;
    },
    getOptions: (club) => {
      const star = (club.players && club.players.slice().sort((a, b) => (b.ovr || 70) - (a.ovr || 70))[0]) || { name: '主力選手' };
      return [
        {
          id: 'bonus_stay',
          title: '特別残留ボーナスを提示して慰留',
          detail: 'クラブの将来計画を熱心に説き、給与アップと特別インセンティブを約束する。',
          effectSummary: '資金 -£600K ／ チーム士気 +10 ／ 選手の忠誠度向上',
          apply: (club) => {
            club.funds = (club.funds || 0) - 600;
            club.morale = Math.min(100, (club.morale || 70) + 10);
            return `${star.name} はGMの熱意と条件を受け入れ、チーム残留を誓いました！（資金 -£600K / 士気 +10）`;
          }
        },
        {
          id: 'strict_reject',
          title: '契約履行を求め厳格に却下',
          detail: '「君は今季のタイトル獲得に不可欠な存在だ」と告げ、クラブの規律を優先して売却を一蹴する。',
          effectSummary: '資金変動なし ／ 一時的な不満による士気微減（-5）',
          apply: (club) => {
            club.morale = Math.max(30, (club.morale || 70) - 5);
            return `${star.name} は不満げながらも契約を尊重し、練習に戻りました。（士気 -5）`;
          }
        },
        {
          id: 'accept_fee',
          title: '巨額の移籍金なら容認する姿勢を示す',
          detail: '「市場価値に見合う妥協のない移籍金オファーが届けば考慮する」と条件付きで容認する。',
          effectSummary: 'サポーター期待度UP ／ 移籍市場での注目度向上',
          apply: (club) => {
            club.fanCount = (club.fanCount || 10000) + 500;
            return `選手と紳士協定を結びました。今後の移籍市場での高額取引が期待されます。（サポーター +500）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_LOCKER_ROOM_FEUD',
    title: 'ロッカールームの戦術対立と派閥問題',
    category: 'チーム規律',
    icon: 'users',
    getDescription: (club) => {
      return `直近の戦術スタイルや先発起用を巡り、守備陣と攻撃陣の間で激しい口論が発生しました。現場の雰囲気が緊迫しています。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'team_bbq',
          title: '全員参加の親睦バーベキュー大会を開催',
          detail: 'GM自ら費用を負担し、郊外のクラブ施設でリフレッシュを兼ねた親睦会を開催する。',
          effectSummary: '資金 -£150K ／ チーム士気 +15 ／ 全選手疲労度 -10',
          apply: (club) => {
            club.funds = (club.funds || 0) - 150;
            club.morale = Math.min(100, (club.morale || 70) + 15);
            if (club.players) {
              club.players.forEach(p => { p.fatigue = Math.max(0, (p.fatigue || 0) - 10); });
            }
            return `和やかな雰囲気の中で本音をぶつけ合い、結束が強まりました！（資金 -£150K / 士気 +15 / 疲労回復）`;
          }
        },
        {
          id: 'trust_captain',
          title: 'キャプテンにロッカールームの調停を一任',
          detail: '「選手同士で解決すべき問題だ」として、リーダー陣の自主性に委ねる。',
          effectSummary: '資金変動なし ／ キャプテンのリーダーシップ発揮（士気 +5）',
          apply: (club) => {
            club.morale = Math.min(100, (club.morale || 70) + 5);
            return `キャプテンがミーティングを主導し、チームの規律を取り戻しました。（士気 +5）`;
          }
        },
        {
          id: 'strict_warning',
          title: '監督とともに規律違反者へ厳重警告',
          detail: 'クラブの和を乱す言動に対して罰金処分を科し、プロとしての責任を徹底させる。',
          effectSummary: '規律回復 ／ 罰金徴収（資金 +£50K）',
          apply: (club) => {
            club.funds = (club.funds || 0) + 50;
            return `厳格な規律指導によりロッカールームの緊張感が引き締まりました。（罰金収益 +£50K）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_GLOBAL_SPONSOR',
    title: '地元グローバル企業からの特別スポンサー提案',
    category: '経営・スポンサー',
    icon: 'dollar-sign',
    getDescription: (club) => {
      return `世界的ハイテク企業が、クラブの将来性とクリーンなイメージに感銘を受け、年間スポンサーシップ契約の増額を打診してきました。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'accept_tech_sponsor',
          title: '条件を快諾し、パートナーシップを締結',
          detail: '胸ロゴ契約とスタジアム看板の独占権を付与し、大型スポンサー料を獲得する。',
          effectSummary: '資金 +£2.5M ／ クラブブランド価値向上',
          apply: (club) => {
            club.funds = (club.funds || 0) + 2500;
            club.fanCount = (club.fanCount || 10000) + 1000;
            return `大型契約が締結され、クラブの財政基盤が一気に強化されました！（資金 +£2.5M / サポーター +1,000）`;
          }
        },
        {
          id: 'community_partner',
          title: '地元地域貢献型の共同基金設立を逆提案',
          detail: '単なる商業支援にとどまらず、地元子ども向けサッカースクールの設立基金を共同設置する。',
          effectSummary: '資金 +£1.2M ／ サポーター熱狂（+2,500人） ／ 士気 +10',
          apply: (club) => {
            club.funds = (club.funds || 0) + 1200;
            club.fanCount = (club.fanCount || 10000) + 2500;
            club.morale = Math.min(100, (club.morale || 70) + 10);
            return `サポーターと地域から絶大な称賛を受け、クラブの誇りが高まりました！（資金 +£1.2M / サポーター +2,500 / 士気 +10）`;
          }
        },
        {
          id: 'keep_tradition',
          title: 'クラブの伝統を守り、契約を保留',
          detail: '過度な商業化を嫌うコアサポーターの声に配慮し、契約規模を抑制する。',
          effectSummary: 'コアサポーターの忠誠度MAX ／ 現状維持',
          apply: (club) => {
            club.morale = Math.min(100, (club.morale || 70) + 5);
            return `伝統を重んじるGMの姿勢に、古参サポーターから熱い感謝が寄せられました。（士気 +5）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_YOUTH_WONDERKID',
    title: '下部組織の奇跡：ユースアカデミーの神童発掘',
    category: '育成・ユース',
    icon: 'star',
    getDescription: (club) => {
      return `アカデミースカウトから興奮気味の報告が入りました。U-18チームに「10年に一人の逸材」と称される17歳の神童アタッカーが頭角を現しています。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'promote_first_team',
          title: '即座にプロ契約を締結し、トップチームへ抜擢',
          detail: '契約金と専用コーチを配置し、トップチームのローテーションに加える。',
          effectSummary: '資金 -£250K ／ OVR 72 の有望若手選手がスカッドに加入！',
          apply: (club) => {
            club.funds = (club.funds || 0) - 250;
            const newKid = {
              id: `youth_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              name: 'L. Sterling',
              nationality: 'England',
              age: 17,
              height: 178,
              preferredFoot: 'Right',
              pos: 'LW',
              primaryPosition: 'LW',
              mainPositions: ['LW', 'RW'],
              subPositions: ['CF'],
              spd: 86,
              tec: 78,
              atk: 74,
              def: 38,
              sta: 75,
              gk: 10,
              ovr: 72,
              calculatedOvr: 72,
              potential: 89,
              growthCurve: 'early',
              fatigue: 0,
              contractYears: 4,
              wage: 8,
              avatarGenes: typeof generateRandomAvatarGenes === 'function' ? generateRandomAvatarGenes() : null
            };
            if (!club.players) club.players = [];
            club.players.push(newKid);
            return `17歳の神童 L. Sterling (LW / OVR 72) がトップチームに昇格しました！（資金 -£250K）`;
          }
        },
        {
          id: 'intensive_academy',
          title: 'ユース施設で英才教育を継続',
          detail: '飛び級のプレッシャーを避け、最新の育成メソッドで基礎体力を鍛え上げる。',
          effectSummary: '資金 -£100K ／ クラブ全体の育成効率 +20%',
          apply: (club) => {
            club.funds = (club.funds || 0) - 100;
            club.youthBoost = true;
            return `アカデミーの育成環境が強化され、若手全体の成長スピードが向上しました！（資金 -£100K）`;
          }
        },
        {
          id: 'loan_plan',
          title: '下位リーグへの武者修行レンタル計画を策定',
          detail: '実戦経験を積ませるため、提携クラブへの短期ローン移籍を内定させる。',
          effectSummary: '資金変動なし ／ 将来の成長保証',
          apply: (club) => {
            club.morale = Math.min(100, (club.morale || 70) + 5);
            return `若手育成ロードマップが確立され、クラブの長期的展望が明るくなりました。（士気 +5）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_MEDICAL_OVERLOAD',
    title: '過密日程警報：チーフドクターからの進言',
    category: 'メディカル',
    icon: 'activity',
    getDescription: (club) => {
      return `メディカルチームのチーフドクターが深刻な顔で訪ねてきました。「連戦による筋肉系の疲労が限界値に近づいており、このままでは主力に長期離脱の怪我人が出るリスクが極めて高い」とのことです。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'rest_day',
          title: 'スタメン全員に特別リカバリー休暇を付与',
          detail: '次節直前まで練習強度を落とし、最新の交代浴と酸素カプセルセラピーを実施する。',
          effectSummary: '全選手の疲労度 -30 ／ 次節の試合に向けコンディション万全',
          apply: (club) => {
            if (club.players) {
              club.players.forEach(p => { p.fatigue = Math.max(0, (p.fatigue || 0) - 30); });
            }
            return `徹底した疲労回復処置により、主力選手たちの身体が完全にリフレッシュされました！（全選手疲労度 -30）`;
          }
        },
        {
          id: 'diet_specialist',
          title: '世界的スポーツ栄養士チームを緊急招聘',
          detail: '食事プログラムを抜本的に見直し、サプリメントと個別栄養管理を導入する。',
          effectSummary: '資金 -£120K ／ 全選手疲労度 -15 ／ 持久力UP',
          apply: (club) => {
            club.funds = (club.funds || 0) - 120;
            if (club.players) {
              club.players.forEach(p => { p.fatigue = Math.max(0, (p.fatigue || 0) - 15); });
            }
            return `プロフェッショナルな栄養指導により、選手の回復効率が劇的に向上しました！（資金 -£120K / 疲労度 -15）`;
          }
        },
        {
          id: 'push_through',
          title: '精神力を鼓舞し、通常メニューを貫徹',
          detail: '「タイトルを争うチームに妥協はない」とゲキを飛ばし、過酷な日程を乗り切るメンタリティを求める。',
          effectSummary: 'チーム士気 +5 ／ 疲労回復なし（怪我リスク維持）',
          apply: (club) => {
            club.morale = Math.min(100, (club.morale || 70) + 5);
            return `選手の闘争心に火がつきましたが、肉体的疲労には注意が必要です。（士気 +5）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_FAN_FESTIVAL',
    title: 'サポーター連合からの「ファン感謝デー」開催要請',
    category: '地域・サポーター',
    icon: 'heart',
    getDescription: (club) => {
      return `公式サポーターズクラブから、スタジアムを開放した大規模なファン感謝イベントの開催提案書が届きました。サポーターとの絆を深める絶好の機会です。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'big_festival',
          title: '豪華な演出を交えたビッグフェスタを開催',
          detail: 'ミニゲームや選手サイン会、グッズ抽選会を盛大に催し、サポーターを歓迎する。',
          effectSummary: '資金 -£180K ／ サポーター +2,000人 ／ チーム士気 +15',
          apply: (club) => {
            club.funds = (club.funds || 0) - 180;
            club.fanCount = (club.fanCount || 10000) + 2000;
            club.morale = Math.min(100, (club.morale || 70) + 15);
            return `スタジアムは大熱狂！サポーターとの絆が深まり、クラブへの愛着が頂点に達しました！（資金 -£180K / サポーター +2,000 / 士気 +15）`;
          }
        },
        {
          id: 'charity_event',
          title: '地域病院・小児施設へのチャリティ訪問に特化',
          detail: '派手な催しを抑え、選手たちが地域社会に直接貢献する温かい活動を実施する。',
          effectSummary: '資金 -£50K ／ サポーター +800人 ／ クラブ好感度大幅UP',
          apply: (club) => {
            club.funds = (club.funds || 0) - 50;
            club.fanCount = (club.fanCount || 10000) + 800;
            club.morale = Math.min(100, (club.morale || 70) + 8);
            return `地域メディアで大々的に報道され、クラブの社会的評価が大きく高まりました。（資金 -£50K / サポーター +800 / 士気 +8）`;
          }
        },
        {
          id: 'online_event',
          title: 'オンライン配信形式に簡素化して実施',
          detail: '試合日程への影響を最小限にとどめ、YouTube生配信でのトークショーとする。',
          effectSummary: '費用最小限（-£10K） ／ サポーター +300人',
          apply: (club) => {
            club.funds = (club.funds || 0) - 10;
            club.fanCount = (club.fanCount || 10000) + 300;
            return `効率的なオンライン交流会が無事に終了しました。（資金 -£10K / サポーター +300）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_TACTICAL_AI',
    title: '最新鋭AI戦術データ分析システムの導入提案',
    category: '戦術・アナリティクス',
    icon: 'cpu',
    getDescription: (club) => {
      return `データ分析部門から、欧州最先端のトラッキングAIと対戦相手シミュレーションソフトウェアの導入稟議が提出されました。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'adopt_full_ai',
          title: '最高峰エンタープライズ版を即決導入',
          detail: '対戦相手のウィークポイントや選手のポジショニングエラーを完全可視化する。',
          effectSummary: '資金 -£300K ／ 次回以降の全公式戦勝率ボーナス',
          apply: (club) => {
            club.funds = (club.funds || 0) - 300;
            club.tacticalAiBoost = true;
            return `最先端AI分析室が稼働を開始しました！緻密なスカウティングで勝利を引き寄せます。（資金 -£300K / 勝率UP）`;
          }
        },
        {
          id: 'adopt_light_ai',
          title: 'トライアル版（基本機能のみ）で試験運用',
          detail: '初期コストを抑えつつ、有用性を検証してから本格導入を検討する。',
          effectSummary: '資金 -£80K ／ 軽微な戦術アドバンテージ',
          apply: (club) => {
            club.funds = (club.funds || 0) - 80;
            return `必要十分な分析データを手頃なコストで確保しました。（資金 -£80K）`;
          }
        },
        {
          id: 'trust_coaches',
          title: '現場のコーチ陣の「直感と経験」を最優先',
          detail: '「数字では測れないフットボールの感性こそが重要だ」として見送る。',
          effectSummary: '資金温存 ／ 現場首脳陣の信頼感UP（士気 +5）',
          apply: (club) => {
            club.morale = Math.min(100, (club.morale || 70) + 5);
            return `現場スタッフのプライドを重んじるGMの決断に、コーチ陣の結束が強まりました。（士気 +5）`;
          }
        }
      ];
    }
  },
  {
    id: 'EVENT_STADIUM_VIP',
    title: 'ホームスタジアムVIPラウンジ改修の投資オファー',
    category: 'スタジアム・施設',
    icon: 'home',
    getDescription: (club) => {
      return `スタジアム運営責任者より、老朽化したホスピタリティラウンジを一新し、富裕層向けVIPスイートを増設する改修計画が持ち上がりました。`;
    },
    getOptions: (club) => {
      return [
        {
          id: 'upgrade_vip',
          title: '一括投資で豪華VIPスイートを新設',
          detail: '今後のホームゲーム入場料・グッズ収益が永続的に底上げされる。',
          effectSummary: '資金 -£500K ／ 毎試合のGM収支 +£80Kボーナス',
          apply: (club) => {
            club.funds = (club.funds || 0) - 500;
            club.vipLoungeUpgrade = true;
            return `最高級VIPスイートが完成！毎試合の商業収益が大幅に向上します！（資金 -£500K / 毎試合収支UP）`;
          }
        },
        {
          id: 'general_seats',
          title: '一般サポーター席の座席・音響改修に予算を充当',
          detail: '一般ファンの観戦体験を向上させ、リピーターを増やす。',
          effectSummary: '資金 -£200K ／ サポーター +1,500人',
          apply: (club) => {
            club.funds = (club.funds || 0) - 200;
            club.fanCount = (club.fanCount || 10000) + 1500;
            return `一般スタンドの快適性が向上し、スタジアムの一体感が高まりました！（資金 -£200K / サポーター +1,500）`;
          }
        },
        {
          id: 'postpone_upgrade',
          title: 'チーム補強資金を優先し、改修を見送り',
          detail: 'ピッチ上の結果こそが最大の営業効果であるとして、資金を手元に残す。',
          effectSummary: '資金温存（変動なし）',
          apply: (club) => {
            return `補強資金をしっかり温存しました。次の移籍市場に備えます。`;
          }
        }
      ];
    }
  }
];

// ==========================================================================
// 2. イベントトリガー & 状態管理
// ==========================================================================

/**
 * カレンダー日進行時に呼び出され、条件に応じてランダムイベントを発生させる
 */
function checkAndTriggerGmEvent() {
  if (gameState.isGameOver || gameState.isSeasonOver) return null;
  if (gameState.pendingGmEvent) return gameState.pendingGmEvent; // 既に未解決イベントがある場合は保留

  const currentDay = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
  if (!currentDay) return null;

  // 試合当日そのものには発生させず、前日や翌日・平日トレーニング日に発生（約12%の確率）
  if (currentDay.isMatchDay || currentDay.isCupMatchDay) return null;

  const roll = Math.random();
  if (roll > 0.12) return null;

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub) return null;

  // ランダムに1件選出
  const randomIndex = Math.floor(Math.random() * RANDOM_GM_EVENTS.length);
  const eventTemplate = RANDOM_GM_EVENTS[randomIndex];

  const eventInstance = {
    id: `${eventTemplate.id}_${Date.now()}`,
    templateId: eventTemplate.id,
    title: eventTemplate.title,
    category: eventTemplate.category,
    icon: eventTemplate.icon,
    description: eventTemplate.getDescription(playerClub),
    options: eventTemplate.getOptions(playerClub),
    triggeredDate: currentDay.displayDate || '本日',
    resolved: false
  };

  gameState.pendingGmEvent = eventInstance;

  // 日報ログとトーストで通知
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【GM緊急案件】${eventInstance.title}（決断が求められています）`);
  }
  if (typeof showToast === 'function') {
    showToast(`⚠️ GM緊急案件が発生しました：「${eventInstance.title}」`, 'warning');
  }

  // GMタスク一覧の即時更新
  if (typeof renderGmTasks === 'function') {
    renderGmTasks();
  }

  return eventInstance;
}

/**
 * 選択式イベントのモーダルを開く
 */
function openGmEventModal(eventInstance) {
  const ev = eventInstance || gameState.pendingGmEvent;
  if (!ev) return;

  let modal = document.getElementById('gm-event-modal');
  if (!modal) {
    createGmEventModalDom();
    modal = document.getElementById('gm-event-modal');
  }

  const titleEl = document.getElementById('gm-event-modal-title');
  const catEl = document.getElementById('gm-event-modal-cat');
  const descEl = document.getElementById('gm-event-modal-desc');
  const optionsContainer = document.getElementById('gm-event-options-container');

  if (titleEl) titleEl.textContent = ev.title;
  if (catEl) catEl.textContent = `${ev.category} 案件`;
  if (descEl) descEl.textContent = ev.description;

  if (optionsContainer) {
    optionsContainer.innerHTML = ev.options.map((opt, idx) => `
      <div class="gm-event-option-card" data-option-id="${opt.id}">
        <div class="gm-event-option-header">
          <span class="gm-event-option-badge mono">選択肢 ${idx + 1}</span>
          <strong class="gm-event-option-title">${opt.title}</strong>
        </div>
        <p class="gm-event-option-detail">${opt.detail}</p>
        <div class="gm-event-option-effect mono">
          <span class="effect-label">影響：</span>${opt.effectSummary}
        </div>
        <button type="button" class="btn btn-primary btn-block btn-select-gm-option" data-option-id="${opt.id}">
          この方針を決断する
        </button>
      </div>
    `).join('');
  }

  modal.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * GMイベントモーダルのDOMを動的生成
 */
function createGmEventModalDom() {
  if (document.getElementById('gm-event-modal')) return;

  const modalHtml = `
    <div id="gm-event-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="gm-event-modal-title">
      <div class="modal-card gm-event-modal-card">
        <div class="modal-header gm-event-header">
          <div>
            <span class="modal-category mono" id="gm-event-modal-cat">GM業務 案件</span>
            <h2 class="modal-title" id="gm-event-modal-title">緊急決断案件</h2>
          </div>
          <button type="button" class="btn-modal-close mono" id="btn-close-gm-event-modal" aria-label="閉じる">✕</button>
        </div>
        <div class="modal-body gm-event-modal-body">
          <div class="gm-event-desc-box" id="gm-event-modal-desc">
            状況説明
          </div>
          <div class="gm-event-options-list" id="gm-event-options-container">
            <!-- 選択肢カードが展開 -->
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // イベントバインド
  const closeBtn = document.getElementById('btn-close-gm-event-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeGmEventModal);
  }

  const optionsContainer = document.getElementById('gm-event-options-container');
  if (optionsContainer) {
    optionsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-select-gm-option');
      if (!btn) return;
      const optionId = btn.getAttribute('data-option-id');
      resolveGmEventOption(optionId);
    });
  }
}

/**
 * 選択肢の決断を実行
 */
function resolveGmEventOption(optionId) {
  const ev = gameState.pendingGmEvent;
  if (!ev) return;

  const selectedOpt = ev.options.find(o => o.id === optionId);
  if (!selectedOpt) return;

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub) return;

  // 効果適用
  const resultMessage = selectedOpt.apply(playerClub);

  // ログ記録
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【GM決断完了】${ev.title} ➜ 「${selectedOpt.title}」を選択。${resultMessage}`);
  }
  if (typeof showToast === 'function') {
    showToast(`決断完了：${resultMessage}`, 'success');
  }

  // 完了フラグ
  ev.resolved = true;
  gameState.pendingGmEvent = null;

  closeGmEventModal();

  // ヘッダーやUIの数値更新
  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderGmTasks === 'function') renderGmTasks();
}

/**
 * イベントモーダルを閉じる
 */
function closeGmEventModal() {
  const modal = document.getElementById('gm-event-modal');
  if (modal) {
    modal.classList.add('hidden');
    if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
  }
}
