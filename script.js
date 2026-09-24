/**
 * Ung dung Flashcard On Tap
 * Cau truc ham dat theo chuẩn BEM:
 * - Khoi tao va Su kien: initApp, bindEvents
 * - Thao tac File: parseFileContent, loadQuestions
 * - Dieu khien Card & Animation: renderCard, handleCardFlip, setFadeEffect
 * - Điêu hường & Loc: navigateQuestion, filterQuestions, resetStudy
 */

// Global State
const appState = {
    allQuestions: [],
    filteredQuestions: [],
    currentIndex: 0,
    isShowingAnswer: false,
    fileName: ''
};

// DOM Elements
const elements = {
    uploadScreen: document.getElementById('uploadScreen'),
    studyScreen: document.getElementById('studyScreen'),
    fileInput: document.getElementById('fileInput'),
    setTitle: document.getElementById('setTitle'),
    chapterSelect: document.getElementById('chapterSelect'),
    flashcard: document.getElementById('flashcard'),
    cardQuestion: document.getElementById('cardQuestion'),
    cardAnswer: document.getElementById('cardAnswer'),
    cardCounter: document.getElementById('cardCounter'),
    progressFill: document.getElementById('progressFill'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    restartBtn: document.getElementById('restartBtn'),
    changeFileBtn: document.getElementById('changeFileBtn')
};

/**
 * Khoi tao ung dung
 */
function initApp() {
    bindEvents();
}

/**
 * Dang ky tat ca cac su kien
 */
function bindEvents() {
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.flashcard.addEventListener('click', handleCardFlip);
    elements.prevBtn.addEventListener('click', () => navigateQuestion(-1));
    elements.nextBtn.addEventListener('click', () => navigateQuestion(1));
    elements.restartBtn.addEventListener('click', resetStudy);
    elements.chapterSelect.addEventListener('change', handleChapterChange);
    elements.changeFileBtn.addEventListener('click', showUploadScreen);
}

/**
 * Xu ly khi nguoi dung tai file len
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Lay ten file lam tieu de (Bo phan mo rong .txt)
    appState.fileName = file.name.replace(/\.[^/.]+$/, "");
    
    const reader = new FileReader();
    reader.onload = function (e) {
        const textContent = e.target.result;
        parseFileContent(textContent);
        
        if (appState.allQuestions.length === 0) {
            alert('File không chứa dữ liệu hợp lệ hoặc sai cấu trúc!');
            return;
        }

        setupStudyScreen();
    };

    reader.readAsText(file, 'UTF-8');
}

/**
 * Phân tích nội dung file TXT
 * Mô tả quy tắc: Các câu phân cách bằng 1 dòng trống. 
 * Hỗ trợ nhận diện Chương bằng cú pháp "Chương X" hoặc "Chuong X"
 */
function parseFileContent(content) {
    // Tách các khối câu hỏi dựa trên 1 hoặc nhiều dòng trống
    const rawBlocks = content.split(/\n\s*\n/);
    
    appState.allQuestions = [];
    let currentChapter = "Chương 1"; // Mặc định nếu không phân chương

    rawBlocks.forEach((block) => {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) return;

        // Kiểm tra xem đoạn này có định nghĩa chương mới không (Ví dụ: "Chương 1: Tổng quan")
        if (lines[0].toLowerCase().startsWith('chương') || lines[0].toLowerCase().startsWith('chuong')) {
            currentChapter = lines[0];
            // Nếu đoạn chỉ chứa tên chương thì bỏ qua
            if (lines.length === 1) return; 
            lines.shift(); // Xóa dòng tên chương để lấy câu hỏi
        }

        // Dòng đầu là câu hỏi, các dòng còn lại gộp thành đáp án
        if (lines.length >= 2) {
            const questionText = lines[0];
            const answerText = lines.slice(1).join('\n');

            appState.allQuestions.push({
                chapter: currentChapter,
                question: questionText,
                answer: answerText
            });
        }
    });

    appState.filteredQuestions = [...appState.allQuestions];
}

/**
 * Thiet lap giao dien va danh sach Chuong
 */
function setupStudyScreen() {
    elements.setTitle.textContent = appState.fileName;
    
    // Tao danh sach cac chuong cho Select
    populateChapterOptions();

    // Mac dinh Reset ve trang thai ban dau
    appState.currentIndex = 0;
    appState.isShowingAnswer = false;

    // Chuyen giao dien tu Upload -> Study
    elements.uploadScreen.classList.add('app__study-screen--hidden');
    elements.studyScreen.classList.remove('app__study-screen--hidden');

    renderCard();
}

/**
 * Nap danh sach Chuong vao Dropdown Select
 */
