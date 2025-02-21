const translations = {
    en: {
        headerTitle: "File Conversion Tool",
        title: "File Conversion Tool",
        instructions: "Use this tool to convert files and text from Cyrillic to Latin script. Upload a file or enter text below to get started.",
        fileUploadButton: "Choose File",
        uploadButton: "Upload and Convert",
        conversionTypeLabel: "Select Conversion Type:",
        conversionTypeCyrillicToLatin: "Cyrillic to Latin",
        conversionTypeLatinToCyrillic: "Latin to Cyrillic",
        textToolHeader: "Text Conversion Tool",
        textAreaPlaceholder: "Enter text to convert...",
        convertedText: "Converted text will appear here...",
        convertButton: "Convert Text",
        fileUploadMessage: "Please select a file before uploading.",
        textInputMessage: "Please enter text before converting."
    },
    uz: {
        headerTitle: "Faylni Konvertatsiya Qilish",
        title: "Faylni Konvertatsiya Qilish",
        instructions: "Ushbu vositadan fayllar va matnlarni kirilldan lotin yozuviga o‘tkazish uchun foydalaning. Faylni yuklang yoki quyida matn kiriting.",
        fileUploadButton: "Faylni Tanlash",
        uploadButton: "Yuklash va O'zgartirish",
        conversionTypeLabel: "Konvertatsiya Turini Tanlang:",
        conversionTypeCyrillicToLatin: "Kirilldan Lotinga",
        conversionTypeLatinToCyrillic: "Lotindan Kirillga",
        textToolHeader: "Matnni Konvertatsiya Qilish",
        textAreaPlaceholder: "O'zgartirish uchun matn kiriting...",
        convertedText: "O'zgartirilgan matn shu yerda paydo bo'ladi...",
        convertButton: "Matnni O'zgartirish",
        fileUploadMessage: "Iltimos, yuklashdan oldin faylni tanlang.",
        textInputMessage: "Iltimos, o'zgartirishdan oldin matn kiriting."
    },
    ru: {
        headerTitle: "Инструмент Конвертации Файлов",
        title: "Инструмент Конвертации Файлов",
        instructions: "Используйте этот инструмент для преобразования файлов и текста с кириллицы на латиницу. Загрузите файл или введите текст ниже, чтобы начать.",
        fileUploadButton: "Выберите Файл",
        uploadButton: "Загрузить и Конвертировать",
        conversionTypeLabel: "Выберите Тип Конвертации:",
        conversionTypeCyrillicToLatin: "Кириллица на Латиницу",
        conversionTypeLatinToCyrillic: "Латиница на Кириллицу",
        textToolHeader: "Инструмент Конвертации Текста",
        textAreaPlaceholder: "Введите текст для конвертации...",
        convertedText: "Преобразованный текст появится здесь...",
        convertButton: "Преобразовать текст",
        fileUploadMessage: "Пожалуйста, выберите файл перед загрузкой.",
        textInputMessage: "Пожалуйста, введите текст перед преобразованием."
    }
};

function setLanguage(lang) {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        element.innerText = translations[lang][key];
        if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
            element.placeholder = translations[lang][key];
        }
    });
}

document.getElementById('file-upload').addEventListener('change', function() {
    const fileName = this.value.split('\\').pop();
    const label = document.querySelector('.custom-file-upload');
    label.textContent = fileName ? fileName : 'Choose File';

    // Enable the upload button if a file is selected
    document.getElementById('uploadButton').disabled = !fileName;
});

document.getElementById('inputText').addEventListener('focus', function() {
    // Clear the placeholder text on focus
    this.placeholder = '';
    this.classList.add('user-input');
});

document.getElementById('inputText').addEventListener('blur', function() {
    // Restore the placeholder text if the user leaves the textarea empty
    if (this.value.trim() === '') {
        this.placeholder = translations.en.textAreaPlaceholder;
        this.classList.remove('user-input');
    }
});

document.getElementById('inputText').addEventListener('input', function() {
    // Enable the convert button if there is text in the textarea
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
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            spinner.style.display = 'none'; // Hide the spinner
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name.split('.')[0] + "-latin.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            spinner.style.display = 'none'; // Hide the spinner
            alert('Failed to convert file: ' + error.message);
        });
    } else {
        alert(translations.en.fileUploadMessage);
    }
}

function convertText() {
    const inputText = document.getElementById('inputText').value;
    const conversionType = document.getElementById('conversion-type').value;
    const spinner = document.getElementById('loading-spinner-text');

    if (inputText.trim()) {
        spinner.style.display = 'block'; // Show the spinner

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
            spinner.style.display = 'none'; // Hide the spinner
            document.getElementById('convertedText').innerText = data.converted;
        })
        .catch(error => {
            spinner.style.display = 'none'; // Hide the spinner
            console.error('Error:', error);
        });
    } else {
        alert('Please enter text before converting.');
    }
}

// Set default language to English
setLanguage('en');
