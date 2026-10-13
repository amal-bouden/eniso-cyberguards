"""
CyberGuard CTF - "Broken Auth" (Web / Easy-Medium)

Two stages, both classic SQL injection:
  1. Auth bypass on the login form (string-formatted query, no parameterization).
  2. Once in as admin, the flag isn't just handed over - it's in a separate `secrets`
     table, and the only way to reach it is the "internal search" feature, which is
     ALSO vulnerable (to a UNION-based injection this time). This mirrors a very real
     pattern: finding one bug often gets you access to pivot and find a second one.

Do NOT deploy either of these patterns in real software.

Run: python3 app.py   (listens on 0.0.0.0:5001)
"""
from flask import Flask, request, render_template_string, g, session, redirect, url_for
import sqlite3
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-only-insecure-secret-change-me")
DB_PATH = os.path.join(os.path.dirname(__file__), 'broken_auth.db')
# Never hardcode the real flag in source that might get shared, committed, or read by a
# curious participant poking at files on the host. Injected at container start instead.
FLAG = os.environ.get("CHALLENGE_FLAG", "ECCC{FLAG_NOT_CONFIGURED}")


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH)
    return db


def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, is_admin INTEGER)")
    conn.execute("INSERT INTO users (username, password, is_admin) VALUES ('guest', 'guest123', 0)")
    conn.execute("INSERT INTO users (username, password, is_admin) VALUES ('alice', 'p@ssw0rd', 0)")
    # The admin's real password is long and random - brute force is not the intended path.
    conn.execute("INSERT INTO users (username, password, is_admin) VALUES ('admin', 'Xk9#mP2$vQ8nL5wR', 1)")

    conn.execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT)")
    for title in [
        "Reminder: rotate the guest wifi password",
        "Room booking for Thursday's workshop confirmed",
        "Printer on 2nd floor is out of toner again",
        "Follow up with sponsors about swag order",
    ]:
        conn.execute("INSERT INTO notes (title) VALUES (?)", (title,))

    # The real target: a separate table the UI never queries directly.
    conn.execute("CREATE TABLE secrets (id INTEGER PRIMARY KEY, title TEXT)")
    conn.execute("INSERT INTO secrets (title) VALUES (?)", (FLAG,))

    conn.commit()
    conn.close()


LOGIN_PAGE = """
<!DOCTYPE html>
<html><head><title>CyberGuard Club Intranet</title>
<style>
  body { background:#0a0e12; color:#dbe4e8; font-family: 'Segoe UI', sans-serif; max-width:420px; margin:80px auto; }
  h2 { color:#39ff8f; font-family: monospace; }
  input { width:100%; padding:10px; margin:6px 0 14px; background:#10161c; border:1px solid #1f2b33; color:#fff; border-radius:6px; box-sizing:border-box;}
  button { background:#39ff8f; color:#04140a; border:none; padding:10px 18px; border-radius:6px; font-weight:bold; cursor:pointer; }
  .msg { padding:10px; border-radius:6px; margin-bottom:14px; }
  .err { background:rgba(255,92,92,0.15); color:#ff5c5c; border:1px solid rgba(255,92,92,0.4); }
  .ok { background:rgba(57,255,143,0.15); color:#39ff8f; border:1px solid rgba(57,255,143,0.4); }
  code { color:#3fb0ff; }
</style></head>
<body>
<h2>&gt; CyberGuard Intranet Login</h2>
<p>Internal member login. Forgot your password? Ask a club officer.</p>
{% if message %}<div class="msg {{ 'ok' if success else 'err' }}">{{ message }}</div>{% endif %}
<form method="POST">
  <label>Username</label>
  <input name="username" autocomplete="off" value="{{ request.form.get('username','') }}">
  <label>Password</label>
  <input name="password" type="password" autocomplete="off">
  <button type="submit">Sign in</button>
</form>
</body></html>
"""

SEARCH_PAGE = """
<!DOCTYPE html>
<html><head><title>CyberGuard Internal Search</title>
<style>
  body { background:#0a0e12; color:#dbe4e8; font-family: 'Segoe UI', sans-serif; max-width:560px; margin:60px auto; padding:0 16px;}
  h2 { color:#39ff8f; font-family: monospace; }
  input { width:100%; padding:10px; margin:6px 0 14px; background:#10161c; border:1px solid #1f2b33; color:#fff; border-radius:6px; box-sizing:border-box; font-family: monospace;}
  button { background:#39ff8f; color:#04140a; border:none; padding:10px 18px; border-radius:6px; font-weight:bold; cursor:pointer; }
  .err { background:rgba(255,92,92,0.15); color:#ff5c5c; border:1px solid rgba(255,92,92,0.4); padding:10px; border-radius:6px; margin-bottom:14px;}
  ul { padding-left: 20px; }
  li { padding: 6px 0; border-bottom: 1px solid #1f2b33; }
  code { color:#3fb0ff; }
</style></head>
<body>
<h2>&gt; Internal Notes Search</h2>
<p>Welcome, admin. The old "flag in the welcome message" feature was removed after a security
review. Notes are searchable below.</p>
{% if error %}<div class="err">{{ error }}</div>{% endif %}
<form method="GET">
  <input name="q" placeholder="search notes..." value="{{ q }}" autocomplete="off">
  <button type="submit">Search</button>
</form>
{% if results is not none %}
<ul>
  {% for row in results %}
    <li>#{{ row[0] }} &mdash; {{ row[1] }}</li>
  {% else %}
    <li><em>No matching notes.</em></li>
  {% endfor %}
</ul>
{% endif %}
</body></html>
"""


@app.route('/', methods=['GET', 'POST'])
def login():
    message, success = None, False
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')

        # VULNERABLE ON PURPOSE: raw string formatting into SQL, no parameterization.
        query = f"SELECT id, username, is_admin FROM users WHERE username = '{username}' AND password = '{password}'"
        db = get_db()
        try:
            cur = db.execute(query)
            row = cur.fetchone()
        except sqlite3.Error as e:
            row = None
            message = f"Database error: {e}"

        if row:
            uid, uname, is_admin = row
            if is_admin:
                session['role'] = 'admin'
                return redirect(url_for('search'))
            else:
                message = f"Welcome, {uname}. You are logged in, but you are not an admin."
                success = True
        elif message is None:
            message = "Invalid username or password."

    return render_template_string(LOGIN_PAGE, message=message, success=success)


@app.route('/search', methods=['GET'])
def search():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))

    q = request.args.get('q', '')
    results = None
    error = None
    if q:
        # VULNERABLE ON PURPOSE: same mistake as the login form, string-formatted SQL.
        # This one only queries `notes` by design - but nothing stops a UNION SELECT
        # from pulling rows out of `secrets` instead, as long as the column count and
        # roughly-compatible types line up (id, title - exactly what `secrets` has too).
        query = f"SELECT id, title FROM notes WHERE title LIKE '%{q}%'"
        db = get_db()
        try:
            results = db.execute(query).fetchall()
        except sqlite3.Error as e:
            error = f"Database error: {e}"

    return render_template_string(SEARCH_PAGE, q=q, results=results, error=error)


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001)
