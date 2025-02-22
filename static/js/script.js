const translations = {
    en: {
        headerTitle: "File Conversion Tool",
        title: "File Conversion Tool",
        instructions: "Use this tool to convert files and text. Note that file conversion is only available from Cyrillic to Latin.",
        fileUploadButton: "Choose File",
        uploadButton: "Convert to Latin",
        conversionTypeLabel: "Select Conversion Type:",
        conversionTypeCyrillicToLatin: "Cyrillic to Latin",
        conversionTypeLatinToCyrillic: "Latin to Cyrillic",
        textToolHeader: "Text Conversion Tool",
        textAreaPlaceholder: "Enter text to convert...",
        convertedText: "Converted text will appear here...",
        convertButton: "Convert Text",
        fileUploadMessage: "Please select a file before uploading.",
        textInputMessage: "Please enter text before converting.",
        fileToolHeader: "File Conversion (Cyrillic to Latin only)",
        dailyLimitMessage: "You have reached your daily limit of 3 file conversions. Please try again tomorrow.",
        fileSizeMessage: "File size exceeds the maximum limit of 5MB.",
        serverErrorMessage: "An error occurred during conversion. Please try again.",
    },
    uz: {
        headerTitle: "Faylni Konvertatsiya Qilish",
        title: "Faylni Konvertatsiya Qilish",
        instructions: "Ushbu vositadan fayllar va matnlarni o'zgartirish uchun foydalaning. E'tibor bering: fayl konvertatsiyasi faqat Kirilldan Lotinga mavjud.",
        fileUploadButton: "Faylni Tanlash",
        uploadButton: "Lotinga O'zgartirish",
        conversionTypeLabel: "Konvertatsiya Turini Tanlang:",
        conversionTypeCyrillicToLatin: "Kirilldan Lotinga",
        conversionTypeLatinToCyrillic: "Lotindan Kirillga",
        textToolHeader: "Matnni Konvertatsiya Qilish",
        textAreaPlaceholder: "O'zgartirish uchun matn kiriting...",
        convertedText: "O'zgartirilgan matn shu yerda paydo bo'ladi...",
        convertButton: "Matnni O'zgartirish",
        fileUploadMessage: "Iltimos, yuklashdan oldin faylni tanlang.",
        textInputMessage: "Iltimos, o'zgartirishdan oldin matn kiriting.",
        fileToolHeader: "Fayl Konvertatsiyasi (faqat Kirilldan Lotinga)",
        dailyLimitMessage: "Kunlik 3 ta fayl konvertatsiya limitiga yetdingiz. Iltimos, ertaga qayta urinib ko'ring.",
        fileSizeMessage: "Fayl hajmi maksimal 5MB limitidan oshib ketdi.",
        serverErrorMessage: "Konvertatsiya paytida xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
    },
    ru: {
        headerTitle: "Инструмент Конвертации Файлов",
        title: "Инструмент Конвертации Файлов",
        instructions: "Используйте этот инструмент для преобразования файлов и текста. Обратите внимание: конвертация файлов доступна только из Кириллицы в Латиницу.",
        fileUploadButton: "Выберите Файл",
        uploadButton: "Преобразовать в Латиницу",
        conversionTypeLabel: "Выберите Тип Конвертации:",
        conversionTypeCyrillicToLatin: "Кириллица на Латиницу",
        conversionTypeLatinToCyrillic: "Латиница на Кириллицу",
        textToolHeader: "Инструмент Конвертации Текста",
        textAreaPlaceholder: "Введите текст для конвертации...",
        convertedText: "Преобразованный текст появится здесь...",
        convertButton: "Преобразовать текст",
        fileUploadMessage: "Пожалуйста, выберите файл перед загрузкой.",
        textInputMessage: "Пожалуйста, введите текст перед преобразованием.",
        fileToolHeader: "Конвертация Файлов (только из Кириллицы в Латиницу)",
        dailyLimitMessage: "Вы достигли дневного лимита в 3 конвертации файлов. Пожалуйста, попробуйте завтра.",
        fileSizeMessage: "Размер файла превышает максимальный лимит в 5МБ.",
        serverErrorMessage: "Произошла ошибка при конвертации. Пожалуйста, попробуйте снова.",
    }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

let currentLanguage = 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (element.tagName === "TEXTAREA") {
            // Only update placeholder if textarea is empty
            if (!element.value.trim()) {
                element.placeholder = translations[lang][key];
            }
        } else if (element.tagName === "INPUT") {
            element.placeholder = translations[lang][key];
        } else {
            element.innerText = translations[lang][key];
        }
    });
}

