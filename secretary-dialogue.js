// ==========================================================================
// 秘書セリフ・詳細解説・状況別アドバイス定義（secretary-dialogue.js）
// 3名の秘書（polite: C. Bennett / active: E. Silva / calm: A. Miles）に対応
// ==========================================================================

const SecretaryDialogue = (() => {
  function getTone(sec) {
    const t = sec && sec.tone ? String(sec.tone) : 'polite';
    if (t === 'active' || t === 'calm' || t === 'polite') return t;
    return 'polite';
  }

  function pickByTone(sec, map) {
    const tone = getTone(sec);
    return map[tone] || map.polite || map.active || map.calm;
  }

  function getEventDialogue(eventKey, ctx = {}, sec = null) {
    const secName = (sec && sec.name) || 'C. Bennett';
    const clubName = ctx.clubName || '当クラブ';
    const deadlineLabel = ctx.deadlineLabel || '8/31';

    switch (eventKey) {
      case 'onboarding': {
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、改めまして ${clubName} へのご着任おめでとうございます！秘書の ${secName} です。まずはクラブ立ち上げに必要な3つの重要事項から進めていきましょう！`,
              `最初に「監督・コーチ陣の選任」で現場の軸を決め、次に「スポンサー契約」を期限（${deadlineLabel}）までに締結してください。期限を過ぎると今季終了まで新規契約ができなくなるので要注意です！`,
              `最後に「スタジアム・チケット・グッズ設定」を固めて準備完了です。興行計画は確定後に今季変更不可となるため、現在のファン総数と収支バランスを見比べてベストな方針を選びましょう。`
            ],
            calm: [
              `${clubName} 担当秘書を拝命しました ${secName} です。日程を進める前に、まず開幕へ向けた3つの基盤体制をご確認いただきます。`,
              `「監督・コーチ陣の選任」はチームの戦術浸透と練習効率を左右します。また「スポンサー契約」は締切（${deadlineLabel}）を過ぎると今季中の受付が終了するため、優先的な締結を推奨します。`,
              `「スタジアム・チケット・グッズ設定」は一度確定するとシーズン終了まで変更できません。現在のサポーター規模に応じた来場予想と維持費のバランスを見極めた上でご確定ください。`
            ],
            polite: [
              `GM、${clubName} の担当秘書を務めさせていただきます ${secName} でございます。執務の第一歩として、最優先となる3つの重要事項からご案内申し上げます。`,
              `まず「監督・コーチ陣の選任」で指導体制を整え、続いて「スポンサー契約」をご締結ください。スポンサーには締切（${deadlineLabel}）があり、過ぎますと今季は契約できなくなってしまいます。`,
              `あわせて「スタジアム・チケット・グッズ設定」の確定も重要でございます。確定後はシーズン終了まで条件を変更できませんので、サポーター規模や予想純収益をご確認のうえご判断くださいませ。`
            ]
          })
        };
      }

      case 'club_opening': {
        const isFirst = Boolean(ctx.isFirstCareer);
        const season = ctx.season || 1;
        const mgrName = ctx.mgrName || '新監督';
        const wishPos = ctx.wishPosText || '戦力全体のバランス';
        const hasPendingSp = Boolean(ctx.hasPendingSponsors);
        const spClause = hasPendingSp
          ? `未契約のスポンサー枠は期限（${deadlineLabel}）までにご締結をお忘れなく。`
          : '補強予算やスケジュールを見ながら計画的に動かしましょう。';
        const p2PoliteSp = hasPendingSp
          ? `なお、未契約のスポンサー枠が残っておりますので、期限（${deadlineLabel}）までにお手続きいただけますと安心でございます。`
          : '各ポジションの選手層をご確認のうえ、目標順位の達成へ向けて動き出しましょう。';

        return {
          pages: pickByTone(sec, {
            active: [
              isFirst
                ? `GM、${mgrName}監督のもと新体制がスタートしましたね！7月1日より夏の移籍市場が解禁され、監督からは「${wishPos}」の補強リクエストが届いています。`
                : `GM、Season ${season} の開幕です！夏の移籍市場もオープンしています。${mgrName}監督の補強希望「${wishPos}」を軸にスカッドを強化していきましょう！`,
              `補強の際は現在資金だけでなく、今後の週給支払いを差し引いた「安全移籍予算」を意識するのがコツです。${spClause}`
            ],
            calm: [
              isFirst
                ? `GM、${mgrName}監督との指導体制が発足しました。本日7月1日より夏の移籍市場が開幕しており、初期査定では「${wishPos}」の補強優先度が高い結果となっています。`
                : `GM、Season ${season} の基準日を迎えました。目標順位の達成に向け、${mgrName}監督が求める「${wishPos}」の補強精査をおすすめします。`,
              `無理な移籍金や高騰した週給はPSR（3年累積収支）を圧迫します。必ず安全移籍予算の範囲内で獲得をご検討ください。${hasPendingSp ? `未契約スポンサー（期限 ${deadlineLabel}）の締結も計画的に進めましょう。` : ''}`
            ],
            polite: [
              isFirst
                ? `GM、${mgrName}監督およびコーチ陣の選任が完了いたしました。本日より移籍市場も開いており、監督からは「${wishPos}」の補強要望が届いております。`
                : `GM、Season ${season} が開幕いたしました。移籍市場も同時に開いておりますので、まずは${mgrName}監督の補強希望「${wishPos}」をご確認くださいませ。`,
              `選手獲得の際は、シーズン中の給与支払いを確保した「安全移籍予算」を目安にされると経営が安定いたします。${p2PoliteSp}`
            ]
          })
        };
      }

      case 'winter_market_open': {
        const posLabel = ctx.posLabel || '補強ポイント';
        return {
          pages: pickByTone(sec, {
            active: [
              `1月1日、冬の移籍ウィンドウが開幕しました！監督からは後半戦を戦い抜くための「${posLabel}」補強要望と推薦リストが届いています。`,
              `冬の市場は1月末までの1か月限定です。さらに1月からは、他クラブで契約残り1年を切った選手に「来季の事前合意（移籍金£0）」を打診できるようになるので要チェックですよ！`
            ],
            calm: [
              `1月1日より冬の移籍市場が開幕しました。後半戦の過密日程と目標順位達成に向け、監督より「${posLabel}」に関する補強要請が提出されています。`,
              `市場は1月末で閉幕する短期戦です。また、契約残り1年以下の選手に対する来季の事前合意（ボスマン移籍）も解禁されていますので、中長期編成にもご活用ください。`
            ],
            polite: [
              `1月1日より冬の移籍ウィンドウが開幕いたしました。監督から後半戦へ向けた「${posLabel}」の補強要望書と推薦選手リストが届いております。`,
              `冬の市場は1月末までと期間が短くなっております。あわせて来季以降の移籍金£0加入を狙える「事前合意」も解禁されておりますので、あわせてご検討くださいませ。`
            ]
          })
        };
      }

      case 'deadline_day': {
        const dateLabel = ctx.displayDate || '最終日';
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、本日（${dateLabel}）はいよいよ移籍市場の最終日・デッドラインデイです！ここからは10:00〜24:00まで1時間刻みで進行し、駆け込みオファーが飛び交います！`,
              `注意点として、相手と条件合意していても最終的な契約手続きを済ませないまま24:00を過ぎると無効になります。進行中の獲得・売却オファーを今すぐ最終確認しましょう！`
            ],
            calm: [
              `本日（${dateLabel}）をもって今ウィンドウの移籍市場が閉幕いたします。デッドラインデイは10:00から24:00まで1時間ごとの進行となります。`,
              `ウィンドウ閉幕と同時に、未締結の合意オファーや保留中の打診はすべて失効します。やり残しがないよう、進行中の交渉案件を事前に精査してください。`
            ],
            polite: [
              `GM、本日（${dateLabel}）をもって今ウィンドウの移籍市場が閉幕いたします。本日は10:00〜24:00まで1時間刻みで進行する特別な最終日でございます。`,
              `合意済みの獲得契約の締結漏れや、未回答の売却打診が残ったまま閉幕を迎えますと失効してしまいます。進行前に今一度、交渉案件をご確認くださいますようお願い申し上げます。`
            ]
          })
        };
      }

      case 'deadline_21h_warning': {
        const agreedN = Number(ctx.pendingAgreedCount || 0);
        const incomingN = Number(ctx.pendingIncomingCount || 0);
        const taskNote = (agreedN > 0 || incomingN > 0)
          ? `現在、締結待ちの合意案件が${agreedN}件、未回答の到着オファーが${incomingN}件残っています！`
          : `締結漏れやスカウトからの駆け込み獲得がないか、最後のチェックを済ませておきましょう！`;
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、21:00になりました！移籍市場の閉幕まで残りあと3時間です！ここからはラストスパートの駆け込み時間帯に入ります！`,
              `${taskNote} 24:00を過ぎると未締結案件はすべて白紙になりますのでご注意ください！`
            ],
            calm: [
              `時刻は21:00、移籍市場の閉幕まで残り3時間となりました。交渉テーブルの最終整理を行うべき時間帯です。`,
              `${taskNote} 期限の24:00を過ぎると進行中オファーはすべて失効します。`
            ],
            polite: [
              `GM、21:00を迎え、移籍市場の閉幕まで残すところあと3時間となりました。`,
              `${taskNote} 24:00の締切を迎えますと未完了の交渉は失効いたしますので、最終確認をお願いいたします。`
            ]
          })
        };
      }

      case 'deadline_closed': {
        const wLabel = ctx.windowLabel || '移籍市場';
        const inN = Number(ctx.signingsCount || 0);
        const outN = Number(ctx.departuresCount || 0);
        return {
          pages: pickByTone(sec, {
            active: [
              `24:00を迎えました！これをもって今期の${wLabel}が正式に閉幕です！（加入 ${inN}名 / 放出・退団 ${outN}名）`,
              `補強ウィンドウの戦いは終了です。ここからは現在のスカッドを信じてピッチの結果に全力を注ぎましょう！`
            ],
            calm: [
              `24:00をもって今期の${wLabel}が閉幕しました。今ウィンドウの動静は加入 ${inN}名・放出退団 ${outN}名で確定となります。`,
              `登録スカッドが固まりましたので、次の移籍市場までは現有戦力のコンディション管理と戦術運用に集中してまいります。`
            ],
            polite: [
              `24:00を迎え、今期の${wLabel}が無事閉幕いたしました。今期間の収支移動は加入 ${inN}名・放出退団 ${outN}名でございます。`,
              `このメンバーで今後の公式戦を戦い抜くこととなります。引き続きクラブ運営のほどよろしくお願いいたします。`
            ]
          })
        };
      }

      case 'incoming_offer': {
        const buyer = ctx.buyerClubName || '他クラブ';
        const playerText = ctx.playerText || '所属選手';
        const feeText = ctx.feeText || '';
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、${buyer} から当クラブの ${playerText} へ正式な買取オファー${feeText ? `（${feeText}）` : ''}が届きました！回答期限は5日間です。`,
              `売却に踏み切れば移籍予算とPSR収支が大きく改善します。逆に引き止める場合、選手が好条件を意識して要求週給が上がる可能性もあるので、代役の有無を踏まえて判断しましょう。`
            ],
            calm: [
              `${buyer} より、当クラブ所属の ${playerText} に対して正式な獲得打診${feeText ? `（${feeText}）` : ''}が入りました。回答期限は5日間です。`,
              `放出による資金確保は財務健全化と再投資に有効ですが、主力流出は戦力低下に直結します。また拒否時は選手の要求水準が上がる恐れがある点もご考慮ください。`
            ],
            polite: [
              `GM、${buyer} より当クラブの ${playerText} に対して正式な買取打診${feeText ? `（${feeText}）` : ''}が届いております。ご回答の期限は5日間でございます。`,
              `売却益はクラブ資金やPSR基準に大きな余裕をもたらしますが、拒否された場合は選手が残留見返りとして昇給を求めるケースもございます。チーム構想と照らし合わせてご判断くださいませ。`
            ]
          })
        };
      }

      case 'sponsor_deadline_soon': {
        const daysLeft = ctx.daysLeft || 7;
        const pendingCount = ctx.pendingCount || 1;
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、スポンサー契約の締切（${deadlineLabel}）まであと ${daysLeft}日 となりました！現在まだ ${pendingCount}枠 が未契約のまま残っています。`,
              `期限を過ぎると来季まで一切の新規スポンサー契約ができなくなり、貴重な年間収益を丸ごと逃してしまいます。今のうちにお早めに契約を締結しておきましょう！`
            ],
            calm: [
              `スポンサー契約の受付期限（${deadlineLabel}）まで残り ${daysLeft}日 です。未契約のスポンサー枠が ${pendingCount}件 残っています。`,
              `締切経過後はシーズン終了まで枠が凍結され、年間の安定収入を失う結果となります。安全圏の財政を維持するためにも早期締結を推奨します。`
            ],
            polite: [
              `GM、スポンサー契約の受付期限（${deadlineLabel}）まで残り ${daysLeft}日 と迫ってまいりました。現在、未契約の枠が ${pendingCount}枠 残っております。`,
              `期限を過ぎますと今シーズン中のご契約ができなくなり、年間収入に大きな影響が生じてしまいます。お早めにお手続きくださいますようお願い申し上げます。`
            ]
          })
        };
      }

      case 'commercial_setup_reminder': {
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、リーグ開幕が目前なのに、今季の「スタジアム・チケット・グッズ設定」がまだ未決定のままですよ！`,
              `本拠地スタジアムとチケット・グッズの条件を固めて確定すると毎試合の収支計画が定まります。確定後は今季終了まで変更できないので、収支を見ながら仕上げましょう！`
            ],
            calm: [
              `リーグ戦の開幕が近づいていますが、今シーズンの興行計画（スタジアム・チケット・グッズ設定）が未確定の状態です。`,
              `確定後の変更は来季まで不可となりますが、適切な座席価格と黒字グッズの組み合わせを決めておかないとホーム開催の収益効率が落ちます。お早めに最終確認をご検討ください。`
            ],
            polite: [
              `GM、まもなくリーグ戦が開幕いたしますが、今季の「スタジアム・チケット・グッズ設定」がまだ未確定となっております。`,
              `興行計画は一度ご確定いただくとシーズン終了まで変更できない仕組みでございます。現在のファン規模に合うスタジアムやチケット価格をお確かめのうえ、お早めにご確定くださいませ。`
            ]
          })
        };
      }

      case 'contract_expiry_warning': {
        const count = ctx.expiringCount || 2;
        const namesText = ctx.namesText || '主力選手';
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、注意報です！${namesText} など計 ${count}名 の契約残りが1年を切っています。`,
              `このまま更新しないと、1月以降は他クラブと移籍金£0での来季事前合意を許したり、シーズン末に無償退団されたりして大損になります。今のうちに契約延長の交渉を始めましょう！`
            ],
            calm: [
              `契約管理上の懸念事項です。${namesText} を含む ${count}名 の登録選手が契約最終年に入っています。`,
              `無償流出（£0）および冬ウィンドウ以降の他クラブとの事前合意を防ぐため、戦力として残す選手は早期の契約更新、構想外なら売却での資金回収をご判断ください。`
            ],
            polite: [
              `GM、契約期間に関する大切なご報告でございます。${namesText} を含む計 ${count}名 の契約残りが1年となっております。`,
              `更新を行わないままシーズン終盤を迎えますと、他クラブとの事前合意や移籍金なしの無償退団につながりかねません。お早めに契約更新交渉をお進めくださいませ。`
            ]
          })
        };
      }

      case 'psr_or_board_crisis': {
        const isPsr = Boolean(ctx.isPsrBreach);
        return {
          pages: pickByTone(sec, {
            active: [
              isPsr
                ? `GM、財務アラートです！3年累積収支がPSR規律の許容ラインを超えかけています。このままでは理事会の評価も下がりかねません。`
                : `GM、理事会からの評価が大きく低下し警戒ラインに入っています。早急に流れを立て直す必要があります！`,
              `まずは移籍市場での高給選手の売却やレンタル放出で週給総額を抑えつつ、監督と戦術・スタメンを見直して次の数試合で確実に勝ち点を拾いにいきましょう。`
            ],
            calm: [
              isPsr
                ? `財務監査上の警告です。3年累積収支がPSR許容枠に対して赤字超過域に入っており、早急な是正措置が求められています。`
                : `理事会評価に関する警戒通知です。現在の評価が厳しい水準にあり、このまま目標順位から乖離すると解任リスクが現実味を帯びます。`,
              `即効性のある対策は、週給負担の重い余剰戦力の放出と獲得凍結によるコスト圧縮、および主力コンディションを優先した戦術調整です。次節からの軌道修正を強く推奨します。`
            ],
            polite: [
              isPsr
                ? `GM、クラブ財務について重大なご報告がございます。3年間の累積収支がPSR財務規律の許容範囲を下回っており、立て直しが急務でございます。`
                : `GM、理事会からの評価が大きく低下し、厳しい視線が向けられております。ここからの立て直しが非常に重要でございます。`,
              `高給選手の放出による週給圧縮やグッズ・チケット収支の見直しに加え、監督との連携による勝ち点の積み上げをご検討くださいませ。`
            ]
          })
        };
      }

      case 'offseason_guide': {
        const rank = ctx.rank || 1;
        const divLabel = ctx.divLabel || 'ENG-D1';
        return {
          pages: pickByTone(sec, {
            active: [
              `1シーズンの長丁場、本当にお疲れさまでした！${divLabel} を ${rank}位 で完走しましたね。ここからは来季に向けたオフシーズン期間に入ります！`,
              `オフの間にすべきことは「契約満了選手の延長・整理」「U-21ユースからの有望株昇格」「夏の市場での狙い目補強」の3つです。準備が整ったら「次シーズンへ」進みましょう！`
            ],
            calm: [
              `今シーズンの公式戦がすべて終了し、最終順位 ${rank}位（${divLabel}）が確定しました。まずはここまでの指揮、お疲れさまでした。`,
              `オフシーズンは選手契約・世代交代・補強の最重要フェーズです。特に契約切れ間近の主力更新とユース有望株のトップ昇格を完了させた上で、次年度へ移行してください。`
            ],
            polite: [
              `今シーズンの全日程、誠にお疲れさまでございました。最終順位は ${divLabel} 第 ${rank}位 となり、これよりオフシーズンへと移行いたします。`,
              `オフ期間中は「契約残り1年選手の更新」「アカデミー有望株の昇格」「来季に向けた補強」をお進めいただけます。ご準備が整いましたら次シーズンへお進みくださいませ。`
            ]
          })
        };
      }

      case 'staff_required': {
        return {
          pages: pickByTone(sec, {
            active: ['日程を進めるには、まず監督とコーチ陣の選任が必要です！スタッフを迎えて現場の体制を固めましょう。'],
            calm: ['カレンダー進行の前に、監督およびコーチ陣の選任を完了させて指導体制を整える必要があります。'],
            polite: ['日程を進める前に、監督とコーチ陣の選任が必要でございます。まずは指導陣のお手続きをお進めくださいませ。']
          })
        };
      }

      case 'outgoing_offer_reply': {
        const hasAgreed = Boolean(ctx.hasAgreed);
        return {
          pages: pickByTone(sec, {
            active: [
              hasAgreed
                ? '送信していた獲得オファーに合意の返事が届きました！最終契約を結べば正式加入です！'
                : '獲得オファーに対して相手クラブからカウンター提案が届いています！届いた条件を見て再判断しましょう。'
            ],
            calm: [
              hasAgreed
                ? '獲得交渉中の選手について先方クラブとの合意が確認されました。合意内容をご確認のうえ最終締結の手続きを行ってください。'
                : '送信していた獲得オファーに対し相手クラブから対案が提示されました。予算と必要度を照らし合わせ、条件をご判断ください。'
            ],
            polite: [
              hasAgreed
                ? '送信していた獲得オファーに合意のお返事が届いております。最終契約の締結をお願いいたします。'
                : '送信していた獲得オファーに対する相手クラブからの回答が届いております。提示条件のご確認と再判断をお願いいたします。'
            ]
          })
        };
      }

      case 'manager_hired': {
        const mgrName = ctx.mgrName || '新監督';
        const formation = ctx.formation || '4-3-3';
        const tacticLabel = ctx.tacticLabel || 'バランス';
        const wishPos = ctx.wishPos || 'スカッド全体の調整';
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、${mgrName}監督との契約が完了しました！チームの初期布陣も監督が得意な「${formation} / ${tacticLabel}」に合わせて整えましたよ。`,
              `さっそく新監督から「${wishPos}」を強化したいと要望書が届いていますよ。推薦選手リストも確認して市場で動いてみましょう！`
            ],
            calm: [
              `${mgrName}監督の招聘が完了しました。チームの基準戦術と基本陣形は監督が得意とする「${formation} / ${tacticLabel}」の方針へ切り替わっています。`,
              `就任に伴い、新監督からは「${wishPos}」の補強要望が提出されています。予算枠と現有スカッドを見比べて優先度をご判断ください。`
            ],
            polite: [
              `GM、${mgrName}監督（得意: ${formation} / ${tacticLabel}）との契約が完了いたしました。チームの戦術方針も新監督のやり方に沿う形へ切り替え済みでございます。`,
              `新体制の初動として、監督より「${wishPos}」の補強要望を受け取っております。推薦候補をご確認のうえご検討くださいませ。`
            ]
          })
        };
      }

      case 'signing_manager_thanks': {
        const pName = ctx.playerName || '新戦力';
        const mgrName = ctx.mgrName || '監督';
        const isRec = Boolean(ctx.isRecommended);
        const pos = ctx.matchedPos || '';
        return {
          pages: pickByTone(sec, {
            active: [
              `GM、${pName}選手の獲得お疲れさまです！${mgrName}監督も「${isRec ? 'リクエスト通りの理想的な補強だ' : `${pos}の層が一気に厚くなった`}」と大喜びですよ！`
            ],
            calm: [
              `GM、${pName}選手の加入手続きご苦労さまでした。${mgrName}監督からも「${isRec ? '狙い通りの実力者を確保できた' : `${pos}の懸念が大きく緩和された`}」との評価が届いています。`
            ],
            polite: [
              `GM、${pName}選手のご獲得お疲れさまでございました。${mgrName}監督から「${isRec ? '推薦した狙い通りの戦力だ' : `${pos}の厚みが大きく改善した`}」と感謝のメッセージが届いております。`
            ]
          })
        };
      }

      case 'monthly_meeting': {
        const year = ctx.year || 2026;
        const month = ctx.month || 7;
        const conf = typeof ctx.boardConfidence === 'number' ? ctx.boardConfidence : 75;
        const isPsr = Boolean(ctx.isPsrBreach);
        const net = Number(ctx.netBalance || 0);
        const onTarget = Boolean(ctx.onTarget);
        let p2Polite = '現行の経営・編成ともに安定しております。次月も目標順位の維持へ向けて着実に進めてまいりましょう。';
        let p2Active = 'チームの流れは悪くありません！この調子を維持しつつ、来月の日程と選手コンディションを見極めていきましょう！';
        let p2Calm = '現行の数値は許容範囲内に収まっています。次月も収支バランスと選手疲労の管理を継続してください。';

        if (isPsr || net < -5000) {
          p2Polite = 'なお、今月は収支面でやや支出が先行しております。PSR基準を守るためにも給与や移籍収支のバランスにご留意くださいませ。';
          p2Active = 'ひとつ気になるのが収支の赤字幅です。来月は大型支出を少し抑えて財政ペースも整えていきたいですね！';
          p2Calm = '財務指標に赤字拡大傾向が見られます。次月は週給負担や補強支出の抑制を意識することを推奨します。';
        } else if (conf < 45) {
          p2Polite = 'ただいま理事会からの評価が低下傾向にございます。次月は戦術や起用の見直しを含め、早急に勝ち点を重ねることが最優先でございます。';
          p2Active = '少し理事会の目が厳しくなっています…！次の数試合で一気に流れを変えて、信頼を取り戻しましょう！';
          p2Calm = '理事会からの評価が厳しい水準です。結果が直結する時期ですので、ベストメンバーの維持と戦術適性の再点検を勧めます。';
        } else if (onTarget) {
          p2Polite = 'リーグ順位も目標圏内をしっかりと維持しており、理事会からも高い信頼を得られております。';
          p2Active = '目標圏内をバッチリキープできていて最高ですね！次月も自信を持って主導権を握っていきましょう！';
          p2Calm = '順位推移・財務規律ともに計画通りです。現在の軌道から外れぬよう、疲労管理を徹底してください。';
        }

        return {
          pages: pickByTone(sec, {
            active: [
              `GM、${month}月度の月次定例経営会議のお時間です！今月の戦績と収支決算、理事会評価をまとめてきました。`,
              p2Active
            ],
            calm: [
              `GM、${year}年${month}月度の定例経営会議を開始します。今月の戦績実績、収支決算、ならびに理事会評価をご確認ください。`,
              p2Calm
            ],
            polite: [
              `GM、${year}年${month}月度の月次定例経営会議のお時間でございます。今月の戦績ならびに財務決算の詳細をご報告申し上げます。`,
              p2Polite
            ]
          })
        };
      }

      case 'special_match_eve': {
        const matchLabel = ctx.matchLabel || '注目の一戦';
        const oppName = ctx.oppName || '強敵';
        const isHome = Boolean(ctx.isHome);
        const dateLabel = ctx.displayDate || '明日';
        const isDerby = Boolean(ctx.isDerby);
        const bonusLabel = ctx.fanBonusLabel || '大きな支持拡大とクラブ評価の上昇';
        const venueNote = isHome
          ? '本拠地での開催となり、サポーターの大動員による興行収入と士気の上昇が期待できます。'
          : '敵地でのアウェイ戦となりますが、勝利すればファンの熱気とクラブの評価が一気に高まります。';

        return {
          pages: pickByTone(sec, {
            active: [
              `GM、明日（${dateLabel}）はいよいよ「${matchLabel}」（vs ${oppName}）です！街中やSNSでもすでに話題沸騰ですよ！`,
              `${venueNote} ${isDerby ? '伝統のダービー勝利は' : '大一番での勝利は'}${bonusLabel}に直結します。スタメンと戦術を万全に整えて迎え撃ちましょう！`
            ],
            calm: [
              `明日（${dateLabel}）は注目カード「${matchLabel}」（vs ${oppName}）が控えています。通常の公式戦以上にクラブの威信とファンの関心が集まる一戦です。`,
              `${venueNote} 勝てば${bonusLabel}が見込める一方、疲労管理と戦術の噛み合わせが鍵を握ります。事前編成をご確認ください。`
            ],
            polite: [
              `GM、明日（${dateLabel}）はいよいよ「${matchLabel}」（vs ${oppName}）でございます。ファンやメディアの注目も一段と高まっております。`,
              `${venueNote} 勝利いたしますと${bonusLabel}につながりますので、試合前に先発や戦術をご確認のうえ大一番へ臨みましょう。`
            ]
          })
        };
      }

      case 'match_report': {
        const comp = ctx.compLabel || '公式戦';
        const opp = ctx.oppName || '対戦相手';
        const myScore = Number(ctx.myScore || 0);
        const oppScore = Number(ctx.oppScore || 0);
        const res = ctx.resultLabel || '終了';
        const won = Boolean(ctx.won);
        const draw = Boolean(ctx.draw);
        const diff = myScore - oppScore;
        const isFinal = Boolean(ctx.isFinal);

        let speechText = '';
        if (won && isFinal) {
          speechText = pickByTone(sec, {
            active: `GM、やりましたね！！${comp} で ${opp} を ${myScore}-${oppScore} で破り、見事タイトル獲得です！今試合の収支も最高ですよ！`,
            calm: `GM、${comp} 優勝おめでとうございます。${opp} に ${myScore}-${oppScore} で勝利し、最高の結果を手にしました。収支明細と次期日程をご確認ください。`,
            polite: `GM、${comp} での優勝、誠におめでとうございます！${opp} に ${myScore}-${oppScore} で見事勝利いたしました。試合の収支と今後の予定をご報告申し上げます。`
          });
        } else if (won && diff >= 3) {
          speechText = pickByTone(sec, {
            active: `GM、${comp} で ${opp} に ${myScore}-${oppScore} の圧勝です！攻撃陣が完全に噛み合いましたね。収支と次戦予定もまとめました！`,
            calm: `GM、${comp} の ${opp} 戦は ${myScore}-${oppScore} と点差をつけての快勝でした。勢いを維持しつつ、今試合の収支と次戦スケジュールをご確認ください。`,
            polite: `GM、${comp}・${opp} 戦は ${myScore}-${oppScore} の見事な快勝でございました。今試合の収支明細ならびに次戦の予定をご報告いたします。`
          });
        } else if (won) {
          speechText = pickByTone(sec, {
            active: `GM、${comp} 勝利おめでとうございます！${opp} 戦（${myScore}-${oppScore}）、しっかり勝ち切りましね！試合収支と次戦予定です。`,
            calm: `GM、${comp} の ${opp} 戦（${myScore}-${oppScore} / ${res}）にて勝ち点と結果を確保しました。収支と次戦予定をご確認ください。`,
            polite: `GM、${comp}・${opp} 戦（${myScore}-${oppScore} / ${res}）お疲れさまでございました。今試合の収支と次戦スケジュールをご報告いたします。`
          });
        } else if (draw) {
          speechText = pickByTone(sec, {
            active: `GM、${comp} の ${opp} 戦は ${myScore}-${oppScore} のドローでした。接戦を粘りましたね！今回の収支と次回日程をまとめました。`,
            calm: `GM、${comp}（${myScore}-${oppScore} / ${res}）の集計結果です。勝ち点を分け合う形となりましたが、収支と次戦予定を確認して次に備えましょう。`,
            polite: `GM、${comp} の結果（${myScore}-${oppScore} / ${res}）および今試合の収支と次戦スケジュールをご報告いたします。`
          });
        } else {
          speechText = pickByTone(sec, {
            active: `GM、${comp} の ${opp} 戦（${myScore}-${oppScore}）は悔しい結果になりましたね…。切り替えが大事です！収支と次戦日程を確認しましょう。`,
            calm: `GM、${comp}・${opp} 戦（${myScore}-${oppScore} / ${res}）は厳しい結果となりました。課題と疲労を見直し、次節での修正を図りましょう。`,
            polite: `GM、${comp}、${opp} 戦（${myScore}-${oppScore}・${res}）お疲れさまでございました。悔しい結果ではございますが、今回の収支と次回試合予定をご報告申し上げます。`
          });
        }
        return { pages: [speechText] };
      }

      default:
        return { pages: [ctx.fallbackSpeech || ''] };
    }
  }

  function getOfficeBriefingAdvice(ctx = {}, sec = null) {
    if (ctx.staffMissing) {
      return pickByTone(sec, {
        active: 'まずは監督とコーチ陣の選任からスタートしましょう！',
        calm: '日程進行前に、監督・コーチ陣の選任を完了させてください。',
        polite: 'まずは監督・コーチ陣の選任をお進めくださいませ。'
      });
    }
    if (ctx.isDeadlineDay) {
      return pickByTone(sec, {
        active: '今日は移籍最終日です！合意済み契約の締結漏れにご注意を！',
        calm: '移籍市場最終日です。未処理オファーは本日24時に失効します。',
        polite: '本日は移籍最終日でございます。オファーの最終確認をお願いいたします。'
      });
    }
    if (ctx.pendingCommercialSetup) {
      return pickByTone(sec, {
        active: 'スタジアム・チケット・グッズの興行計画を確定させて収益を固めましょう！',
        calm: '興行計画が未確定です。お早めに今季設定を確定してください。',
        polite: '今季のスタジアム・興行計画のご確定をお待ちしております。'
      });
    }
    if (ctx.hasPendingSponsors && typeof ctx.sponsorDaysLeft === 'number' && ctx.sponsorDaysLeft <= 14) {
      return pickByTone(sec, {
        active: `スポンサー契約の締切まで残り${ctx.sponsorDaysLeft}日です！今のうちに締結しましょう！`,
        calm: `スポンサー受付終了まで残り${ctx.sponsorDaysLeft}日。未契約枠の確保を推奨します。`,
        polite: `スポンサー契約の期限まで残り${ctx.sponsorDaysLeft}日でございます。お早めにご確認ください。`
      });
    }
    if (ctx.isMatchDay) {
      return pickByTone(sec, {
        active: `本日は ${ctx.matchLabel || '試合当日'} です！スタメンと戦術の最終チェックをお願いします！`,
        calm: `本日は試合当日です。出場メンバーと疲労状態を確認の上、キックオフへ。`,
        polite: `本日は試合日でございます。先発編成をご確認のうえ試合へお進みください。`
      });
    }
    if (ctx.isPsrBreach || (typeof ctx.boardConfidence === 'number' && ctx.boardConfidence < 50)) {
      return pickByTone(sec, {
        active: '財務・理事会評価が警戒ラインです。収支と起用を見直して立て直しましょう！',
        calm: '財政状況または理事会評価が厳しい状況です。週給圧縮と勝ち点確保を優先してください。',
        polite: '財務規律と理事会評価に警戒が出ております。収支と戦術の調整をご検討ください。'
      });
    }
    if ((ctx.urgentExpiringCount || 0) > 0) {
      return pickByTone(sec, {
        active: `契約残り1年の選手が${ctx.urgentExpiringCount}名います！流出前に更新交渉を！`,
        calm: `契約最終年の選手が${ctx.urgentExpiringCount}名在籍。更新か売却かをご判断ください。`,
        polite: `契約満了が近い選手が${ctx.urgentExpiringCount}名おります。早めの更新をご検討ください。`
      });
    }
    if (ctx.isWindowOpen && (ctx.openOfferCount || 0) > 0) {
      return pickByTone(sec, {
        active: `進行中の移籍オファーが${ctx.openOfferCount}件あります！条件を確認しましょう！`,
        calm: `移籍市場で${ctx.openOfferCount}件の交渉が動いています。届いた条件をご確認ください。`,
        polite: `現在${ctx.openOfferCount}件の移籍交渉が進行中でございます。ご確認をお願いいたします。`
      });
    }
    if ((ctx.winStreak || 0) >= 3) {
      return pickByTone(sec, {
        active: `${ctx.winStreak}連勝中で絶好調ですね！このまま連勝記録を伸ばしましょう！`,
        calm: `${ctx.winStreak}連勝と好調を維持。疲労蓄積だけ注視しつつ継続を推奨します。`,
        polite: `${ctx.winStreak}連勝と素晴らしい勢いでございます。この流れを大切にしてまいりましょう。`
      });
    }
    if ((ctx.lossStreak || 0) >= 2) {
      return pickByTone(sec, {
        active: `直近は少し苦しい流れですが、戦術や先発の入れ替えで必ず立て直せます！`,
        calm: `連敗を止めるため、相手に応じた戦術切替と疲労選手の休養をご検討ください。`,
        polite: `厳しい結果が続いておりますが、編成と戦術の調整で巻き返しを図りましょう。`
      });
    }
    if (ctx.isSeasonOver) {
      return pickByTone(sec, {
        active: 'オフシーズン中です！契約更新やユース昇格を済ませて来季へ備えましょう！',
        calm: 'オフシーズン期間です。世代交代と市場補強を整理した上で次季へ移行してください。',
        polite: 'オフシーズン期間でございます。契約更新や来季補強をお進めくださいませ。'
      });
    }
    return pickByTone(sec, {
      active: '各業務を確認しながら、次の試合に向けて準備を進めていきましょう！',
      calm: '直近のスケジュールと選手コンディションを確認し、次節へ備えてください。',
      polite: '本日のクラブ業務と次回日程をご確認のうえ、順次お進めくださいませ。'
    });
  }

  return {
    getTone,
    getEventDialogue,
    getOfficeBriefingAdvice
  };
})();
