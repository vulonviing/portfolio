export const languages = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const translations = {
  tr: {
    nav: {
      logo: 'Asla Vazgeçme',
      links: {
        melody: 'Maç Akışı',
        time: 'Zaman & Momentum',
        projection: 'Vazgeçme Eşiği',
        voices: 'Konuşanlar',
        brain: 'Terim Haritası',
      },
      meta: 'Powered by React + Vite',
      back: 'Portfolyoya Dön',
    },
    hero: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      titleA: 'Kaybedenlere',
      titleAEm: 'asla kızmam',
      titleB: 'ama',
      titleBU: 'vazgeçip',
      titleBRest: 'yenilgiyi kabul edenleri',
      titleC: 'siler atarım.',
      lede: [
        'Bu interaktif deneyim, bir maçın akışında',
        'kaybetmek',
        'ile',
        'vazgeçmek',
        'arasındaki farkı görselleştiriyor. Skor değil, zihinsel eşik belirleyici.',
      ],
      cta: 'Maç akışına gir',
      hint: 'Kaydır — deneyim başlıyor',
    },
    melody: {
      eyebrow: '01 — Maç Akışı',
      title: 'Tezahürat, tempo ve momentum',
      lede:
        'Bir maç, skor tablosunda değil tribünün nefesinde gezinir. Aşağıdaki grafik, 90 dakika boyunca tempo ve momentumun nasıl nefes aldığını üç farklı senaryoda gösteriyor.',
      scenarios: {
        comeback: 'Geriden Gel',
        collapse: 'Pes Et',
        grind: 'Direnç',
      },
      winLabel: 'Kazandın',
      winProgress: 'Dayanıyorsun…',
    },
    time: {
      eyebrow: '02 — Zaman & Momentum',
      title: 'Aynı söz, üç farklı dakikada',
      lede:
        'Zaman her anda aynı konuşmaz. İlk yarıda sabır, devre arasında karar, son 10 dakikada cüret ister. Bir kipe bastığında, aynı cümlenin farklı yüzünü göreceksin.',
      moodLabel: 'Ruh hali',
      minute: 'dk',
    },
    projection: {
      eyebrow: '03 — Vazgeçme Eşiği',
      title: 'Kaybetmek bir skor; vazgeçmek bir karar.',
      lede: [
        'Kaydırıcıyı bir ana getir, sonra iki kararı karşılaştır. Skor çizgisi değişmeyebilir — ama',
        'Ruh',
        'çizgisi, kararına göre yukarı ya da aşağı gider. Gerçek yenilgi, ruhun ekrandan çıktığı andır.',
      ],
      sliderLabel: 'Karar anı',
      quit: { title: 'Vazgeç', sub: 'Skor kabul edildi, zihin kapandı' },
      fight: { title: 'Devam et', sub: 'Skor açık, ruh hâlâ sahada' },
      decision: 'KARAR',
      chartAria: 'Skor ve Ruh projeksiyonu',
      legend: { spirit: 'Ruh (Spirit)', score: 'Skor (Score)' },
      stats: {
        score: 'Skor',
        spirit: 'Ruh',
        scoreNote: 'Skor bazen değişmez. Gerçek yenilgi burada ölçülmez.',
        spiritNote: 'Kararın sahaya bıraktığı iz.',
      },
    },
    voices: {
      eyebrow: '04 — Kenar Çizgisinden',
      title: 'Konuşanlar',
      lede:
        'Sahaya çıkmayan herkesin bir sözü vardır. Ekrana dokun — etrafını saran sesler birer birer konuşsun. Son sözü kimin söyleyeceğine bakalım.',
      hint: 'Başlamak için dokun.',
      button: {
        start: 'Bir ses çağır',
        more: 'Bir ses daha',
      },
      reset: 'Baştan',
      doubters: [
        'Sen mi yapacaksın?',
        'Bu işi sen kaldıramazsın.',
        'Sende bu yetenek yok.',
        'Bu takımla buraya kadar.',
        'Rakibe bak, şansın yok.',
        'Bitti, kabul et artık.',
        'Tribün bile sana dönecek.',
        'Bu hoca, bu kadroyla mı?',
        'Devri kapandı diyorlar.',
        'Olmayacak, boşuna uğraşma.',
      ],
      terimQuote: {
        part1: 'Bana dediler ki hoca,',
        dark: 'ne çok düşmanın varmış.',
        part2: 'Ben de dedim ki kendilerine:',
        gold: 'benim düşmanım yok.',
        red: 'Başarının düşmanı var.',
      },
    },
    brain: {
      eyebrow: '05 — Terim Haritası',
      title: 'Vazgeçmemenin sinirsel bölgeleri',
      lede:
        'Vazgeçmek yalnızca taktik değil, sinirsel bir network’ün kapanmasıdır. Bu harita, kenar çizgisindeki bir zihnin hangi bölgelerde yandığını bir metafor olarak görselleştiriyor.',
      mapAria: 'Terim Haritası',
      center: 'TERİM',
      footer: 'Vazgeçmek yalnızca taktik değil, bir network’ün kapanmasıdır.',
    },
    footer: {
      title: 'The Interactive Phenomenology of Winning',
      text:
        'Mücadele anlayışı etrafında, zaman, momentum ve vazgeçmeme üzerine interaktif bir deneyim.',
      tagline: 'Kaybetmek mümkündür. Vazgeçmek zorunlu değildir.',
    },
    intro: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      title: 'Full deneyim için sesi aç',
      text:
        'Bu site, maçın akışına göre değişen prosedürel bir ses katmanı barındırıyor. Senaryoyu ve kararı değiştirdikçe tempo, akor ve filtre gerçek zamanlı tepki veriyor. Seste klasik bir şarkı yok — lisanssız, kod tarafından üretiliyor.',
      languageLabel: 'Dil',
      primary: 'Sesli gir',
      primaryBusy: 'Hazırlanıyor…',
      secondary: 'Sessiz devam',
      hint: 'Kararın geri dönüşsüz değil — sağ alttaki düğmeden istediğin an aç / kapat.',
    },
    audio: {
      turnOff: 'Müziği kapat',
      turnOn: 'Müziği aç',
      turnOnTitle: 'Sesi aç — maç ritmine göre değişir',
      starting: 'Hazırlanıyor',
      on: 'Ses açık',
      off: 'Sesi aç',
    },
    scenarios: {
      comeback: {
        name: '0-2 geriden gelme',
        description:
          'Skor aleyhte; fakat 60. dakikadan sonra tempo hızla yükseliyor, tezahüratlar ritmi değiştiriyor.',
        verdicts: {
          loss: {
            label: 'Kayıp yolu',
            line: 'Denedin ama kaybettin.',
            quote: 'Büyük devrimler gürültüyle gelmez, süreklilikle gelir.',
          },
          win: {
            label: 'Kazanma yolu',
            line: 'Denedin ve kazandın.',
            quote: 'Biz bitti demeden bitmez.',
          },
        },
      },
      collapse: {
        name: 'Pes etme anı',
        description:
          'Önde başlanan maçta 70. dakikadan sonra tempo düşüyor, enerji tribünden sahaya sönüyor.',
        verdicts: {
          terminal: {
            label: 'Hüküm',
            line: 'Pes ettin, kaybettin.',
            quote:
              'Eğer bazı şeylerden korkacaklarsa, yaşamak cesurların hakkıdır.',
          },
        },
      },
      grind: {
        name: 'Sonuna kadar savaşmak',
        description:
          'Maçın her dakikasında aynı yoğunluk; skor ne olursa olsun, son düdüğe kadar koşulur.',
        verdicts: {
          loss: {
            label: 'Hüküm',
            line: 'Direndin ama kaybettin.',
            quote:
              'Ama netice ne olursa olsun, siz benim gönlümde hep kazandınız, hep şampiyonsunuz ve öyle kalacaksınız.',
          },
        },
      },
    },
    phases: {
      firstHalf: {
        label: 'İlk Yarı',
        minute: '0’ – 45’',
        headline: 'Zamanı oku. Oyunu kur.',
        body:
          'Skor aleyhte olabilir ama vakit var. Şu an yapılacak iş hesaplaşmak değil; tempo okumak, plan güncellemek, baskıyı dağıtmak.',
        quote:
          'Daha top yuvarlanıyor. Maçı şimdi bitirmek isteyen, şimdi kaybeder.',
        mood: 'Sabır',
      },
      halftime: {
        label: 'Devre Arası',
        minute: '45’ – 46’',
        headline: 'Yenilgiyi değil, planı değiştir.',
        body:
          'Soyunma odası, 15 dakikanın en uzun evidir. Burada skor değil karar değişir. Yenilgiyi kabul eden kapıdan çıktığı an çıktığı kişidir; kalan oyuncular aynı takım değildir.',
        quote:
          'Kaybedenlere asla kızmam. Ama vazgeçip yenilgiyi kabul edenleri silerim.',
        mood: 'Karar',
      },
      finalTen: {
        label: 'Son 10 Dakika',
        minute: '80’ – 90’+',
        headline: 'Ya şimdi, ya asla.',
        body:
          'Zaman baskıyı ikiye katlar. Riski artırmak, bir stoperi öne sürmek, üçüncü forveti sahaya bırakmak — bunların hepsi bir karar değil; vazgeçmeme refleksidir.',
        quote:
          'Son düdüğe kadar maç bitmez. Zihnen bittiğinde maç çoktan kaybedilmiştir.',
        mood: 'Cüret',
      },
    },
    regions: {
      risk: {
        label: 'Risk Alma',
        description:
          'Maçın son dakikalarında ekstra forvet sokma kararı. Vazgeçmeyen zihnin en görünür yansıması; güvenli değil, gerekli olanı seçmek.',
      },
      motivation: {
        label: 'Motivasyon',
        description:
          'Soyunma odası konuşması, saha içi kol hareketi, kapının önünde beklenen bir bakış. Motivasyon bir taktik değil, bir enerji transferidir.',
      },
      strategy: {
        label: 'Strateji',
        description:
          'Sakin zekâ. Rakibin formasyonu, kendi oyuncunun yorgunluğu, kalan dakika — hepsi aynı anda tartılır. Panik değil, planlama.',
      },
      outburst: {
        label: 'Duygusal Patlama',
        description:
          'Kenarda yükselen ses, dördüncü hakeme dönülen bakış. Kontrolsüz değildir — takıma hâlâ bu maçın kazanılabilir olduğunu hatırlatır.',
      },
      calm: {
        label: 'Sükûnet',
        description:
          'En yüksek baskı anında donup kalabilmek. Zihnin kendi kendini yönettiği an. Vazgeçmeme, bazen bağırmak değil bir iç hat tutmaktır.',
      },
      memory: {
        label: 'Hafıza',
        description:
          'Dakika 89’da takımın geçmiş comeback’leri sahaya çağrılır. Yaşanmış bir zafer, bilinmeyen bir geleceğe cesaret verir.',
      },
    },
    phaseMoods: {
      firstHalf: 'Sabır',
      halftime: 'Karar',
      finalTen: 'Cüret',
    },
  },

  en: {
    nav: {
      logo: 'Never Surrender',
      links: {
        melody: 'Match Flow',
        time: 'Time & Momentum',
        projection: 'Surrender Threshold',
        voices: 'The Speakers',
        brain: 'Terim Map',
      },
      meta: 'Powered by React + Vite',
      back: 'Back to Portfolio',
    },
    hero: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      titleA: 'I never get angry',
      titleAEm: 'at losers',
      titleB: 'but those who',
      titleBU: 'give up',
      titleBRest: 'and accept defeat',
      titleC: 'I wipe away.',
      lede: [
        'This interactive experience visualizes the difference between',
        'losing',
        'and',
        'giving up',
        'inside the flow of a match. Not the score — the mental threshold — is what decides.',
      ],
      cta: 'Enter the match flow',
      hint: 'Scroll — the experience begins',
    },
    melody: {
      eyebrow: '01 — Match Flow',
      title: 'Chants, tempo and momentum',
      lede:
        "A match doesn't live on the scoreboard; it lives in the breath of the stands. The graph below shows how tempo and momentum breathe across 90 minutes in three scenarios.",
      scenarios: {
        comeback: 'Come Back',
        collapse: 'Give Up',
        grind: 'Endure',
      },
      winLabel: 'You won',
      winProgress: 'Holding on…',
    },
    time: {
      eyebrow: '02 — Time & Momentum',
      title: 'Same words, three different minutes',
      lede:
        "Time doesn't speak the same way in every moment. The first half asks for patience, the break for a decision, the final ten for daring. Tap a mode and you'll see the same sentence wear a different face.",
      moodLabel: 'Mood',
      minute: 'min',
    },
    projection: {
      eyebrow: '03 — Surrender Threshold',
      title: 'Losing is a score; giving up is a decision.',
      lede: [
        'Drag the slider to a moment, then compare the two choices. The score line may not change — but the',
        'Spirit',
        "line rises or falls with your decision. The real defeat is the moment the spirit leaves the pitch.",
      ],
      sliderLabel: 'Decision minute',
      quit: { title: 'Give up', sub: 'Score accepted, mind closed' },
      fight: { title: 'Keep going', sub: 'Score open, spirit still on the pitch' },
      decision: 'DECISION',
      chartAria: 'Score and spirit projection',
      legend: { spirit: 'Spirit', score: 'Score' },
      stats: {
        score: 'Score',
        spirit: 'Spirit',
        scoreNote: "Sometimes the score doesn't change. Real defeat isn't measured here.",
        spiritNote: 'The trace your decision leaves on the pitch.',
      },
    },
    voices: {
      eyebrow: '04 — From the Sideline',
      title: 'The Speakers',
      lede:
        "Everyone who isn't on the pitch has a word to say. Tap the screen — let the voices around you speak one by one. Let's see who gets the last word.",
      hint: 'Tap to begin.',
      button: {
        start: 'Summon a voice',
        more: 'One more voice',
      },
      reset: 'Restart',
      doubters: [
        'You? Really?',
        "You can't handle this.",
        "You don't have what it takes.",
        'This team can only go so far.',
        'Look at the opponent — you have no chance.',
        "It's over, just accept it.",
        'Even the stands will turn on you.',
        'This coach, with this squad?',
        'His era is done, they say.',
        "It won't happen. Don't bother.",
      ],
      terimQuote: {
        part1: 'They told me, "Coach,',
        dark: 'you have so many enemies."',
        part2: 'And I told them:',
        gold: 'I have no enemies.',
        red: 'Success has enemies.',
      },
    },
    brain: {
      eyebrow: '05 — Terim Map',
      title: 'The neural regions of not giving up',
      lede:
        "Giving up isn't only tactical — it's the shutdown of a neural network. This map, as a metaphor, shows which regions light up in a mind standing on the sideline.",
      mapAria: 'Terim map',
      center: 'TERİM',
      footer: "Giving up isn't only tactical — it's a network going dark.",
    },
    footer: {
      title: 'The Interactive Phenomenology of Winning',
      text:
        'An interactive experience built around a philosophy of struggle — about time, momentum, and refusing to surrender.',
      tagline: 'Losing is possible. Surrendering is not required.',
    },
    intro: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      title: 'Turn on the sound for the full experience',
      text:
        "This site carries a procedural audio layer that shifts with the flow of the match. As you change the scenario and the decision, tempo, chords and filters respond in real time. There's no licensed song — it's generated by code, free of copyright.",
      languageLabel: 'Language',
      primary: 'Enter with sound',
      primaryBusy: 'Preparing…',
      secondary: 'Continue in silence',
      hint: 'Your choice is reversible — toggle it anytime from the bottom-right button.',
    },
    audio: {
      turnOff: 'Turn off music',
      turnOn: 'Turn on music',
      turnOnTitle: 'Turn on sound — shifts with the match',
      starting: 'Preparing',
      on: 'Sound on',
      off: 'Turn on sound',
    },
    scenarios: {
      comeback: {
        name: 'Coming back from 0-2',
        description:
          'The score is against you; but after the 60th minute the tempo rises fast, and the chants change the rhythm.',
        verdicts: {
          loss: {
            label: 'The losing path',
            line: 'You tried but you lost.',
            quote: "Great revolutions don't come with noise — they come with persistence.",
          },
          win: {
            label: 'The winning path',
            line: 'You tried and you won.',
            quote: "It isn't over until we say it's over.",
          },
        },
      },
      collapse: {
        name: 'The moment of surrender',
        description:
          'In a match you led, after the 70th minute the tempo drops, and the energy fades from the stands to the pitch.',
        verdicts: {
          terminal: {
            label: 'Verdict',
            line: 'You gave up, you lost.',
            quote:
              'If they will be afraid of some things — living is a right reserved for the brave.',
          },
        },
      },
      grind: {
        name: 'Fighting until the end',
        description:
          'The same intensity every minute; whatever the score is, you run until the final whistle.',
        verdicts: {
          loss: {
            label: 'Verdict',
            line: 'You resisted but you lost.',
            quote:
              'But whatever the result, in my heart you have always won, you are always champions, and you always will be.',
          },
        },
      },
    },
    phases: {
      firstHalf: {
        label: 'First Half',
        minute: "0' – 45'",
        headline: 'Read the time. Build the game.',
        body:
          "The score may be against you, but there's time. The job now isn't to settle scores; it's to read the tempo, update the plan, break the pressure.",
        quote:
          'The ball is still rolling. Whoever wants to end the match now will lose it now.',
        mood: 'Patience',
      },
      halftime: {
        label: 'Halftime',
        minute: "45' – 46'",
        headline: "Don't change the defeat — change the plan.",
        body:
          "The locker room is the longest fifteen minutes of a match. Here, the score doesn't change — the decision does. Whoever accepts defeat leaves through that door as someone else; the players who stay are no longer the same team.",
        quote:
          "I never get angry at losers. But those who give up and accept defeat — I wipe them away.",
        mood: 'Decision',
      },
      finalTen: {
        label: 'Final 10 Minutes',
        minute: "80' – 90'+",
        headline: 'Now or never.',
        body:
          'Time doubles the pressure. Taking risk, pushing a center-back forward, sending a third striker on — none of these are just decisions; they are the reflex of not surrendering.',
        quote:
          "The match doesn't end until the final whistle. By the time it ends in your mind, it's already lost.",
        mood: 'Daring',
      },
    },
    regions: {
      risk: {
        label: 'Risk Taking',
        description:
          "Sending an extra striker on in the final minutes. The most visible reflection of a mind that doesn't surrender; choosing what's necessary, not what's safe.",
      },
      motivation: {
        label: 'Motivation',
        description:
          'The locker-room talk, the arm gesture on the touchline, the look held a moment too long at the door. Motivation isn\'t a tactic — it\'s an energy transfer.',
      },
      strategy: {
        label: 'Strategy',
        description:
          "Calm intelligence. The opponent's formation, your own player's fatigue, the minutes left — all weighed at once. Not panic, but planning.",
      },
      outburst: {
        label: 'Emotional Outburst',
        description:
          "A voice rising on the sideline, a look turned toward the fourth official. It isn't uncontrolled — it reminds the team this match can still be won.",
      },
      calm: {
        label: 'Stillness',
        description:
          "The ability to stand frozen under the highest pressure. The moment the mind steers itself. Not giving up is sometimes not shouting — it's holding an inner line.",
      },
      memory: {
        label: 'Memory',
        description:
          "At minute 89, the team's past comebacks are summoned onto the pitch. A victory already lived gives courage for a future still unknown.",
      },
    },
    phaseMoods: {
      firstHalf: 'Patience',
      halftime: 'Decision',
      finalTen: 'Daring',
    },
  },

  de: {
    nav: {
      logo: 'Niemals Aufgeben',
      links: {
        melody: 'Spielverlauf',
        time: 'Zeit & Momentum',
        projection: 'Aufgabeschwelle',
        voices: 'Die Stimmen',
        brain: 'Terim-Karte',
      },
      meta: 'Powered by React + Vite',
      back: 'Zum Portfolio',
    },
    hero: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      titleA: 'Verlierern bin ich',
      titleAEm: 'niemals böse',
      titleB: 'doch wer',
      titleBU: 'aufgibt',
      titleBRest: 'und die Niederlage annimmt,',
      titleC: 'den streiche ich.',
      lede: [
        'Dieses interaktive Erlebnis zeigt den Unterschied zwischen',
        'Verlieren',
        'und',
        'Aufgeben',
        'im Fluss eines Spiels. Nicht das Ergebnis entscheidet — sondern die mentale Schwelle.',
      ],
      cta: 'In den Spielverlauf eintauchen',
      hint: 'Scrolle — das Erlebnis beginnt',
    },
    melody: {
      eyebrow: '01 — Spielverlauf',
      title: 'Gesänge, Tempo und Momentum',
      lede:
        'Ein Spiel lebt nicht auf der Anzeigetafel, sondern im Atem der Tribüne. Die Grafik zeigt, wie Tempo und Momentum über 90 Minuten in drei Szenarien atmen.',
      scenarios: {
        comeback: 'Comeback',
        collapse: 'Aufgeben',
        grind: 'Standhalten',
      },
      winLabel: 'Du hast gewonnen',
      winProgress: 'Du hältst durch…',
    },
    time: {
      eyebrow: '02 — Zeit & Momentum',
      title: 'Derselbe Satz, drei verschiedene Minuten',
      lede:
        'Die Zeit spricht nicht in jedem Moment gleich. Die erste Halbzeit verlangt Geduld, die Pause eine Entscheidung, die letzten zehn Minuten Mut. Wähle einen Modus — und derselbe Satz zeigt ein anderes Gesicht.',
      moodLabel: 'Stimmung',
      minute: 'Min',
    },
    projection: {
      eyebrow: '03 — Aufgabeschwelle',
      title: 'Verlieren ist ein Ergebnis; aufgeben ist eine Entscheidung.',
      lede: [
        'Zieh den Regler zu einem Moment und vergleiche beide Entscheidungen. Die Ergebnislinie muss sich nicht ändern — aber die',
        'Seelen-Linie',
        'steigt oder fällt mit deiner Entscheidung. Die echte Niederlage ist der Moment, in dem die Seele das Feld verlässt.',
      ],
      sliderLabel: 'Entscheidungsminute',
      quit: { title: 'Aufgeben', sub: 'Ergebnis angenommen, Kopf geschlossen' },
      fight: { title: 'Weitermachen', sub: 'Ergebnis offen, Seele bleibt auf dem Feld' },
      decision: 'ENTSCHEIDUNG',
      chartAria: 'Ergebnis- und Seelenprojektion',
      legend: { spirit: 'Seele (Spirit)', score: 'Ergebnis (Score)' },
      stats: {
        score: 'Ergebnis',
        spirit: 'Seele',
        scoreNote:
          'Manchmal ändert sich das Ergebnis nicht. Die echte Niederlage misst man hier nicht.',
        spiritNote: 'Die Spur, die deine Entscheidung auf dem Feld hinterlässt.',
      },
    },
    voices: {
      eyebrow: '04 — Von der Seitenlinie',
      title: 'Die Stimmen',
      lede:
        'Jeder, der nicht auf dem Platz steht, hat etwas zu sagen. Tippe auf den Bildschirm — lass die Stimmen um dich herum eine nach der anderen sprechen. Mal sehen, wer das letzte Wort hat.',
      hint: 'Zum Starten tippen.',
      button: {
        start: 'Eine Stimme rufen',
        more: 'Eine Stimme mehr',
      },
      reset: 'Zurücksetzen',
      doubters: [
        'Du? Ernsthaft?',
        'Das packst du nicht.',
        'Du hast das Zeug nicht dazu.',
        'Mit diesem Team kommt ihr nicht weiter.',
        'Schau dir den Gegner an — keine Chance.',
        'Es ist vorbei, akzeptier es endlich.',
        'Selbst die Tribüne wird sich gegen dich wenden.',
        'Dieser Trainer, mit dieser Mannschaft?',
        'Seine Ära ist vorbei, sagen sie.',
        'Es wird nichts. Spar dir die Mühe.',
      ],
      terimQuote: {
        part1: 'Sie sagten mir: „Trainer,',
        dark: 'du hast so viele Feinde."',
        part2: 'Und ich antwortete ihnen:',
        gold: 'Ich habe keine Feinde.',
        red: 'Der Erfolg hat Feinde.',
      },
    },
    brain: {
      eyebrow: '05 — Terim-Karte',
      title: 'Die neuronalen Regionen des Nicht-Aufgebens',
      lede:
        'Aufgeben ist nicht nur Taktik — es ist das Abschalten eines neuronalen Netzwerks. Diese Karte zeigt als Metapher, welche Regionen in einem Geist an der Seitenlinie aufleuchten.',
      mapAria: 'Terim-Karte',
      center: 'TERİM',
      footer: 'Aufgeben ist nicht nur Taktik — es ist ein Netzwerk, das erlischt.',
    },
    footer: {
      title: 'The Interactive Phenomenology of Winning',
      text:
        'Ein interaktives Erlebnis rund um eine Philosophie des Kampfes — über Zeit, Momentum und den Willen, nicht aufzugeben.',
      tagline: 'Verlieren ist möglich. Aufgeben ist nicht notwendig.',
    },
    intro: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      title: 'Für das volle Erlebnis den Ton einschalten',
      text:
        'Diese Seite enthält eine prozedurale Klangebene, die sich mit dem Spielverlauf verändert. Während du Szenario und Entscheidung wechselst, reagieren Tempo, Akkorde und Filter in Echtzeit. Kein lizenziertes Lied — rein durch Code erzeugt, copyright-frei.',
      languageLabel: 'Sprache',
      primary: 'Mit Ton betreten',
      primaryBusy: 'Wird geladen…',
      secondary: 'Stumm fortfahren',
      hint: 'Deine Wahl ist umkehrbar — schalte es unten rechts jederzeit um.',
    },
    audio: {
      turnOff: 'Musik ausschalten',
      turnOn: 'Musik einschalten',
      turnOnTitle: 'Ton einschalten — verändert sich mit dem Spiel',
      starting: 'Wird geladen',
      on: 'Ton an',
      off: 'Ton einschalten',
    },
    scenarios: {
      comeback: {
        name: 'Comeback aus 0-2',
        description:
          'Das Ergebnis steht gegen dich; aber nach der 60. Minute steigt das Tempo schnell, und die Gesänge verändern den Rhythmus.',
        verdicts: {
          loss: {
            label: 'Der Weg in die Niederlage',
            line: 'Du hast es versucht, aber verloren.',
            quote: 'Große Revolutionen kommen nicht mit Lärm — sie kommen mit Beständigkeit.',
          },
          win: {
            label: 'Der Weg zum Sieg',
            line: 'Du hast es versucht und gewonnen.',
            quote: 'Es ist nicht vorbei, solange wir es nicht sagen.',
          },
        },
      },
      collapse: {
        name: 'Der Moment des Aufgebens',
        description:
          'In einem Spiel, das du geführt hast, bricht nach der 70. Minute das Tempo ein, die Energie schwindet von der Tribüne aufs Feld.',
        verdicts: {
          terminal: {
            label: 'Urteil',
            line: 'Du hast aufgegeben, du hast verloren.',
            quote:
              'Wenn sie sich vor bestimmten Dingen fürchten werden — das Leben ist ein Recht der Mutigen.',
          },
        },
      },
      grind: {
        name: 'Bis zum Ende kämpfen',
        description:
          'In jeder Minute dieselbe Intensität; egal, wie das Ergebnis steht, du läufst bis zum Schlusspfiff.',
        verdicts: {
          loss: {
            label: 'Urteil',
            line: 'Du hast widerstanden, aber verloren.',
            quote:
              'Doch wie das Ergebnis auch lautet — in meinem Herzen habt ihr immer gewonnen, seid ihr immer Meister, und ihr werdet es bleiben.',
          },
        },
      },
    },
    phases: {
      firstHalf: {
        label: 'Erste Halbzeit',
        minute: '0’ – 45’',
        headline: 'Lies die Zeit. Bau das Spiel auf.',
        body:
          'Das Ergebnis kann gegen dich stehen — doch es ist Zeit da. Jetzt geht es nicht um Abrechnung, sondern ums Lesen des Tempos, Planen und Druck verteilen.',
        quote:
          'Der Ball rollt noch. Wer das Spiel jetzt beenden will, verliert es jetzt.',
        mood: 'Geduld',
      },
      halftime: {
        label: 'Halbzeit',
        minute: '45’ – 46’',
        headline: 'Verändere nicht die Niederlage, sondern den Plan.',
        body:
          'Die Kabine ist die längste Viertelstunde eines Spiels. Hier ändert sich nicht das Ergebnis — sondern die Entscheidung. Wer die Niederlage akzeptiert, verlässt die Tür als ein anderer Mensch; wer bleibt, ist nicht mehr dasselbe Team.',
        quote:
          'Verlierern bin ich niemals böse. Aber wer aufgibt und die Niederlage akzeptiert, den streiche ich.',
        mood: 'Entscheidung',
      },
      finalTen: {
        label: 'Letzte 10 Minuten',
        minute: '80’ – 90’+',
        headline: 'Jetzt oder nie.',
        body:
          'Die Zeit verdoppelt den Druck. Mehr Risiko, ein Innenverteidiger nach vorn, ein dritter Stürmer aufs Feld — das sind keine Entscheidungen, sondern der Reflex des Nicht-Aufgebens.',
        quote:
          'Das Spiel endet erst mit dem Schlusspfiff. Wenn es in deinem Kopf endet, ist es längst verloren.',
        mood: 'Wagemut',
      },
    },
    regions: {
      risk: {
        label: 'Risikobereitschaft',
        description:
          'In den letzten Minuten einen zusätzlichen Stürmer bringen. Die sichtbarste Spiegelung eines Geistes, der nicht aufgibt; nicht das Sichere wählen, sondern das Nötige.',
      },
      motivation: {
        label: 'Motivation',
        description:
          'Die Kabinenansprache, die Armbewegung an der Linie, ein Blick vor der Tür. Motivation ist keine Taktik — sie ist Energieübertragung.',
      },
      strategy: {
        label: 'Strategie',
        description:
          'Ruhige Klugheit. Die Formation des Gegners, die Müdigkeit deines Spielers, die verbleibenden Minuten — alles gleichzeitig abgewogen. Keine Panik, sondern Planung.',
      },
      outburst: {
        label: 'Emotionaler Ausbruch',
        description:
          'Eine Stimme, die an der Seitenlinie anschwillt, ein Blick zum vierten Offiziellen. Nicht unkontrolliert — sondern eine Erinnerung an die Mannschaft, dass dieses Spiel noch zu gewinnen ist.',
      },
      calm: {
        label: 'Stille',
        description:
          'Unter höchstem Druck reglos bleiben. Der Moment, in dem der Geist sich selbst steuert. Nicht aufgeben heißt manchmal nicht schreien, sondern eine innere Linie halten.',
      },
      memory: {
        label: 'Erinnerung',
        description:
          'In der 89. Minute werden die vergangenen Comebacks der Mannschaft aufs Feld gerufen. Ein gelebter Sieg gibt Mut für eine unbekannte Zukunft.',
      },
    },
    phaseMoods: {
      firstHalf: 'Geduld',
      halftime: 'Entscheidung',
      finalTen: 'Wagemut',
    },
  },

  fr: {
    nav: {
      logo: 'Ne Jamais Renoncer',
      links: {
        melody: 'Flux du Match',
        time: 'Temps & Élan',
        projection: 'Seuil du Renoncement',
        voices: 'Les Voix',
        brain: 'Carte de Terim',
      },
      meta: 'Powered by React + Vite',
      back: 'Retour Portfolio',
    },
    hero: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      titleA: 'Je ne suis jamais en colère',
      titleAEm: 'contre les perdants',
      titleB: 'mais ceux qui',
      titleBU: 'renoncent',
      titleBRest: 'et acceptent la défaite,',
      titleC: 'je les efface.',
      lede: [
        'Cette expérience interactive visualise la différence entre',
        'perdre',
        'et',
        'renoncer',
        'dans le flux d’un match. Ce n’est pas le score — c’est le seuil mental — qui décide.',
      ],
      cta: 'Entrer dans le flux du match',
      hint: 'Fais défiler — l’expérience commence',
    },
    melody: {
      eyebrow: '01 — Flux du Match',
      title: 'Chants, tempo et élan',
      lede:
        'Un match ne vit pas sur le tableau des scores ; il vit dans le souffle des tribunes. Le graphique ci-dessous montre comment tempo et élan respirent sur 90 minutes, dans trois scénarios.',
      scenarios: {
        comeback: 'Remontée',
        collapse: 'Renoncer',
        grind: 'Tenir',
      },
      winLabel: 'Tu as gagné',
      winProgress: 'Tu tiens bon…',
    },
    time: {
      eyebrow: '02 — Temps & Élan',
      title: 'Mêmes mots, trois minutes différentes',
      lede:
        'Le temps ne parle pas de la même façon à chaque instant. La première mi-temps demande de la patience, la pause une décision, les dix dernières minutes de l’audace. Touche un mode et tu verras la même phrase porter un autre visage.',
      moodLabel: 'Humeur',
      minute: 'min',
    },
    projection: {
      eyebrow: '03 — Seuil du Renoncement',
      title: 'Perdre est un score ; renoncer est une décision.',
      lede: [
        'Déplace le curseur jusqu’à un instant, puis compare les deux choix. La ligne du score peut ne pas changer — mais la ligne de',
        'l’Âme',
        'monte ou descend selon ta décision. La vraie défaite, c’est l’instant où l’âme quitte le terrain.',
      ],
      sliderLabel: 'Minute de décision',
      quit: { title: 'Renoncer', sub: 'Score accepté, esprit fermé' },
      fight: { title: 'Continuer', sub: 'Score ouvert, âme encore sur le terrain' },
      decision: 'DÉCISION',
      chartAria: 'Projection du score et de l’âme',
      legend: { spirit: 'Âme (Spirit)', score: 'Score' },
      stats: {
        score: 'Score',
        spirit: 'Âme',
        scoreNote: 'Parfois le score ne change pas. La vraie défaite ne se mesure pas ici.',
        spiritNote: 'La trace que ta décision laisse sur le terrain.',
      },
    },
    voices: {
      eyebrow: '04 — Depuis la Ligne de Touche',
      title: 'Les Voix',
      lede:
        'Chacun qui n’est pas sur le terrain a un mot à dire. Touche l’écran — laisse les voix qui t’entourent parler une à une. On verra qui aura le dernier mot.',
      hint: 'Touche pour commencer.',
      button: {
        start: 'Appeler une voix',
        more: 'Une voix de plus',
      },
      reset: 'Recommencer',
      doubters: [
        'Toi ? Vraiment ?',
        'Tu ne peux pas y arriver.',
        'Tu n’as pas ce qu’il faut.',
        'Cette équipe n’ira pas plus loin.',
        'Regarde l’adversaire — aucune chance.',
        'C’est fini, accepte-le.',
        'Même la tribune va se retourner contre toi.',
        'Ce coach, avec cet effectif ?',
        'Son époque est finie, disent-ils.',
        'Ça n’arrivera pas. Laisse tomber.',
      ],
      terimQuote: {
        part1: 'Ils m’ont dit : « Coach,',
        dark: 'tu as tant d’ennemis. »',
        part2: 'Et je leur ai répondu :',
        gold: 'je n’ai pas d’ennemis.',
        red: 'Le succès a des ennemis.',
      },
    },
    brain: {
      eyebrow: '05 — Carte de Terim',
      title: 'Les régions neuronales du refus de renoncer',
      lede:
        'Renoncer n’est pas seulement tactique — c’est l’extinction d’un réseau neuronal. Cette carte, en métaphore, montre quelles régions s’allument dans un esprit posté sur la ligne de touche.',
      mapAria: 'Carte de Terim',
      center: 'TERİM',
      footer: 'Renoncer n’est pas seulement tactique — c’est un réseau qui s’éteint.',
    },
    footer: {
      title: 'The Interactive Phenomenology of Winning',
      text:
        'Une expérience interactive autour d’une philosophie de la lutte — sur le temps, l’élan et le refus de renoncer.',
      tagline: 'Perdre est possible. Renoncer n’est pas obligatoire.',
    },
    intro: {
      eyebrow: 'The Interactive Phenomenology of Winning',
      title: 'Active le son pour l’expérience complète',
      text:
        'Ce site contient une couche sonore procédurale qui change avec le flux du match. Quand tu changes de scénario ou de décision, tempo, accords et filtres réagissent en temps réel. Pas de chanson sous licence — tout est généré par le code, libre de droits.',
      languageLabel: 'Langue',
      primary: 'Entrer avec le son',
      primaryBusy: 'Préparation…',
      secondary: 'Continuer en silence',
      hint: 'Ton choix est réversible — bascule-le à tout moment depuis le bouton en bas à droite.',
    },
    audio: {
      turnOff: 'Couper la musique',
      turnOn: 'Activer la musique',
      turnOnTitle: 'Active le son — il change avec le match',
      starting: 'Préparation',
      on: 'Son activé',
      off: 'Activer le son',
    },
    scenarios: {
      comeback: {
        name: 'Remontée à 0-2',
        description:
          'Le score est contre toi ; mais après la 60e minute, le tempo monte vite et les chants changent le rythme.',
        verdicts: {
          loss: {
            label: 'Le chemin de la défaite',
            line: 'Tu as essayé mais tu as perdu.',
            quote: 'Les grandes révolutions n’arrivent pas dans le bruit — elles arrivent dans la constance.',
          },
          win: {
            label: 'Le chemin de la victoire',
            line: 'Tu as essayé et tu as gagné.',
            quote: 'Ce n’est pas fini tant que nous n’avons pas dit que c’est fini.',
          },
        },
      },
      collapse: {
        name: 'L’instant du renoncement',
        description:
          'Dans un match que tu menais, après la 70e minute, le tempo chute et l’énergie s’éteint, des tribunes jusqu’au terrain.',
        verdicts: {
          terminal: {
            label: 'Verdict',
            line: 'Tu as renoncé, tu as perdu.',
            quote:
              'S’ils doivent avoir peur de certaines choses — vivre est un droit réservé aux braves.',
          },
        },
      },
      grind: {
        name: 'Se battre jusqu’au bout',
        description:
          'La même intensité chaque minute ; quel que soit le score, on court jusqu’au coup de sifflet final.',
        verdicts: {
          loss: {
            label: 'Verdict',
            line: 'Tu as résisté mais tu as perdu.',
            quote:
              'Mais quel que soit le résultat, dans mon cœur vous avez toujours gagné, vous êtes toujours champions, et vous le resterez.',
          },
        },
      },
    },
    phases: {
      firstHalf: {
        label: 'Première Mi-Temps',
        minute: '0’ – 45’',
        headline: 'Lis le temps. Construis le jeu.',
        body:
          'Le score peut être contre toi, mais il reste du temps. Il ne s’agit pas de régler des comptes ; il faut lire le tempo, mettre à jour le plan, casser la pression.',
        quote:
          'Le ballon roule encore. Celui qui veut finir le match maintenant, le perd maintenant.',
        mood: 'Patience',
      },
      halftime: {
        label: 'Mi-Temps',
        minute: '45’ – 46’',
        headline: 'Ne change pas la défaite — change le plan.',
        body:
          'Le vestiaire est le quart d’heure le plus long d’un match. Ici, ce n’est pas le score qui change — c’est la décision. Qui accepte la défaite sort par cette porte en une autre personne ; ceux qui restent ne sont plus la même équipe.',
        quote:
          'Je ne suis jamais en colère contre les perdants. Mais ceux qui renoncent et acceptent la défaite, je les efface.',
        mood: 'Décision',
      },
      finalTen: {
        label: '10 Dernières Minutes',
        minute: '80’ – 90’+',
        headline: 'Maintenant ou jamais.',
        body:
          'Le temps double la pression. Prendre du risque, faire avancer un défenseur, lancer un troisième attaquant — ce ne sont pas des décisions, ce sont les réflexes du refus de renoncer.',
        quote:
          'Le match ne finit qu’au coup de sifflet final. Quand il finit dans ta tête, il est déjà perdu.',
        mood: 'Audace',
      },
    },
    regions: {
      risk: {
        label: 'Prise de Risque',
        description:
          'Lancer un attaquant supplémentaire dans les dernières minutes. Le reflet le plus visible d’un esprit qui ne renonce pas ; choisir le nécessaire, pas le sûr.',
      },
      motivation: {
        label: 'Motivation',
        description:
          'Le discours au vestiaire, le geste du bras sur la ligne, un regard retenu devant la porte. La motivation n’est pas une tactique — c’est un transfert d’énergie.',
      },
      strategy: {
        label: 'Stratégie',
        description:
          'Une intelligence calme. Le dispositif adverse, la fatigue de ton joueur, les minutes restantes — tout pesé en même temps. Pas la panique, la planification.',
      },
      outburst: {
        label: 'Éclat Émotionnel',
        description:
          'Une voix qui monte sur la ligne, un regard vers le quatrième arbitre. Ce n’est pas incontrôlé — c’est un rappel à l’équipe que ce match peut encore être gagné.',
      },
      calm: {
        label: 'Calme',
        description:
          'Savoir rester figé sous la plus forte pression. L’instant où l’esprit se dirige lui-même. Ne pas renoncer, c’est parfois ne pas crier — mais tenir une ligne intérieure.',
      },
      memory: {
        label: 'Mémoire',
        description:
          'À la 89e minute, les remontées passées de l’équipe sont appelées sur le terrain. Une victoire déjà vécue donne du courage pour un futur inconnu.',
      },
    },
    phaseMoods: {
      firstHalf: 'Patience',
      halftime: 'Décision',
      finalTen: 'Audace',
    },
  },
};
