from flask import Flask, request, send_file, render_template, jsonify
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import pdfplumber
from docx import Document
import logging

app = Flask(__name__)

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# Define the conversion mappings
cyrillic_to_latin_map = {
    'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'Д': 'D', 'д': 'd',
    'Е': 'E', 'е': 'e', 'Ф': 'F', 'ф': 'f', 'Г': 'G', 'г': 'g',
    'Ҳ': 'H', 'ҳ': 'h', 'И': 'I', 'и': 'i', 'Ж': 'J', 'ж': 'j',
    'К': 'K', 'к': 'k', 'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm',
    'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o', 'П': 'P', 'п': 'p',
    'Қ': 'Q', 'қ': 'q', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's',
    'Т': 'T', 'т': 't', 'У': 'U', 'у': 'u', 'В': 'V', 'в': 'v',
    'Х': 'X', 'х': 'x', 'Й': 'Y', 'й': 'y', 'З': 'Z', 'з': 'z',
    'Ш': 'Sh', 'ш': 'sh', 'Ч': 'Ch', 'ч': 'ch', 'Ю': 'Yu', 'ю': 'yu',
    'Я': 'Ya', 'я': 'ya', 'Ў': 'O‘', 'ў': 'o‘', 'Ғ': 'G‘', 'ғ': 'g‘',
    'Ц': 'Ts', 'ц': 'ts', 'Э': 'E', 'э': 'e', 'Ё': 'Yo', 'ё': 'yo',
    'Ӯ': 'U‘', 'ӯ': 'u‘', 'Ү': 'U', 'ү': 'u', 'Ъ': '', 'ъ': '',  # Handling 'ъ' as silent
}

latin_to_cyrillic_map = {
    'A': 'А', 'a': 'а',
    'B': 'Б', 'b': 'б',
    'D': 'Д', 'd': 'д',
    'E': 'Е', 'e': 'е',
    'F': 'Ф', 'f': 'ф',
    'G': 'Г', 'g': 'г',
    'H': 'Ҳ', 'h': 'ҳ',
    'I': 'И', 'i': 'и',
    'J': 'Ж', 'j': 'ж',
    'K': 'К', 'k': 'к',
    'L': 'Л', 'l': 'л',
    'M': 'М', 'm': 'м',
    'N': 'Н', 'n': 'н',
    'O': 'О', 'o': 'о',
    "O'": 'Ў', "o'": 'ў',
    'P': 'П', 'p': 'п',
    'Q': 'Қ', 'q': 'қ',
    'R': 'Р', 'r': 'р',
    'S': 'С', 's': 'с',
    'T': 'Т', 't': 'т',
    'U': 'У', 'u': 'у',     # Regular U mapping
    "U'": 'Ү', "u'": 'ү',   # Special U
    'V': 'В', 'v': 'в',
    'X': 'Х', 'x': 'х',
    'Y': 'Й', 'y': 'й',
    'Z': 'З', 'z': 'з',
    'Sh': 'Ш', 'sh': 'ш',
    'Ch': 'Ч', 'ch': 'ч',
    'Yu': 'Ю', 'yu': 'ю',
    'Ya': 'Я', 'ya': 'я',
    "G'": 'Ғ', "g'": 'ғ',   # Mapping for special G
    'Ts': 'Ц', 'ts': 'ц',
    'Yo': 'Ё', 'yo': 'ё'
}

def convert_cyrillic_to_latin(text):
    """Converts Cyrillic text to Latin using the defined mapping."""
    converted_text = []
    for char in text:
        if char in cyrillic_to_latin_map:
            converted_text.append(cyrillic_to_latin_map[char])
        else:
            converted_text.append(char)  # Preserve non-Cyrillic characters
    return ''.join(converted_text)

def convert_latin_to_cyrillic(text):
    """Converts Latin text to Cyrillic using the defined mapping."""
    words = text.split()
    converted_text = []
    for word in words:
        converted_word = []
        i = 0
        while i < len(word):
            # Check for two-character mappings first
            if i + 1 < len(word) and word[i:i+2] in latin_to_cyrillic_map:
                converted_word.append(latin_to_cyrillic_map[word[i:i+2]])
                i += 2
            else:
                # Then check for single character mappings
                converted_word.append(latin_to_cyrillic_map.get(word[i], word[i]))
                i += 1
        converted_text.append(''.join(converted_word))
    return ' '.join(converted_text)

def extract_and_convert_pdf(file_stream, conversion_function):
    """Extract text from PDF, convert from one script to another, ignoring Arabic."""
    output_text = []
    try:
        with pdfplumber.open(file_stream) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    converted_text = conversion_function(text)
                    output_text.append(converted_text)
                else:
                    logging.warning(f"No text found on page {pdf.pages.index(page)+1}")
    except Exception as e:
        logging.error(f"Failed to process the PDF: {e}")
        return None
    return "\n".join(output_text)

def extract_and_convert_docx(file_stream, conversion_function):
    """Extract text from DOCX, convert from one script to another."""
    output_text = []
    try:
        doc = Document(file_stream)
        for para in doc.paragraphs:
            text = para.text
            converted_text = conversion_function(text)
            output_text.append(converted_text)
    except Exception as e:
        logging.error(f"Failed to process the DOCX: {e}")
        return None
    return "\n".join(output_text)

def save_to_pdf(text, output):
    """Save converted text to a PDF file."""
    if text:
        c = canvas.Canvas(output, pagesize=letter)
        text_obj = c.beginText(40, 750)
        text_obj.setFont("Helvetica", 12)
        lines = text.split('\n')
        for line in lines:
            text_obj.textLine(line.strip())
            if text_obj.getY() < 100:  # Check if we are at the bottom of the page
                c.drawText(text_obj)
                c.showPage()  # Start a new page
                text_obj = c.beginText(40, 750)
        c.drawText(text_obj)
        c.save()
    else:
        logging.info("No text to save.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    file = request.files['file']
    if not file:
        return "No file uploaded", 400

    # Convert the uploaded file to BytesIO object
    file_stream = BytesIO(file.read())
    file_extension = file.filename.split('.')[-1].lower()

    if file_extension == 'pdf':
        converted_text = extract_and_convert_pdf(file_stream, convert_cyrillic_to_latin)
    elif file_extension in ['doc', 'docx']:
        converted_text = extract_and_convert_docx(file_stream, convert_cyrillic_to_latin)
    else:
        return "Unsupported file format", 400

    if not converted_text:
        return "Failed to convert the file", 500

    # Save the converted text to a PDF file
    output = BytesIO()
    save_to_pdf(converted_text, output)

    # Get the original filename and append "-latin" to it
    original_filename = file.filename
    converted_filename = original_filename.rsplit('.', 1)[0] + "-latin.pdf"

    output.seek(0)
    return send_file(output, as_attachment=True, download_name=converted_filename)

@app.route('/convert-text', methods=['POST'])
def convert_text():
    data = request.get_json()
    input_text = data.get('text', '')
    conversion_type = data.get('type', 'cyrillic-to-latin')

    if conversion_type == 'latin-to-cyrillic':
        converted_text = convert_latin_to_cyrillic(input_text)
    else:
        converted_text = convert_cyrillic_to_latin(input_text)

    return jsonify({'converted': converted_text})

if __name__ == '__main__':
    app.run()