function populateChapterOptions() {
    // Lay danh sach cac chuong duy nhat
    const chapters = [...new Set(appState.allQuestions.map(q => q.chapter))];
    
    elements.chapterSelect.innerHTML = '<option value="all">Tất cả các chương</option>';
    
    chapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = chapter;
        elements.chapterSelect.appendChild(option);
    });
}

/**
 * Hien thi noi dung Card hien tai
 */
function renderCard() {
    const total = appState.filteredQuestions.length;

    if (total === 0) {
        elements.cardQuestion.textContent = "Không có câu hỏi nào trong chương này!";
        elements.cardAnswer.textContent = "";
        elements.cardCounter.textContent = "Câu 0 / 0";
        elements.progressFill.style.width = "0%";
        elements.flashcard.classList.remove('card--answer-active');
        updateButtonStates();
        return;
    }

    const currentData = appState.filteredQuestions[appState.currentIndex];

    // Reset mat the ve Cau hoi (Màu nền trắng mặc định)
    appState.isShowingAnswer = false;
    elements.flashcard.classList.remove('card--answer-active');
    elements.cardQuestion.classList.remove('card__content--hidden');
    elements.cardAnswer.classList.add('card__content--hidden');

    // Cap nhat noi dung
    elements.cardQuestion.textContent = currentData.question;
    elements.cardAnswer.textContent = currentData.answer;

    // Cap nhat bo dem & Thanh tien trinh
    elements.cardCounter.textContent = `Câu ${appState.currentIndex + 1} / ${total}`;
    const progressPercent = ((appState.currentIndex + 1) / total) * 100;
    elements.progressFill.style.width = `${progressPercent}%`;

    updateButtonStates();
}

/**
 * Hieu ung lat card dung Fade và đổi màu nền (bgc)
 */
function handleCardFlip() {
    if (appState.filteredQuestions.length === 0) return;

    // Fade out
    elements.flashcard.classList.add('card--fade-out');

    setTimeout(() => {
        appState.isShowingAnswer = !appState.isShowingAnswer;

        if (appState.isShowingAnswer) {
            elements.cardQuestion.classList.add('card__content--hidden');
            elements.cardAnswer.classList.remove('card__content--hidden');
            // Đổi bgc sang màu nền đáp án
            elements.flashcard.classList.add('card--answer-active');
        } else {
            elements.cardQuestion.classList.remove('card__content--hidden');
            elements.cardAnswer.classList.add('card__content--hidden');
            // Trả bgc về màu nền câu hỏi
            elements.flashcard.classList.remove('card--answer-active');
        }

        // Fade in
        elements.flashcard.classList.remove('card--fade-out');
    }, 200); // 200ms trùng với transition trong CSS
}

/**
 * Dieu huong Cau truoc / Cau sau
 */
function navigateQuestion(direction) {
    const newIndex = appState.currentIndex + direction;

    if (newIndex >= 0 && newIndex < appState.filteredQuestions.length) {
        // Them hieu ung Fade khi chuyen câu
        elements.flashcard.classList.add('card--fade-out');
        
        setTimeout(() => {
            appState.currentIndex = newIndex;
            renderCard();
            elements.flashcard.classList.remove('card--fade-out');
        }, 200);
    }
}

/**
 * Loc cau hoi theo Chuong
 */
function handleChapterChange(event) {
    const selectedChapter = event.target.value;

    if (selectedChapter === 'all') {
        appState.filteredQuestions = [...appState.allQuestions];
    } else {
        appState.filteredQuestions = appState.allQuestions.filter(q => q.chapter === selectedChapter);
    }

    appState.currentIndex = 0;
    renderCard();
}

/**
 * Lam lai tu dau
 */
function resetStudy() {
    if (appState.filteredQuestions.length === 0) return;

    elements.flashcard.classList.add('card--fade-out');
    setTimeout(() => {
        appState.currentIndex = 0;
        renderCard();
        elements.flashcard.classList.remove('card--fade-out');
    }, 200);
}

/**
 * Cap nhat trang thai Disable/Enable cua cac nut
 */
function updateButtonStates() {
    const total = appState.filteredQuestions.length;
    elements.prevBtn.disabled = appState.currentIndex === 0 || total === 0;
    elements.nextBtn.disabled = appState.currentIndex === total - 1 || total === 0;
}

/**
 * Quay lai man hinh Tai file
 */
function showUploadScreen() {
    elements.fileInput.value = ''; // Clear file input
    elements.studyScreen.classList.add('app__study-screen--hidden');
    elements.uploadScreen.classList.remove('app__study-screen--hidden');
}

// Chay khi DOM san sang
document.addEventListener('DOMContentLoaded', initApp);