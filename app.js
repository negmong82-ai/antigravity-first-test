// ===== StyleForMen - 남성 패션 추천 엔진 =====

(function () {
  'use strict';

  // ===== Particle System =====
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 40;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -(Math.random() * 0.3 + 0.1);
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.6
          ? `rgba(226, 183, 20, ${this.opacity})`
          : `rgba(58, 123, 213, ${this.opacity * 0.7})`;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.pulse) * 0.1;
        this.pulse += this.pulseSpeed;
        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
          this.y = canvas.height + 10;
        }
      }
      draw() {
        const pulseFactor = 1 + Math.sin(this.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ===== Mouse-tracking Glow for Cards =====
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.rec-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });

  // ===== Scroll-triggered Reveal Observer =====
  function setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    // Observe all revealable elements
    document.querySelectorAll('.rec-card, .color-palette, .tips-card, .color-swatch, .tip-item')
      .forEach(el => observer.observe(el));
  }

  // ===== Counter Animation =====
  function animateCounter(el, target, suffix = '', duration = 800) {
    const start = 0;
    const startTime = performance.now();
    const isFloat = String(target).includes('.');

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (target - start) * eased;
      el.textContent = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ===== State =====
  const state = {
    currentStep: 1,
    photoUploaded: false,
    photoDataUrl: null,
    height: null,
    weight: null,
    stylePreference: 'casual',
    bodyType: null,
    heightCategory: null,
    bmi: null,
  };

  // ===== DOM References =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    uploadArea: $('#uploadArea'),
    fileInput: $('#fileInput'),
    uploadContent: $('#uploadContent'),
    uploadPreview: $('#uploadPreview'),
    previewImage: $('#previewImage'),
    changePhotoBtn: $('#changePhotoBtn'),
    toStep2Btn: $('#toStep2Btn'),
    backToStep1Btn: $('#backToStep1Btn'),
    analyzeBtn: $('#analyzeBtn'),
    heightInput: $('#heightInput'),
    weightInput: $('#weightInput'),
    loadingOverlay: $('#loadingOverlay'),
    recGrid: $('#recGrid'),
    colorSwatches: $('#colorSwatches'),
    tipList: $('#tipList'),
    restartBtn: $('#restartBtn'),
    saveResultBtn: $('#saveResultBtn'),
    payBtn: $('#payBtn'),
    premiumBanner: $('#premiumBanner'),
  };

  // ===== PortOne Initialization =====
  const IMP = window.IMP;
  if (IMP) {
    IMP.init('imp00000000'); // 테스트 가맹점 식별코드
  }

  // ===== Style Recommendation Data =====
  const BODY_TYPES = {
    slim: { label: '슬림 체형', icon: '🧍', desc: 'BMI가 낮은 마른 체형' },
    standard: { label: '표준 체형', icon: '🙂', desc: '균형 잡힌 보통 체형' },
    athletic: { label: '탄탄 체형', icon: '💪', desc: '근육질의 탄탄한 체형' },
    stocky: { label: '다부진 체형', icon: '🏋️', desc: '넉넉하고 다부진 체형' },
    big: { label: '빅사이즈 체형', icon: '👊', desc: '체격이 큰 빅사이즈 체형' },
  };

  const RECOMMENDATIONS = {
    casual: {
      slim: {
        top: { title: '상의 추천', icon: '👕', items: ['레이어드 티셔츠', '오버핏 맨투맨', '패딩 조끼', '두꺼운 니트'], reason: '슬림한 체형에는 레이어드로 볼륨감을 주는 것이 효과적입니다. 오버핏 상의로 어깨 라인을 넓혀보세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['스트레이트 핏 청바지', '카고 팬츠', '와이드 팬츠', '코듀로이 팬츠'], reason: '스트레이트~와이드 핏 바지가 다리에 볼륨감을 더해줍니다. 스키니는 더 마른 인상을 줄 수 있어요.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['블루종 자켓', '푸퍼 자켓', 'MA-1 항공점퍼', '후리스 집업'], reason: '볼륨감 있는 아우터가 상체를 넓어 보이게 해줍니다. 숄더 패드가 있는 자켓도 추천합니다.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['청키 스니커즈', '하이탑 운동화', '워커 부츠', 'New Balance 530'], reason: '볼륨감 있는 청키 슈즈가 하체 비율을 안정적으로 보이게 합니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['큰 다이얼 시계', '비니', '머플러', '크로스백'], reason: '포인트 액세서리로 시선 분산 효과를 내세요. 비니와 머플러로 볼륨 업!' },
      },
      standard: {
        top: { title: '상의 추천', icon: '👕', items: ['레귤러핏 티셔츠', '피케 폴로', '무지 맨투맨', '옥스포드 셔츠'], reason: '균형 잡힌 체형이라 대부분의 핏이 잘 어울립니다. 레귤러핏으로 깔끔하게 입으세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['슬림 스트레이트 청바지', '치노 팬츠', '조거 팬츠', '면 슬랙스'], reason: '슬림 스트레이트가 가장 깔끔하게 어울리는 핏입니다. 다양한 스타일에 도전해 보세요.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['코치 자켓', '데님 자켓', '라이더 자켓', '셔츠 자켓'], reason: '어떤 아우터든 무난하게 소화 가능합니다. 시즌별로 다양하게 시도해 보세요.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['미니멀 스니커즈', '로퍼', '캔버스화', 'Nike Air Force 1'], reason: '심플한 디자인의 스니커즈가 캐주얼 룩을 완성해줍니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['미니멀 시계', '볼캡', '가죽 벨트', '토트백'], reason: '과하지 않은 미니멀 액세서리로 세련된 캐주얼 룩을 완성하세요.' },
      },
      athletic: {
        top: { title: '상의 추천', icon: '👕', items: ['슬림핏 헨리넥', '라운드넥 니트', '피케 티셔츠', '슬림 맨투맨'], reason: '탄탄한 체형을 자연스럽게 드러내는 슬림~레귤러 핏이 잘 어울립니다. 몸에 적당히 붙는 소재를 선택하세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['테이퍼드 팬츠', '슬림 스트레이트 데님', '트레이닝 조거', '밴딩 슬랙스'], reason: '허벅지에서 편하고 밑단은 좁아지는 테이퍼드 핏이 탄탄한 다리를 멋지게 보여줍니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['봄버 자켓', '하프 집업', '트렌치코트', '나일론 자켓'], reason: '어깨가 넓은 체형에 봄버나 집업이 자연스러운 실루엣을 만들어줍니다.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['러닝 스니커즈', '슬립온', '가죽 스니커즈', 'Reebok Classic'], reason: '슬림한 실루엣의 신발이 전체 밸런스를 맞춰줍니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['스포츠 시계', '선글라스', '심플 팔찌', '백팩'], reason: '스포티한 감성의 액세서리가 탄탄한 체형과 잘 어울립니다.' },
      },
      stocky: {
        top: { title: '상의 추천', icon: '👕', items: ['V넥 티셔츠', '셔츠 레이어드', '세로 스트라이프 셔츠', '다크 톤 니트'], reason: 'V넥으로 목선을 길어 보이게 하고, 세로 라인이 있는 상의가 시각적으로 날씬해 보이는 효과가 있습니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['스트레이트 핏 팬츠', '원턱 슬랙스', '다크 데님', '밴딩 치노'], reason: '스트레이트 핏이나 약간 여유 있는 핏으로 편안하면서도 깔끔한 라인을 만드세요.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['싱글 코트', '스트레이트 블레이저', '롱 카디건', '셔켓'], reason: '세로로 긴 라인의 아우터가 체형을 길어 보이게 해줍니다. 더블 여밈보다 싱글이 좋아요.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['심플 가죽 스니커즈', '첼시 부츠', '모카신', '깔끔한 러닝화'], reason: '끝이 약간 뾰족한 라인의 신발이 전체 실루엣을 정돈된 느낌으로 만들어줍니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['가죽 시계', '다크 톤 머플러', '슬림 백팩', '가죽 벨트'], reason: '과하지 않은 포인트 액세서리로 시선을 상체 위쪽으로 유도하세요.' },
      },
      big: {
        top: { title: '상의 추천', icon: '👕', items: ['박시핏 셔츠', '오버핏 헨리넥', '저지 소재 티셔츠', '다크 컬러 맨투맨'], reason: '적당히 여유 있는 핏이 편안하면서도 세련된 인상을 줍니다. 너무 타이트하거나 너무 큰 옷은 피하세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['릴렉스 핏 팬츠', '원턱 와이드', '밴딩 슬랙스', '다크 워시 데님'], reason: '릴렉스~와이드 핏으로 편안함과 스타일을 동시에 잡으세요. 다크 컬러가 슬림해 보이는 효과가 있습니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['롱 코트', '오픈 카디건', '유틸리티 자켓', '부드러운 후디'], reason: '세로 라인이 긴 아우터가 체형을 길어 보이게 해줍니다. 앞을 오픈하면 세로 라인이 더 강조돼요.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['러닝 스니커즈', '더비슈즈', '로퍼', '볼륨 스니커즈'], reason: '밑창이 두꺼운 신발이 키가 커 보이는 효과를 줍니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['큰 페이스 시계', '모자(볼캡)', '넥타이/스카프', '메신저백'], reason: '얼굴 근처에 포인트를 주면 시선이 상체 위쪽으로 올라가는 효과가 있습니다.' },
      },
    },
    business: {
      slim: {
        top: { title: '상의 추천', icon: '👔', items: ['슬림핏 드레스 셔츠', '니트 타이 조합', '패딩 안감 셔츠', '더블브레스트 조끼'], reason: '슬림 체형엔 패드가 살짝 들어간 구조감 있는 셔츠가 좋습니다. 조끼를 레이어드하면 체형에 볼륨감을 줄 수 있어요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['스트레이트 드레스 팬츠', '플리츠 슬랙스', '울 팬츠', '핀스트라이프 팬츠'], reason: '약간의 여유가 있는 스트레이트 핏 슬랙스가 가장 자연스러운 실루엣을 만듭니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['패드 숄더 블레이저', '싱글 울코트', '맥코트', '체스터필드 코트'], reason: '어깨 패드가 있는 블레이저로 넓은 어깨 라인을 연출하세요.' },
        shoes: { title: '신발 추천', icon: '👞', items: ['옥스포드 구두', '몽크스트랩', '더비슈즈', '앵클 부츠'], reason: '클래식한 디자인의 가죽 구두로 격식 있는 느낌을 완성하세요.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['클래식 가죽 시계', '실크 타이', '커프링크스', '가죽 서류가방'], reason: '고급스러운 디테일이 비즈니스 룩을 한 단계 업그레이드합니다.' },
      },
      standard: {
        top: { title: '상의 추천', icon: '👔', items: ['레귤러핏 드레스 셔츠', '터틀넥 니트', '옥스포드 버튼다운', '폴로 니트'], reason: '균형 잡힌 체형이라 클래식한 레귤러 핏이 가장 깔끔합니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['슬림 테이퍼드 슬랙스', '울 블렌드 팬츠', '치노 슬랙스', '네이비 드레스 팬츠'], reason: '슬림 테이퍼드 핏이 비즈니스 캐주얼에 가장 적합합니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['네이비 블레이저', '캐시미어 코트', '트렌치코트', '하프 코트'], reason: '네이비 블레이저는 비즈니스 캐주얼의 기본이자 정석입니다.' },
        shoes: { title: '신발 추천', icon: '👞', items: ['로퍼', '옥스포드', '브로그', '첼시 부츠'], reason: '상황에 따라 구두와 로퍼를 적절히 활용해 보세요.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['메탈 밴드 시계', '가죽 벨트', '포켓치프', '브리프케이스'], reason: '절제된 액세서리가 프로페셔널한 이미지를 만듭니다.' },
      },
      athletic: {
        top: { title: '상의 추천', icon: '👔', items: ['스트레치 드레스 셔츠', '슬림핏 폴로', '니트 셔츠', '저지 블레이저 이너'], reason: '탄탄한 체형엔 신축성 좋은 소재의 셔츠가 편안하고 핏도 좋습니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['스트레치 슬랙스', '컴포트 핏 치노', '밴딩 드레스 팬츠', '테이퍼드 울 팬츠'], reason: '스트레치 소재로 허벅지가 편한 핏을 선택하세요.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['저지 블레이저', '봄버 수트 자켓', '니트 블레이저', '스포츠 코트'], reason: '부드러운 소재의 블레이저가 근육질 체형에 자연스럽게 맞습니다.' },
        shoes: { title: '신발 추천', icon: '👞', items: ['더비슈즈', '모던 로퍼', '하이브리드 스니커즈', '스웨이드 부츠'], reason: '포멀과 캐주얼의 경계에 있는 스마트 캐주얼 슈즈가 최적입니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['스포츠 드레스 워치', '니트 타이', '가죽 트레이', '슬림 노트북 백'], reason: '스포티 엘레강스한 액세서리로 균형을 맞추세요.' },
      },
      stocky: {
        top: { title: '상의 추천', icon: '👔', items: ['세미 슬림 셔츠', '세로 스트라이프 드레스 셔츠', 'V존 깊은 니트', '다크 컬러 셔츠'], reason: '세로 라인이 강조되는 셔츠와 V존을 깊게 만드는 것이 날씬해 보이는 핵심입니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['스트레이트 슬랙스', '원턱 울 팬츠', '다크 네이비 팬츠', '미드라이즈 치노'], reason: '허리선이 자연스러운 미드라이즈에 스트레이트 핏이 가장 안정감 있습니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['싱글 브레스트 수트', '롱 블레이저', '체스터필드 코트', '심플 카디건'], reason: '싱글 여밈의 긴 라인 아우터가 세로 라인을 강조해 날씬해 보입니다.' },
        shoes: { title: '신발 추천', icon: '👞', items: ['포인트 토 옥스포드', '슬림 로퍼', '앵클 부츠', '더비슈즈'], reason: '앞코가 날렵한 구두가 전체 실루엣을 정리해줍니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['슬림 시계', '세로 줄무늬 타이', '다크 벨트', '구조적인 가방'], reason: '세로 방향의 액세서리가 길어 보이는 효과를 줍니다.' },
      },
      big: {
        top: { title: '상의 추천', icon: '👔', items: ['컴포트핏 셔츠', '니트 폴로', '저지 헨리넥', '다크 톤 터틀넥'], reason: '편안한 핏의 고급 소재 셔츠로 깔끔한 인상을 만드세요. 너무 딱 붙는 핏은 피해주세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['릴렉스 슬랙스', '밴딩 드레스 팬츠', '플리츠 와이드', '다크 울 팬츠'], reason: '편안한 릴렉스 핏에 다크 컬러를 선택하면 슬림 효과가 있습니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['롱 싱글 코트', '소프트 블레이저', '니트 카디건', '라이트 트렌치'], reason: '길이가 긴 아우터를 오픈해서 입으면 세로 라인이 강조돼 날씬해 보입니다.' },
        shoes: { title: '신발 추천', icon: '👞', items: ['플랫폼 더비', '로퍼', '앵클 부츠', '킬트 슈즈'], reason: '굽이 약간 있는 신발이 키 보정 효과를 줍니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['빅 페이스 시계', '네이비 타이', '포켓치프', '구조적 브리프케이스'], reason: '상체 위쪽에 포인트를 주는 것이 시선 분산에 효과적입니다.' },
      },
    },
    street: {
      slim: {
        top: { title: '상의 추천', icon: '👕', items: ['그래픽 오버핏 티', '후디', '레이어드 롱슬리브', '패딩 조끼 + 맨투맨'], reason: '스트릿 룩에서 오버핏은 기본! 슬림 체형이라 오버핏이 특히 잘 어울립니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['와이드 카고 팬츠', '배기 데님', '트랙 팬츠', '페인터 팬츠'], reason: '와이드~배기 핏으로 스트릿 무드를 살리세요. 슬림 체형은 과감한 핏이 더 멋집니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['푸퍼 다운', 'MA-1 봄버', '코듀로이 자켓', '아노락'], reason: '볼륨감 있는 아우터가 체형에 힘을 넣어줍니다.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['Jordan 1', 'New Balance 550', 'Converse', '덩키'], reason: '스트릿의 핵심은 신발! 하이탑이나 청키 슈즈로 포인트를 주세요.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['스냅백', '체인 목걸이', '크로스백', '비니'], reason: '대담한 액세서리가 스트릿 룩을 완성합니다.' },
      },
      standard: {
        top: { title: '상의 추천', icon: '👕', items: ['박시 프린트 티', '크루넥 맨투맨', '짧은 후디', '저지 레이어드'], reason: '적당한 오버핏으로 힘 빼고 편한 스트릿 무드를 연출하세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['스트레이트 카고', '워싱 데님', '나일론 트랙 팬츠', '밴딩 와이드'], reason: '다양한 핏을 자유롭게 시도할 수 있는 체형입니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['윈드브레이커', '데님 자켓', '플리스', '나일론 코치 자켓'], reason: '레이어드의 핵심! 가볍고 트렌디한 아우터를 겹쳐 입으세요.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['에어맥스', 'Vans Old Skool', 'Adidas Samba', '뉴발란스 993'], reason: '클래식한 스트릿 슈즈가 어떤 스타일에도 잘 맞습니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['볼캡', '미니 크로스백', '스카프/반다나', '디지털 시계'], reason: '자유롭고 개성 있는 소품으로 나만의 스타일을 표현하세요.' },
      },
      athletic: {
        top: { title: '상의 추천', icon: '👕', items: ['탱크 레이어드 티', '스포츠 브랜드 맨투맨', '크롭 후디', '레글런 슬리브 티'], reason: '탄탄한 몸을 살리면서도 스트릿 무드를 내는 조합입니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['조거 카고', '테이퍼드 트랙 팬츠', '숏 팬츠', '테크 웨어 팬츠'], reason: '스포티한 핏이 탄탄한 체형과 잘 어울립니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['테크 웨어 자켓', '트랙 자켓', '후딩 윈드브레이커', '패딩 봄버'], reason: '스포츠 브랜드의 기능성 아우터가 체형과 스타일 모두 잡아줍니다.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['에어조던', 'Yeezy', '트레일 러닝화', '하이테크 스니커즈'], reason: '하이테크 감성의 스니커즈가 스포티 스트릿의 핵심입니다.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['스포츠 시계', '웨이스트백', '선글라스', '스냅백'], reason: '스포티 럭셔리 감성으로 포인트를 주세요.' },
      },
      stocky: {
        top: { title: '상의 추천', icon: '👕', items: ['오버핏 스트라이프 티', '레이어드 셔츠 + 후디', '롱 슬리브', '지퍼 디테일 맨투맨'], reason: '세로 라인을 활용한 스트릿 아이템이 체형 커버에도 효과적입니다.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['릴렉스 카고', '다크 와이드 팬츠', '밴딩 조거', '스트레이트 데님'], reason: '여유 있는 핏의 다크 팬츠가 가장 무난하고 멋집니다.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['롱 후디', '오픈 셔켓', '롱 코치 자켓', '유틸리티 베스트'], reason: '길이감 있는 아우터로 세로 라인을 살릴 수 있습니다.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['에어포스 1', '뉴발란스 574', 'Vans 어센틱', '심플 스니커즈'], reason: '클린한 디자인의 스니커즈로 안정감 있게 마무리하세요.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['볼캡', '메신저백', '긴 펜던트 목걸이', '레이어드 팔찌'], reason: '세로로 늘어지는 액세서리가 시각적 연장 효과를 줍니다.' },
      },
      big: {
        top: { title: '상의 추천', icon: '👕', items: ['빅사이즈 그래픽 티', '오버핏 후디', '롱 레이어드 티', '집업 후디'], reason: '큰 체격은 오버핏 스트릿 웨어와 환상의 궁합! 자신감 있게 입으세요.' },
        bottom: { title: '하의 추천', icon: '👖', items: ['와이드 카고', '릴렉스 데님', '트랙 팬츠', '이지 팬츠'], reason: '편안하고 여유 있는 하의로 스트릿 바이브를 살리세요.' },
        outer: { title: '아우터 추천', icon: '🧥', items: ['오버사이즈 푸퍼', '롱 파카', 'XL 봄버 자켓', '후리스'], reason: '큰 체격에 볼륨감 있는 아우터가 임팩트 있는 실루엣을 만듭니다.' },
        shoes: { title: '신발 추천', icon: '👟', items: ['에어맥스 90', 'New Balance 2002R', '플랫폼 스니커즈', '하이탑 운동화'], reason: '볼륨감 있는 스니커즈로 전체 밸런스를 맞추세요.' },
        acc: { title: '액세서리 추천', icon: '⌚', items: ['빅 볼캡', '버킷햇', '크로스 바디백', 'G-Shock 시계'], reason: '빅사이즈 액세서리가 전체 비율에 맞아 자연스럽습니다.' },
      },
    },
  };

  // Color palettes per body type
  const COLOR_PALETTES = {
    slim: [
      { color: '#2C3E50', name: '차콜 네이비' },
      { color: '#8B4513', name: '브라운' },
      { color: '#B22222', name: '버건디' },
      { color: '#F5F5DC', name: '베이지' },
      { color: '#556B2F', name: '올리브' },
      { color: '#DAA520', name: '머스타드' },
    ],
    standard: [
      { color: '#1C1C1C', name: '블랙' },
      { color: '#FFFFFF', name: '화이트' },
      { color: '#000080', name: '네이비' },
      { color: '#808080', name: '그레이' },
      { color: '#8B0000', name: '와인' },
      { color: '#F0E68C', name: '라이트 옐로' },
    ],
    athletic: [
      { color: '#1C1C1C', name: '블랙' },
      { color: '#333333', name: '다크 그레이' },
      { color: '#000080', name: '네이비' },
      { color: '#FFFFFF', name: '화이트' },
      { color: '#228B22', name: '포레스트 그린' },
      { color: '#4169E1', name: '로열 블루' },
    ],
    stocky: [
      { color: '#191970', name: '미드나잇 블루' },
      { color: '#1C1C1C', name: '블랙' },
      { color: '#2F4F4F', name: '다크 슬레이트' },
      { color: '#800020', name: '버건디' },
      { color: '#36454F', name: '챠콜' },
      { color: '#483D8B', name: '다크 슬레이트 블루' },
    ],
    big: [
      { color: '#1C1C1C', name: '블랙' },
      { color: '#191970', name: '딥 네이비' },
      { color: '#36454F', name: '챠콜' },
      { color: '#2F4F4F', name: '다크 그린' },
      { color: '#3C1414', name: '다크 브라운' },
      { color: '#4B0082', name: '인디고' },
    ],
  };

  // Tips per body type
  const STYLING_TIPS = {
    slim: [
      { icon: '📏', text: '레이어드를 적극 활용하세요. 겉옷 + 이너 + 셔츠 조합으로 볼륨감을 만들 수 있습니다.' },
      { icon: '🎨', text: '밝은 색상의 상의와 어두운 하의를 매치하면 상체에 시선이 집중됩니다.' },
      { icon: '👖', text: '스키니 팬츠보다는 스트레이트~와이드 핏이 더 안정적인 비율을 만들어줍니다.' },
      { icon: '🧥', text: '가로 줄무늬(보더) 패턴이 체형을 넓어 보이게 하는 데 효과적입니다.' },
    ],
    standard: [
      { icon: '✨', text: '축복받은 체형! 대부분의 스타일이 잘 어울리니 다양하게 도전해 보세요.' },
      { icon: '🎯', text: '핏에 너무 집착하기보다 컬러와 소재 조합에 신경 쓰면 한 단계 업그레이드됩니다.' },
      { icon: '👟', text: '신발에 투자하세요. 좋은 신발 하나가 전체 룩의 완성도를 높여줍니다.' },
      { icon: '📐', text: '상의 기장은 벨트 라인을 살짝 덮는 정도가 가장 깔끔합니다.' },
    ],
    athletic: [
      { icon: '💪', text: '단단한 체형은 큰 장점! 너무 감추려 하지 말고 적당히 핏이 드러나게 입으세요.' },
      { icon: '🧶', text: '면, 울 같은 자연 소재가 체형을 자연스럽게 보이게 합니다.' },
      { icon: '⚖️', text: '상체가 크다면 하의를 약간 와이드하게 입어 상하 밸런스를 맞추세요.' },
      { icon: '👔', text: '스트레치 소재의 셔츠를 선택하면 움직임이 편하면서도 깔끔합니다.' },
    ],
    stocky: [
      { icon: '📐', text: '세로 라인을 강조하는 것이 핵심입니다. 세로 스트라이프, 지퍼 라인, V넥을 활용하세요.' },
      { icon: '🌑', text: '다크 톤 위주로 입되, 상의에 밝은 포인트를 하나 주면 세련됩니다.' },
      { icon: '📏', text: '옷의 기장이 중요합니다. 너무 짧거나 긴 옷보다 딱 맞는 기장을 찾으세요.' },
      { icon: '🧥', text: '앞이 개방되는 아우터(코트, 카디건)를 입으면 세로 라인이 생겨 날씬해 보입니다.' },
    ],
    big: [
      { icon: '🎯', text: '핏이 모든 것! 너무 타이트하거나 너무 큰 옷이 아닌 "적당히 여유 있는" 핏을 찾으세요.' },
      { icon: '🌑', text: '다크 컬러(블랙/네이비/챠콜)를 메인으로 하고, 얼굴 근처에 밝은 포인트를 주세요.' },
      { icon: '📐', text: '모노톤(한 가지 색 계열)으로 코디하면 전체적으로 길어 보이는 효과가 있습니다.' },
      { icon: '👟', text: '깔끔하게 관리된 신발은 체형과 관계없이 전체 인상을 업그레이드합니다.' },
    ],
  };

  // ===== Body Type Analysis =====
  function analyzeBodyType(height, weight) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    let bodyType;

    if (bmi < 18.5) bodyType = 'slim';
    else if (bmi < 23) bodyType = 'standard';
    else if (bmi < 25) bodyType = 'athletic';
    else if (bmi < 30) bodyType = 'stocky';
    else bodyType = 'big';

    let heightCategory;
    if (height < 170) heightCategory = 'short';
    else if (height < 180) heightCategory = 'medium';
    else heightCategory = 'tall';

    return { bmi: Math.round(bmi * 10) / 10, bodyType, heightCategory };
  }

  // ===== Step Navigation =====
  function goToStep(step) {
    state.currentStep = step;

    // Update panels
    $$('.step-panel').forEach((panel) => panel.classList.remove('active'));
    $(`#step${step}`).classList.add('active');

    // Update indicators
    $$('.step-indicator').forEach((ind, i) => {
      const stepNum = i + 1;
      ind.classList.remove('active', 'completed');
      if (stepNum === step) ind.classList.add('active');
      else if (stepNum < step) ind.classList.add('completed');
    });

    // Update lines
    const line1 = $('#line1');
    const line2 = $('#line2');
    line1.classList.toggle('completed', step > 1);
    line2.classList.toggle('completed', step > 2);

    // Update step circles for completed
    $$('.step-indicator.completed .step-circle').forEach((circle) => {
      circle.textContent = '✓';
    });
    $$('.step-indicator:not(.completed) .step-circle').forEach((circle, i) => {
      const allIndicators = $$('.step-indicator');
      allIndicators.forEach((ind, idx) => {
        if (!ind.classList.contains('completed')) {
          ind.querySelector('.step-circle').textContent = idx + 1;
        }
      });
    });
  }

  // ===== Photo Upload Handling =====
  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.photoDataUrl = e.target.result;
      state.photoUploaded = true;
      dom.previewImage.src = e.target.result;
      dom.uploadContent.style.display = 'none';
      dom.uploadPreview.style.display = 'flex';
      dom.uploadArea.classList.add('has-image');
      dom.toStep2Btn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  // Upload area click
  dom.uploadArea.addEventListener('click', (e) => {
    if (e.target === dom.changePhotoBtn || e.target.closest('.change-btn')) return;
    dom.fileInput.click();
  });

  dom.fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileSelect(e.target.files[0]);
  });

  // Change photo button
  dom.changePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.fileInput.value = '';
    dom.fileInput.click();
  });

  // Drag and drop
  dom.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.uploadArea.classList.add('dragover');
  });

  dom.uploadArea.addEventListener('dragleave', () => {
    dom.uploadArea.classList.remove('dragover');
  });

  dom.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  });

  // ===== Step Buttons =====
  dom.toStep2Btn.addEventListener('click', () => {
    if (state.photoUploaded) goToStep(2);
  });

  dom.backToStep1Btn.addEventListener('click', () => {
    goToStep(1);
  });

  // ===== Payment Handler =====
  if (dom.payBtn) {
    dom.payBtn.addEventListener('click', () => {
      if (!IMP) {
        alert('결제 모듈을 불러올 수 없습니다.');
        return;
      }

      // 실제로는 서버에서 생성된 merchant_uid를 사용해야 함
      const merchant_uid = `ORD-${Date.now()}`;

      IMP.request_pay({
        pg: 'kakaopay.TC0ONETIME', // 카카오페이 테스트 코드
        pay_method: 'card',
        merchant_uid: merchant_uid,
        name: 'StyleForMen 프리미엄 리포트',
        amount: 9900,
        buyer_email: 'test@example.com',
        buyer_name: '테스터',
        buyer_tel: '010-1234-5678',
      }, function (rsp) {
        if (rsp.success) {
          // 결제 성공!
          unlockPremiumContent();
          alert('결제가 완료되었습니다! 프리미엄 기능이 활성화되었습니다.');
        } else {
          // 결제 실패 (테스트 환경에서는 취소 버튼을 누르면 이리로 옴)
          // 하지만 시뮬레이션을 위해 실패하더라도 성공인 척 할 수 있는 '강제 성공' 모드를 유도하거나 안내
          console.log('결제 실패:', rsp.error_msg);

          // 사용자 경험을 위해 테스트 환경임을 안내하고 시뮬레이션 버튼 제공
          if (confirm('테스트 환경에서 결제를 건너뛰고 프리미엄 기능을 확인하시겠습니까?')) {
            unlockPremiumContent();
          }
        }
      });
    });
  }

  function unlockPremiumContent() {
    if (!dom.premiumBanner) return;

    dom.premiumBanner.classList.add('unlocked');
    dom.premiumBanner.innerHTML = `
      <div class="premium-content">
        <div class="premium-badge">✅ UNLOCKED</div>
        <h3>🎉 프리미엄 리포트가 잠금 해제되었습니다!</h3>
        <p>전담 스타일리스트의 맞춤형 조언과 상세 분석 리포트를 확인하세요.</p>
        <div class="premium-analysis" style="margin-top: 20px; text-align: left; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px dashed #2ecc71;">
          <h4 style="color: #2ecc71; margin-bottom: 10px;">🌟 전문 코디네이터의 한마디</h4>
          <p style="color: #fff; font-size: 0.9rem; line-height: 1.6;">
            현재 ${state.bodyType === 'standard' ? '표준' : state.bodyType} 체질에 맞춰 매우 균형 잡힌 코디를 추천드렸습니다. 
            추가적으로 현재 트렌드인 <strong>'미니멀리즘 실루엣'</strong>을 위해 와이드 팬츠와 크롭 상의 조합을 특히 추천드립니다.
            피부 톤을 고려했을 때 네이비와 그레이 컬러의 레이어드가 가장 지적인 이미지를 연출할 수 있습니다.
          </p>
        </div>
      </div>
    `;

    // 스크롤 이동
    dom.premiumBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ===== Analyze Button =====
  dom.analyzeBtn.addEventListener('click', () => {
    const height = parseFloat(dom.heightInput.value);
    const weight = parseFloat(dom.weightInput.value);

    if (!height || height < 100 || height > 250) {
      alert('키를 올바르게 입력해주세요. (100~250cm)');
      dom.heightInput.focus();
      return;
    }
    if (!weight || weight < 30 || weight > 250) {
      alert('몸무게를 올바르게 입력해주세요. (30~250kg)');
      dom.weightInput.focus();
      return;
    }

    const styleRadio = document.querySelector('input[name="style"]:checked');
    state.stylePreference = styleRadio ? styleRadio.value : 'casual';
    state.height = height;
    state.weight = weight;

    const analysis = analyzeBodyType(height, weight);
    state.bodyType = analysis.bodyType;
    state.heightCategory = analysis.heightCategory;
    state.bmi = analysis.bmi;

    showLoading(analysis);
  });

  // ===== Loading Animation =====
  function showLoading(analysis) {
    dom.loadingOverlay.classList.add('active');
    const steps = ['loadStep1', 'loadStep2', 'loadStep3', 'loadStep4'];

    steps.forEach((id) => {
      $(`#${id}`).classList.remove('active', 'done');
    });

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx > 0) {
        $(`#${steps[currentIdx - 1]}`).classList.remove('active');
        $(`#${steps[currentIdx - 1]}`).classList.add('done');
        $(`#${steps[currentIdx - 1]}`).textContent = '✅ ' + $(`#${steps[currentIdx - 1]}`).textContent.substring(2);
      }
      if (currentIdx < steps.length) {
        $(`#${steps[currentIdx]}`).classList.add('active');
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          dom.loadingOverlay.classList.remove('active');
          renderResults(analysis);
          goToStep(3);
        }, 400);
      }
    }, 500);
  }

  // ===== Render Results =====
  function renderResults(analysis) {
    const { bmi, bodyType } = analysis;
    const typeInfo = BODY_TYPES[bodyType];
    const recs = RECOMMENDATIONS[state.stylePreference][bodyType];
    const colors = COLOR_PALETTES[bodyType];
    const tips = STYLING_TIPS[bodyType];

    // Header
    $('#bodyTypeIcon').textContent = typeInfo.icon;
    $('#bodyTypeText').textContent = typeInfo.label;

    // Animated counters for stats
    const statHeight = $('#statHeight');
    const statWeight = $('#statWeight');
    const statBmi = $('#statBmi');
    animateCounter(statHeight, state.height, 'cm', 1000);
    animateCounter(statWeight, state.weight, 'kg', 1000);
    animateCounter(statBmi, bmi, '', 1200);

    // Recommendation cards
    dom.recGrid.innerHTML = '';
    const categories = ['top', 'bottom', 'outer', 'shoes', 'acc'];
    categories.forEach((cat) => {
      const rec = recs[cat];
      const card = document.createElement('div');
      card.className = 'rec-card';
      card.innerHTML = `
        <div class="rec-card-header">
          <div class="rec-card-icon">${rec.icon}</div>
          <div>
            <div class="rec-card-title">${rec.title}</div>
            <div class="rec-card-category">${getCategoryLabel(cat)}</div>
          </div>
        </div>
        <div class="rec-items">
          ${rec.items.map((item) => `<span class="rec-item-tag">${item}</span>`).join('')}
        </div>
        <div class="rec-reason">
          <strong>💡 왜 어울릴까?</strong> ${rec.reason}
        </div>
      `;
      dom.recGrid.appendChild(card);
    });

    // Color palette
    dom.colorSwatches.innerHTML = '';
    colors.forEach((c, i) => {
      const sw = document.createElement('div');
      sw.className = 'color-swatch';
      sw.innerHTML = `
        <div class="swatch-circle" style="background: ${c.color}"></div>
        <span class="swatch-name">${c.name}</span>
      `;
      dom.colorSwatches.appendChild(sw);
    });

    // Tips
    dom.tipList.innerHTML = '';
    tips.forEach((tip, i) => {
      const item = document.createElement('div');
      item.className = 'tip-item';
      item.innerHTML = `
        <span class="tip-icon">${tip.icon}</span>
        <span>${tip.text}</span>
      `;
      dom.tipList.appendChild(item);
    });

    // Set up scroll-triggered reveals for dynamically added elements
    requestAnimationFrame(() => {
      setupScrollReveal();
    });
  }

  function getCategoryLabel(cat) {
    const labels = { top: 'TOP', bottom: 'BOTTOM', outer: 'OUTER', shoes: 'SHOES', acc: 'ACCESSORY' };
    return labels[cat] || cat.toUpperCase();
  }

  // ===== Restart =====
  dom.restartBtn.addEventListener('click', () => {
    state.photoUploaded = false;
    state.photoDataUrl = null;
    state.height = null;
    state.weight = null;
    dom.uploadContent.style.display = '';
    dom.uploadPreview.style.display = 'none';
    dom.uploadArea.classList.remove('has-image');
    dom.toStep2Btn.disabled = true;
    dom.heightInput.value = '';
    dom.weightInput.value = '';
    dom.fileInput.value = '';
    // Reset loading step text
    $('#loadStep1').textContent = '📐 체형 분석 중...';
    $('#loadStep2').textContent = '👔 스타일 매칭 중...';
    $('#loadStep3').textContent = '🎨 컬러 추천 생성 중...';
    $('#loadStep4').textContent = '✨ 최종 결과 준비 중...';
    goToStep(1);
  });

  // ===== Save Results =====
  dom.saveResultBtn.addEventListener('click', () => {
    const typeInfo = BODY_TYPES[state.bodyType];
    const recs = RECOMMENDATIONS[state.stylePreference][state.bodyType];
    const tips = STYLING_TIPS[state.bodyType];

    let text = `=== StyleForMen 스타일 추천 결과 ===\n\n`;
    text += `📊 체형 분석\n`;
    text += `- 키: ${state.height}cm\n`;
    text += `- 몸무게: ${state.weight}kg\n`;
    text += `- BMI: ${state.bmi}\n`;
    text += `- 체형: ${typeInfo.label}\n`;
    text += `- 선호 스타일: ${state.stylePreference}\n\n`;

    const categories = ['top', 'bottom', 'outer', 'shoes', 'acc'];
    categories.forEach((cat) => {
      const rec = recs[cat];
      text += `${rec.icon} ${rec.title}\n`;
      text += `  추천: ${rec.items.join(', ')}\n`;
      text += `  이유: ${rec.reason}\n\n`;
    });

    text += `💡 스타일링 팁\n`;
    tips.forEach((tip) => {
      text += `${tip.icon} ${tip.text}\n`;
    });

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      const btn = dom.saveResultBtn;
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ 복사 완료!';
      btn.style.background = '#2ecc71';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 2000);
    }).catch(() => {
      // Fallback: create a download
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'style-recommendation.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

})();
