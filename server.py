from flask import Flask, request, jsonify, session, redirect, render_template, send_from_directory
from flask_cors import CORS
import telebot
import os
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.secret_key = "your_secret_key"

# --- Настройки Telegram ---
BOT_TOKEN = "8217178286:AAGWP-1TDmM1sm3bD9lPnJ9VU5qMzPdyEM8"
CHAT_ID = "1686962725"
bot = telebot.TeleBot(BOT_TOKEN)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, 'users.db')

# --- Инициализация базы данных ---
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    
                    email TEXT,
                    phone TEXT,
                    password TEXT,
                    member_since TEXT
                )''')
    conn.commit()
    conn.close()

init_db()

# --- HTML страницы через render_template ---
@app.route('/')
def index():
    return render_template('index.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

@app.route('/products')
def products():
    return render_template('products.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))
@app.route('/reviews')
def reviews():
    return render_template('reviews.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

@app.route('/gallery')
def gallery():
    return render_template('gallery.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

@app.route('/delivery')
def delivery():
    return render_template('delivery.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

@app.route('/contacts')
def contacts():
    return render_template('contacts.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

@app.route('/locations')
def locations():
    return render_template('locations.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

@app.route('/about')
def about():
    return render_template('about.html', logged_in=session.get('user_logged_in', False),
                           username=session.get('username'))

# --- Регистрация ---
@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')

        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        if c.fetchone():
            conn.close()
            error = "Имя пользователя уже существует"
            return render_template('register.html', error=error)

        member_since = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        c.execute(
            "INSERT INTO users (username, email, phone, password, member_since) VALUES (?, ?, ?, ?, ?)",
            (username, email, phone, password, member_since)
        )
        conn.commit()
        conn.close()

        # После регистрации сразу логиним пользователя
        session['user_logged_in'] = True
        session['username'] = username
        session['email'] = email
        session['phone'] = phone

        return redirect('/profile')

    return render_template('register.html', error=error)

# --- Логин ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        conn = sqlite3.connect(DB)
        c = conn.cursor()
        # Берем все нужные данные из базы по username
        c.execute('SELECT email, phone, password FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()

        # user = (email, phone, password)
        if user and user[2] == password:
            session['user_logged_in'] = True
            session['username'] = username
            session['email'] = user[0]
            session['phone'] = user[1]
            return redirect('/profile')
        else:
            error = "❌ Неверный логин или пароль"

    return render_template('login.html', error=error)

@app.route('/profile')
def profile():
    if not session.get('user_logged_in'):
        return redirect('/login')
    
    orders = session.get('orders', [])  # Получаем список заказов из session
    
    return render_template('profile.html',
                           username=session.get('username'),
                           email=session.get('email'),
                           member_since="2025",
                           phone=session.get('phone'),
                           orders=orders)

# --- Выход ---
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return redirect('/')

# --- Статические файлы ---
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'static'), filename)

# --- Favicon ---
@app.route('/favicon.ico')
def favicon():
    path = os.path.join(BASE_DIR, 'favicon.ico')
    if os.path.exists(path):
        return send_from_directory(BASE_DIR, 'favicon.ico')
    return '', 204

# --- Обработка заказа ---
@app.route('/submit_order', methods=['POST'])
def submit_order():
    if not session.get('user_logged_in'):
        return jsonify({"status": "error", "message": "User not logged in"}), 401

    data = request.json
    street = data.get('street')
    entrance = data.get('entrance')
    intercom = data.get('intercom')
    floor = data.get('floor')
    apartment = data.get('apartment')
    comment = data.get('comment')
    cart = data.get('cart', [])

    username = session.get('username')
    email = session.get('email')
    phone = session.get('phone')

    message = f"🧁 Новый заказ!\n\n" \
              f"👤 Пользователь: {username}\n" \
              f"📧 Email: {email}\n" \
              f"📞 Телефон: {phone}\n" \
              f"📍 Адрес: {street}\n" \
              f"🚪 Подъезд: {entrance}\n" \
              f"🔢 Этаж: {floor}\n" \
              f"🏠 Кв: {apartment}\n" \
              f"🔔 Домофон: {intercom}\n" \
              f"💬 Комментарий: {comment}\n\n"

    if cart:
        message += "🛒 Корзина:\n"
        for item in cart:
            message += f"— {item.get('title')} = {item.get('price')}₸\n"

    try:
        bot.send_message(CHAT_ID, message)
    except Exception as e:
        print("Ошибка Telegram:", e)
        return jsonify({"status": "error", "message": "Ошибка отправки в Telegram"}), 500

    # сохраняем заказ
    order_summary = f"{username} ({email}, {phone}): {', '.join([item.get('title') for item in cart])}"
    if 'orders' not in session:
        session['orders'] = []
    session['orders'].append(order_summary)

    return jsonify({"status": "success", "message": "Заказ отправлен!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