document.getElementById('file-upload').addEventListener('change', function() {
    const file = this.files[0];
    const fileName = file ? file.name : '';
    const label = document.querySelector('.custom-file-upload');
    
    // Check file size
    if (file && file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 5MB limit');
        this.value = ''; // Clear the file input
        label.textContent = translations[currentLanguage].fileUploadButton;
        document.getElementById('uploadButton').disabled = true;
        return;
    }
    
    label.textContent = fileName || translations[currentLanguage].fileUploadButton;
    document.getElementById('uploadButton').disabled = !fileName;
});

document.getElementById('inputText').addEventListener('focus', function() {
    this.placeholder = '';
    if (this.value === translations[currentLanguage].textAreaPlaceholder) {
        this.value = '';
    }
    this.classList.add('user-input');
});

document.getElementById('inputText').addEventListener('blur', function() {
    if (!this.value.trim()) {
        const currentLanguage = document.querySelector('.language-selector select').value;
        this.placeholder = translations[currentLanguage].textAreaPlaceholder;
        this.value = '';
        this.classList.remove('user-input');
    }
});

document.getElementById('inputText').addEventListener('input', function() {
    document.getElementById('convertButton').disabled = !this.value.trim();
});

function uploadFile() {
    const input = document.getElementById('file-upload');
    const file = input.files[0];
    const spinner = document.getElementById('loading-spinner');
    const conversionType = document.getElementById('conversion-type').value;

    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversionType', conversionType);

        spinner.style.display = 'block'; // Show the spinner

        fetch('/convert', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (response.status === 429) {
                throw new Error('daily-limit');
            } else if (response.status === 413) {
                throw new Error('file-size');
            } else if (!response.ok) {
                throw new Error('server-error');
            }
            return response.blob();
        })
        .then(blob => {
            spinner.style.display = 'none';
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name.split('.')[0] + "-latin.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            updateRemainingConversions();
        })
        .catch(error => {
            spinner.style.display = 'none';
            
            input.value = '';
            document.querySelector('.custom-file-upload').textContent = translations[currentLanguage].fileUploadButton;
            document.getElementById('uploadButton').disabled = true;

            // Show appropriate error message
            if (error.message === 'daily-limit') {
                alert(translations[currentLanguage].dailyLimitMessage || 'Daily conversion limit reached. Please try again tomorrow.');
            } else if (error.message === 'file-size') {
                alert(translations[currentLanguage].fileSizeMessage || 'File size exceeds 5MB limit.');
            } else {
                alert(translations[currentLanguage].serverErrorMessage || 'Server error occurred. Please try again later.');
            }
        });
    } else {
        alert(translations[currentLanguage].fileUploadMessage);
    }
}

function convertText() {
    const inputText = document.getElementById('inputText').value;
    const conversionType = document.getElementById('conversion-type').value;
    const spinner = document.getElementById('loading-spinner-text');

    if (inputText.trim()) {
        spinner.style.display = 'block'; 

        fetch('/convert-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: inputText, type: conversionType })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            spinner.style.display = 'none';
            document.getElementById('convertedText').innerText = data.converted;
        })
        .catch(error => {
            spinner.style.display = 'none';
            console.error('Error:', error);
        });
    } else {
        alert('Please enter text before converting.');
    }
}

function updateUIBasedOnLimits(remaining) {
    const fileUpload = document.getElementById('file-upload');
    const uploadButton = document.getElementById('uploadButton');
    const chooseFileLabel = document.querySelector('.custom-file-upload');
    
    if (remaining <= 0) {
        // Disable file upload functionality
        fileUpload.disabled = true;
        uploadButton.disabled = true;
        chooseFileLabel.classList.add('disabled');
        
        // Update the style of the choose file label to look disabled
        chooseFileLabel.style.opacity = '0.6';
        chooseFileLabel.style.cursor = 'not-allowed';
        
        // Update the limit info text style to show warning
        const limitInfo = document.querySelector('.limit-info');
        limitInfo.innerHTML = `
            <small>Maximum file size: 5MB</small>
            <br>
            <small style="color: #ef4444;">Daily conversion limit reached. Please try again tomorrow.</small>
        `;
    } else {
        // Enable file upload functionality
        fileUpload.disabled = false;
        uploadButton.disabled = !fileUpload.files.length;
        chooseFileLabel.classList.remove('disabled');
        chooseFileLabel.style.opacity = '1';
        chooseFileLabel.style.cursor = 'pointer';
    }
}

function updateRemainingConversions() {
    fetch('/remaining-conversions')
        .then(response => response.json())
        .then(data => {
            const limitInfo = document.querySelector('.limit-info');
            limitInfo.innerHTML = `
                <small>Maximum file size: 5MB</small>
                <br>
                <small>Daily conversion limit: ${data.remaining} of 3 files remaining</small>
            `;
            updateUIBasedOnLimits(data.remaining);
        });
}

// Call this function when page loads and after each conversion
document.addEventListener('DOMContentLoaded', updateRemainingConversions);

// Set default language to English
setLanguage('en');
